import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/config.js";

const HOST = '127.0.0.1'
const PORT = config.PORT;
const MONGO_URI = config.MONGO_URI;

// Start server immediately
app.listen(PORT, () => {
  console.log(`Server is running on ${config.BACKEND_URL}`);
});

// Connect to database separately
connectDB(MONGO_URI).then(() => {
  console.log("Database connected successfully");
}).catch((error) => {
  console.error("Failed to connect to the database:", error);
});