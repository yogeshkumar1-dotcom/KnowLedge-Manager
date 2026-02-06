import express from "express";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import audioRoutes from "./routes/audio.routes.js";
import transcriptionRoutes from "./routes/transcription.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import aiInterviewRoutes from "./routes/aiInterview.routes.js";
import { config } from "./config/config.js";
import cors from "cors";

const app = express();
app.use(cors({
    origin: [config.FRONTEND_URL, "http://127.0.0.1:5173", "http://localhost:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static("public"));

app.use("/api/v1/auth", authRoutes)
// app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/transcripts', transcriptionRoutes)
app.use('/api/v1/interviews', interviewRoutes)
app.use('/api/v1/ai-interviewer', aiInterviewRoutes);


app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack: err.stack,
    });
})
export default app;