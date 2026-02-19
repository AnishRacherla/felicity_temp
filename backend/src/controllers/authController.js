import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { ROLES } from "../constants/roles.js";

/**
 * Participant Registration
 * POST /api/auth/register
 */
export const registerParticipant = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeName,
      contactNumber,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !participantType) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // IIIT email validation
    if (
      participantType === "IIIT" &&
      !(
        email.endsWith("@students.iiit.ac.in") ||
        email.endsWith("@research.iiit.ac.in")
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "IIIT students must use their IIIT email (@students.iiit.ac.in or @research.iiit.ac.in)",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new participant
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: ROLES.PARTICIPANT,
      participantType,
      collegeName,
      contactNumber,
      isActive: true,
    });

    // Generate JWT token
    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        participantType: user.participantType,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: err.message,
    });
  }
};

/**
 * Login (All roles)
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact admin.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken(user);

    // Prepare response based on role
    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    // Add role-specific fields
    if (user.role === ROLES.PARTICIPANT) {
      userResponse.participantType = user.participantType;
      userResponse.collegeName = user.collegeName;
      userResponse.contactNumber = user.contactNumber;
    } else if (user.role === ROLES.ORGANIZER) {
      userResponse.organizerName = user.organizerName;
      userResponse.category = user.category;
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
      error: err.message,
    });
  }
};

/**
 * Get Current User
 * GET /api/auth/me
 * Protected route - requires authentication
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
      error: err.message,
    });
  }
};

/**
 * Change Password
 * PUT /api/auth/change-password
 * Protected route - requires authentication
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Only participants can change password directly
    // Organizers must request password reset from admin
    if (req.user.role !== 'participant') {
      return res.status(403).json({
        success: false,
        message: "Organizers must request password reset from admin. Please contact your administrator.",
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: err.message,
    });
  }
};
