"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePost = void 0;
const app_1 = __importDefault(require("../../models/post/app"));
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: "ID do post é obrigatório." });
            return;
        }
        const deletedPost = await app_1.default.findByIdAndDelete(id);
        if (!deletedPost) {
            res.status(404).json({ error: "Post não encontrado." });
            return;
        }
        res.status(200).json({ message: "Post apagado com sucesso!", data: deletedPost });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao apagar o post." });
    }
};
exports.deletePost = deletePost;
