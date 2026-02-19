import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Attempting MongoDB connection...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "***" + process.env.MONGO_URI.slice(-50) : "UNDEFINED");
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB connected successfully");
    console.log(`Connected to database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("\nPossible solutions:");
    console.error("1. Check if your IP is whitelisted in MongoDB Atlas Network Access");
    console.error("2. Verify your MongoDB credentials in .env file");
    console.error("3. Ensure the MongoDB cluster is running");
    // Don't exit - let server run for testing
    console.log("\n⚠️  Server running without database connection");
  }
};

export default connectDB;
