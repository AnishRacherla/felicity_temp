import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    // Common fields for all users
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Hide by default for security
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    // Participant-specific fields
    participantType: {
      type: String,
      enum: ["IIIT", "NON_IIIT"],
    },
    collegeName: String,
    contactNumber: String,
    
    // Participant preferences (for personalization)
    interests: [{
      type: String,
      trim: true,
    }],
    followedOrganizers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    
    // Organizer-specific fields
    organizerName: String, // Display name for the organizer
    category: {
      type: String,
      enum: ["Club", "Council", "Fest Team", "Technical", "Cultural", "Sports", "Other"],
    },
    description: String,
    contactEmail: String, // Public contact for organizer
    discordWebhook: String, // For Discord integration
    
    // System fields
    isActive: { type: Boolean, default: true }, // For soft delete/disable
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  // Only hash password if it's modified (new or changed)
  if (!this.isModified("password")) return;
  
  // Hash password with bcrypt (10 rounds of salting)
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
