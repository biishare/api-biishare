"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShorts = void 0;
const app_1 = __importDefault(require("../../models/shorts/app"));
/**
 * GET /api/shorts
 * Query params:
 * - area (opcional)
 * - page (opcional)
 * - limit (opcional)
 */
const getShorts = async (req, res) => {
    try {
        const { area, page, limit } = req.query;
        // 🔹 usamos Record<string, unknown> e type assertion
        const filters = {};
        if (area && area !== "todos") {
            filters.area = area.toString().toLowerCase();
        }
        const pageNumber = Math.max(Number(page || "1"), 1);
        const limitNumber = Math.min(Number(limit || "10"), 50);
        const skip = (pageNumber - 1) * limitNumber;
        // 🔹 type assertion aqui resolve o TS
        const [shorts, total] = await Promise.all([
            app_1.default.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            app_1.default.countDocuments(filters),
        ]);
        const shortsMapped = shorts.map((s) => {
            var _a, _b;
            return ({
                _id: s._id,
                area: s.area,
                title: s.title,
                description: s.description,
                mediaType: s.mediaType,
                videoUrl: (_a = s.video) === null || _a === void 0 ? void 0 : _a.url,
                imageUrl: (_b = s.image) === null || _b === void 0 ? void 0 : _b.url,
                isPublished: s.isPublished,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
            });
        });
        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            data: shortsMapped,
        });
    }
    catch (error) {
        console.error("Erro ao buscar shorts:", error);
        res.status(500).json({
            error: "Failed to fetch shorts",
        });
    }
};
exports.getShorts = getShorts;
