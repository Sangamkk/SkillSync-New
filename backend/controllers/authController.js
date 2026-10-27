import * as authService from "../services/authService.js";
import EmailVerification from "../models/EmailVerification.js";
import User from "../models/User.js";
import OrganisationApplication from "../models/OrganisationApplication.js";
import { sendVerificationEmail } from "../services/emailService.js";

export const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user or organisation already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    const existingOrg = await OrganisationApplication.findOne({ email: normalizedEmail });
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in.",
      });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous active code for this email and save the new code
    await EmailVerification.deleteMany({ email: normalizedEmail });
    await EmailVerification.create({
      email: normalizedEmail,
      code,
      verified: false,
    });

    await sendVerificationEmail(normalizedEmail, code);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email address. Please check your inbox.",
    });
  } catch (error) {
    console.error("[AUTH SEND VERIFICATION CODE ERROR]:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send verification code. Please try again.",
    });
  }
};

export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await EmailVerification.findOne({ email: normalizedEmail });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or not found. Please request a new code.",
      });
    }

    if (verification.code !== code.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again.",
      });
    }

    verification.verified = true;
    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("[AUTH VERIFY CODE ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify code. Please try again.",
    });
  }
};

export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    return res.status(201).json(result);
  } catch (error) {
    console.error("[AUTH REGISTER ERROR]:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AUTH LOGIN ERROR]:", error.message);
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const role = (req.user?.role || "").toUpperCase();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    let user = null;
    if (role === "ORGANISATION") {
      user = await OrganisationApplication.findById(userId).select("-password").lean();
    } else {
      user = await User.findById(userId).select("-password").lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const role = (req.user?.role || "").toUpperCase();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const {
      name,
      headline,
      bio,
      phone,
      college,
      usn,
      githubUrl,
      linkedinUrl,
      website,
      emailNotificationsEnabled,
      notificationPreferences,
      organisationName,
      description,
    } = req.body;

    let updated = null;
    if (role === "ORGANISATION") {
      const updates = {};
      if (name !== undefined || organisationName !== undefined) {
        updates.organisationName = organisationName || name;
      }
      if (website !== undefined) updates.website = website;
      if (description !== undefined) updates.description = description;
      if (emailNotificationsEnabled !== undefined) {
        updates.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);
      }
      if (notificationPreferences !== undefined && typeof notificationPreferences === "object") {
        updates.notificationPreferences = notificationPreferences;
      }

      updated = await OrganisationApplication.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      )
        .select("-password")
        .lean();
    } else {
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (headline !== undefined) updates.headline = headline;
      if (bio !== undefined) updates.bio = bio;
      if (phone !== undefined) updates.phone = phone;
      if (college !== undefined) updates.college = college;
      if (usn !== undefined) updates.usn = usn;
      if (githubUrl !== undefined) updates.githubUrl = githubUrl;
      if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
      if (website !== undefined) updates.website = website;
      if (emailNotificationsEnabled !== undefined) {
        updates.emailNotificationsEnabled = Boolean(emailNotificationsEnabled);
      }
      if (notificationPreferences !== undefined && typeof notificationPreferences === "object") {
        updates.notificationPreferences = notificationPreferences;
      }

      updated = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      )
        .select("-password")
        .lean();
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("[UPDATE SETTINGS ERROR]:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};