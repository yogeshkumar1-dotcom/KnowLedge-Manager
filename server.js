import app from "./src/app.js";

import { connectDB } from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();
// const HOST = '172.16.5.3'
// const HOST = '10.49.33.16' by me
const HOST = '127.0.0.1'
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/knowledge_manager";

// Start server immediately
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Connect to database separately
connectDB(MONGO_URI).then(() => {
  console.log("Database connected successfully");
}).catch((error) => {
  console.error("Failed to connect to the database:", error);
});