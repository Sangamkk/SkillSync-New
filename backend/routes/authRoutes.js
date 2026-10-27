import express from "express";
import {
  register,
  login,
  sendVerificationCode,
  verifyCode,
  getCurrentUser,
  updateSettings,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-verification-code", sendVerificationCode);
router.post("/verify-code", verifyCode);
router.post("/register", register);
router.post("/login", login);

// Authenticated User / Org Settings
router.get("/me", authenticate, getCurrentUser);
router.patch("/settings", authenticate, updateSettings);

export default router;
