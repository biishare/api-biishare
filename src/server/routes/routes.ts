import { Router, Request, Response } from "express";
import { PostController } from "../controllers/app";
import { ShortController } from "../controllers/app";
import { AdController } from "../controllers/ad/app";
const router = Router();

/* ================================
 * ROOT
 * ================================ */
router.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "API BII está online 🚀",
    version: "1.0.0",
    endpoints: {
      posts: {
        list: "GET /posts",
        create: "POST /posts",
        update: "PUT /posts/:postId",
        delete: "DELETE /posts/:id",
        filters: "GET /posts/filters",
        byId: "GET /posts/:id",
      },
       curiosities: {
        create: "POST /curiosities",
      },
    },
  });
});

/* ================================
 * POSTS
 * ================================ */
// 🎛️ FILTROS DISPONÍVEIS
router.get("/posts/filters", PostController.getPostFilters);

// 🔎 LISTAGEM + BUSCA
router.get("/posts", PostController.getPosts);

// 🔍 DETALHE
router.get("/posts/:id", PostController.getPostById);

// ➕ CRIAÇÃO
router.post("/posts", PostController.create);

// ➡️ ATUALIZAÇÃO
router.put("/posts/:postId", PostController.update);

// ❌ EXCLUSÃO
router.delete("/posts/:id", PostController.deletePost);


/* ================================
 * CURIOSITIES (SHORTS)
 * ================================ */
router.post("/toques", ShortController.create);        // Criação
router.get("/toques", ShortController.getShorts);      // Listagem
router.get("/toques/:id", ShortController.getToqueById); // Detalhe por ID
// router.delete("/toques/:id", ShortController.deleteShort); // Exclusão


/* ================================
 * Ads
 * ================================ */
router.post("/ads", AdController.create);        // Criação
router.get("/ads", AdController.getAds);      // Listagem
router.get("/ads/:id", AdController.getAdById); // Detalhe por ID
// router.delete("/ads/:id", AdController.deleteAd); // Exclusão

export { router };
