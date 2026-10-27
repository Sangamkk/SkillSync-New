import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaCertificate,
  FaBriefcase,
  FaTrashAlt,
  FaCheckDouble,
  FaExternalLinkAlt,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../../services/notificationService";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Just now";

  const diffSec = Math.floor((new Date() - date) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getNotificationMeta = (type) => {
  switch (type) {
    case "VERIFICATION_APPROVED":
      return {
        icon: <FaCheckCircle className="text-emerald-500 text-base" />,
        bg: "bg-emerald-50 border-emerald-100",
        badge: "Approved",
        badgeColor: "bg-emerald-100 text-emerald-800",
      };
    case "VERIFICATION_REJECTED":
      return {
        icon: <FaTimesCircle className="text-rose-500 text-base" />,
        bg: "bg-rose-50 border-rose-100",
        badge: "Rejected",
        badgeColor: "bg-rose-100 text-rose-800",
      };
    case "CERTIFICATE_ISSUED":
      return {
        icon: <FaCertificate className="text-blue-500 text-base" />,
        bg: "bg-blue-50 border-blue-100",
        badge: "Credential",
        badgeColor: "bg-blue-100 text-blue-800",
      };
    case "CERTIFICATE_UPLOADED":
      return {
        icon: <FaCertificate className="text-sky-500 text-base" />,
        bg: "bg-sky-50 border-sky-100",
        badge: "Certificate Added",
        badgeColor: "bg-sky-100 text-sky-800",
      };
    case "VERIFICATION_REQUESTED":
    case "PROJECT_VERIFICATION_REQUEST":
      return {
        icon: <FaFileAlt className="text-amber-500 text-base" />,
        bg: "bg-amber-50 border-amber-100",
        badge: "Request",
        badgeColor: "bg-amber-100 text-amber-800",
      };
    case "OFFER_EXTENDED":
      return {
        icon: <FaBriefcase className="text-amber-600 text-base" />,
        bg: "bg-amber-100 border-amber-300",
        badge: "⭐ Job Offer",
        badgeColor: "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold shadow-xs",
      };
    case "JOB_POSTED":
      return {
        icon: <FaBriefcase className="text-blue-600 text-base" />,
        bg: "bg-blue-50 border-blue-200",
        badge: "📢 Opportunity",
        badgeColor: "bg-blue-100 text-blue-800 font-semibold",
      };
    case "JOB_APPLICATION":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "EMPLOYMENT_TERMINATED":
      return {
        icon: <FaBriefcase className="text-indigo-500 text-base" />,
        bg: "bg-indigo-50 border-indigo-100",
        badge: "Employment",
        badgeColor: "bg-indigo-100 text-indigo-800",
      };
    case "APPLICATION_APPROVED":
      return {
        icon: <FaCheckCircle className="text-emerald-600 text-base" />,
        bg: "bg-emerald-50 border-emerald-200",
        badge: "🏛️ Organisation",
        badgeColor: "bg-emerald-100 text-emerald-800 font-semibold",
      };
    case "APPLICATION_REJECTED":
      return {
        icon: <FaTimesCircle className="text-rose-500 text-base" />,
        bg: "bg-rose-50 border-rose-100",
        badge: "Organisation",
        badgeColor: "bg-rose-100 text-rose-800",
      };
    default:
      return {
        icon: <FaBell className="text-slate-500 text-base" />,
        bg: "bg-slate-50 border-slate-100",
        badge: "Activity",
        badgeColor: "bg-slate-100 text-slate-800",
      };
  }
};

export default function NotificationBell({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" | "UNREAD" | "VERIFICATIONS" | "CERTS"
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotificationList = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await getNotifications();
      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background fetch errors silently
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Initial fetch and auto-refresh polling every 25 seconds
  useEffect(() => {
    fetchNotificationList(true);
    const interval = setInterval(() => {
      fetchNotificationList(false);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotificationList(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const target = notifications.find((n) => n._id === id);
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.read) {
      handleMarkAsRead(item._id);
    }
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  // Filter items by selected tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "UNREAD") return !item.read;
    if (activeTab === "VERIFICATIONS") {
      return (
        item.type === "VERIFICATION_APPROVED" ||
        item.type === "VERIFICATION_REJECTED" ||
        item.type === "VERIFICATION_REQUESTED" ||
        item.type === "PROJECT_VERIFICATION_REQUEST" ||
        item.type === "PROJECT_APPROVED" ||
        item.type === "PROJECT_REJECTED"
      );
    }
    if (activeTab === "CERTS") {
      return (
        item.type === "CERTIFICATE_ISSUED" ||
        item.type === "CERTIFICATE_UPLOADED" ||
        item.type === "PROJECT_ADDED"
      );
    }
    return true;
  });

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={handleToggle}
        title="Activity Notifications"
        aria-label="Activity Notifications"
        className="relative p-2 rounded-lg border border-[#D9E1E8] bg-white text-[#4D4D4D] hover:text-[#0A66C2] hover:bg-[#F3F6F8] hover:border-[#0A66C2]/40 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30 cursor-pointer flex items-center justify-center"
      >
        <FaBell
          className={`text-base transition-transform duration-200 ${
            unreadCount > 0 ? "text-[#0A66C2] animate-wiggle" : "text-[#555555]"
          }`}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E02424] px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-[#D9E1E8] bg-white text-[#191919] shadow-xl z-50 overflow-hidden transform transition-all duration-200 origin-top-right animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0F172A] tracking-tight">
                Activity Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] hover:text-[#004182] hover:underline cursor-pointer"
                >
                  <FaCheckDouble className="text-[10px]" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all notifications"
                  className="p-1 text-[#94A3B8] hover:text-[#EF4444] transition cursor-pointer"
                >
                  <FaTrashAlt className="text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-[#F1F5F9] text-xs font-medium text-[#64748B]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-[#0A66C2] text-white font-semibold"
                  : "hover:bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNREAD")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === "UNREAD"
                  ? "bg-[#0A66C2] text-white font-semibold"
                  : "hover:bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("VERIFICATIONS")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === "VERIFICATIONS"
                  ? "bg-[#0A66C2] text-white font-semibold"
                  : "hover:bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              Verifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CERTS")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === "CERTS"
                  ? "bg-[#0A66C2] text-white font-semibold"
                  : "hover:bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              Certificates
            </button>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F5F9]">
            {loading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[#64748B]">
                <FaSpinner className="animate-spin text-2xl text-[#0A66C2] mb-2" />
                <p className="text-xs">Loading activity stream…</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-xl text-[#94A3B8] mb-3">
                  🔔
                </div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  No notifications to show
                </p>
                <p className="text-xs text-[#64748B] mt-1 max-w-[260px]">
                  Activities like approvals, rejections, added certificates, and verification requests will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const meta = getNotificationMeta(item.type);
                  const isImportantOffer = Boolean(item.isImportant || item.type === "OFFER_EXTENDED");
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 transition-colors relative flex items-start gap-3 cursor-pointer group ${
                        isImportantOffer
                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500 hover:from-amber-100/70 hover:to-yellow-100/60"
                          : !item.read
                          ? "bg-[#F0F7FF]/70 hover:bg-[#E8F3FF]"
                          : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {/* Leading Type Icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-0.5 ${meta.bg}`}
                      >
                        {meta.icon}
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isImportantOffer && (
                            <span className="text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs animate-pulse">
                              ⭐ IMPORTANT
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badgeColor}`}
                          >
                            {meta.badge}
                          </span>
                          <h4
                            className={`text-xs tracking-tight truncate ${
                              isImportantOffer
                                ? "font-extrabold text-[#78350F]"
                                : !item.read
                                ? "font-bold text-[#0F172A]"
                                : "font-semibold text-[#334155]"
                            }`}
                          >
                            {item.title}
                          </h4>
                        </div>

                      <p className="text-xs text-[#475569] mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#94A3B8]">
                          {formatRelativeTime(item.createdAt)}
                        </span>

                        {item.link && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] group-hover:underline">
                            View details
                            <FaExternalLinkAlt className="text-[9px]" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot & actions */}
                    <div className="absolute top-3.5 right-3 flex items-center gap-1.5">
                      {!item.read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                          title="Mark as read"
                          className="w-2.5 h-2.5 rounded-full bg-[#0A66C2] hover:scale-125 transition-transform"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item._id, e)}
                        title="Dismiss notification"
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#EF4444] transition-opacity cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live activity stream
            </span>
            <span>SkillSync Verified</span>
          </div>
        </div>
      )}
    </div>
  );
}
