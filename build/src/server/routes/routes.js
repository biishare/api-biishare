"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const app_1 = require("../controllers/app");
const app_2 = require("../controllers/app");
const app_3 = require("../controllers/ad/app");
const router = (0, express_1.Router)();
exports.router = router;
/* ================================
 * ROOT
 * ================================ */
router.get("/", (req, res) => {
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
router.get("/posts/filters", app_1.PostController.getPostFilters);
// 🔎 LISTAGEM + BUSCA
router.get("/posts", app_1.PostController.getPosts);
// 🔍 DETALHE
router.get("/posts/:id", app_1.PostController.getPostById);
// ➕ CRIAÇÃO
router.post("/posts", app_1.PostController.create);
// ➡️ ATUALIZAÇÃO
router.put("/posts/:postId", app_1.PostController.update);
// ❌ EXCLUSÃO
router.delete("/posts/:id", app_1.PostController.deletePost);
/* ================================
 * CURIOSITIES (SHORTS)
 * ================================ */
router.post("/toques", app_2.ShortController.create); // Criação
router.get("/toques", app_2.ShortController.getShorts); // Listagem
router.get("/toques/:id", app_2.ShortController.getToqueById); // Detalhe por ID
// router.delete("/toques/:id", ShortController.deleteShort); // Exclusão
/* ================================
 * Ads
 * ================================ */
router.post("/ads", app_3.AdController.create); // Criação
router.get("/ads", app_3.AdController.getAds); // Listagem
router.get("/ads/:id", app_3.AdController.getAdById); // Detalhe por ID
