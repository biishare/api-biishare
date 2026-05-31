"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../models/ad/app"));
/* ======================================================
 * GET AD BY ID
 * ====================================================== */
const getAdById = async (req, res) => {
    var _a, _b;
    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId)
            ? rawId[0]
            : rawId;
        /* ---------- VALIDATE ID ---------- */
        if (!id) {
            res.status(400).json({
                error: "ID do anúncio é obrigatório.",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                error: "ID inválido.",
            });
            return;
        }
        /* ---------- QUERY ---------- */
        const ad = await app_1.default.findById(id);
        if (!ad) {
            res.status(404).json({
                error: "Anúncio não encontrado.",
            });
            return;
        }
        /* ---------- NORMALIZED RESPONSE ---------- */
        const data = {
            _id: ad._id,
            title: ad.title,
            subtitle: ad.subtitle,
            cta: ad.cta,
            link: ad.link,
            /* ---------- MEDIA ---------- */
            mediaType: ad.mediaType,
            image: (_a = ad.image) === null || _a === void 0 ? void 0 : _a.url,
            video: (_b = ad.video) === null || _b === void 0 ? void 0 : _b.url,
            /* ---------- VISUAL ---------- */
            layout: ad.layout,
            fitMode: ad.fitMode,
            focalPoint: ad.focalPoint,
            blurStrength: ad.blurStrength,
            priority: ad.priority,
            active: ad.active,
            createdAt: ad.createdAt,
            updatedAt: ad.updatedAt,
        };
        /* ---------- RESPONSE ---------- */
        res.status(200).json({
            message: "Anúncio encontrado com sucesso",
            data,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: (error === null || error === void 0 ? void 0 : error.message) ||
                "Failed to fetch ad",
        });
    }
};
exports.getAdById = getAdById;
