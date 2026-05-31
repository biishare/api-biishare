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
 * SUBSCHEMA
 * ====================================================== */
const adMediaSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
        match: /^https?:\/\/.+/i,
    },
}, { _id: false });
/* ======================================================
 * MAIN SCHEMA
 * ====================================================== */
const adSchema = new mongoose_1.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: 80,
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: 120,
    },
    cta: {
        type: String,
        trim: true,
        maxlength: 30,
    },
    link: {
        type: String,
        trim: true,
    },
    /* ---------- MEDIA ---------- */
    mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true,
        default: "image",
    },
    image: {
        type: adMediaSchema,
        required: false,
    },
    video: {
        type: adMediaSchema,
        required: false,
    },
    /* ---------- VISUAL ---------- */
    layout: {
        type: String,
        enum: ["hero", "banner", "card"],
        default: "hero",
        index: true,
    },
    fitMode: {
        type: String,
        enum: ["cover", "contain", "auto"],
        default: "cover",
    },
    focalPoint: {
        type: String,
        enum: ["center", "top", "bottom"],
        default: "center",
    },
    blurStrength: {
        type: Number,
        default: 16,
        min: 0,
        max: 40,
    },
    priority: {
        type: String,
        enum: ["visual", "informational"],
        default: "visual",
    },
    active: {
        type: Boolean,
        default: true,
        index: true,
    },
}, { timestamps: true });
/* ======================================================
 * INDICES
 * ====================================================== */
adSchema.index({ createdAt: -1 });
adSchema.index({
    active: 1,
    layout: 1,
});
adSchema.index({
    priority: 1,
});
/* ======================================================
 * BUSINESS RULES
 * ====================================================== */
adSchema.pre("validate", function () {
    /* ---------- IMAGE ---------- */
    var _a, _b, _c, _d;
    if (this.mediaType === "image" &&
        !((_a = this.image) === null || _a === void 0 ? void 0 : _a.url)) {
        this.invalidate("image", "Anúncio de imagem precisa de imagem válida");
    }
    /* ---------- VIDEO ---------- */
    if (this.mediaType === "video" &&
        !((_b = this.video) === null || _b === void 0 ? void 0 : _b.url)) {
        this.invalidate("video", "Anúncio de vídeo precisa de vídeo válido");
    }
    /* ---------- ACTIVE ---------- */
    if (this.active &&
        this.mediaType === "image" &&
        !((_c = this.image) === null || _c === void 0 ? void 0 : _c.url)) {
        this.invalidate("active", "Anúncio ativo precisa de imagem");
    }
    if (this.active &&
        this.mediaType === "video" &&
        !((_d = this.video) === null || _d === void 0 ? void 0 : _d.url)) {
        this.invalidate("active", "Anúncio ativo precisa de vídeo");
    }
});
/* ======================================================
 * MODEL
 * ====================================================== */
const AdModel = mongoose_1.default.models.Ad ||
    mongoose_1.default.model("Ad", adSchema);
exports.default = AdModel;
