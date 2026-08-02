"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSavedToque = exports.saveToque = exports.getSavedToqueStatus = exports.getSavedToques = exports.toToquePreview = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/savedToque/app"));
const app_2 = __importDefault(require("../../models/shorts/app"));
const TOQUE_PREVIEW_SELECT = "area title description mediaType video image isPublished createdAt updatedAt";
const parsePositiveInteger = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    const normalized = Math.floor(parsed);
    return max ? Math.min(normalized, max) : normalized;
};
const getUserId = (res) => {
    const userId = res.locals.userId;
    if (typeof userId !== "string" || !mongoose_1.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return userId;
};
const getToqueId = (req) => {
    const toqueId = req.params.id;
    if (typeof toqueId !== "string" || !mongoose_1.Types.ObjectId.isValid(toqueId)) {
        return null;
    }
    return toqueId;
};
const stringifyId = (id) => {
    if (id instanceof mongoose_1.Types.ObjectId) {
        return id.toString();
    }
    return typeof id === "string" ? id : String(id);
};
const asOptionalString = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const asRequiredString = (value) => typeof value === "string" ? value : "";
const toToquePreview = (toque) => {
    if (!toque || typeof toque !== "object") {
        return toque;
    }
    const documentLikeToque = toque;
    const plainToque = typeof documentLikeToque.toObject === "function"
        ? documentLikeToque.toObject()
        : toque;
    const mediaType = plainToque.mediaType === "image" ? "image" : "video";
    const video = plainToque.video;
    const image = plainToque.image;
    return {
        _id: stringifyId(plainToque._id),
        area: asRequiredString(plainToque.area),
        title: asRequiredString(plainToque.title),
        description: asRequiredString(plainToque.description),
        mediaType,
        videoUrl: mediaType === "video" ? asOptionalString(video === null || video === void 0 ? void 0 : video.url) : undefined,
        imageUrl: mediaType === "image" ? asOptionalString(image === null || image === void 0 ? void 0 : image.url) : undefined,
        isPublished: Boolean(plainToque.isPublished),
        createdAt: plainToque.createdAt,
        updatedAt: plainToque.updatedAt,
    };
};
exports.toToquePreview = toToquePreview;
const buildSavedToquePayload = (savedToque, toque) => ({
    id: stringifyId(savedToque._id),
    savedAt: savedToque.createdAt,
    toque: (0, exports.toToquePreview)(toque),
});
const getSavedToques = async (req, res) => {
    try {
        const userId = getUserId(res);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const pageNumber = parsePositiveInteger(req.query.page, 1);
        const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
        const skip = (pageNumber - 1) * limitNumber;
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const [savedToques, total] = await Promise.all([
            app_1.default.find({ userId: userObjectId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .populate({
                path: "toqueId",
                select: TOQUE_PREVIEW_SELECT,
            })
                .lean(),
            app_1.default.countDocuments({ userId: userObjectId }),
        ]);
        const data = savedToques
            .filter(savedToque => savedToque.toqueId)
            .map(savedToque => buildSavedToquePayload(savedToque, savedToque.toqueId));
        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            data,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch saved toques" });
    }
};
exports.getSavedToques = getSavedToques;
const getSavedToqueStatus = async (req, res) => {
    try {
        const userId = getUserId(res);
        const toqueId = getToqueId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        const savedToque = await app_1.default.exists({
            userId: new mongoose_1.Types.ObjectId(userId),
            toqueId: new mongoose_1.Types.ObjectId(toqueId),
        });
        res.status(200).json({ saved: Boolean(savedToque) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch saved toque status" });
    }
};
exports.getSavedToqueStatus = getSavedToqueStatus;
const saveToque = async (req, res) => {
    try {
        const userId = getUserId(res);
        const toqueId = getToqueId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const toqueObjectId = new mongoose_1.Types.ObjectId(toqueId);
        const toque = await app_2.default.findById(toqueObjectId).select(TOQUE_PREVIEW_SELECT);
        if (!toque) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        const existingSavedToque = await app_1.default.findOne({
            userId: userObjectId,
            toqueId: toqueObjectId,
        });
        const savedToque = existingSavedToque !== null && existingSavedToque !== void 0 ? existingSavedToque : (await app_1.default.create({
            userId: userObjectId,
            toqueId: toqueObjectId,
        }));
        res.status(200).json({
            saved: true,
            data: buildSavedToquePayload(savedToque, toque),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save toque" });
    }
};
exports.saveToque = saveToque;
const deleteSavedToque = async (req, res) => {
    try {
        const userId = getUserId(res);
        const toqueId = getToqueId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        await app_1.default.deleteOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            toqueId: new mongoose_1.Types.ObjectId(toqueId),
        });
        res.status(200).json({ saved: false });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to remove saved toque" });
    }
};
exports.deleteSavedToque = deleteSavedToque;
