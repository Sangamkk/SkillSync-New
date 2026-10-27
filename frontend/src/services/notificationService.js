import api from "./api";

/**
 * Fetch all notifications and unread count for current user/org.
 */
export const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

/**
 * Delete a single notification.
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

/**
 * Clear all notifications.
 */
export const clearAllNotifications = async () => {
  const response = await api.delete("/notifications");
  return response.data;
};
