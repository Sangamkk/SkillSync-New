import crypto from "crypto";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import OrganisationApplication from "../models/OrganisationApplication.js";
import VerificationRequest from "../models/VerificationRequest.js";
import { applicantManager, requestManager } from "../blockchain/contracts.js";

export const createProjectService = async (projectData) => {
    const {
        student,
        projectName,
        projectType,
        githubLink,
        description,
    } = projectData;

    const cleanLink = String(githubLink || "").trim();
    if (!cleanLink) {
        const error = new Error("githubLink is required");
        error.statusCode = 400;
        throw error;
    }

    // Hash the GitHub link for on-chain usage (SHA-256)
    const githubHash = crypto
        .createHash("sha256")
        .update(cleanLink)
        .digest("hex");

    // Check for duplicate project by link or hash
    const existingProject = await Project.findOne({
        $or: [
            { githubLink: cleanLink },
            { githubHash: githubHash }
        ]
    });
    if (existingProject) {
        const error = new Error("This GitHub project is already registered");
        error.statusCode = 409;
        throw error;
    }

    let onChainRegistered = false;
    let txHash = "";

    // If the student has an applicantId, attempt on-chain registration
    try {
        const studentUser = await User.findById(student);
        if (studentUser?.applicantId && applicantManager) {
            const projectHashBytes32 = "0x" + githubHash;
            const onChainProj = await applicantManager.projects(projectHashBytes32);
            if (!onChainProj || !onChainProj.exists) {
                console.log(`[BLOCKCHAIN] Registering project on-chain for applicant: ${studentUser.applicantId}`);
                const addProjTx = await applicantManager.addProject(studentUser.applicantId, projectHashBytes32);
                await addProjTx.wait();
                onChainRegistered = true;
                txHash = addProjTx.hash;
                console.log(`[BLOCKCHAIN] addProject confirmed: ${txHash}`);
            } else {
                onChainRegistered = true;
            }
        }
    } catch (chainErr) {
        console.warn("[WARNING] On-chain registration deferred/failed during createProject:", chainErr.message);
    }

    const project = await Project.create({
        student,
        projectName,
        projectType,
        githubLink: cleanLink,
        githubHash,
        description: description || "",
        onChainRegistered,
        txHash,
        status: "PENDING"
    });

    return project;
};

/**
 * Get pending projects for an organisation (by org _id).
 */
export const getPendingProjectsService = async (organisationId) => {
    let query = { status: "PENDING" };
    const requestMap = new Map();

    if (organisationId) {
        const requests = await VerificationRequest.find({
            organisation: organisationId,
            requestType: "project",
            status: "Pending",
        }).select("project blockchainRequestId");

        requests.forEach((r) => {
            if (r.project) {
                requestMap.set(r.project.toString(), r.blockchainRequestId || r._id);
            }
        });

        const projectIds = requests.map((r) => r.project).filter(Boolean);
        if (projectIds.length > 0) {
            query = { _id: { $in: projectIds }, status: "PENDING" };
        } else {
            // Organisation has no pending verification requests
            return [];
        }
    }

    const projects = await Project.find(query)
        .populate("student", "name email usn college walletAddress")
        .sort({ createdAt: -1 })
        .lean();

    return projects.map((p) => ({
        ...p,
        blockchainRequestId: requestMap.get(p._id.toString()) || null,
    }));
};

export const getStudentProjectsService = async (studentId) => {
    if (!studentId) return [];

    const query = mongoose.Types.ObjectId.isValid(studentId)
        ? { student: new mongoose.Types.ObjectId(studentId) }
        : { student: studentId };

    const projects = await Project.find(query)
        .populate("approvedBy", "organisationName email")
        .sort({ createdAt: -1 });

    // Enrich projects with verification requests & blockchain state
    const projectIds = projects.map((p) => p._id);
    const requests = await VerificationRequest.find({
        project: { $in: projectIds },
        requestType: "project"
    }).populate("organisation", "organisationName email");

    const requestsByProject = new Map();
    for (const req of requests) {
        const pId = req.project ? req.project.toString() : "";
        if (!pId) continue;
        if (!requestsByProject.has(pId)) {
            requestsByProject.set(pId, []);
        }
        requestsByProject.get(pId).push({
            requestId: req.blockchainRequestId || req._id,
            status: (req.status || "Pending").toUpperCase(),
            expectedVerifier: req.organisation?.organisationName || req.organisation?.email || "Organisation",
            verifier: req.organisation?.organisationName || req.organisation?.email,
            verifierOrganisation: req.organisation?.organisationName,
            createdAt: req.createdAt ? Math.floor(new Date(req.createdAt).getTime() / 1000) : null,
            verifiedAt: req.updatedAt ? Math.floor(new Date(req.updatedAt).getTime() / 1000) : null,
            reason: req.rejectionReason || "",
            actionTxHash: req.actionTxHash || "",
        });
    }

    return projects.map((p) => {
        const pObj = p.toObject ? p.toObject() : { ...p };
        const hist = requestsByProject.get(p._id.toString()) || [];
        const isVerified = pObj.status === "APPROVED" || hist.some((h) => h.status === "APPROVED" || h.status === "VERIFIED");
        return {
            ...pObj,
            isVerified,
            verificationHistory: hist,
        };
    });
};

