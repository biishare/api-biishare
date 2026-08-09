"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const creatorApplicationSchema = new mongoose_1.Schema({
    workDescription: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    publicName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    verificationCode: {
        type: String,
        default: undefined,
        trim: true,
        maxlength: 40,
    },
    verificationPhotoName: {
        type: String,
        default: undefined,
        trim: true,
        maxlength: 220,
    },
    submittedAt: {
        type: Date,
        required: true,
    },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    passwordHash: {
        type: String,
        select: false,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        index: true,
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true,
        default: undefined,
        index: true,
    },
    avatarUrl: {
        type: String,
        default: undefined,
    },
    coverUrl: {
        type: String,
        default: undefined,
    },
    creatorStatus: {
        type: String,
        enum: ["none", "pending", "approved"],
        default: "none",
        index: true,
    },
    creatorAppliedAt: {
        type: Date,
        default: undefined,
    },
    creatorApprovedAt: {
        type: Date,
        default: undefined,
    },
    creatorApplication: {
        type: creatorApplicationSchema,
        default: undefined,
    },
    nameUpdatedAt: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
});
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
