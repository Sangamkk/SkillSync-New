import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Automatically expire documents after 10 minutes (600 seconds)
      expires: 600,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("EmailVerification", emailVerificationSchema);
