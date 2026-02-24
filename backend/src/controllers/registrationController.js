import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { generateTicketId, generateQRCode } from "../utils/ticketGenerator.js";
import { sendRegistrationEmail } from "../utils/emailService.js";
import {
  isRegistrationOpen,
  hasCapacity,
  checkEligibility,
} from "../utils/validators.js";

/**
 * Register for a normal event
 * POST /api/events/:id/register
 */
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponse } = req.body;

    // Get event
    const event = await Event.findById(eventId).populate("organizer", "organizerName");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event is not open for registration" });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      participant: req.user._id,
      event: eventId,
      status: { $in: ["CONFIRMED", "PENDING"] },
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    // Validate eligibility
    if (!checkEligibility(event.eligibility, req.user.participantType)) {
      return res.status(403).json({
        message: `This event is only for ${event.eligibility.replace("_", " ")} participants`,
      });
    }

    // Check registration deadline
    if (!isRegistrationOpen(event.registrationDeadline)) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    // Check capacity
    if (!hasCapacity(event.registrationLimit, event.currentRegistrations)) {
      return res.status(400).json({ message: "Event is full" });
    }

    // Generate ticket
    const ticketId = generateTicketId();
    const qrData = {
      ticketId,
      participantId: req.user._id.toString(),
      participantName: `${req.user.firstName} ${req.user.lastName}`,
      eventId: event._id.toString(),
      eventName: event.eventName,
      eventDate: event.eventStartDate,
    };
    const qrCode = await generateQRCode(qrData);

    // Create registration
    const registration = await Registration.create({
      participant: req.user._id,
      event: eventId,
      ticketId,
      qrCode,
      registrationType: "NORMAL",
      status: "CONFIRMED",
      paymentStatus: event.registrationFee > 0 ? "UNPAID" : "PAID",
      amountPaid: 0,
      formResponse,
    });

    // Update event
    event.currentRegistrations += 1;
    event.registrationsLast24h += 1;
    
    // Lock form after first registration
    if (!event.formLocked) {
      event.formLocked = true;
    }
    
    await event.save();

    // Send email asynchronously (fire-and-forget)
    setImmediate(async () => {
      try {
        console.log(`📧 Attempting to send registration email to: ${req.user.email}`);
        console.log(`📧 Event: ${event.eventName}, Ticket: ${ticketId}`);
        
        await sendRegistrationEmail({
          to: req.user.email,
          participantName: `${req.user.firstName} ${req.user.lastName}`,
          eventName: event.eventName,
          ticketId,
          qrCode,
          eventDate: event.eventStartDate,
        });
        
        console.log(`✅ Registration email sent successfully to ${req.user.email}`);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError.message);
        console.error("Error details:", emailError);
        // Email failure doesn't affect registration
      }
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Check your email for the ticket.",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

/**
 * Purchase merchandise
 * POST /api/events/:id/purchase
 */
export const purchaseMerchandise = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { size, color, variant, quantity = 1 } = req.body;

    const event = await Event.findById(eventId).populate("organizer", "organizerName");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.eventType !== "MERCHANDISE") {
      return res.status(400).json({ message: "This is not a merchandise event" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Merchandise sale is not open" });
    }

    // Check if already purchased
    const existingPurchase = await Registration.findOne({
      participant: req.user._id,
      event: eventId,
      status: { $in: ["CONFIRMED", "PENDING"] },
    });

    if (existingPurchase) {
      return res.status(400).json({ message: "Already purchased this merchandise" });
    }

    // Log input for debugging
    console.log(`[PURCHASE] Event: ${event.eventName}, Size: ${size}, Color: ${color}, Qty: ${quantity}`);
    console.log(`[PURCHASE] Total Stock: ${event.merchandise?.stockQuantity}, Variants: ${event.merchandise?.variants?.length}`);

    // Check stock - validate against specific variant if available
    let availableStock = 0;
    if (event.merchandise?.variants && size && color) {
      // Find specific variant - try multiple matching strategies
      let variant = event.merchandise.variants.find(v => v.size === size && v.color === color);
      
      // Fallback: try matching by name format "SIZE - COLOR"
      if (!variant) {
        const variantName = `${size} - ${color}`;
        variant = event.merchandise.variants.find(v => v.name === variantName);
      }
      
      if (!variant) {
        console.log(`[PURCHASE] Variant not found for ${size} - ${color}`);
        return res.status(400).json({ message: `Variant not found: ${size} - ${color}` });
      }
      
      // Calculate effective stock with fallback
      availableStock = variant.stock || 0;
      
      // If variant has 0 stock but total stockQuantity exists, calculate distributed stock
      if (availableStock === 0 && event.merchandise?.stockQuantity && event.merchandise.stockQuantity > 0) {
        const variantIndex = event.merchandise.variants.findIndex(v => 
          (v.size === size && v.color === color) || v.name === `${size} - ${color}`
        );
        const numVariants = event.merchandise.variants.length;
        const baseStock = Math.floor(event.merchandise.stockQuantity / numVariants);
        const remainder = event.merchandise.stockQuantity % numVariants;
        availableStock = variantIndex >= 0 && variantIndex < remainder ? baseStock + 1 : baseStock;
        console.log(`[PURCHASE] Using fallback: variantIndex=${variantIndex}, baseStock=${baseStock}, remainder=${remainder}, calculated=${availableStock}`);
      } else {
        console.log(`[PURCHASE] Using actual stock: ${availableStock}`);
      }
      
      if (availableStock <= 0) {
        return res.status(400).json({ message: `${size} - ${color} is out of stock` });
      }
      
      if (quantity > availableStock) {
        return res.status(400).json({ message: `Only ${availableStock} unit(s) available for ${size} - ${color}. You requested ${quantity}.` });
      }
    } else {
      // Fallback to total stock if variants not available
      availableStock = event.merchandise?.stockQuantity || 0;
      console.log(`[PURCHASE] No variants/size/color, using total stock: ${availableStock}`);
      
      if (availableStock <= 0) {
        return res.status(400).json({ message: "Out of stock" });
      }
      
      if (quantity > availableStock) {
        return res.status(400).json({ message: `Only ${availableStock} units available. You requested ${quantity}.` });
      }
    }

    // Check purchase limit
    const maxPerPerson = event.merchandise?.purchaseLimit || 1;
    if (quantity > maxPerPerson) {
      return res.status(400).json({
        message: `Maximum ${maxPerPerson} items per person`,
      });
    }

    // Generate ticket ID
    const ticketId = generateTicketId();

    // Create purchase registration (pending approval)
    const registration = await Registration.create({
      participant: req.user._id,
      event: eventId,
      ticketId,
      registrationType: "MERCHANDISE",
      status: "PENDING", // Pending payment approval
      paymentStatus: "PENDING_APPROVAL",
      amountPaid: event.registrationFee * quantity,
      merchandiseDetails: {
        size,
        color,
        variant,
        quantity,
      },
    });

    res.status(201).json({
      success: true,
      message: "Purchase initiated. Please upload payment proof for approval.",
      registration,
      instructions: "Upload your payment screenshot to complete the purchase",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Purchase failed",
      error: error.message,
    });
  }
};

