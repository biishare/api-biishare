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
const toqueMediaSchema = new mongoose_1.Schema({
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
const toqueSchema = new mongoose_1.Schema({
    creatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: undefined,
        index: true,
    },
    area: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 80,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 20,
        maxlength: 600,
    },
    mediaType: {
        type: String,
        enum: ["video", "image"],
        required: true,
        index: true,
    },
    video: {
        type: toqueMediaSchema,
        default: undefined,
    },
    image: {
        type: toqueMediaSchema,
        default: undefined,
    },
    images: {
        type: [toqueMediaSchema],
        default: undefined,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
/* ======================================================
 * INDICES
 * ====================================================== */
toqueSchema.index({ createdAt: -1, _id: -1 });
toqueSchema.index({ creatorId: 1, createdAt: -1 });
toqueSchema.index({ area: 1, createdAt: -1, _id: -1 });
toqueSchema.index({ mediaType: 1, createdAt: -1 });
/* ======================================================
 * BUSINESS RULE
 * ====================================================== */
toqueSchema.pre("validate", function () {
    var _a, _b, _c;
    if (this.mediaType === "video") {
        this.images = undefined;
        if (this.image && !this.image.url) {
            this.image = undefined;
        }
        if (!((_a = this.video) === null || _a === void 0 ? void 0 : _a.url)) {
            this.invalidate("video", "Toque do tipo video precisa de uma URL valida");
        }
    }
    if (this.mediaType === "image") {
        this.video = undefined;
        const imageItems = ((_b = this.images) !== null && _b !== void 0 ? _b : []).filter((item) => item === null || item === void 0 ? void 0 : item.url);
        if (imageItems.length === 0 && ((_c = this.image) === null || _c === void 0 ? void 0 : _c.url)) {
            imageItems.push({ url: this.image.url });
        }
        this.images = imageItems;
        this.image = imageItems[0];
        if (imageItems.length === 0) {
            this.invalidate("images", "Toque do tipo imagem precisa de pelo menos uma URL valida");
        }
    }
});
/* ======================================================
 * MODEL
 * ====================================================== */
const ToqueModel = mongoose_1.default.models.Toque ||
    mongoose_1.default.model("Toque", toqueSchema);
exports.default = ToqueModel;