export const updateProjectStatusService = async (identifier, status, txHash, rejectionReason, extraData = {}) => {
    // Try finding by _id first, then by githubHash
    let project = null;

    if (identifier && identifier.toString().match(/^[0-9a-fA-F]{24}$/)) {
        project = await Project.findById(identifier);
    }

    if (!project) {
        const cleanHash = identifier.startsWith("0x") ? identifier.slice(2) : identifier;
        project = await Project.findOne({
            $or: [{ githubHash: cleanHash }, { githubHash: identifier }]
        });
    }

    if (!project) {
        return null;
    }

    // Ownership check for STUDENT role — students can only update their own projects
    if (extraData.userRole === "STUDENT" && extraData.userId) {
        if (project.student.toString() !== extraData.userId.toString()) {
            const error = new Error("Unauthorized to update this project");
            error.statusCode = 403;
            throw error;
        }
    }

    // ORGANISATION verification handling
    if ((extraData.userRole === "ORGANISATION" || extraData.userRole === "ADMIN") && extraData.userId) {
        const organisation = await OrganisationApplication.findById(extraData.userId);

        if (status === "APPROVED") {
            project.approvedBy = extraData.userId;
            const rawHash = project.githubHash.startsWith("0x") ? project.githubHash.slice(2) : project.githubHash;
            const projectHashBytes32 = "0x" + rawHash;

            // Ensure project is registered in ApplicantManager on-chain
            try {
                if (applicantManager) {
                    const onChainProj = await applicantManager.projects(projectHashBytes32);
                    if (!onChainProj || !onChainProj.exists) {
                        const studentUser = await User.findById(project.student);
                        if (studentUser?.applicantId) {
                            console.log(`[BLOCKCHAIN] Pre-registering project on-chain for applicant: ${studentUser.applicantId}`);
                            const addProjTx = await applicantManager.addProject(studentUser.applicantId, projectHashBytes32);
                            await addProjTx.wait();
                            project.onChainRegistered = true;
                        }
                    } else {
                        project.onChainRegistered = true;
                    }
                }
            } catch (err) {
                console.warn("[WARNING] Project on-chain pre-check/registration error:", err.message);
            }

            // Check if there is a pending VerificationRequest for this project & organisation
            const pendingReq = await VerificationRequest.findOne({
                project: project._id,
                organisation: extraData.userId,
                status: "Pending"
            });

            if (pendingReq && pendingReq.blockchainRequestId && organisation?.organisationId && requestManager) {
                try {
                    console.log(`[BLOCKCHAIN] Approving request ${pendingReq.blockchainRequestId} for org ${organisation.organisationId}`);
                    const approveTx = await requestManager.approveRequest(
                        pendingReq.blockchainRequestId,
                        organisation.organisationId
                    );
                    const receipt = await approveTx.wait();
                    if (receipt.status === 1) {
                        pendingReq.status = "Approved";
                        pendingReq.actionTxHash = approveTx.hash;
                        pendingReq.actionBlockNumber = receipt.blockNumber;
                        await pendingReq.save();
                        txHash = approveTx.hash;
                    }
                } catch (approveErr) {
                    console.error("[BLOCKCHAIN ERROR] approveRequest failed:", approveErr.message);
                    throw approveErr;
                }
            } else if (organisation?.organisationId && applicantManager) {
                // Direct on-chain verification
                try {
                    console.log(`[BLOCKCHAIN] Adding direct project verification by org: ${organisation.organisationId}`);
                    const verifyTx = await applicantManager.addProjectVerification(
                        projectHashBytes32,
                        organisation.organisationId
                    );
                    const receipt = await verifyTx.wait();
                    if (receipt.status === 1) {
                        txHash = verifyTx.hash;
                    }
                } catch (verifyErr) {
                    console.warn("[BLOCKCHAIN] Direct addProjectVerification warning:", verifyErr.message);
                }
            }

            project.onChainRegistered = true;
        }

        if (status === "REJECTED") {
            const pendingReq = await VerificationRequest.findOne({
                project: project._id,
                organisation: extraData.userId,
                status: "Pending"
            });

            if (pendingReq && pendingReq.blockchainRequestId && organisation?.organisationId && requestManager) {
                try {
                    console.log(`[BLOCKCHAIN] Rejecting request ${pendingReq.blockchainRequestId} for org ${organisation.organisationId}`);
                    const rejectTx = await requestManager.rejectRequest(
                        pendingReq.blockchainRequestId,
                        organisation.organisationId
                    );
                    await rejectTx.wait();
                    pendingReq.actionTxHash = rejectTx.hash;
                } catch (rejectErr) {
                    console.warn("[BLOCKCHAIN] rejectRequest warning:", rejectErr.message);
                }
            }

            if (pendingReq) {
                pendingReq.status = "Rejected";
                pendingReq.rejectionReason = rejectionReason || "Rejected by organisation";
                await pendingReq.save();
            }
        }
    }

    if (status) project.status = status;
    if (txHash) project.txHash = txHash;
    if (rejectionReason !== undefined) project.rejectionReason = rejectionReason;
    if (extraData.onChainRegistered !== undefined) project.onChainRegistered = extraData.onChainRegistered;

    await project.save();
    return project;
};