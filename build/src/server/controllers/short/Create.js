"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const mongoose_1 = require("mongoose");
const app_1 = __importDefault(require("../../models/shorts/app"));
/* ======================================================
 * CREATE TOQUE (SHORT)
 * ====================================================== */
const create = async (req, res) => {
    try {
        const { area, title, description, mediaType, videoUrl, isPublished, } = req.body;
        const userId = res.locals.userId;
        if (typeof userId !== "string" || !mongoose_1.Types.ObjectId.isValid(userId)) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const creatorId = new mongoose_1.Types.ObjectId(userId);
        if (!area || !title || !description || !mediaType) {
            res.status(400).json({ error: "Campos obrigatorios ausentes." });
            return;
        }
        if (mediaType !== "video") {
            res.status(400).json({ error: "Toques aceitam apenas videos." });
            return;
        }
        if (title.trim().length < 3 || title.trim().length > 80) {
            res.status(400).json({ error: "Titulo deve ter entre 3 e 80 caracteres." });
            return;
        }
        if (description.trim().length < 20 || description.trim().length > 600) {
            res.status(400).json({ error: "Descricao deve ter entre 20 e 600 caracteres." });
            return;
        }
        if (!videoUrl || typeof videoUrl !== "string") {
            res.status(400).json({ error: "Toque precisa de um link de video." });
            return;
        }
        const newToque = new app_1.default({
            creatorId,
            area: area.toLowerCase().trim(),
            title: title.trim(),
            description: description.trim(),
            mediaType: "video",
            video: { url: videoUrl.trim() },
            image: undefined,
            isPublished: isPublished !== false,
        });
        await newToque.save();
        res.status(201).json({
            message: "Toque criado com sucesso!",
            data: newToque,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: (error === null || error === void 0 ? void 0 : error.message) || "Erro ao criar toque.",
        });
    }
};
exports.create = create;
