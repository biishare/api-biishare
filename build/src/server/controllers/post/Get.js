"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPosts = exports.getPosts = void 0;
const creatorOwnership_1 = require("../creatorOwnership");
const locales_1 = require("../../i18n/locales");
const app_1 = __importDefault(require("../../models/post/app"));
const Presenter_1 = require("./Presenter");
const CREATOR_SELECT = "name username avatarUrl email";
const CONTENT_TYPES = ["video", "document", "image", "playlist"];
const ACCENT_FOLD = {
    a: "aáàâãäå",
    e: "eéèêë",
    i: "iíìîï",
    o: "oóòôõö",
    u: "uúùûü",
    c: "cç",
    n: "nñ",
};
const parsePositiveInteger = (value, fallback, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }
    const normalized = Math.floor(parsed);
    return max ? Math.min(normalized, max) : normalized;
};
const getQueryString = (value) => {
    const rawValue = Array.isArray(value) ? value[0] : value;
    if (typeof rawValue !== "string") {
        return "";
    }
    return rawValue.replace(/\s+/g, " ").trim();
};
const normalizeSearchValue = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const escapeRegexChar = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildSearchRegex = (value) => {
    const query = normalizeSearchValue(getQueryString(value));
    if (query.length < 2) {
        return null;
    }
    const pattern = Array.from(query)
        .map((char) => {
        if (/\s/.test(char)) {
            return "\\s+";
        }
        const variants = ACCENT_FOLD[char];
        return variants ? `[${variants}]` : escapeRegexChar(char);
    })
        .join("");
    return new RegExp(pattern, "i");
};
const buildPublicPostFilters = (req) => {
    const { subjectId, level, contentType, q } = req.query;
    const filters = { isPublished: { $ne: false } };
    const conditions = [];
    const subjectIdValue = getQueryString(subjectId);
    const levelValue = getQueryString(level);
    const searchRegex = buildSearchRegex(q);
    if (subjectIdValue) {
        conditions.push({ $or: [{ subjectIds: subjectIdValue }, { subjectId: subjectIdValue }] });
    }
    if (levelValue) {
        filters.level = levelValue;
    }
    if (typeof contentType === "string" && CONTENT_TYPES.includes(contentType)) {
        filters.contentType = contentType;
    }
    if (searchRegex) {
        conditions.push({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { level: searchRegex },
                { contentType: searchRegex },
                { subjectId: searchRegex },
                { subjectIds: searchRegex },
                { playlistTitle: searchRegex },
                { "videos.title": searchRegex },
                { "documents.title": searchRegex },
                { "images.title": searchRegex },
                { "playlist.title": searchRegex },
            ],
        });
    }
    if (conditions.length > 0) {
        filters.$and = conditions;
    }
    return filters;
};
const sendPostPage = async (req, res, filters) => {
    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 20, 50);
    const skip = (pageNumber - 1) * limitNumber;
    const locale = (0, locales_1.normalizeContentLocale)(req.query.locale);
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
        data: posts.map(post => (0, Presenter_1.toPostResponse)(post, { locale })),
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
