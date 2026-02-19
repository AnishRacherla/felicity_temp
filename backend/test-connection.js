// Simple MongoDB Connection Test
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

console.log("=== MongoDB Connection Diagnostics ===\n");

// Check if MONGO_URI exists
console.log("1. MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("2. MONGO_URI length:", process.env.MONGO_URI?.length || 0);

// Check for whitespace issues
if (process.env.MONGO_URI) {
  const hasLeadingSpace = process.env.MONGO_URI[0] === ' ' || process.env.MONGO_URI[0] === '\n';
  const hasTrailingSpace = process.env.MONGO_URI[process.env.MONGO_URI.length - 1] === ' ' || 
                           process.env.MONGO_URI[process.env.MONGO_URI.length - 1] === '\n';
  
  console.log("3. Has leading whitespace:", hasLeadingSpace);
  console.log("4. Has trailing whitespace:", hasTrailingSpace);
  console.log("5. Full URI (masked):", process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
  
  // Check URI format
  const startsCorrectly = process.env.MONGO_URI.trim().startsWith('mongodb+srv://');
  console.log("6. Starts with 'mongodb+srv://':", startsCorrectly);
}

console.log("\n=== Attempting Connection ===\n");

async function testConnection() {
  try {
    const cleanUri = process.env.MONGO_URI?.trim();
    console.log("Using cleaned URI (masked):", cleanUri?.replace(/\/\/([^:]+):([^@]+)@/, '//<username>:<password>@'));
    
    await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("\n✅ SUCCESS: MongoDB connected successfully!");
    console.log("Connection state:", mongoose.connection.readyState);
    process.exit(0);
  } catch (error) {
    console.error("\n❌ FAILED: MongoDB connection error");
    console.error("Error message:", error.message);
    console.error("\nIf you see ECONNREFUSED or ENOTFOUND:");
    console.error("  - Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)");
    console.error("  - Verify username and password are correct");
    console.error("  - Ensure cluster name is correct");
    process.exit(1);
  }
}

testConnection();
