import * as StudentService from "../services/student.service.js";

// ─── GET /api/student/profile ──────────────────────────────────────────────────
/** Student gets their own profile. */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const user = await StudentService.getProfile(userId);

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── GET /api/student/profile/full ────────────────────────────────────────────
/** Student gets their full professional profile (certs + projects + employment). */
export const getFullProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const profile = await StudentService.getFullProfile(userId);

        return res.status(200).json({
            success: true,
            ...profile,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── PUT /api/student/profile ──────────────────────────────────────────────────
/** Student updates their profile (bio, headline, skills, phone, college, etc.). */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const user = await StudentService.updateProfile(userId, req.body);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};
