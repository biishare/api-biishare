"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToqueById = void 0;
const app_1 = __importDefault(require("../../models/shorts/app"));
const getToqueById = async (req, res) => {
    try {
        const { id } = req.params;
        const toque = await app_1.default.findById(id);
        if (!toque) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(toque);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch toque" });
    }
};
exports.getToqueById = getToqueById;
