import User from "../models/User.js";
import { ROLES } from "../constants/roles.js";
import { generateRandomPassword } from "../utils/validators.js";
import { sendOrganizerCredentials } from "../utils/emailService.js";
import PasswordResetRequest from "../models/PasswordResetRequest.js";

/**
 * Create new organizer account
 * POST /api/admin/organizers
 */
export const createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      loginEmail,
    } = req.body;

    // Validation
    if (!organizerName || !category || !loginEmail) {
      return res.status(400).json({
        message: "Please provide organizerName, category, and loginEmail",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate random password
    const generatedPassword = generateRandomPassword(12);

    // Create organizer
    const organizer = await User.create({
      firstName: organizerName.split(" ")[0] || "Organizer",
      lastName: organizerName.split(" ").slice(1).join(" ") || "Account",
      email: loginEmail,
      password: generatedPassword,
      role: ROLES.ORGANIZER,
      organizerName,
      category,
      description,
      contactEmail: contactEmail || loginEmail,
      isActive: true,
    });

    // Send credentials via email
    try {
      await sendOrganizerCredentials({
        to: loginEmail,
        organizerName,
        email: loginEmail,
        password: generatedPassword,
      });
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Organizer account created successfully",
      organizer: {
        id: organizer._id,
        organizerName,
        email: loginEmail,
        password: generatedPassword, // Show password only once
      },
      note: "Credentials have been sent to the organizer's email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create organizer",
      error: error.message,
    });
  }
};

/**
 * Get all organizers
 * GET /api/admin/organizers
 */
export const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await User.find({ role: ROLES.ORGANIZER })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizers",
      error: error.message,
    });
  }
};

/**
 * Get organizer details
 * GET /api/admin/organizers/:id
 */
export const getOrganizerDetails = async (req, res) => {
  try {
    const now = new Date();
    const organizer = await User.findOne({
      _id: req.params.id,
      role: ROLES.ORGANIZER,
    }).select("-password");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Get organizer's event stats
    const Event = (await import("../models/Event.js")).default;
    const events = await Event.find({ organizer: organizer._id })
      .sort({ eventStartDate: -1 })
      .select(
        "eventName description eventType status eventStartDate eventEndDate registrationFee currentRegistrations registrationLimit"
      );

    const presentEvents = events.filter(
      (event) => event.eventStartDate <= now && event.eventEndDate >= now
    );
    const upcomingEvents = events.filter((event) => event.eventStartDate > now);
    const pastEvents = events.filter((event) => event.eventEndDate < now);

    const stats = {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === "PUBLISHED").length,
      ongoingEvents: events.filter((e) => e.status === "ONGOING").length,
      completedEvents: events.filter((e) => e.status === "COMPLETED").length,
      totalRegistrations: events.reduce((sum, e) => sum + e.currentRegistrations, 0),
    };

    res.json({
      success: true,
      organizer,
      stats,
      events,
      presentEvents,
      upcomingEvents,
      pastEvents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer details",
      error: error.message,
    });
  }
};

/**
 * Update organizer details
 * PUT /api/admin/organizers/:id
 */
export const updateOrganizer = async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail } = req.body;

    const updates = {};
    if (organizerName) updates.organizerName = organizerName;
    if (category) updates.category = category;
    if (description) updates.description = description;
    if (contactEmail) updates.contactEmail = contactEmail;

    const organizer = await User.findOneAndUpdate(
      { _id: req.params.id, role: ROLES.ORGANIZER },
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    res.json({
      success: true,
      message: "Organizer updated successfully",
      organizer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update organizer",
      error: error.message,
    });
  }
};

/**
 * Toggle organizer active status (enable/disable)
 * PUT /api/admin/organizers/:id/toggle
 */
export const toggleOrganizerStatus = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: ROLES.ORGANIZER,
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.json({
      success: true,
      message: `Organizer ${organizer.isActive ? "enabled" : "disabled"} successfully`,
      isActive: organizer.isActive,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle organizer status",
      error: error.message,
    });
  }
};

