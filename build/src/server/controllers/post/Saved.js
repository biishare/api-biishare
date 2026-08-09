"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSavedPost = exports.savePost = exports.getSavedPostStatus = exports.getSavedPosts = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/post/app"));
const app_2 = __importDefault(require("../../models/savedPost/app"));
const Presenter_1 = require("./Presenter");
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
const getPostId = (req) => {
    const postId = req.params.id;
    if (typeof postId !== "string" || !mongoose_1.Types.ObjectId.isValid(postId)) {
        return null;
    }
    return postId;
};
const stringifyId = (id) => {
    if (id instanceof mongoose_1.Types.ObjectId) {
        return id.toString();
    }
    return typeof id === "string" ? id : String(id);
};
const oldToSavedPostPreview = (post) => {
    if (!post || typeof post !== "object") {
        return post;
    }
    const documentLikePost = post;
    const plainPost = typeof documentLikePost.toObject === "function"
        ? documentLikePost.toObject()
        : post;
    return {
        ...plainPost,
        _id: stringifyId(plainPost._id),
        imageLink: typeof plainPost.imageLink === "string" ? plainPost.imageLink.trim() : "",
    };
};
const buildSavedPostPayload = (savedPost, post) => ({
    id: stringifyId(savedPost._id),
    savedAt: savedPost.createdAt,
    post: (0, Presenter_1.toPostResponse)(post),
});
const getSavedPosts = async (req, res) => {
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
        const [savedPosts, total] = await Promise.all([
            app_2.default.find({ userId: userObjectId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .populate({
                path: "postId",
                select: "creatorId subjectId subjectIds title description level contentType imageLink videos documents images playlist createdAt updatedAt",
                populate: {
                    path: "creatorId",
                    select: "name username avatarUrl email",
                },
            })
                .lean(),
            app_2.default.countDocuments({ userId: userObjectId }),
        ]);
        const data = savedPosts
            .filter(savedPost => savedPost.postId)
            .map(savedPost => buildSavedPostPayload(savedPost, savedPost.postId));
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
        res.status(500).json({ error: "Failed to fetch saved posts" });
    }
};
exports.getSavedPosts = getSavedPosts;
const getSavedPostStatus = async (req, res) => {
    try {
        const userId = getUserId(res);
        const postId = getPostId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!postId) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }
        const savedPost = await app_2.default.exists({
            userId: new mongoose_1.Types.ObjectId(userId),
            postId: new mongoose_1.Types.ObjectId(postId),
        });
        res.status(200).json({ saved: Boolean(savedPost) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch saved post status" });
    }
};
exports.getSavedPostStatus = getSavedPostStatus;
const savePost = async (req, res) => {
    try {
        const userId = getUserId(res);
        const postId = getPostId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!postId) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const postObjectId = new mongoose_1.Types.ObjectId(postId);
        const post = await app_1.default.findById(postObjectId).select("creatorId subjectId subjectIds title description level contentType imageLink videos documents images playlist createdAt updatedAt").populate({
            path: "creatorId",
            select: "name username avatarUrl email",
        });
        if (!post) {
            res.status(404).json({ error: "Post not found" });
            return;
        }
        const existingSavedPost = await app_2.default.findOne({
            userId: userObjectId,
            postId: postObjectId,
        });
        const savedPost = existingSavedPost !== null && existingSavedPost !== void 0 ? existingSavedPost : (await app_2.default.create({
            userId: userObjectId,
            postId: postObjectId,
        }));
        res.status(200).json({
            saved: true,
            data: buildSavedPostPayload(savedPost, post),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save post" });
    }
};
exports.savePost = savePost;
const deleteSavedPost = async (req, res) => {
    try {
        const userId = getUserId(res);
        const postId = getPostId(req);
        if (!userId) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        if (!postId) {
            res.status(400).json({ error: "Invalid post id" });
            return;
        }
        await app_2.default.deleteOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            postId: new mongoose_1.Types.ObjectId(postId),
        });
        res.status(200).json({ saved: false });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to remove saved post" });
    }
};
exports.deleteSavedPost = deleteSavedPost;
