import Notification from "../models/Notification.js";
import { syncPastActivities, removeDuplicateNotifications } from "../services/notificationService.js";

/**
 * GET /api/notifications
 * Fetch notifications for authenticated user/organisation.
 * Also runs syncPastActivities to ensure past events appear and deduplicates.
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Attempt backfill of existing activities so existing user data is immediately populated
    await syncPastActivities(userId, userRole).catch((err) =>
      console.warn("syncPastActivities warning:", err.message)
    );

    // Purge any duplicates in real-time
    await removeDuplicateNotifications(userId).catch((err) =>
      console.warn("removeDuplicateNotifications warning:", err.message)
    );

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET NOTIFICATIONS ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
      notifications: [],
      unreadCount: 0,
    });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("[MARK NOTIFICATION READ ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification",
    });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the user as read.
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("[MARK ALL READ ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all as read",
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { id } = req.params;

    await Notification.findOneAndDelete({ _id: id, recipient: userId });

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    console.error("[DELETE NOTIFICATION ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
};

/**
 * DELETE /api/notifications
 * Clear all notifications for the user.
 */
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;

    await Notification.deleteMany({ recipient: userId });

    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("[CLEAR NOTIFICATIONS ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear notifications",
    });
  }
};
