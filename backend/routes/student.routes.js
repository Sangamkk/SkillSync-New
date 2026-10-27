import express from "express";

import {
    getProfile,
    getFullProfile,
    updateProfile
} from "../controllers/student.controller.js";
import {
    initiateGitHubOAuth,
    handleGitHubCallback,
    getGitHubStatus,
    getAuthenticatedGitHubRepos,
    disconnectGitHub
} from "../controllers/githubOAuth.controller.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
    createProject,
    getPendingProjects,
    getStudentProjects,
    getCandidateProjects,
    updateProjectStatus
} from "../controllers/project.Controller.js";

const router = express.Router();

// ─── GitHub OAuth Integration ───────────────────────────────────────────────
router.get(
    "/github/connect",
    authenticate,
    authorizeRoles("STUDENT"),
    initiateGitHubOAuth
);

router.get(
    "/github/callback",
    handleGitHubCallback
);

router.get(
    "/github/status",
    authenticate,
    authorizeRoles("STUDENT"),
    getGitHubStatus
);

router.get(
    "/github/repos",
    authenticate,
    authorizeRoles("STUDENT"),
    getAuthenticatedGitHubRepos
);

router.post(
    "/github/disconnect",
    authenticate,
    authorizeRoles("STUDENT"),
    disconnectGitHub
);

router.get(
    "/profile",
    authenticate,
    authorizeRoles("STUDENT"),
    getProfile
);

router.put(
    "/profile",
    authenticate,
    authorizeRoles("STUDENT"),
    updateProfile
);

// Full professional profile (certs + projects + employment)
router.get(
    "/profile/full",
    authenticate,
    authorizeRoles("STUDENT"),
    getFullProfile
);

// ─── Projects ─────────────────────────────────────────────────────────────────
router.post(
    "/projects",
    authenticate,
    authorizeRoles("STUDENT"),
    createProject
);

// NOTE: /projects/pending must come before /projects to avoid route conflict
router.get(
    "/projects/pending",
    authenticate,
    authorizeRoles("ORGANISATION", "ADMIN"),
    getPendingProjects
);

router.get(
    "/projects",
    authenticate,
    authorizeRoles("STUDENT"),
    getStudentProjects
);

router.get(
    "/candidates/:studentId/projects",
    authenticate,
    authorizeRoles("ORGANISATION"),
    getCandidateProjects
);

router.put(
    "/projects/status",
    authenticate,
    authorizeRoles("STUDENT", "ORGANISATION", "ADMIN"),
    updateProjectStatus
);

export default router;