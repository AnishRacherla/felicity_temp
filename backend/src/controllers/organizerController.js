import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";
import { validateEventDates } from "../utils/validators.js";
import { generateQRCode } from "../utils/ticketGenerator.js";
import { sendRegistrationEmail } from "../utils/emailService.js";

/**
 * Get organizer's dashboard (all events with stats)
 * GET /api/organizer/dashboard
 */
export const getDashboard = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .select("eventName eventType status currentRegistrations totalRevenue totalAttendance eventStartDate")
      .sort({ createdAt: -1 });

    // Calculate overall stats
    const stats = {
      totalEvents: events.length,
      draftEvents: events.filter((e) => e.status === "DRAFT").length,
      publishedEvents: events.filter((e) => e.status === "PUBLISHED").length,
      completedEvents: events.filter((e) => e.status === "COMPLETED").length,
      totalRegistrations: events.reduce((sum, e) => sum + e.currentRegistrations, 0),
      totalRevenue: events.reduce((sum, e) => sum + e.totalRevenue, 0),
      totalAttendance: events.reduce((sum, e) => sum + e.totalAttendance, 0),
    };

    res.json({
      success: true,
      stats,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
      error: error.message,
    });
  }
};

/**
 * Get organizer's all events
 * GET /api/organizer/events
 */
export const getMyEvents = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { organizer: req.user._id };
    if (status) query.status = status.toUpperCase();

    const events = await Event.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

/**
 * Get single event details with analytics (Organizer view)
 * GET /api/organizer/events/:id
 */
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get registrations count by status
    const registrations = await Registration.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const analytics = {
      totalRegistrations: event.currentRegistrations,
      confirmedRegistrations: registrations.find((r) => r._id === "CONFIRMED")?.count || 0,
      pendingRegistrations: registrations.find((r) => r._id === "PENDING")?.count || 0,
      cancelledRegistrations: registrations.find((r) => r._id === "CANCELLED")?.count || 0,
      totalRevenue: event.totalRevenue,
      totalAttendance: event.totalAttendance,
      attendanceRate:
        event.currentRegistrations > 0
          ? ((event.totalAttendance / event.currentRegistrations) * 100).toFixed(2) + "%"
          : "0%",
    };

    res.json({
      success: true,
      event,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
      error: error.message,
    });
  }
};

/**
 * Update event (with status-based restrictions)
 * PUT /api/organizer/events/:id
 */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const {
      eventName,
      description,
      registrationDeadline,
      registrationLimit,
      customForm,
    } = req.body;

    // Status-based edit restrictions
    if (event.status === "DRAFT") {
      // Draft: Can edit everything
      Object.assign(event, req.body);
    } else if (event.status === "PUBLISHED") {
      // Published: Limited edits
      if (description) event.description = description;
      
      // Can only extend deadline, not reduce
      if (registrationDeadline) {
        const newDeadline = new Date(registrationDeadline);
        if (newDeadline > new Date(event.registrationDeadline)) {
          event.registrationDeadline = newDeadline;
        } else {
          return res.status(400).json({ message: "Can only extend registration deadline" });
        }
      }
      
      // Can only increase limit, not reduce
      if (registrationLimit) {
        if (registrationLimit >= event.currentRegistrations) {
          event.registrationLimit = registrationLimit;
        } else {
          return res.status(400).json({
            message: "Cannot reduce limit below current registrations",
          });
        }
      }
    } else {
      // ONGOING/COMPLETED: No edits allowed
      return res.status(400).json({
        message: "Cannot edit event in current status. You can only change status.",
      });
    }

    // Cannot edit form if locked
    if (event.formLocked && customForm) {
      return res.status(400).json({
        message: "Form is locked after first registration",
      });
    }

    await event.save();

    res.json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

/**
 * Publish event (change from DRAFT to PUBLISHED)
 * POST /api/organizer/events/:id/publish
 */
export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "DRAFT") {
      return res.status(400).json({ message: "Only draft events can be published" });
    }

    // Validate dates before publishing
    const dateValidation = validateEventDates(
      event.eventStartDate,
      event.eventEndDate,
      event.registrationDeadline
    );

    if (!dateValidation.valid) {
      return res.status(400).json({ message: dateValidation.message });
    }

    event.status = "PUBLISHED";
    await event.save();

    res.json({
      success: true,
      message: "Event published successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to publish event",
      error: error.message,
    });
  }
};

