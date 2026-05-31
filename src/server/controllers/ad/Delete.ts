import { Request, Response } from "express";
import mongoose from "mongoose";
import AdModel from "../../models/ad/app";

/* ======================================================
 * DELETE AD
 * ====================================================== */
export const deleteAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    /* ---------- VALIDATE ID ---------- */
    if (!id) {
      res.status(400).json({ error: "ID do anúncio é obrigatório." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    /* ---------- DELETE ---------- */
    const deletedAd = await AdModel.findByIdAndDelete(id);

    if (!deletedAd) {
      res.status(404).json({ error: "Anúncio não encontrado." });
      return;
    }

    /* ---------- RESPONSE ---------- */
    res.status(200).json({
      message: "Anúncio apagado com sucesso!",
      data: deletedAd,
    });

  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error: error?.message || "Erro ao apagar anúncio.",
    });
  }
};