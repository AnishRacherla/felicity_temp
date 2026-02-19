/**
 * Admin Account Creation Script
 * 
 * This script creates the first admin account in the system.
 * Run this ONCE during initial setup:
 * 
 * Usage: node scripts/createAdmin.js
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../src/models/User.js";
import { ROLES } from "../src/constants/roles.js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@felicity.iiit.ac.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Felicity2026";

const createAdmin = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists!");
      console.log("Email:", ADMIN_EMAIL);
      console.log("\nIf you need to reset the password, delete the existing admin first.");
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      firstName: "Admin",
      lastName: "Felicity",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log("✅ Admin account created successfully!\n");
    console.log("==========================================");
    console.log("📧 Email:", ADMIN_EMAIL);
    console.log("🔑 Password:", ADMIN_PASSWORD);
    console.log("==========================================\n");
    console.log("⚠️  IMPORTANT: Store these credentials securely!");
    console.log("💡 TIP: Update password after first login\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