/**
 * Delete/Remove organizer permanently
 * DELETE /api/admin/organizers/:id
 */
export const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: ROLES.ORGANIZER,
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Check if organizer has active events
    const Event = (await import("../models/Event.js")).default;
    const activeEvents = await Event.countDocuments({
      organizer: organizer._id,
      status: { $in: ["PUBLISHED", "ONGOING"] },
    });

    if (activeEvents > 0) {
      return res.status(400).json({
        message: `Cannot delete organizer with ${activeEvents} active event(s). Close or complete them first.`,
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Organizer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete organizer",
      error: error.message,
    });
  }
};

/**
 * Reset organizer password
 * POST /api/admin/organizers/:id/reset-password
 */
export const resetOrganizerPassword = async (req, res) => {
  try {
    const organizer = await User.findOne({
      _id: req.params.id,
      role: ROLES.ORGANIZER,
    });

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Generate new password
    const newPassword = generateRandomPassword(12);
    organizer.password = newPassword; // Will be hashed by pre-save hook
    await organizer.save();

    // Send new credentials
    try {
      await sendOrganizerCredentials({
        to: organizer.email,
        organizerName: organizer.organizerName,
        email: organizer.email,
        password: newPassword,
      });
    } catch (emailError) {
      console.error("Failed to send new credentials:", emailError);
    }

    res.json({
      success: true,
      message: "Password reset successfully",
      newPassword, // Show only once
      note: "New credentials have been sent to the organizer's email",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

/**
 * Get system stats (dashboard)
 * GET /api/admin/stats
 */
export const getSystemStats = async (req, res) => {
  try {
    const Event = (await import("../models/Event.js")).default;
    const Registration = (await import("../models/Registration.js")).default;

    const [
      totalParticipants,
      totalOrganizers,
      totalEvents,
      publishedEvents,
      totalRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.PARTICIPANT }),
      User.countDocuments({ role: ROLES.ORGANIZER, isActive: true }),
      Event.countDocuments(),
      Event.countDocuments({ status: "PUBLISHED" }),
      Registration.countDocuments({ status: "CONFIRMED" }),
    ]);

    res.json({
      success: true,
      stats: {
        totalParticipants,
        totalOrganizers,
        totalEvents,
        publishedEvents,
        totalRegistrations,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch system stats",
      error: error.message,
    });
  }
};

/**
 * Get all password reset requests
 * GET /api/admin/password-requests
 */
export const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate("organizer", "organizerName email category")
      .populate("processedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch password reset requests",
      error: error.message,
    });
  }
};

/**
 * Approve password reset request
 * POST /api/admin/password-requests/:id/approve
 */
export const approvePasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;

    // Find request
    const request = await PasswordResetRequest.findById(id).populate("organizer");
    
    if (!request) {
      return res.status(404).json({ message: "Password reset request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "Request has already been processed" });
    }

    // Generate new password
    const newPassword = generateRandomPassword(12);

    // Update organizer's password
    const organizer = await User.findById(request.organizer._id);
    organizer.password = newPassword;
    await organizer.save();

    // Update request
    request.status = "APPROVED";
    request.newPassword = newPassword;
    request.adminComments = adminComments;
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    // Send credentials to organizer
    try {
      await sendOrganizerCredentials({
        to: organizer.email,
        organizerName: organizer.organizerName,
        email: organizer.email,
        password: newPassword,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    res.json({
      success: true,
      message: "Password reset request approved",
      request,
      newPassword, // Return password for admin to share
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve password reset request",
      error: error.message,
    });
  }
};

/**
 * Reject password reset request
 * POST /api/admin/password-requests/:id/reject
 */
export const rejectPasswordResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComments } = req.body;

    // Find request
    const request = await PasswordResetRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: "Password reset request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ message: "Request has already been processed" });
    }

    // Update request
    request.status = "REJECTED";
    request.adminComments = adminComments || "Request rejected by admin";
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    await request.save();

    res.json({
      success: true,
      message: "Password reset request rejected",
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reject password reset request",
      error: error.message,
    });
  }
};
