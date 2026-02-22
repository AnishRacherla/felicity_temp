import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    // Basic Information
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    
    // Event Type
    eventType: {
      type: String,
      enum: ["NORMAL", "MERCHANDISE"],
      required: true,
    },
    
    // Organizer
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Eligibility & Capacity
    eligibility: {
      type: String,
      enum: ["IIIT_ONLY", "NON_IIIT_ONLY", "ALL"],
      default: "ALL",
    },
    registrationLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    currentRegistrations: {
      type: Number,
      default: 0,
    },
    
    // Dates
    registrationDeadline: {
      type: Date,
      required: true,
    },
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    
    // Pricing
    registrationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Event Status
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CLOSED"],
      default: "DRAFT",
    },
    
    // Tags for search/filter
    tags: [{
      type: String,
      trim: true,
    }],
    
    // Trending metrics
    views: {
      type: Number,
      default: 0,
    },
    registrationsLast24h: {
      type: Number,
      default: 0,
    },
    
    // Normal Event - Custom Registration Form
    customForm: [{
      fieldName: String,
      fieldType: {
        type: String,
        enum: ["TEXT", "TEXTAREA", "DROPDOWN", "CHECKBOX", "RADIO", "FILE"],
      },
      options: [String], // For dropdown/radio/checkbox
      required: Boolean,
      order: Number,
    }],
    formLocked: {
      type: Boolean,
      default: false, // Locks after first registration
    },
    
    // Merchandise Event - Product Details
    merchandise: {
      sizes: [String], // ["S", "M", "L", "XL"]
      colors: [String],
      variants: [{
        name: String,
        size: String,
        color: String,
        price: Number,
        stock: Number,
      }],
      stockQuantity: Number,
      purchaseLimit: {
        type: Number,
        default: 1, // Max items per participant
      },
    },
    
    // Analytics
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalAttendance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ eventType: 1, status: 1 });
eventSchema.index({ registrationDeadline: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ eventName: "text", description: "text" }); // Text search

export default mongoose.model("Event", eventSchema);
