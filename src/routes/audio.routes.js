import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import { uploadFiles } from "../controllers/uploads.controllers.js";
import upload from "../utils/audioMulter.js";
import { createTranscript } from "../controllers/transcription.controllers.js";
import { uploadFromGoogleDrive, downloadOriginalAndProcess } from "../controllers/googleDrive.controllers.js";
import { processUploadedVideo, downloadVideo } from "../controllers/uploadsProcessor.controllers.js";
import authMiddleware from "../middlewares/auth.middlewares.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

const router = express.Router();
router.get("/test", (req, res) => {
  res.json({ message: "Audio routes are working!" });
});
router.post("/file", upload.single("file"), uploadFiles, createTranscript);
router.post("/files", upload.array("files", 10), uploadFiles);
router.post("/google-drive", authMiddleware, uploadFromGoogleDrive);

// Process uploaded video: extract audio → Assembly AI → Gemini LLM
router.get("/uploads/:fileName/process", authMiddleware, processUploadedVideo);

// Download original from Google Drive into uploads/ and start processing
router.post("/uploads/:fileName", authMiddleware, downloadOriginalAndProcess);

// Download video file directly (without processing)
router.get("/uploads/:fileName", downloadVideo);

export default router;
