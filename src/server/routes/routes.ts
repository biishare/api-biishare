import { Router, Request, Response } from "express";
import multer from "multer";
import { PostController } from "../controllers/app";
import { ShortController } from "../controllers/app";
import { AuthController } from "../controllers/app";
import { AdController } from "../controllers/ad/app";
import { authenticate, requireCreator } from "../middlewares/auth";

const router = Router();
const profileImageUpload = multer({
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

const publicationMediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 80 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const mimetype = file.mimetype.toLowerCase();
    const name = file.originalname.toLowerCase();
    const isAllowed =
      mimetype.startsWith("image/") ||
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

router.get("/", (req: Request, res: Response) => {
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

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/logout", AuthController.logout);
router.get("/auth/username", AuthController.checkUsername);
router.get("/auth/me", authenticate, AuthController.getMe);
router.patch("/auth/preferred-locale", authenticate, AuthController.updatePreferredLocale);
router.post(
  "/auth/creator-application",
  authenticate,
  profileImageUpload.single("verificationPhoto"),
  AuthController.applyCreatorApplication
);
router.get("/auth/google", AuthController.googleAuth);
router.get("/auth/google/callback", AuthController.googleCallback);
router.get("/auth/facebook", AuthController.facebookAuth);
router.get("/auth/facebook/callback", AuthController.facebookCallback);
router.post(
  "/auth/profile-images",
  authenticate,
  profileImageUpload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  AuthController.uploadProfileImages
);

router.post("/posts/media", authenticate, requireCreator, publicationMediaUpload.single("file"), PostController.uploadPublicationMedia);
router.get("/posts/filters", PostController.getPostFilters);
router.get("/posts/mine", authenticate, PostController.getMyPosts);
router.get("/posts", PostController.getPosts);
router.get("/posts/saved", authenticate, PostController.getSavedPosts);
router.get("/posts/:id/save", authenticate, PostController.getSavedPostStatus);
router.post("/posts/:id/save", authenticate, PostController.savePost);
router.delete("/posts/:id/save", authenticate, PostController.deleteSavedPost);
router.get("/posts/:id", PostController.getPostById);
router.post("/posts", authenticate, requireCreator, PostController.create);
router.put("/posts/:postId", authenticate, requireCreator, PostController.update);
router.delete("/posts/:id", authenticate, requireCreator, PostController.deletePost);

router.post("/toques", authenticate, requireCreator, ShortController.create);
router.get("/toques/mine", authenticate, ShortController.getMyToques);
router.get("/toques", ShortController.getShorts);
router.get("/toques/saved", authenticate, ShortController.getSavedToques);
router.get("/toques/:id/save", authenticate, ShortController.getSavedToqueStatus);
router.post("/toques/:id/save", authenticate, ShortController.saveToque);
router.delete("/toques/:id/save", authenticate, ShortController.deleteSavedToque);
router.get("/toques/:id/social", ShortController.getToqueSocialSummary);
router.post("/toques/:id/like", authenticate, ShortController.likeToque);
router.delete("/toques/:id/like", authenticate, ShortController.unlikeToque);
router.get("/toques/:id/comments", ShortController.getToqueComments);
router.post("/toques/:id/comments", authenticate, ShortController.createToqueComment);
router.get("/toques/:id/context", ShortController.getToqueContext);
router.put("/toques/:id", authenticate, requireCreator, ShortController.update);
router.delete("/toques/:id", authenticate, requireCreator, ShortController.deleteToque);
router.get("/toques/:id", ShortController.getToqueById);

router.post("/ads", AdController.create);
router.get("/ads", AdController.getAds);
router.get("/ads/:id", AdController.getAdById);

export { router };
