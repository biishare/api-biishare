"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyToques = exports.getShorts = void 0;
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/shorts/app"));
const parsePositiveInteger = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    const normalized = Math.floor(parsed);
    return max ? Math.min(normalized, max) : normalized;
};
const toToqueResponse = (toque) => {
    var _a, _b;
    return ({
        _id: toque._id,
        creatorId: toque.creatorId,
        area: toque.area,
        title: toque.title,
        description: toque.description,
        mediaType: toque.mediaType,
        videoUrl: (_a = toque.video) === null || _a === void 0 ? void 0 : _a.url,
        imageUrl: (_b = toque.image) === null || _b === void 0 ? void 0 : _b.url,
        isPublished: toque.isPublished,
        createdAt: toque.createdAt,
        updatedAt: toque.updatedAt,
    });
};
const sendToquePage = async (req, res, filters) => {
    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 10, 50);
    const skip = (pageNumber - 1) * limitNumber;
    const [shorts, total] = await Promise.all([
        app_1.default.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),
        app_1.default.countDocuments(filters),
    ]);
    res.status(200).json({
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        data: shorts.map(toToqueResponse),
    });
};
const getShorts = async (req, res) => {
    try {
        const { area } = req.query;
        const filters = { isPublished: { $ne: false } };
        if (area && area !== "todos") {
            filters.area = area.toString().toLowerCase();
        }
        await sendToquePage(req, res, filters);
    }
    catch (error) {
        console.error("Erro ao buscar shorts:", error);
        res.status(500).json({
            error: "Failed to fetch shorts",
        });
    }
};
exports.getShorts = getShorts;
const getMyToques = async (req, res) => {
    try {
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        await sendToquePage(req, res, (0, creatorOwnership_1.buildCreatorContentFilter)(owner));
    }
    catch (error) {
        console.error("Erro ao buscar toques do criador:", error);
        res.status(500).json({
            error: "Failed to fetch creator toques",
        });
    }
};
exports.getMyToques = getMyToques;
