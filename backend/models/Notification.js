import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ["STUDENT", "ORGANISATION", "ADMIN"],
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    senderName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "VERIFICATION_APPROVED",
        "VERIFICATION_REJECTED",
        "VERIFICATION_REQUESTED",
        "CERTIFICATE_ISSUED",
        "CERTIFICATE_UPLOADED",
        "PROJECT_ADDED",
        "PROJECT_APPROVED",
        "PROJECT_REJECTED",
        "JOB_APPLICATION",
        "JOB_POSTED",
        "OFFER_EXTENDED",
        "OFFER_ACCEPTED",
        "OFFER_REJECTED",
        "EMPLOYMENT_TERMINATED",
        "APPLICATION_APPROVED",
        "APPLICATION_REJECTED",
        "SYSTEM",
      ],
      default: "SYSTEM",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    isImportant: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);
