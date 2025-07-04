import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateUpdateProfile, validateUserId } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// Update user profile
router.put('/profile', authenticateToken, validateUpdateProfile, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, avatar } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { 
      ...(name && { name }),
      ...(avatar && { avatar })
    },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true }
  });

  res.json({ message: 'Profile updated successfully', user: updatedUser });
}));

// Get user by ID (for other services)
router.get('/:userId', authenticateToken, validateUserId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// Search users by email or name
router.get('/search/:query', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.params;
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: { id: true, email: true, name: true, avatar: true },
    take: 10 // Limit results
  });

  res.json({ users });
}));

export default router;