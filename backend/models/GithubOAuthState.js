import mongoose from "mongoose";

const githubOAuthStateSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    returnUrl: {
      type: String,
      default: "/student/project/add",
    },
    frontendOrigin: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      // Automatically expire state after 10 minutes (600s)
      expires: 600,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("GithubOAuthState", githubOAuthStateSchema);
