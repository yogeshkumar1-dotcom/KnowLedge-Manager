import express from "express";
import { getRecentTranscripts, getTranscript } from "../controllers/transcription.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";
const router = express.Router();

router.get("/", authMiddleware, getRecentTranscripts)
router.get("/:id", authMiddleware, getTranscript)

export default router;