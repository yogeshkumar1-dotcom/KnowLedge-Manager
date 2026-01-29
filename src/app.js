import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import audioRoutes from "./routes/audio.routes.js";
import transcriptionRoutes from "./routes/transcription.routes.js";
import taskRoutes from "./routes/task.routes.js";
import GrazittiRoutes from "./routes/grazittiRoutes.routes.js"
import { scheduleWeeklyStatusEmails } from "./utils/weeklyStatusMail.js";
import cors from "cors";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors(
    {origin: "*"}
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// Serve React static files with correct paths
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use('/assets', express.static(path.join(frontendDistPath, "assets")));
app.use(express.static(frontendDistPath));

app.use("/api/v1/auth", authRoutes)
app.use('/api/v1/upload', audioRoutes);
app.use('/api/v1/transcripts', transcriptionRoutes)
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/grazitti', GrazittiRoutes)

// Start the weekly email scheduler
scheduleWeeklyStatusEmails()

// Serve React app for all non-API routes (must be after API routes)
app.use((req, res, next) => {
  // Skip if it's an API route
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = path.join(frontendDistPath, 'index.html');
  console.log('Serving React app from:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving React app:', err);
      res.status(500).send('Error loading the application. Please make sure the frontend is built.');
    }
  });
});

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        stack: err.stack,
    });
})
export default app;