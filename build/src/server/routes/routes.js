"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const app_1 = require("../controllers/app");
const app_2 = require("../controllers/app");
const app_3 = require("../controllers/app");
const app_4 = require("../controllers/ad/app");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.router = router;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error("Apenas imagens sao permitidas."));
            return;
        }
        callback(null, true);
    },
});
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
                saved: "GET /posts/saved",
                save: "POST /posts/:id/save",
                unsave: "DELETE /posts/:id/save",
                savedStatus: "GET /posts/:id/save",
            },
            toques: {
                list: "GET /toques",
                create: "POST /toques",
                byId: "GET /toques/:id",
                saved: "GET /toques/saved",
                save: "POST /toques/:id/save",
                unsave: "DELETE /toques/:id/save",
                savedStatus: "GET /toques/:id/save",
            },
            curiosities: {
                create: "POST /curiosities",
            },
            auth: {
                register: "POST /auth/register",
                login: "POST /auth/login",
                logout: "POST /auth/logout",
                me: "GET /auth/me",
                username: "GET /auth/username?username=:username",
                google: "GET /auth/google",
                googleCallback: "GET /auth/google/callback",
                facebook: "GET /auth/facebook",
                facebookCallback: "GET /auth/facebook/callback",
                profileImages: "POST /auth/profile-images",
            },
        },
    });
});
/* ================================
 * AUTH
 * ================================ */
router.post("/auth/register", app_3.AuthController.register);
router.post("/auth/login", app_3.AuthController.login);
router.post("/auth/logout", app_3.AuthController.logout);
router.get("/auth/username", app_3.AuthController.checkUsername);
router.get("/auth/me", auth_1.authenticate, app_3.AuthController.getMe);
router.get("/auth/google", app_3.AuthController.googleAuth);
router.get("/auth/google/callback", app_3.AuthController.googleCallback);
router.get("/auth/facebook", app_3.AuthController.facebookAuth);
router.get("/auth/facebook/callback", app_3.AuthController.facebookCallback);
router.post("/auth/profile-images", auth_1.authenticate, upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
]), app_3.AuthController.uploadProfileImages);
/* ================================
 * POSTS
 * ================================ */
// 🎛️ FILTROS DISPONÍVEIS
router.get("/posts/filters", app_1.PostController.getPostFilters);
// 🔎 LISTAGEM + BUSCA
router.get("/posts", app_1.PostController.getPosts);
// Guardados do utilizador autenticado
router.get("/posts/saved", auth_1.authenticate, app_1.PostController.getSavedPosts);
router.get("/posts/:id/save", auth_1.authenticate, app_1.PostController.getSavedPostStatus);
router.post("/posts/:id/save", auth_1.authenticate, app_1.PostController.savePost);
router.delete("/posts/:id/save", auth_1.authenticate, app_1.PostController.deleteSavedPost);
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
router.get("/toques/saved", auth_1.authenticate, app_2.ShortController.getSavedToques);
router.get("/toques/:id/save", auth_1.authenticate, app_2.ShortController.getSavedToqueStatus);
router.post("/toques/:id/save", auth_1.authenticate, app_2.ShortController.saveToque);
router.delete("/toques/:id/save", auth_1.authenticate, app_2.ShortController.deleteSavedToque);
router.get("/toques/:id", app_2.ShortController.getToqueById); // Detalhe por ID
// router.delete("/toques/:id", ShortController.deleteShort); // Exclusão
/* ================================
 * Ads
 * ================================ */
router.post("/ads", app_4.AdController.create); // Criação
router.get("/ads", app_4.AdController.getAds); // Listagem
router.get("/ads/:id", app_4.AdController.getAdById); // Detalhe por ID
