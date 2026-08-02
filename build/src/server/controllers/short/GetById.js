"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToqueById = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Saved_1 = require("./Saved");
const getToqueById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid toque id" });
        }
        const toque = await app_1.default.findById(id);
        if (!toque) {
            return res.status(404).json({ error: "Toque not found" });
        }
        res.json((0, Saved_1.toToquePreview)(toque));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch toque" });
    }
};
exports.getToqueById = getToqueById;
