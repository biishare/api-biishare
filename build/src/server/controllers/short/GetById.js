"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToqueById = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Get_1 = require("./Get");
const getToqueById = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid toque id" });
        }
        const toque = await app_1.default.findById(id).populate({
            path: "creatorId",
            select: Get_1.TOQUE_CREATOR_SELECT,
        });
        if (!toque) {
            return res.status(404).json({ error: "Toque not found" });
        }
        res.json((0, Get_1.toToqueResponse)(toque));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch toque" });
    }
};
exports.getToqueById = getToqueById;
