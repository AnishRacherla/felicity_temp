import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    // Core References
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    
    // Ticket Information
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    qrCode: String, // QR code image URL or base64
    
    // Registration Type
    registrationType: {
      type: String,
      enum: ["NORMAL", "MERCHANDISE"],
      required: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"],
      default: "CONFIRMED",
    },
    
    // Payment Information
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "PENDING_APPROVAL", "REFUNDED"],
      default: "UNPAID",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentProof: String, // For merchandise payment verification (image URL)
    paymentProofUploadedAt: Date, // When proof was uploaded
    paymentRejectionReason: String, // Why payment was rejected
    paymentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentApprovedAt: Date,
    
    // Custom Form Response (for Normal Events)
    formResponse: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Flexible field storage
    },
    
    // Merchandise Details (for Merchandise Events)
    merchandiseDetails: {
      size: String,
      color: String,
      variant: String,
      quantity: {
        type: Number,
        default: 1,
      },
    },
    
    // Team Information (for team events)
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    teamName: String,
    
    // Attendance
    attended: {
      type: Boolean,
      default: false,
    },
    attendedAt: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Timestamps
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
registrationSchema.index({ participant: 1, event: 1 });
// ticketId index is created automatically by unique: true
registrationSchema.index({ event: 1, status: 1 });

export default mongoose.model("Registration", registrationSchema);
