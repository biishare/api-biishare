"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostFilters = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const getPostFilters = async (req, res) => {
    try {
        const [subjects, levels, years, contentTypes] = await Promise.all([
            app_1.default.distinct("subjectId"),
            app_1.default.distinct("level"),
            app_1.default.distinct("year"),
            app_1.default.distinct("contentType"),
        ]);
        res.status(200).json({
            subjects,
            levels,
            years: years.sort((a, b) => a - b),
            contentTypes,
        });
    }
    catch (err) {
        res.status(500).json({
            error: "Failed to fetch filters",
        });
    }
};
exports.getPostFilters = getPostFilters;
