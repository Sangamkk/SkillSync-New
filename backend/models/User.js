import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["STUDENT", "ADMIN"],
      required: true,
    },

    usn: {
      type: String,
      default: "",
    },

    college: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    headline: {
      type: String,
      default: "",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    githubUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // GitHub OAuth fields
    githubConnected: {
      type: Boolean,
      default: false,
    },

    githubId: {
      type: String,
      default: "",
      index: true,
    },

    githubUsername: {
      type: String,
      default: "",
    },

    githubAvatarUrl: {
      type: String,
      default: "",
    },

    githubAccessToken: {
      type: String,
      default: "",
      select: false, // Never return in queries or expose to frontend
    },

    githubConnectedAt: {
      type: Date,
      default: null,
    },

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },

    notificationPreferences: {
      jobOffers: { type: Boolean, default: true },
      jobPostings: { type: Boolean, default: true },
      applications: { type: Boolean, default: true },
      certificates: { type: Boolean, default: true },
      verifications: { type: Boolean, default: true },
      projects: { type: Boolean, default: true },
    },

    organizationName: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },

    digiLockerVerified: {
      type: Boolean,
      default: false,
    },

    experience: [
      {
        title: { type: String, default: "" },
        company: { type: String, default: "" },
        location: { type: String, default: "" },
        startDate: { type: String, default: "" },
        endDate: { type: String, default: "" },
        current: { type: Boolean, default: false },
        description: { type: String, default: "" },
      },
    ],

    // Blockchain identity — bytes32 hex string
    applicantId: {
      type: String,
      unique: true,
      sparse: true,
    },

    blockchainTxHash: {
      type: String,
      default: "",
    },

    blockchainBlockNumber: {
      type: Number,
      default: null,
    },

    blockchainStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "FAILED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);