/**
 * Upload payment proof for merchandise
 * POST /api/registrations/:id/payment-proof
 */
export const uploadPaymentProof = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentProof } = req.body; // Base64 image data or URL

    const registration = await Registration.findOne({
      _id: registrationId,
      participant: req.user._id,
    }).populate('event', 'eventName');

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Allow upload for PENDING status or if payment was rejected
    if (registration.paymentStatus === 'PAID') {
      return res.status(400).json({ message: "Payment already approved" });
    }

    // Update registration with payment proof
    registration.paymentProof = paymentProof;
    registration.paymentProofUploadedAt = new Date();
    registration.paymentStatus = "PENDING_APPROVAL";
    registration.status = "PENDING"; // Set status to pending until approved
    registration.paymentRejectionReason = undefined; // Clear rejection reason
    await registration.save();

    res.json({
      success: true,
      message: "Payment proof uploaded successfully. Awaiting organizer approval.",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload payment proof",
      error: error.message,
    });
  }
};

/**
 * Get registration/ticket details
 * GET /api/registrations/:id
 */
export const getTicketDetails = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      _id: registrationId,
      participant: req.user._id,
    })
      .populate("event", "eventName eventType eventStartDate eventEndDate")
      .populate({
        path: "event",
        populate: { path: "organizer", select: "organizerName contactEmail" },
      });

    if (!registration) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json({
      success: true,
      ticket: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

/**
 * Cancel registration
 * DELETE /api/registrations/:id
 */
export const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      _id: registrationId,
      participant: req.user._id,
    }).populate("event");

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.status === "CANCELLED") {
      return res.status(400).json({ message: "Registration already cancelled" });
    }

    // Check if event has started
    if (new Date() >= new Date(registration.event.eventStartDate)) {
      return res.status(400).json({ message: "Cannot cancel after event has started" });
    }

    // Update registration status
    registration.status = "CANCELLED";
    await registration.save();

    // Decrement event registrations
    await Event.findByIdAndUpdate(registration.event._id, {
      $inc: { currentRegistrations: -1 },
    });

    res.json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
      error: error.message,
    });
  }
};
