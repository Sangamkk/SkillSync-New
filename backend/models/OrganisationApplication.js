import mongoose from "mongoose";

const organisationApplicationSchema = new mongoose.Schema(
    {
        organisationName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        organisationId: {
            type: String,
            unique: true,
            sparse: true
        },

        organisationType: {
            type: String,
            enum: [
                "Company",
                "University",
                "ResearchLab",
                "NGO",
                "Government",
                "Other"
            ],
            required: true
        },

        registrationNumber: {
            type: String,
            required: true,
            unique: true
        },

        website: {
            type: String,
            default: ""
        },

        description: {
            type: String,
            default: ""
        },

        emailVerified: {
            type: Boolean,
            default: true
        },

        emailNotificationsEnabled: {
            type: Boolean,
            default: true
        },

        notificationPreferences: {
            jobOffers: { type: Boolean, default: true },
            jobPostings: { type: Boolean, default: true },
            applications: { type: Boolean, default: true },
            certificates: { type: Boolean, default: true },
            verifications: { type: Boolean, default: true },
            projects: { type: Boolean, default: true },
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected"
            ],
            default: "Pending"
        },

        role: {
            type: String,
            default: "ORGANISATION"
        },

        txHash: {
            type: String,
            default: ""
        },

        blockchainBlockNumber: {
            type: Number,
            default: null
        },

        rejectionReason: {
            type: String,
            default: ""
        },

        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "OrganisationApplication",
    organisationApplicationSchema
);