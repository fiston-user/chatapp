import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import syncRoutes from './routes/sync';
import { errorHandler } from './middleware/errorHandler';
import { userEventWorker, closeUserEventWorker } from './queue/userEventProcessor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ service: 'user-service', status: 'healthy' });
});

app.use('/', userRoutes);
app.use('/', syncRoutes);

// Error handling middleware should be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
  console.log('🚀 User event worker started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await closeUserEventWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await closeUserEventWorker();
  process.exit(0);
});