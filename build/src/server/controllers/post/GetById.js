"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostById = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const Presenter_1 = require("./Presenter");
const CREATOR_SELECT = "name username avatarUrl email";
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await app_1.default.findById(id).populate({
            path: "creatorId",
            select: CREATOR_SELECT,
        });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json((0, Presenter_1.toPostResponse)(post));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
};
exports.getPostById = getPostById;
