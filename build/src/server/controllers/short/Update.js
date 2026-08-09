"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Saved_1 = require("./Saved");
const update = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "ID do toque e obrigatorio." });
            return;
        }
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const toque = await app_1.default.findById(id);
        if (!toque) {
            res.status(404).json({ error: "Toque nao encontrado." });
            return;
        }
        if (!(0, creatorOwnership_1.canManageCreatorContent)(toque.creatorId, owner)) {
            res.status(403).json({ error: "Nao tens permissao para editar este toque." });
            return;
        }
        const { area, title, description, mediaType, videoUrl, isPublished } = req.body;
        if (mediaType !== undefined && mediaType !== "video") {
            res.status(400).json({ error: "Toques aceitam apenas videos." });
            return;
        }
        if (area !== undefined) {
            toque.area = typeof area === "string" ? area.toLowerCase().trim() : area;
        }
        if (title !== undefined) {
            toque.title = typeof title === "string" ? title.trim() : title;
        }
        if (description !== undefined) {
            toque.description =
                typeof description === "string" ? description.trim() : description;
        }
        const nextVideoUrl = typeof videoUrl === "string" ? videoUrl.trim() : (_a = toque.video) === null || _a === void 0 ? void 0 : _a.url;
        if (!nextVideoUrl) {
            res.status(400).json({ error: "Toque precisa de um link de video." });
            return;
        }
        if (typeof isPublished === "boolean") {
            toque.isPublished = isPublished;
        }
        toque.mediaType = "video";
        toque.video = { url: nextVideoUrl };
        toque.image = undefined;
        await toque.save();
        res.status(200).json({
            message: "Toque atualizado com sucesso!",
            data: (0, Saved_1.toToquePreview)(toque),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o toque." });
    }
};
exports.update = update;
