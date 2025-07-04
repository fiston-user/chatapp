import { Queue } from 'bullmq';
import redisConnection from './connection';

// Define job types
export interface UserCreatedJobData {
  userId: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface UserUpdatedJobData {
  userId: string;
  email?: string;
  name?: string;
  updatedAt: Date;
}

// Create queues
export const userEventsQueue = new Queue('user-events', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep only 100 completed jobs
    removeOnFail: 50,      // Keep only 50 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
});

// Job publishing functions
export const publishUserCreated = async (userData: UserCreatedJobData) => {
  try {
    const job = await userEventsQueue.add('user.created', userData, {
      priority: 10, // High priority for user creation
    });
    
    console.log(`📤 Published user.created event for user ${userData.userId}`, {
      jobId: job.id,
      userData,
    });
    
    return job;
  } catch (error) {
    console.error('❌ Failed to publish user.created event:', error);
    throw error;
  }
};

export const publishUserUpdated = async (userData: UserUpdatedJobData) => {
  try {
    const job = await userEventsQueue.add('user.updated', userData, {
      priority: 5, // Medium priority for user updates
    });
    
    console.log(`📤 Published user.updated event for user ${userData.userId}`, {
      jobId: job.id,
      userData,
    });
    
    return job;
  } catch (error) {
    console.error('❌ Failed to publish user.updated event:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeUserEventsQueue = async () => {
  await userEventsQueue.close();
  console.log('🔒 User events queue closed');
};