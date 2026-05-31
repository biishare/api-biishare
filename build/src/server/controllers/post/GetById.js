"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostById = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await app_1.default.findById(id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
};
exports.getPostById = getPostById;
