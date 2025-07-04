import express from "express";
import dotenv from "dotenv";
import chatRoutes from "./routes/chats";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "chat-service", status: "healthy" });
});

app.use("/", chatRoutes);

// Error handling middleware should be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});
