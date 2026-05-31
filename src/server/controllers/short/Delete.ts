// import { Request, Response } from "express";
// import ToqueModel from "../../models/shorts/app";

// export const deleteShort = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       res.status(400).json({ error: "ID do short é obrigatório." });
//       return;
//     }

//     const deletedShort = await ToqueModel.findByIdAndDelete(id);

//     if (!deletedShort) {
//       res.status(404).json({ error: "Short não encontrado." });
//       return;
//     }

//     res.status(200).json({
//       message: "Short apagado com sucesso!",
//       data: deletedShort,
//     });
//   } catch (error: any) {
//     console.error(error);
//     res.status(500).json({ error: "Erro ao apagar o short." });
//   }
// };
