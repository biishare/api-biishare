"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyToques = exports.getShorts = exports.toToqueResponse = exports.toCreatorPreview = exports.TOQUE_SORT = exports.TOQUE_CREATOR_SELECT = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/shorts/app"));
exports.TOQUE_CREATOR_SELECT = "name username avatarUrl";
const ACCENT_FOLD = {
    a: "aáàâãäå",
    e: "eéèêë",
    i: "iíìîï",
    o: "oóòôõö",
    u: "uúùûü",
    c: "cç",
    n: "nñ",
};
exports.TOQUE_SORT = { createdAt: -1, _id: -1 };
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
const getToqueImageUrls = (toque) => {
    var _a, _b, _c;
    const urls = ((_a = toque.images) !== null && _a !== void 0 ? _a : [])
        .map((item) => { var _a; return (_a = item.url) === null || _a === void 0 ? void 0 : _a.trim(); })
        .filter((url) => Boolean(url));
    const legacyUrl = (_c = (_b = toque.image) === null || _b === void 0 ? void 0 : _b.url) === null || _c === void 0 ? void 0 : _c.trim();
    return Array.from(new Set([...urls, legacyUrl].filter((url) => Boolean(url))));
};
const stringifyId = (id) => {
    if (id instanceof mongoose_1.Types.ObjectId) {
        return id.toString();
    }
    return typeof id === "string" ? id : String(id);
};
const asOptionalString = (value) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const toCreatorPreview = (creatorValue) => {
    if (!creatorValue ||
        creatorValue instanceof mongoose_1.Types.ObjectId ||
        typeof creatorValue !== "object") {
        return undefined;
    }
    const documentLikeCreator = creatorValue;
    const creator = typeof documentLikeCreator.toObject === "function"
        ? documentLikeCreator.toObject()
        : creatorValue;
    const name = asOptionalString(creator.name);
    if (!name) {
        return undefined;
    }
    return {
        id: stringifyId(creator._id),
        name,
        username: asOptionalString(creator.username),
        avatarUrl: asOptionalString(creator.avatarUrl),
    };
};
exports.toCreatorPreview = toCreatorPreview;
const toToqueResponse = (toque) => {
    var _a, _b, _c;
    const mediaType = toque.mediaType === "image" ? "image" : "video";
    const imageUrls = mediaType === "image" ? getToqueImageUrls(toque) : [];
    const videoPosterUrl = mediaType === "video" ? (_a = toque.image) === null || _a === void 0 ? void 0 : _a.url : undefined;
    const creator = (0, exports.toCreatorPreview)(toque.creatorId);
    return {
        _id: toque._id,
        creatorId: (_b = creator === null || creator === void 0 ? void 0 : creator.id) !== null && _b !== void 0 ? _b : (toque.creatorId ? toque.creatorId.toString() : undefined),
        creator,
        area: toque.area,
        title: toque.title,
        description: toque.description,
        mediaType,
        videoUrl: mediaType === "video" ? (_c = toque.video) === null || _c === void 0 ? void 0 : _c.url : undefined,
        imageUrl: mediaType === "image" ? imageUrls[0] : videoPosterUrl,
        imageUrls: mediaType === "image" ? imageUrls : undefined,
        images: mediaType === "image" ? imageUrls.map((url) => ({ url })) : undefined,
        isPublished: toque.isPublished,
        createdAt: toque.createdAt,
        updatedAt: toque.updatedAt,
    };
};
exports.toToqueResponse = toToqueResponse;
const buildToqueCursor = (toque) => {
    if (!toque)
        return undefined;
    return {
        id: toque._id.toString(),
        createdAt: toque.createdAt,
    };
};
const buildCursorFilter = (createdAtValue, idValue, directionValue) => {
    const createdAt = new Date(getQueryString(createdAtValue));
    const id = getQueryString(idValue);
    if (!Number.isFinite(createdAt.getTime()) || !mongoose_1.Types.ObjectId.isValid(id)) {
        return null;
    }
    const objectId = new mongoose_1.Types.ObjectId(id);
    const direction = getQueryString(directionValue) === "before" ? "before" : "after";
    if (direction === "before") {
        return {
            $or: [
                { createdAt: { $gt: createdAt } },
                { createdAt, _id: { $gt: objectId } },
            ],
        };
    }
    return {
        $or: [
            { createdAt: { $lt: createdAt } },
            { createdAt, _id: { $lt: objectId } },
        ],
    };
};
const sendCursorPage = async (res, filters, cursorFilter, limitNumber) => {
    const queryFilter = { $and: [filters, cursorFilter] };
    const [shortsWithExtra, total] = await Promise.all([
        app_1.default.find(queryFilter)
            .sort(exports.TOQUE_SORT)
            .limit(limitNumber + 1)
            .populate({ path: "creatorId", select: exports.TOQUE_CREATOR_SELECT }),
        app_1.default.countDocuments(filters),
    ]);
    const data = shortsWithExtra.slice(0, limitNumber);
    res.status(200).json({
        page: 1,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
        hasNextPage: shortsWithExtra.length > limitNumber,
        nextCursor: buildToqueCursor(data[data.length - 1]),
        previousCursor: buildToqueCursor(data[0]),
        data: data.map(exports.toToqueResponse),
    });
};
const sendToquePage = async (req, res, filters) => {
    const pageNumber = parsePositiveInteger(req.query.page, 1);
    const limitNumber = parsePositiveInteger(req.query.limit, 10, 50);
    const cursorFilter = buildCursorFilter(req.query.cursorCreatedAt, req.query.cursorId, req.query.direction);
    if (cursorFilter) {
        await sendCursorPage(res, filters, cursorFilter, limitNumber);
        return;
    }
    const skip = (pageNumber - 1) * limitNumber;
    const [shorts, total] = await Promise.all([
        app_1.default.find(filters)
            .sort(exports.TOQUE_SORT)
            .skip(skip)
            .limit(limitNumber)
            .populate({ path: "creatorId", select: exports.TOQUE_CREATOR_SELECT }),
        app_1.default.countDocuments(filters),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    res.status(200).json({
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        nextCursor: buildToqueCursor(shorts[shorts.length - 1]),
        previousCursor: buildToqueCursor(shorts[0]),
        data: shorts.map(exports.toToqueResponse),
    });
};
const getShorts = async (req, res) => {
    try {
        const { area, q } = req.query;
        const areaValue = getQueryString(area).toLowerCase();
        const searchRegex = buildSearchRegex(q);
        const filters = { isPublished: { $ne: false } };
        if (areaValue && areaValue !== "todos") {
            filters.area = areaValue;
        }
        if (searchRegex) {
            filters.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { area: searchRegex },
                { mediaType: searchRegex },
            ];
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
