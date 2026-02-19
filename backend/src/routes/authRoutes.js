import express from "express";
import {
  registerParticipant,
  login,
  getMe,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerParticipant);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

export default router;
