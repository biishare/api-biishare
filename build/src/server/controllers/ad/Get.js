"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAds = void 0;
const app_1 = __importDefault(require("../../models/ad/app"));
/* ======================================================
 * GET ADS
 * ====================================================== */
const getAds = async (req, res) => {
    try {
        const { layout, active, page, limit, } = req.query;
        /* ---------- NORMALIZE QUERY ---------- */
        const cleanLayout = typeof layout === "string"
            ? layout
            : undefined;
        const pageNumber = Math.max(Number(page !== null && page !== void 0 ? page : 1), 1);
        const limitNumber = Math.min(Number(limit !== null && limit !== void 0 ? limit : 10), 50);
        const skip = (pageNumber - 1) * limitNumber;
        const isActive = active === undefined
            ? true
            : active === "true";
        /* ---------- FILTERS ---------- */
        const filters = {
            active: isActive,
        };
        if (cleanLayout &&
            cleanLayout !== "all") {
            filters.layout = cleanLayout;
        }
        /* ---------- QUERY ---------- */
        const [ads, total] = await Promise.all([
            app_1.default.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            app_1.default.countDocuments(filters),
        ]);
        /* ---------- RESPONSE ---------- */
        const data = ads.map((ad) => {
            var _a, _b;
            return ({
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
            });
        });
        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            data,
        });
    }
    catch (error) {
        console.error("Erro ao buscar ads:", error);
        res.status(500).json({
            error: (error === null || error === void 0 ? void 0 : error.message) ||
                "Failed to fetch ads",
        });
    }
};
exports.getAds = getAds;
