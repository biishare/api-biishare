"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToqueContext = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Get_1 = require("./Get");
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
const buildCursor = (toque) => {
    if (!toque)
        return undefined;
    return {
        id: toque._id.toString(),
        createdAt: toque.createdAt,
    };
};
const buildPublishedFilter = (area) => {
    const filters = {
        isPublished: { $ne: false },
    };
    if (area && area !== "todos") {
        filters.area = area;
    }
    return filters;
};
const buildBeforeFilter = (toque) => ({
    $or: [
        { createdAt: { $gt: toque.createdAt } },
        { createdAt: toque.createdAt, _id: { $gt: toque._id } },
    ],
});
const buildAfterFilter = (toque) => ({
    $or: [
        { createdAt: { $lt: toque.createdAt } },
        { createdAt: toque.createdAt, _id: { $lt: toque._id } },
    ],
});
const getToqueContext = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid toque id" });
            return;
        }
        const current = await app_1.default.findOne({
            _id: new mongoose_1.Types.ObjectId(id),
            isPublished: { $ne: false },
        }).populate({ path: "creatorId", select: Get_1.TOQUE_CREATOR_SELECT });
        if (!current) {
            res.status(404).json({ error: "Toque not found" });
            return;
        }
        const requestedArea = getQueryString(req.query.area).toLowerCase();
        const effectiveArea = requestedArea && requestedArea !== "todos" && requestedArea !== current.area
            ? current.area
            : requestedArea;
        const baseFilter = buildPublishedFilter(effectiveArea);
        const beforeLimit = parsePositiveInteger(req.query.before, 6, 20);
        const afterLimit = parsePositiveInteger(req.query.after, 10, 30);
        const [beforeWithExtra, afterWithExtra] = await Promise.all([
            app_1.default.find({ $and: [baseFilter, buildBeforeFilter(current)] })
                .sort(Get_1.TOQUE_SORT)
                .limit(beforeLimit + 1)
                .populate({ path: "creatorId", select: Get_1.TOQUE_CREATOR_SELECT }),
            app_1.default.find({ $and: [baseFilter, buildAfterFilter(current)] })
                .sort(Get_1.TOQUE_SORT)
                .limit(afterLimit + 1)
                .populate({ path: "creatorId", select: Get_1.TOQUE_CREATOR_SELECT }),
        ]);
        const before = beforeWithExtra.slice(0, beforeLimit);
        const after = afterWithExtra.slice(0, afterLimit);
        const data = [...before, current, ...after];
        res.status(200).json({
            data: data.map(Get_1.toToqueResponse),
            current: (0, Get_1.toToqueResponse)(current),
            currentIndex: before.length,
            hasBefore: beforeWithExtra.length > beforeLimit,
            hasAfter: afterWithExtra.length > afterLimit,
            beforeCursor: buildCursor(before[0]),
            afterCursor: buildCursor(after[after.length - 1]),
            requestedArea: requestedArea || "todos",
            effectiveArea: effectiveArea || "todos",
            areaAdjusted: Boolean(requestedArea &&
                requestedArea !== "todos" &&
                requestedArea !== current.area),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch toque context" });
    }
};
exports.getToqueContext = getToqueContext;