/**
 * Close event registrations
 * POST /api/organizer/events/:id/close
 */
export const closeEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "CLOSED";
    await event.save();

    res.json({
      success: true,
      message: "Event closed successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to close event",
      error: error.message,
    });
  }
};

/**
 * Mark event as completed
 * POST /api/organizer/events/:id/complete
 */
export const completeEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = "COMPLETED";
    await event.save();

    res.json({
      success: true,
      message: "Event marked as completed",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete event",
      error: error.message,
    });
  }
};

/**
 * Delete event (only drafts can be deleted)
 * DELETE /api/organizer/events/:id
 */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft events can be deleted",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

/**
 * Get all registrations for an event
 * GET /api/organizer/events/:id/registrations
 */
export const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, search } = req.query;

    // Verify event ownership
    const event = await Event.findOne({ _id: id, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const query = { event: id };
    if (status) query.status = status.toUpperCase();

    let registrations = await Registration.find(query)
      .populate("participant", "firstName lastName email contactNumber collegeName")
      .sort({ registrationDate: -1 });

    // Search filter
    if (search) {
      registrations = registrations.filter((reg) => {
        const name = `${reg.participant.firstName} ${reg.participant.lastName}`.toLowerCase();
        const email = reg.participant.email.toLowerCase();
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      });
    }

    res.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
      error: error.message,
    });
  }
};

/**
 * Export registrations to CSV
 * GET /api/organizer/events/:id/export
 */
export const exportRegistrations = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({ _id: id, organizer: req.user._id });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registrations = await Registration.find({ event: id })
      .populate("participant", "firstName lastName email contactNumber collegeName participantType");

    // Create CSV
    const csvHeader = "Ticket ID,Name,Email,Phone,College,Type,Registration Date,Status,Payment,Attended\n";
    const csvRows = registrations.map((reg) => {
      return [
        reg.ticketId,
        `${reg.participant.firstName} ${reg.participant.lastName}`,
        reg.participant.email,
        reg.participant.contactNumber || "N/A",
        reg.participant.collegeName || "N/A",
        reg.participant.participantType || "N/A",
        new Date(reg.registrationDate).toLocaleDateString(),
        reg.status,
        reg.paymentStatus,
        reg.attended ? "Yes" : "No",
      ].join(",");
    }).join("\n");

    const csv = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${event.eventName}-registrations.csv"`
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export registrations",
      error: error.message,
    });
  }
};

/**
 * Approve merchandise payment
 * POST /api/organizer/registrations/:id/approve
 */
export const approveMerchandisePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findById(id).populate("event");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify organizer owns this event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (registration.paymentStatus !== "PENDING_APPROVAL") {
      return res.status(400).json({ message: "Payment not pending approval" });
    }

    // Generate QR code now
    const participant = await User.findById(registration.participant);
    const qrData = {
      ticketId: registration.ticketId,
      participantId: participant._id.toString(),
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventId: registration.event._id.toString(),
      eventName: registration.event.eventName,
      eventDate: registration.event.eventStartDate,
    };
    const qrCode = await generateQRCode(qrData);

    // Update registration
    registration.status = "CONFIRMED";
    registration.paymentStatus = "PAID";
    registration.qrCode = qrCode;
    registration.paymentApprovedBy = req.user._id;
    registration.paymentApprovedAt = new Date();
    await registration.save();

    // Decrement stock
    const event = registration.event;
    event.merchandise.stockQuantity -= registration.merchandiseDetails.quantity;
    event.totalRevenue += registration.amountPaid;
    await event.save();

    // Send confirmation email
    try {
      await sendRegistrationEmail({
        to: participant.email,
        participantName: `${participant.firstName} ${participant.lastName}`,
        eventName: event.eventName,
        ticketId: registration.ticketId,
        qrCode,
        eventDate: event.eventStartDate,
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.json({
      success: true,
      message: "Payment approved and ticket generated",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve payment",
      error: error.message,
    });
  }
};

/**
 * Reject merchandise payment
 * POST /api/organizer/registrations/:id/reject
 */
export const rejectMerchandisePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ 
        message: "Please provide a rejection reason (minimum 5 characters)" 
      });
    }

    const registration = await Registration.findById(id)
      .populate("event")
      .populate("participant", "firstName lastName email");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify organizer owns this event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (registration.paymentStatus !== "PENDING_APPROVAL") {
      return res.status(400).json({ message: "Payment not pending approval" });
    }

    // Update registration - allow resubmission
    registration.status = "REJECTED";
    registration.paymentStatus = "UNPAID";
    registration.paymentRejectionReason = reason.trim();
    registration.paymentProof = undefined; // Clear payment proof
    await registration.save();

    res.json({
      success: true,
      message: "Payment rejected. Participant can resubmit.",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject payment",
      error: error.message,
    });
  }
};

