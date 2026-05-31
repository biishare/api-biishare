"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const app_1 = __importDefault(require("../../models/ad/app"));
/* ======================================================
 * CREATE AD
 * ====================================================== */
const create = async (req, res) => {
    try {
        const { title, subtitle, cta, link, mediaType, image, video, layout, fitMode, focalPoint, blurStrength, priority, active, } = req.body;
        /* ---------- BASE VALIDATION ---------- */
        if (!mediaType || !layout) {
            res.status(400).json({
                error: "Tipo de mídia e layout são obrigatórios.",
            });
            return;
        }
        /* ---------- IMAGE VALIDATION ---------- */
        if (mediaType === "image") {
            if (!image) {
                res.status(400).json({
                    error: "Imagem obrigatória.",
                });
                return;
            }
            if (!isValidUrl(image)) {
                res.status(400).json({
                    error: "URL da imagem inválida.",
                });
                return;
            }
        }
        /* ---------- VIDEO VALIDATION ---------- */
        if (mediaType === "video") {
            if (!video) {
                res.status(400).json({
                    error: "Vídeo obrigatório.",
                });
                return;
            }
            if (!isValidUrl(video)) {
                res.status(400).json({
                    error: "URL do vídeo inválida.",
                });
                return;
            }
        }
        /* ---------- NORMALIZAÇÃO ---------- */
        const cleanTitle = title === null || title === void 0 ? void 0 : title.trim();
        const cleanSubtitle = subtitle === null || subtitle === void 0 ? void 0 : subtitle.trim();
        const cleanCta = cta === null || cta === void 0 ? void 0 : cta.trim();
        const cleanLink = link === null || link === void 0 ? void 0 : link.trim();
        /* ---------- PAYLOAD ---------- */
        const payload = {
            title: cleanTitle,
            subtitle: cleanSubtitle,
            cta: cleanCta,
            link: cleanLink,
            mediaType,
            layout,
            fitMode,
            focalPoint,
            blurStrength: blurStrength !== null && blurStrength !== void 0 ? blurStrength : 16,
            priority: priority !== null && priority !== void 0 ? priority : "visual",
            active: active !== null && active !== void 0 ? active : true,
        };
        /* ---------- MEDIA ---------- */
        if (mediaType === "image") {
            payload.image = {
                url: image.trim(),
            };
        }
        if (mediaType === "video") {
            payload.video = {
                url: video.trim(),
            };
        }
        /* ---------- CREATE ---------- */
        const newAd = await app_1.default.create(payload);
        res.status(201).json({
            message: "Anúncio criado com sucesso!",
            data: newAd,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: (error === null || error === void 0 ? void 0 : error.message) ||
                "Erro ao criar anúncio.",
        });
    }
};
exports.create = create;
/* ======================================================
 * HELPER
 * ====================================================== */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
