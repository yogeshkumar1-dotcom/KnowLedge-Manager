import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import transcriptionRoutes from "./routes/transcription.routes.js";
import taskRoutes from "./routes/task.routes.js";
import GrazittiRoutes from "./routes/grazittiRoutes.routes.js"
import { scheduleWeeklyStatusEmails } from "./utils/weeklyStatusMail.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api/v1/auth", authRoutes)
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/transcripts', transcriptionRoutes)
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/grazitti', GrazittiRoutes)

// Start the weekly email scheduler
scheduleWeeklyStatusEmails()

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack: err.stack,
    });
})
export default app;