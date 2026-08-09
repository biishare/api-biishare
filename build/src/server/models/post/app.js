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
    kind: {
        type: String,
        enum: ["video", "document", "image"],
        default: undefined,
    },
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
    thumbnailUrl: {
        type: String,
        required: false,
        trim: true,
        default: undefined,
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
        required: false,
        trim: true,
        default: undefined,
    },
    creatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: undefined,
        index: true,
    },
    subjectIds: {
        type: [String],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: "Selecione pelo menos uma disciplina",
        },
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    level: {
        type: String,
        required: true,
        trim: true,
    },
    contentType: {
        type: String,
        enum: ["video", "document", "image", "playlist"],
        required: true,
    },
    imageLink: {
        type: String,
        required: true,
        trim: true,
    },
    playlistTitle: {
        type: String,
        required: false,
        trim: true,
        default: undefined,
    },
    playlistOrder: {
        type: Number,
        required: false,
        min: 1,
        default: undefined,
    },
    videos: {
        type: [mediaSchema],
        default: undefined,
    },
    documents: {
        type: [mediaSchema],
        default: undefined,
    },
    images: {
        type: [mediaSchema],
        default: undefined,
    },
    playlist: {
        type: [mediaSchema],
        default: undefined,
    },
    isPublished: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
});
/* ======================================================
 * INDICES (PERFORMANCE)
 * ====================================================== */
postSchema.index({ createdAt: -1 });
postSchema.index({ isPublished: 1, createdAt: -1 });
postSchema.index({ creatorId: 1, createdAt: -1 });
postSchema.index({ playlistTitle: 1, playlistOrder: 1 });
postSchema.index({
    subjectIds: 1,
    level: 1,
    contentType: 1,
});
postSchema.index({
    subjectId: 1,
    level: 1,
    contentType: 1,
});
/* ======================================================
 * BUSINESS RULE
 * ====================================================== */
postSchema.pre("validate", function () {
    if ((!this.subjectIds || this.subjectIds.length === 0) && this.subjectId) {
        this.subjectIds = [this.subjectId];
    }
    if (this.subjectIds) {
        this.subjectIds = [...new Set(this.subjectIds.map(id => id.trim()).filter(Boolean))];
        const primarySubjectId = this.subjectIds[0];
        if (primarySubjectId) {
            this.subjectId = primarySubjectId;
        }
        else {
            delete this.subjectId;
        }
    }
    if (this.contentType === "video") {
        delete this.documents;
        delete this.images;
        delete this.playlist;
        if (!this.videos || this.videos.length === 0) {
            throw new Error("Post do tipo video deve conter pelo menos um video");
        }
    }
    if (this.contentType === "document") {
        delete this.videos;
        delete this.images;
        delete this.playlist;
        if (!this.documents || this.documents.length === 0) {
            throw new Error("Post do tipo documento deve conter pelo menos um documento");
        }
        const invalidDoc = this.documents.find(doc => !doc.totalPages || doc.totalPages < 1);
        if (invalidDoc) {
            throw new Error("Todo documento deve possuir o numero total de paginas");
        }
    }
    if (this.contentType === "image") {
        delete this.videos;
        delete this.documents;
        delete this.playlist;
        if (!this.images || this.images.length === 0) {
            throw new Error("Post do tipo imagem deve conter pelo menos uma imagem");
        }
    }
    if (this.contentType === "playlist") {
        delete this.videos;
        delete this.documents;
        delete this.images;
        if (!this.playlist || this.playlist.length === 0) {
            throw new Error("Playlist deve conter pelo menos um item");
        }
        const invalidItem = this.playlist.find(item => item.kind !== "video" && item.kind !== "document");
        if (invalidItem) {
            throw new Error("Playlist aceita apenas videos e documentos");
        }
        const invalidDoc = this.playlist.find(item => item.kind === "document" && (!item.totalPages || item.totalPages < 1));
        if (invalidDoc) {
            throw new Error("Documentos da playlist devem possuir numero total de paginas");
        }
    }
});
/* ======================================================
 * MODEL
 * ====================================================== */
const PostModel = mongoose_1.default.model("Post", postSchema);
exports.default = PostModel;
