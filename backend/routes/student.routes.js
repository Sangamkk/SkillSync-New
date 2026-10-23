import express from "express";

<<<<<<< Updated upstream
import { getProfile } from "../controllers/student.controller.js";
=======
import { getProfile, getFullProfile, updateProfile } from "../controllers/student.controller.js";
>>>>>>> Stashed changes
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
router.get("/profile", authenticate, authorizeRoles("STUDENT"), getProfile);

<<<<<<< Updated upstream
router.post("/projects", authenticate, authorizeRoles("STUDENT"), createProject);
router.get("/projects", authenticate, authorizeRoles("STUDENT"), getStudentProjects);
router.get("/candidates/:studentId/projects", authenticate, authorizeRoles("ORGANISATION"), getCandidateProjects);
router.get("/projects/pending", authenticate, authorizeRoles("ORGANISATION", "ADMIN"), getPendingProjects);
router.put("/projects/status", authenticate, authorizeRoles("STUDENT", "ORGANISATION", "ADMIN"), updateProjectStatus);
=======
// ─── Student profile ──────────────────────────────────────────────────────────
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
>>>>>>> Stashed changes

export default router;