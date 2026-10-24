import User from "../models/User.js";
import Certificate from "../models/Certificate.js";
import Project from "../models/Project.js";
import Employment from "../models/Employment.js";
import OrganisationApplication from "../models/OrganisationApplication.js";
import { resolveCertificatesWithOnChain } from "./blockchainSync.service.js";

/**
 * Get student profile by MongoDB _id.
 */
export const getProfile = async (userId) => {
    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

/**
 * Update student profile (bio, headline, skills, phone, githubUrl, linkedinUrl, college, usn, etc.)
 */
export const updateProfile = async (userId, updateData) => {
    const allowedFields = [
        "name",
        "bio",
        "headline",
        "skills",
        "phone",
        "college",
        "usn",
        "githubUrl",
        "linkedinUrl",
        "experience"
    ];

    const updates = {};
    for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
            if (field === "skills" && typeof updateData[field] === "string") {
                updates[field] = updateData[field]
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            } else {
                updates[field] = updateData[field];
            }
        }
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

/**
 * Get full professional profile (certs, projects, employment) for a student.
 */
export const getFullProfile = async (studentId) => {
    const [studentUser, certificates, projects, employmentRecords] = await Promise.all([
        User.findById(studentId).select("-password").lean(),
        Certificate.find({ student: studentId })
            .populate("issuingOrganisation", "organisationName walletAddress organisationId")
            .sort({ createdAt: -1 })
            .lean(),
        Project.find({ student: studentId }).sort({ createdAt: -1 }).lean(),
        Employment.find({ student: studentId }).populate("job").lean(),
    ]);

    const resolvedCertificates = await resolveCertificatesWithOnChain(
        certificates,
        studentUser?.applicantId
    );

    // Resolve organisation for each employment record
    const resolvedEmployment = await Promise.all(
        employmentRecords.map(async (rec) => {
            let orgName = "Organisation";
            if (rec.organisation) {
                const org = await OrganisationApplication.findById(rec.organisation)
                    .select("organisationName")
                    .lean();
                if (org) orgName = org.organisationName;
            }
            return {
                ...rec,
                organisation: { _id: rec.organisation, name: orgName },
            };
        })
    );

    const currentEmployment = resolvedEmployment.filter((r) => r.status === "Active");
    const previousEmployment = resolvedEmployment.filter(
        (r) => r.status === "Completed" || r.status === "Terminated"
    );

    return {
        user: studentUser,
        certificates: resolvedCertificates,
        projects,
        currentEmployment,
        previousEmployment,
    };
};