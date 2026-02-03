import express from "express";
import {  getInterview, getRecentInterviews } from "../controllers/transcription.controllers.js";
const router = express.Router();

router.get("/", getRecentInterviews)
router.get("/:id", getInterview)

export default router;