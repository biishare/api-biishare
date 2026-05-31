"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAd = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../models/ad/app"));
/* ======================================================
 * DELETE AD
 * ====================================================== */
const deleteAd = async (req, res) => {
    try {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        /* ---------- VALIDATE ID ---------- */
        if (!id) {
            res.status(400).json({ error: "ID do anúncio é obrigatório." });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "ID inválido." });
            return;
        }
        /* ---------- DELETE ---------- */
        const deletedAd = await app_1.default.findByIdAndDelete(id);
        if (!deletedAd) {
            res.status(404).json({ error: "Anúncio não encontrado." });
            return;
        }
        /* ---------- RESPONSE ---------- */
        res.status(200).json({
            message: "Anúncio apagado com sucesso!",
            data: deletedAd,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            error: (error === null || error === void 0 ? void 0 : error.message) || "Erro ao apagar anúncio.",
        });
    }
};
exports.deleteAd = deleteAd;
