"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPosts = exports.getPosts = void 0;
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/post/app"));
const Presenter_1 = require("./Presenter");
const CREATOR_SELECT = "name username avatarUrl email";
const CONTENT_TYPES = ["video", "document", "image", "playlist"];
const parsePositiveInteger = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    const normalized = Math.floor(parsed);
    return max ? Math.min(normalized, max) : normalized;
};
const buildPublicPostFilters = (req) => {
    const { subjectId, level, contentType } = req.query;
    const filters = { isPublished: { $ne: false } };
    if (subjectId) {
        filters.$or = [{ subjectIds: subjectId }, { subjectId }];
    }
    if (level) {
        filters.level = level;
    }
    if (typeof contentType === "string" && CONTENT_TYPES.includes(contentType)) {
        filters.contentType = contentType;
    }
    return filters;
};
const sendPostPage = async (req, res, filters) => {
    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
    const skip = (pageNumber - 1) * limitNumber;
    const [posts, total] = await Promise.all([
        app_1.default.find(filters)
            .populate({ path: "creatorId", select: CREATOR_SELECT })
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
        data: posts.map(Presenter_1.toPostResponse),
    });
};
const getPosts = async (req, res) => {
    try {
        await sendPostPage(req, res, buildPublicPostFilters(req));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch posts",
        });
    }
};
exports.getPosts = getPosts;
const getMyPosts = async (req, res) => {
    try {
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        await sendPostPage(req, res, (0, creatorOwnership_1.buildCreatorContentFilter)(owner));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch creator posts",
        });
    }
};
exports.getMyPosts = getMyPosts;
