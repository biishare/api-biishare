"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToqueComment = exports.getToqueComments = exports.unlikeToque = exports.likeToque = exports.getToqueSocialSummary = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/shorts/app"));
const app_2 = __importDefault(require("../../models/toqueLike/app"));
const app_3 = __importDefault(require("../../models/toqueComment/app"));
const utils_1 = require("../auth/utils");
const COMMENT_AUTHOR_SELECT = "name username avatarUrl";
const parsePositiveInteger = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    const normalized = Math.floor(parsed);
    return max ? Math.min(normalized, max) : normalized;
};
const stringifyId = (id) => {
    if (id instanceof mongoose_1.Types.ObjectId) {
        return id.toString();
    }
    return typeof id === "string" ? id : String(id);
};
const getToqueObjectId = (req) => {
    const toqueId = req.params.id;
    if (typeof toqueId !== "string" || !mongoose_1.Types.ObjectId.isValid(toqueId)) {
        return null;
    }
    return new mongoose_1.Types.ObjectId(toqueId);
};
const getRequiredUserObjectId = (res) => {
    const userId = res.locals.userId;
    if (typeof userId !== "string" || !mongoose_1.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return new mongoose_1.Types.ObjectId(userId);
};
const getOptionalUserObjectId = (req) => {
    const header = req.headers.authorization;
    const bearerToken = (header === null || header === void 0 ? void 0 : header.startsWith("Bearer ")) ? header.slice(7) : undefined;
    const token = bearerToken || (0, utils_1.getAuthTokenFromCookieHeader)(req.headers.cookie);
    if (!token) {
        return null;
    }
    const session = (0, utils_1.verifyAuthToken)(token);
    if (!session || !mongoose_1.Types.ObjectId.isValid(session.userId)) {
        return null;
    }
    return new mongoose_1.Types.ObjectId(session.userId);
};
const ensureToqueExists = async (toqueId) => {
    return app_1.default.exists({
        _id: toqueId,
        isPublished: { $ne: false },
    });
};
const buildSocialSummary = async (toqueId, userId) => {
    const [likes, comments, liked] = await Promise.all([
        app_2.default.countDocuments({ toqueId }),
        app_3.default.countDocuments({ toqueId, status: "visible" }),
        userId ? app_2.default.exists({ toqueId, userId }) : Promise.resolve(null),
    ]);
    return {
        liked: Boolean(liked),
        likes,
        comments,
    };
};
const asString = (value, fallback = "") => {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
};
const asAuthor = (value) => {
    if (!value || typeof value !== "object" || value instanceof mongoose_1.Types.ObjectId) {
        return {};
    }
    return value;
};
const toCommentResponse = (comment) => {
    const author = asAuthor(comment.userId);
    return {
        id: stringifyId(comment._id),
        text: asString(comment.text),
        author: {
            id: stringifyId(author._id),
            name: asString(author.name, "Utilizador Biishare"),
            username: asString(author.username) || undefined,
            avatarUrl: asString(author.avatarUrl) || undefined,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
    };
};
const getToqueSocialSummary = async (req, res) => {
    try {
        const toqueId = getToqueObjectId(req);
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        const toqueExists = await ensureToqueExists(toqueId);
        if (!toqueExists) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        res.status(200).json(await buildSocialSummary(toqueId, getOptionalUserObjectId(req)));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch toque social summary" });
    }
};
exports.getToqueSocialSummary = getToqueSocialSummary;
const likeToque = async (req, res) => {
    try {
        const toqueId = getToqueObjectId(req);
        const userId = getRequiredUserObjectId(res);
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const toqueExists = await ensureToqueExists(toqueId);
        if (!toqueExists) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        await app_2.default.updateOne({ toqueId, userId }, { $setOnInsert: { toqueId, userId } }, { upsert: true });
        res.status(200).json(await buildSocialSummary(toqueId, userId));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to like toque" });
    }
};
exports.likeToque = likeToque;
const unlikeToque = async (req, res) => {
    try {
        const toqueId = getToqueObjectId(req);
        const userId = getRequiredUserObjectId(res);
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        await app_2.default.deleteOne({ toqueId, userId });
        res.status(200).json(await buildSocialSummary(toqueId, userId));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to unlike toque" });
    }
};
exports.unlikeToque = unlikeToque;
const getToqueComments = async (req, res) => {
    try {
        const toqueId = getToqueObjectId(req);
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        const toqueExists = await ensureToqueExists(toqueId);
        if (!toqueExists) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        const pageNumber = parsePositiveInteger(req.query.page, 1);
        const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
        const skip = (pageNumber - 1) * limitNumber;
        const filters = { toqueId, status: "visible" };
        const [comments, total] = await Promise.all([
            app_3.default.find(filters)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limitNumber)
                .populate({ path: "userId", select: COMMENT_AUTHOR_SELECT })
                .lean(),
            app_3.default.countDocuments(filters),
        ]);
        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
            data: comments.map((comment) => toCommentResponse(comment)),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch toque comments" });
    }
};
exports.getToqueComments = getToqueComments;
const createToqueComment = async (req, res) => {
    var _a;
    try {
        const toqueId = getToqueObjectId(req);
        const userId = getRequiredUserObjectId(res);
        const text = asString((_a = req.body) === null || _a === void 0 ? void 0 : _a.text).replace(/\s+/g, " ").trim();
        if (!toqueId) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (text.length < 1 || text.length > 500) {
            res.status(400).json({ error: "Comentario invalido." });
            return;
        }
        const toqueExists = await ensureToqueExists(toqueId);
        if (!toqueExists) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        const comment = await app_3.default.create({
            toqueId,
            userId,
            text,
            status: "visible",
        });
        const populated = await comment.populate({
            path: "userId",
            select: COMMENT_AUTHOR_SELECT,
        });
        const total = await app_3.default.countDocuments({
            toqueId,
            status: "visible",
        });
        res.status(201).json({
            data: toCommentResponse(populated.toObject()),
            total,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create toque comment" });
    }
};
exports.createToqueComment = createToqueComment;
