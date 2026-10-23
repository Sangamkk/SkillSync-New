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
      enum: ["STUDENT"],
      required: true,
    },

    walletAddress: {
      type: String,
      required: true,
      unique: true,
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

    linkedinUrl: {
      type: String,
      default: "",
      trim: true,
    },

    organizationName: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },
<<<<<<< Updated upstream
=======

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
>>>>>>> Stashed changes
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);