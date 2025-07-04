import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import { closeUserEventsQueue } from "./queue/userEvents";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "healthy" });
});

app.use("/", authRoutes);

// Error handling middleware should be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await closeUserEventsQueue();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await closeUserEventsQueue();
  process.exit(0);
});
