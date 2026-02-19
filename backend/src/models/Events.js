import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },

    type: {
      type: String,
      enum: ["NORMAL", "MERCH"],
      required: true,
    },

    eligibility: {
      type: String,
      enum: ["IIIT", "NON_IIIT", "ALL"],
      default: "ALL",
    },

    registrationDeadline: Date,
    startDate: Date,
    endDate: Date,

    registrationLimit: Number,
    registrationFee: { type: Number, default: 0 },

    tags: [String],

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ONGOING", "CLOSED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