/**
 * Verify ticket (QR code scanning)
 * POST /api/organizer/verify-ticket
 */
export const verifyTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    console.log('=== TICKET VERIFICATION ATTEMPT ===');
    console.log('Received ticketId:', ticketId);
    console.log('TicketId type:', typeof ticketId);
    console.log('TicketId length:', ticketId?.length);

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }

    // Trim whitespace
    const trimmedTicketId = ticketId.trim();
    console.log('Trimmed ticketId:', trimmedTicketId);

    // Find registration by ticket ID
    const registration = await Registration.findOne({ ticketId: trimmedTicketId })
      .populate("event", "eventName eventStartDate eventEndDate organizer")
      .populate("participant", "firstName lastName email");

    console.log('Registration found:', registration ? 'YES' : 'NO');
    if (!registration) {
      // Debug: Find any registrations to see what ticketIds exist
      const sampleRegistrations = await Registration.find({})
        .limit(5)
        .select('ticketId status paymentStatus');
      console.log('Sample registrations in DB:', sampleRegistrations);
    }

    if (!registration) {
      return res.status(404).json({ 
        success: false,
        message: "Invalid ticket - Registration not found" 
      });
    }

    // Verify organizer owns this event
    if (registration.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized - This ticket belongs to another organizer's event" 
      });
    }

    // Check if ticket already used
    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: "Ticket already scanned",
        alreadyScanned: true,
        registration: {
          ticketId: registration.ticketId,
          participant: registration.participant,
          event: registration.event,
          status: registration.status,
          scannedAt: registration.attendanceMarkedAt
        }
      });
    }

    // Check if registration is confirmed
    if (registration.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: `Cannot verify - Registration status is ${registration.status}`,
        registration: {
          ticketId: registration.ticketId,
          status: registration.status,
          paymentStatus: registration.paymentStatus
        }
      });
    }

    // Mark attendance
    registration.attended = true;
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    // Update event attendance count
    const event = await Event.findById(registration.event._id);
    event.totalAttendance = (event.totalAttendance || 0) + 1;
    await event.save();

    res.json({
      success: true,
      message: "✅ Ticket verified successfully!",
      registration: {
        ticketId: registration.ticketId,
        participant: {
          name: `${registration.participant.firstName} ${registration.participant.lastName}`,
          email: registration.participant.email
        },
        event: {
          name: registration.event.eventName,
          date: registration.event.eventStartDate
        },
        status: registration.status,
        paymentStatus: registration.paymentStatus,
        verifiedAt: registration.attendanceMarkedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify ticket",
      error: error.message,
    });
  }
};

/**
 * Get organizer profile
 * GET /api/organizer/profile
 */
export const getProfile = async (req, res) => {
  try {
    const organizer = await User.findById(req.user._id).select("-password");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    res.json({
      success: true,
      profile: organizer,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch profile", 
      error: error.message 
    });
  }
};

/**
 * Update organizer profile
 * PUT /api/organizer/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      discordWebhook,
    } = req.body;

    // Fields that can be updated
    const updates = {};
    if (organizerName) updates.organizerName = organizerName;
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (contactNumber !== undefined) updates.contactNumber = contactNumber;
    if (discordWebhook !== undefined) updates.discordWebhook = discordWebhook;

    const organizer = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: organizer,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update profile", 
      error: error.message 
    });
  }
};

/**
 * Request password reset
 * POST /api/organizer/request-password-reset
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        message: "Please provide a detailed reason (minimum 10 characters)" 
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizer: req.user._id,
      status: "PENDING",
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: "You already have a pending password reset request" 
      });
    }

    // Create new request
    const request = await PasswordResetRequest.create({
      organizer: req.user._id,
      reason: reason.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Password reset request submitted successfully. Admin will review it shortly.",
      request,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to submit password reset request", 
      error: error.message 
    });
  }
};

/**
 * Get my password reset requests
 * GET /api/organizer/password-requests
 */
export const getMyPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ 
      organizer: req.user._id 
    })
      .populate("processedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch password reset requests", 
      error: error.message 
    });
  }
};
