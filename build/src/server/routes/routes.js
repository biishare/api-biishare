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
const profileImageUpload = (0, multer_1.default)({
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
const publicationMediaUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 80 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        const mimetype = file.mimetype.toLowerCase();
        const name = file.originalname.toLowerCase();
        const isAllowed = mimetype.startsWith("image/") ||
            mimetype.startsWith("video/") ||
            mimetype === "application/pdf" ||
            name.endsWith(".pdf");
        if (!isAllowed) {
            callback(new Error("Apenas imagens, videos e PDFs sao permitidos."));
            return;
        }
        callback(null, true);
    },
});
router.get("/", (req, res) => {
    return res.status(200).json({
        message: "API BII esta online",
        version: "1.0.0",
        endpoints: {
            posts: {
                list: "GET /posts",
                mine: "GET /posts/mine",
                create: "POST /posts",
                media: "POST /posts/media",
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
                mine: "GET /toques/mine",
                create: "POST /toques",
                update: "PUT /toques/:id",
                delete: "DELETE /toques/:id",
                byId: "GET /toques/:id",
                saved: "GET /toques/saved",
                save: "POST /toques/:id/save",
                unsave: "DELETE /toques/:id/save",
                savedStatus: "GET /toques/:id/save",
                social: "GET /toques/:id/social",
                like: "POST /toques/:id/like",
                unlike: "DELETE /toques/:id/like",
                comments: "GET/POST /toques/:id/comments",
                context: "GET /toques/:id/context",
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
                creatorApplication: "POST /auth/creator-application",
            },
        },
    });
});
router.post("/auth/register", app_3.AuthController.register);
router.post("/auth/login", app_3.AuthController.login);
router.post("/auth/logout", app_3.AuthController.logout);
router.get("/auth/username", app_3.AuthController.checkUsername);
router.get("/auth/me", auth_1.authenticate, app_3.AuthController.getMe);
router.patch("/auth/preferred-locale", auth_1.authenticate, app_3.AuthController.updatePreferredLocale);
router.post("/auth/creator-application", auth_1.authenticate, profileImageUpload.single("verificationPhoto"), app_3.AuthController.applyCreatorApplication);
router.get("/auth/google", app_3.AuthController.googleAuth);
router.get("/auth/google/callback", app_3.AuthController.googleCallback);
router.get("/auth/facebook", app_3.AuthController.facebookAuth);
router.get("/auth/facebook/callback", app_3.AuthController.facebookCallback);
router.post("/auth/profile-images", auth_1.authenticate, profileImageUpload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
]), app_3.AuthController.uploadProfileImages);
router.post("/posts/media", auth_1.authenticate, auth_1.requireCreator, publicationMediaUpload.single("file"), app_1.PostController.uploadPublicationMedia);
router.get("/posts/filters", app_1.PostController.getPostFilters);
router.get("/posts/mine", auth_1.authenticate, app_1.PostController.getMyPosts);
router.get("/posts", app_1.PostController.getPosts);
router.get("/posts/saved", auth_1.authenticate, app_1.PostController.getSavedPosts);
router.get("/posts/:id/save", auth_1.authenticate, app_1.PostController.getSavedPostStatus);
router.post("/posts/:id/save", auth_1.authenticate, app_1.PostController.savePost);
router.delete("/posts/:id/save", auth_1.authenticate, app_1.PostController.deleteSavedPost);
router.get("/posts/:id", app_1.PostController.getPostById);
router.post("/posts", auth_1.authenticate, auth_1.requireCreator, app_1.PostController.create);
router.put("/posts/:postId", auth_1.authenticate, auth_1.requireCreator, app_1.PostController.update);
router.delete("/posts/:id", auth_1.authenticate, auth_1.requireCreator, app_1.PostController.deletePost);
router.post("/toques", auth_1.authenticate, auth_1.requireCreator, app_2.ShortController.create);
router.get("/toques/mine", auth_1.authenticate, app_2.ShortController.getMyToques);
router.get("/toques", app_2.ShortController.getShorts);
router.get("/toques/saved", auth_1.authenticate, app_2.ShortController.getSavedToques);
router.get("/toques/:id/save", auth_1.authenticate, app_2.ShortController.getSavedToqueStatus);
router.post("/toques/:id/save", auth_1.authenticate, app_2.ShortController.saveToque);
router.delete("/toques/:id/save", auth_1.authenticate, app_2.ShortController.deleteSavedToque);
router.get("/toques/:id/social", app_2.ShortController.getToqueSocialSummary);
router.post("/toques/:id/like", auth_1.authenticate, app_2.ShortController.likeToque);
router.delete("/toques/:id/like", auth_1.authenticate, app_2.ShortController.unlikeToque);
router.get("/toques/:id/comments", app_2.ShortController.getToqueComments);
router.post("/toques/:id/comments", auth_1.authenticate, app_2.ShortController.createToqueComment);
router.get("/toques/:id/context", app_2.ShortController.getToqueContext);
router.put("/toques/:id", auth_1.authenticate, auth_1.requireCreator, app_2.ShortController.update);
router.delete("/toques/:id", auth_1.authenticate, auth_1.requireCreator, app_2.ShortController.deleteToque);
router.get("/toques/:id", app_2.ShortController.getToqueById);
router.post("/ads", app_4.AdController.create);
router.get("/ads", app_4.AdController.getAds);
router.get("/ads/:id", app_4.AdController.getAdById);
