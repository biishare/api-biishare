"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteToque = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/shorts/app"));
const Saved_1 = require("./Saved");
const deleteToque = async (req, res) => {
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
            res.status(403).json({ error: "Nao tens permissao para apagar este toque." });
            return;
        }
        const data = (0, Saved_1.toToquePreview)(toque);
        await toque.deleteOne();
        res.status(200).json({
            message: "Toque apagado com sucesso!",
            data,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao apagar o toque." });
    }
};
exports.deleteToque = deleteToque;
