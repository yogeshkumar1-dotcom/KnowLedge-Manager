import express from "express";
import { googleAuthCallback, googleAuthUrl, getCurrentUser, logout, getGoogleDriveToken } from "../controllers/auth.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.get("/google", googleAuthUrl);
router.get("/google/callback", googleAuthCallback);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);
router.get("/google-drive-token", authMiddleware, getGoogleDriveToken);

export default router;