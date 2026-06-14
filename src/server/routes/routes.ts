import { Router, Request, Response } from "express";
import multer from "multer";
import { PostController } from "../controllers/app";
import { ShortController } from "../controllers/app";
import { AuthController } from "../controllers/app";
import { AdController } from "../controllers/ad/app";
import { authenticate } from "../middlewares/auth";
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
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
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        logout: "POST /auth/logout",
        me: "GET /auth/me",
        username: "GET /auth/username?username=:username",
        profileImages: "POST /auth/profile-images",
      },
    },
  });
});

/* ================================
 * AUTH
 * ================================ */
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.get("/auth/username", AuthController.checkUsername);
router.get("/auth/me", authenticate, AuthController.getMe);
router.post(
  "/auth/profile-images",
  authenticate,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  AuthController.uploadProfileImages
);

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
