import express from "express";
import { uploadFiles } from "../controllers/uploads.controllers.js";
import upload from "../utils/audioMulter.js";
import { createTranscript } from "../controllers/transcription.controllers.js";

const router = express.Router();

// Test endpoint to check if upload service is working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload service is running",
    timestamp: new Date().toISOString()
  });
});

// Main upload route that handles both video and audio
// 1. Multer processes the files and saves in memory
// 2. uploadFiles handles Supabase upload (and video-to-audio extraction if needed)
// 3. createTranscript handles AI transcription and analysis
router.post("/file", (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
        errors: [err.message]
      });
    }
    next();
  });
}, uploadFiles, createTranscript);

export default router;
