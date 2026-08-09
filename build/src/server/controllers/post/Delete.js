"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = void 0;
const mongoose_1 = require("mongoose");
const creatorOwnership_1 = require("../creatorOwnership");
const app_1 = __importDefault(require("../../models/post/app"));
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string" || !mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "ID do post e obrigatorio." });
            return;
        }
        const owner = await (0, creatorOwnership_1.getAuthenticatedContentOwner)(res);
        if (!owner) {
            res.status(401).json({ error: "Sessao obrigatoria." });
            return;
        }
        const post = await app_1.default.findById(id);
        if (!post) {
            res.status(404).json({ error: "Post nao encontrado." });
            return;
        }
        if (!(0, creatorOwnership_1.canManageCreatorContent)(post.creatorId, owner)) {
            res.status(403).json({ error: "Nao tens permissao para apagar este post." });
            return;
        }
        await post.deleteOne();
        res.status(200).json({ message: "Post apagado com sucesso!", data: post });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao apagar o post." });
    }
};
exports.deletePost = deletePost;
