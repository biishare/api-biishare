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
/* ======================================================
 * SUBSCHEMA: MEDIA
 * ====================================================== */
const mediaSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        trim: true,
    },
    totalPages: {
        type: Number,
        min: 1,
        default: undefined,
    },
}, {
    _id: false,
});
/* ======================================================
 * MAIN SCHEMA
 * ====================================================== */
const postSchema = new mongoose_1.Schema({
    subjectId: {
        type: String,
        required: true,
        trim: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: 2100,
    },
    level: {
        type: String,
        required: true,
        trim: true,
    },
    contentType: {
        type: String,
        enum: ["video", "document"],
        required: true,
    },
    imageLink: {
        type: String,
        required: true,
        trim: true,
    },
    videos: {
        type: [mediaSchema],
        default: undefined,
    },
    documents: {
        type: [mediaSchema],
        default: undefined,
    },
}, {
    timestamps: true,
});
/* ======================================================
 * INDICES (PERFORMANCE)
 * ====================================================== */
// Feed (ordenação por data)
postSchema.index({ createdAt: -1 });
// Filtros combinados (frontend via URL)
postSchema.index({
    subjectId: 1,
    level: 1,
    year: 1,
    contentType: 1,
});
/* ======================================================
 * BUSINESS RULE (CRÍTICA)
 * ====================================================== */
postSchema.pre("validate", function () {
    if (this.contentType === "video") {
        // Remove documentos se existir
        delete this.documents;
        if (!this.videos || this.videos.length === 0) {
            throw new Error("Post do tipo vídeo deve conter pelo menos um vídeo");
        }
    }
    if (this.contentType === "document") {
        delete this.videos;
        if (!this.documents || this.documents.length === 0) {
            throw new Error("Post do tipo documento deve conter pelo menos um documento");
        }
        const invalidDoc = this.documents.find(doc => !doc.totalPages || doc.totalPages < 1);
        if (invalidDoc) {
            throw new Error("Todo documento deve possuir o número total de páginas");
        }
    }
});
/* ======================================================
 * MODEL
 * ====================================================== */
const PostModel = mongoose_1.default.model("Post", postSchema);
exports.default = PostModel;
