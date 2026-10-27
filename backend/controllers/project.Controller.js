import {
    createProjectService,
    getPendingProjectsService,
    getStudentProjectsService,
    updateProjectStatusService
} from "../services/createProjectService.js";
import Application from "../models/Application.js";
import { createNotification } from "../services/notificationService.js";

// ─── POST /api/student/projects ───────────────────────────────────────────────
export const createProject = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const project = await createProjectService({
            student: userId,
            projectName: req.body.projectName,
            projectType: req.body.projectType,
            githubLink: req.body.githubLink,
            description: req.body.description,
        });

        // Trigger Notification
        createNotification({
            recipient: userId,
            recipientRole: "STUDENT",
            type: "PROJECT_ADDED",
            title: "Project Added",
            message: `Project "${req.body.projectName}" added to your portfolio.`,
            link: "/student/projects",
            metadata: { projectId: project._id },
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: "Project added successfully",
            project,
            txHash: project.txHash || "",
            transactionHash: project.txHash || ""
        });
    } catch (error) {
        console.error("Create Project Error:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to create project"
        });
    }
};

// ─── GET /api/student/projects/pending ────────────────────────────────────────
export const getPendingProjects = async (req, res) => {
    try {
        const orgId = req.user?.userId || req.user?._id;
        const projects = await getPendingProjectsService(orgId);

        return res.status(200).json({
            success: true,
            projects
        });
    } catch (error) {
        console.error("Get Pending Projects Error:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch pending projects"
        });
    }
};

// ─── GET /api/student/projects ────────────────────────────────────────────────
export const getStudentProjects = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.query.studentId || req.user?.userId || req.user?._id;
        const projects = await getStudentProjectsService(studentId);

        return res.status(200).json({
            success: true,
            projects: projects || []
        });
    } catch (error) {
        console.error("Get Student Projects Error:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch student projects",
            projects: []
        });
    }
};

// ─── PUT /api/student/projects/status ────────────────────────────────────────
export const updateProjectStatus = async (req, res) => {
    try {
        const { id, status, txHash, rejectionReason, onChainRegistered } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "id is required"
            });
        }

        const userId = req.user?.userId || req.user?._id;
        const project = await updateProjectStatusService(id, status, txHash, rejectionReason, {
            onChainRegistered,
            userRole: req.user?.role,
            userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Trigger Notification for Student
        if (project.student) {
            const isApproved = status === "APPROVED";
            createNotification({
                recipient: project.student,
                recipientRole: "STUDENT",
                sender: userId,
                type: isApproved ? "PROJECT_APPROVED" : "PROJECT_REJECTED",
                title: isApproved ? "Project Verified! 🎉" : "Project Verification Update",
                message: isApproved
                    ? `Your project "${project.projectName}" was verified on blockchain.`
                    : `Your project "${project.projectName}" was rejected. ${rejectionReason || ""}`,
                link: "/student/projects",
                metadata: { projectId: project._id, txHash: project.txHash || txHash || "" },
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: `Project status updated to ${status}`,
            project,
            txHash: project.txHash || "",
            transactionHash: project.txHash || ""
        });
    } catch (error) {
        console.error("Update Project Status Error:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update project status"
        });
    }
};

// ─── GET /api/student/candidates/:studentId/projects ─────────────────────────
export const getCandidateProjects = async (req, res) => {
    try {
        const { studentId } = req.params;
        const orgId = req.user?.userId || req.user?._id;

        // Verify the student applied to this org's job
        const application = await Application.findOne({
            student: studentId,
            organisation: orgId,
        }).select("_id").lean();

        if (!application) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this candidate's projects",
            });
        }

        const projects = await getStudentProjectsService(studentId);
        return res.status(200).json({ success: true, projects: projects || [] });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch candidate projects",
            projects: [],
        });
    }
};