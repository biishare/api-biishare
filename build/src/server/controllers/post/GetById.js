"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostById = void 0;
const locales_1 = require("../../i18n/locales");
const app_1 = __importDefault(require("../../models/post/app"));
const Presenter_1 = require("./Presenter");
const CREATOR_SELECT = "name username avatarUrl email";
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const locale = (0, locales_1.normalizeContentLocale)(req.query.locale);
        const post = await app_1.default.findById(id).populate({
            path: "creatorId",
            select: CREATOR_SELECT,
        });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json((0, Presenter_1.toPostResponse)(post, { locale }));
    }
    catch {
        res.status(500).json({ error: "Failed to fetch post" });
    }
};
exports.getPostById = getPostById;
