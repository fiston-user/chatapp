import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import redisConnection from './connection';

const prisma = new PrismaClient();

// Define job data interfaces
interface UserCreatedJobData {
  userId: string;
  email: string;
  name?: string;
  createdAt: Date;
}

interface UserUpdatedJobData {
  userId: string;
  email?: string;
  name?: string;
  updatedAt: Date;
}

// Job processors
const processUserCreated = async (job: Job<UserCreatedJobData>) => {
  const { userId, email, name, createdAt } = job.data;
  
  console.log(`📥 Processing user.created event for user ${userId}`);
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      console.log(`ℹ️ User ${userId} already exists in user-service`);
      return { success: true, message: 'User already exists' };
    }

    // Create user in user-service database
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || null,
        createdAt: new Date(createdAt),
      },
    });

    console.log(`✅ Successfully created user ${userId} in user-service`);
    return { success: true, user };
  } catch (error) {
    console.error(`❌ Failed to process user.created for ${userId}:`, error);
    throw error; // This will mark the job as failed and trigger retry
  }
};

const processUserUpdated = async (job: Job<UserUpdatedJobData>) => {
  const { userId, email, name, updatedAt } = job.data;
  
  console.log(`📥 Processing user.updated event for user ${userId}`);
  
  try {
    // Update user in user-service database
    const updateData: any = {
      updatedAt: new Date(updatedAt),
    };
    
    if (email) updateData.email = email;
    if (name !== undefined) updateData.name = name;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`✅ Successfully updated user ${userId} in user-service`);
    return { success: true, user };
  } catch (error) {
    console.error(`❌ Failed to process user.updated for ${userId}:`, error);
    throw error; // This will mark the job as failed and trigger retry
  }
};

// Create worker
export const userEventWorker = new Worker(
  'user-events',
  async (job: Job) => {
    switch (job.name) {
      case 'user.created':
        return await processUserCreated(job as Job<UserCreatedJobData>);
      case 'user.updated':
        return await processUserUpdated(job as Job<UserUpdatedJobData>);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Worker event handlers
userEventWorker.on('completed', (job: Job) => {
  console.log(`🎉 Job ${job.id} (${job.name}) completed successfully`);
});

userEventWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`💥 Job ${job?.id} (${job?.name}) failed:`, err.message);
});

userEventWorker.on('error', (err: Error) => {
  console.error('❌ Worker error:', err);
});

// Graceful shutdown
export const closeUserEventWorker = async () => {
  await userEventWorker.close();
  console.log('🔒 User event worker closed');
};