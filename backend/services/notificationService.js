import Notification from "../models/Notification.js";
import VerificationRequest from "../models/VerificationRequest.js";
import Certificate from "../models/Certificate.js";
import Project from "../models/Project.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import OrganisationApplication from "../models/OrganisationApplication.js";
import { sendActivityNotificationEmail } from "./emailService.js";

/**
 * Map notification type to user preference category.
 */
export const getCategoryFromType = (type) => {
  switch (type) {
    case "OFFER_EXTENDED":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "EMPLOYMENT_TERMINATED":
      return "jobOffers";
    case "JOB_POSTED":
      return "jobPostings";
    case "JOB_APPLICATION":
      return "applications";
    case "CERTIFICATE_ISSUED":
    case "CERTIFICATE_UPLOADED":
      return "certificates";
    case "VERIFICATION_REQUESTED":
    case "VERIFICATION_APPROVED":
    case "VERIFICATION_REJECTED":
      return "verifications";
    case "PROJECT_ADDED":
    case "PROJECT_APPROVED":
    case "PROJECT_REJECTED":
      return "projects";
    default:
      return null;
  }
};

/**
 * Clean up duplicate notifications for a user.
 */
export const removeDuplicateNotifications = async (userId) => {
  try {
    if (!userId) return;
    const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
    const seen = new Set();
    const toDelete = [];

    for (const notif of notifications) {
      const key =
        notif.metadata?.activityId ||
        (notif.metadata?.jobId ? `${notif.type}_job_${notif.metadata.jobId}` : "") ||
        (notif.metadata?.applicationId ? `${notif.type}_app_${notif.metadata.applicationId}` : "") ||
        (notif.metadata?.certificateId ? `${notif.type}_cert_${notif.metadata.certificateId}` : "") ||
        (notif.metadata?.requestId ? `${notif.type}_req_${notif.metadata.requestId}` : "") ||
        `${notif.type}_${notif.title}_${notif.message}`;

      if (seen.has(key)) {
        toDelete.push(notif._id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      await Notification.deleteMany({ _id: { $in: toDelete } });
    }
  } catch (err) {
    console.warn("[NOTIFICATION DEDUP ERROR]:", err.message);
  }
};

/**
 * Create a single notification document safely with deduplication and preference check.
 * Dispatches real-time email notification if recipient has a verified email and email notifications enabled.
 */
export const createNotification = async ({
  recipient,
  recipientRole,
  sender = null,
  senderName = "",
  type = "SYSTEM",
  title,
  message,
  link = "",
  isImportant = false,
  metadata = {},
}) => {
  try {
    if (!recipient || !title || !message) {
      return null;
    }

    // 1. Fetch recipient to verify notification preferences
    let recipientDoc = null;
    if (recipientRole === "ORGANISATION") {
      recipientDoc = await OrganisationApplication.findById(recipient)
        .select("email emailVerified emailNotificationsEnabled notificationPreferences organisationName")
        .lean();
      if (!recipientDoc) {
        recipientDoc = await User.findById(recipient)
          .select("email emailVerified emailNotificationsEnabled notificationPreferences name organisationName")
          .lean();
      }
    } else {
      recipientDoc = await User.findById(recipient)
        .select("email emailVerified emailNotificationsEnabled notificationPreferences name")
        .lean();
      if (!recipientDoc) {
        recipientDoc = await OrganisationApplication.findById(recipient)
          .select("email emailVerified emailNotificationsEnabled notificationPreferences organisationName")
          .lean();
      }
    }

    // 2. Check if user opted out of this specific notification category
    const category = getCategoryFromType(type);
    if (category && recipientDoc?.notificationPreferences) {
      if (recipientDoc.notificationPreferences[category] === false) {
        // Recipient explicitly disabled notifications for this category
        return null;
      }
    }

    // 3. Strict Deduplication check: prevent multiple creations of the same event
    const activityId = metadata?.activityId || null;
    const dedupConditions = [];
    if (activityId) {
      dedupConditions.push({ "metadata.activityId": activityId });
    }
    if (metadata?.jobId && type === "JOB_POSTED") {
      dedupConditions.push({ "metadata.jobId": metadata.jobId, type: "JOB_POSTED" });
    }
    if (metadata?.applicationId && type) {
      dedupConditions.push({ "metadata.applicationId": metadata.applicationId, type });
    }
    if (metadata?.certificateId && type) {
      dedupConditions.push({ "metadata.certificateId": metadata.certificateId, type });
    }
    if (metadata?.requestId && type) {
      dedupConditions.push({ "metadata.requestId": metadata.requestId, type });
    }

    if (dedupConditions.length > 0) {
      const existing = await Notification.findOne({
        recipient,
        $or: dedupConditions,
      });
      if (existing) {
        // Return existing record instead of creating duplicate
        return existing;
      }
    }

    const importantFlag = Boolean(isImportant || type === "OFFER_EXTENDED");

    const doc = await Notification.create({
      recipient,
      recipientRole: recipientRole || "STUDENT",
      sender,
      senderName,
      type,
      title,
      message,
      link,
      isImportant: importantFlag,
      metadata,
    });

    // 4. Asynchronously dispatch email if recipient has a verified email & notifications allowed
    (async () => {
      try {
        const hasVerifiedEmail =
          recipientDoc?.email && recipientDoc?.emailVerified !== false;
        const allowsEmailNotifications =
          recipientDoc?.emailNotificationsEnabled !== false;
        const categoryAllowed =
          !category ||
          !recipientDoc?.notificationPreferences ||
          recipientDoc.notificationPreferences[category] !== false;

        if (hasVerifiedEmail && allowsEmailNotifications && categoryAllowed) {
          await sendActivityNotificationEmail({
            to: recipientDoc.email,
            recipientName:
              recipientDoc.name || recipientDoc.organisationName || "Applicant",
            title,
            message,
            link,
            isImportant: importantFlag,
            senderName,
          });
        }
      } catch (err) {
        console.warn("[NOTIFICATION EMAIL DISPATCH FAILED]:", err.message);
      }
    })().catch(() => {});

    return doc;
  } catch (error) {
    console.error("[NOTIFICATION SERVICE CREATE ERROR]:", error.message);
    return null;
  }
};

/**
 * Idempotently sync past activities into notifications for a user or organisation.
 * This ensures that existing approvals, rejections, and added certificates are already visible in the bell.
 */
export const syncPastActivities = async (userId, userRole) => {
  try {
    if (!userId) return;
    const role = (userRole || "").toUpperCase();

    if (role === "STUDENT") {
      // 1. Sync student's verification requests (Approved or Rejected)
      const requests = await VerificationRequest.find({
        student: userId,
        status: { $in: ["Approved", "Rejected"] },
      })
        .populate("organisation", "organisationName name")
        .populate("certificate", "certificateName")
        .populate("project", "projectName")
        .lean();

      for (const req of requests) {
        const activityId = `verif_req_${req._id}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing) {
          const orgName =
            req.organisation?.organisationName ||
            req.organisation?.name ||
            "Organisation";
          const itemName =
            req.certificate?.certificateName ||
            req.project?.projectName ||
            "Credential";
          const isApproved = req.status === "Approved";

          await Notification.create({
            recipient: userId,
            recipientRole: "STUDENT",
            sender: req.organisation?._id || req.organisation,
            senderName: orgName,
            type: isApproved ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
            title: isApproved
              ? "Verification Approved"
              : "Verification Rejected",
            message: isApproved
              ? `Your ${req.requestType || "credential"} "${itemName}" was verified on blockchain by ${orgName}.`
              : `Your verification request for "${itemName}" was rejected by ${orgName}.${
                  req.rejectionReason ? ` Reason: ${req.rejectionReason}` : ""
                }`,
            link:
              req.requestType === "project"
                ? "/student/projects"
                : "/student/certificates",
            read: false,
            metadata: {
              activityId,
              requestId: req._id,
              txHash: req.actionTxHash || req.transactionHash || "",
            },
            createdAt: req.updatedAt || req.createdAt,
          });
        }
      }

      // 2. Sync student's certificates (uploaded or issued)
      const certificates = await Certificate.find({ student: userId })
        .populate("issuingOrganisation", "organisationName name")
        .lean();

      for (const cert of certificates) {
        const activityId = `cert_${cert._id}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing) {
          const isOrgIssued = cert.issuedByOrganisation;
          const orgName =
            cert.issuingOrganisation?.organisationName ||
            cert.issuer ||
            "Organisation";

          await Notification.create({
            recipient: userId,
            recipientRole: "STUDENT",
            sender: cert.issuingOrganisation?._id || null,
            senderName: orgName,
            type: isOrgIssued ? "CERTIFICATE_ISSUED" : "CERTIFICATE_UPLOADED",
            title: isOrgIssued
              ? "Certificate Issued"
              : "Certificate Added",
            message: isOrgIssued
              ? `${orgName} issued verified certificate "${cert.certificateName}" to your portfolio.`
              : `Certificate "${cert.certificateName}" was added. You can now request verification.`,
            link: "/student/certificates",
            read: false,
            metadata: {
              activityId,
              certificateId: cert._id,
              certificateHash: cert.certificateHash,
              txHash: cert.txHash || cert.blockchainTxHash || "",
            },
            createdAt: cert.createdAt,
          });
        }
      }

      // 3. Sync student's job applications and offers
      const applications = await Application.find({ student: userId })
        .populate("job", "title")
        .populate("organisation", "organisationName name")
        .lean();

      for (const app of applications) {
        const activityId = `app_${app._id}_${app.status}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing && app.status && app.status !== "Applied") {
          const orgName =
            app.organisation?.organisationName ||
            app.organisation?.name ||
            "Company";
          const jobTitle = app.job?.title || "Opportunity";

          let title = `Application Update: ${app.status}`;
          let type = "JOB_APPLICATION";
          let message = `Your application for "${jobTitle}" at ${orgName} has been marked as ${app.status}.`;

          let isImportant = false;
          if (app.status === "Offered") {
            title = "⭐ IMPORTANT: Official Job Offer Received! 💼";
            type = "OFFER_EXTENDED";
            isImportant = true;
            message = `Congratulations! ${orgName} has extended an official employment offer for "${jobTitle}". Review offer details and respond.`;
          } else if (app.status === "Accepted") {
            title = "Offer Accepted";
            type = "OFFER_ACCEPTED";
            message = `You accepted the offer for "${jobTitle}" at ${orgName}.`;
          } else if (app.status === "Rejected") {
            title = "Application Update";
            type = "JOB_APPLICATION";
            message = `Your application for "${jobTitle}" was not selected.`;
          }

          await Notification.create({
            recipient: userId,
            recipientRole: "STUDENT",
            sender: app.organisation?._id || null,
            senderName: orgName,
            type,
            title,
            message,
            link: "/student/offers",
            isImportant,
            read: false,
            metadata: {
              activityId,
              applicationId: app._id,
              jobId: app.job?._id,
            },
            createdAt: app.updatedAt || app.createdAt,
          });
        }
      }
    } else if (role === "ORGANISATION") {
      // 1. Sync organisation's received verification requests
      const requests = await VerificationRequest.find({
        organisation: userId,
      })
        .populate("student", "name email")
        .populate("certificate", "certificateName")
        .populate("project", "projectName")
        .lean();

      for (const req of requests) {
        const activityId = `org_verif_req_${req._id}_${req.status}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing) {
          const studentName = req.student?.name || "Applicant";
          const itemName =
            req.certificate?.certificateName ||
            req.project?.projectName ||
            "Credential";

          let type = "VERIFICATION_REQUESTED";
          let title = "Verification Request";
          let message = `${studentName} requested verification for "${itemName}".`;

          if (req.status === "Approved") {
            type = "VERIFICATION_APPROVED";
            title = "Verification Approved";
            message = `You approved verification for ${studentName}'s "${itemName}". Recorded on blockchain.`;
          } else if (req.status === "Rejected") {
            type = "VERIFICATION_REJECTED";
            title = "Verification Rejected";
            message = `You rejected verification request for ${studentName}'s "${itemName}".`;
          }

          await Notification.create({
            recipient: userId,
            recipientRole: "ORGANISATION",
            sender: req.student?._id || null,
            senderName: studentName,
            type,
            title,
            message,
            link: "/organisation?section=requests",
            read: false,
            metadata: {
              activityId,
              requestId: req._id,
              status: req.status,
              txHash: req.actionTxHash || "",
            },
            createdAt: req.updatedAt || req.createdAt,
          });
        }
      }

      // 2. Sync certificates issued by this organisation
      const issuedCerts = await Certificate.find({
        issuingOrganisation: userId,
      })
        .populate("student", "name")
        .lean();

      for (const cert of issuedCerts) {
        const activityId = `org_cert_issued_${cert._id}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing) {
          const studentName = cert.student?.name || "Student";
          await Notification.create({
            recipient: userId,
            recipientRole: "ORGANISATION",
            sender: cert.student?._id || null,
            senderName: studentName,
            type: "CERTIFICATE_ISSUED",
            title: "Certificate Issued",
            message: `Successfully issued credential "${cert.certificateName}" to ${studentName} on blockchain.`,
            link: "/organisation?section=issue-cert",
            read: false,
            metadata: {
              activityId,
              certificateId: cert._id,
              txHash: cert.txHash || cert.blockchainTxHash || "",
            },
            createdAt: cert.createdAt,
          });
        }
      }

      // 3. Sync job applicants for organisation
      const applicants = await Application.find({ organisation: userId })
        .populate("student", "name email")
        .populate("job", "title")
        .lean();

      for (const app of applicants) {
        const activityId = `org_app_${app._id}_${app.status}`;
        const existing = await Notification.findOne({
          recipient: userId,
          $or: [
            { "metadata.activityId": activityId },
            { "metadata.applicationId": app._id, status: app.status },
          ],
        });

        if (!existing) {
          const studentName = app.student?.name || "Candidate";
          const jobTitle = app.job?.title || "Job Opening";

          let title = "New Job Application";
          let type = "JOB_APPLICATION";
          let message = `${studentName} applied for the position "${jobTitle}".`;
          let isImportant = false;

          if (app.status === "Offered") {
            title = "Job Offer Extended ⭐";
            type = "OFFER_EXTENDED";
            isImportant = true;
            message = `You extended an official employment offer for "${jobTitle}" to ${studentName}.`;
          } else if (app.status === "Accepted") {
            title = "Offer Accepted 🎉";
            type = "OFFER_ACCEPTED";
            message = `${studentName} accepted your offer for "${jobTitle}". Added to employee roster.`;
          } else if (app.status === "Rejected") {
            title = "Offer Declined";
            type = "OFFER_REJECTED";
            message = `${studentName} declined the offer for "${jobTitle}".`;
          }

          await Notification.create({
            recipient: userId,
            recipientRole: "ORGANISATION",
            sender: app.student?._id || null,
            senderName: studentName,
            type,
            title,
            message,
            link: "/organisation/jobs",
            isImportant,
            read: false,
            metadata: {
              activityId,
              applicationId: app._id,
              jobId: app.job?._id,
            },
            createdAt: app.updatedAt || app.createdAt,
          });
        }
      }

      // 4. Sync jobs posted by organisation
      const postedJobs = await Job.find({ organisation: userId }).lean();
      for (const job of postedJobs) {
        const activityId = `org_job_${job._id}`;
        const existing = await Notification.findOne({
          recipient: userId,
          "metadata.activityId": activityId,
        });

        if (!existing) {
          await Notification.create({
            recipient: userId,
            recipientRole: "ORGANISATION",
            sender: null,
            senderName: "SkillSync Opportunities",
            type: "JOB_POSTED",
            title: "Job Opportunity Published 📢",
            message: `Your job listing for "${job.title}" (${job.employmentType}) is active and accepting candidate applications.`,
            link: "/organisation/jobs",
            read: false,
            metadata: {
              activityId,
              jobId: job._id,
            },
            createdAt: job.createdAt,
          });
        }
      }
    }
  } catch (err) {
    console.error("[NOTIFICATION SYNC PAST ACTIVITIES ERROR]:", err.message);
  }
};
