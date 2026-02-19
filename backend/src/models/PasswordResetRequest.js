import mongoose from "mongoose";

const passwordResetRequestSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    adminComments: {
      type: String,
      trim: true,
    },
    newPassword: {
      type: String,
      // Only set when approved
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Admin who processed the request
    },
    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PasswordResetRequest", passwordResetRequestSchema);
