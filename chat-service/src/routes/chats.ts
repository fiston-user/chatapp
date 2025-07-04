import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  validateCreateChat, 
  validateSendMessage, 
  validateAddUserToChat, 
  validateChatId, 
  validatePagination 
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new chat room
router.post('/rooms', authenticateToken, validateCreateChat, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, type = 'GROUP' } = req.body;

  const chat = await prisma.chat.create({
    data: {
      name,
      type,
      chatUsers: {
        create: {
          userId: req.user!.userId
        }
      }
    },
    include: {
      chatUsers: true,
      _count: {
        select: { messages: true, chatUsers: true }
      }
    }
  });

  res.status(201).json({ message: 'Chat room created', chat });
}));

// Get user's chat rooms
router.get('/rooms', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userChats = await prisma.chatUser.findMany({
    where: { userId: req.user!.userId },
    include: {
      chat: {
        include: {
          _count: {
            select: { messages: true, chatUsers: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              createdAt: true,
              userId: true
            }
          }
        }
      }
    }
  });

  const chats = userChats.map(uc => ({
    ...uc.chat,
    lastMessage: uc.chat.messages[0] || null
  }));

  res.json({ chats });
}));

// Get specific chat room details
router.get('/rooms/:chatId', authenticateToken, validateChatId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;

  // Verify user is member of this chat
  const chatUser = await prisma.chatUser.findFirst({
    where: {
      chatId,
      userId: req.user!.userId
    }
  });

  if (!chatUser) {
    return res.status(403).json({ error: 'Access denied to this chat' });
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      chatUsers: true,
      _count: {
        select: { messages: true, chatUsers: true }
      }
    }
  });

  res.json({ chat });
}));

// Add user to chat room
router.post('/rooms/:chatId/users', authenticateToken, validateChatId, validateAddUserToChat, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  // Verify requester is member of this chat
  const requesterMembership = await prisma.chatUser.findFirst({
    where: {
      chatId,
      userId: req.user!.userId
    }
  });

  if (!requesterMembership) {
    return res.status(403).json({ error: 'Access denied to this chat' });
  }

  // Check if user is already a member
  const existingMembership = await prisma.chatUser.findFirst({
    where: { chatId, userId }
  });

  if (existingMembership) {
    return res.status(400).json({ error: 'User is already a member of this chat' });
  }

  const chatUser = await prisma.chatUser.create({
    data: { chatId, userId }
  });

  res.status(201).json({ message: 'User added to chat', chatUser });
}));

// Send a message to chat room
router.post('/rooms/:chatId/messages', authenticateToken, validateChatId, validateSendMessage, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const { content } = req.body;

  // Verify user is member of this chat
  const chatUser = await prisma.chatUser.findFirst({
    where: {
      chatId,
      userId: req.user!.userId
    }
  });

  if (!chatUser) {
    return res.status(403).json({ error: 'Access denied to this chat' });
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      userId: req.user!.userId,
      chatId
    }
  });

  res.status(201).json({ message: 'Message sent', data: message });
}));

// Get messages from chat room
router.get('/rooms/:chatId/messages', authenticateToken, validateChatId, validatePagination, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;
  const { page = '1', limit = '50' } = req.query;

  // Verify user is member of this chat
  const chatUser = await prisma.chatUser.findFirst({
    where: {
      chatId,
      userId: req.user!.userId
    }
  });

  if (!chatUser) {
    return res.status(403).json({ error: 'Access denied to this chat' });
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limitNum,
    select: {
      id: true,
      content: true,
      userId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const totalMessages = await prisma.message.count({
    where: { chatId }
  });

  res.json({
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalMessages,
      pages: Math.ceil(totalMessages / limitNum)
    }
  });
}));

// Leave chat room
router.delete('/rooms/:chatId/leave', authenticateToken, validateChatId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { chatId } = req.params;

  const deleted = await prisma.chatUser.deleteMany({
    where: {
      chatId,
      userId: req.user!.userId
    }
  });

  if (deleted.count === 0) {
    return res.status(404).json({ error: 'You are not a member of this chat' });
  }

  res.json({ message: 'Left chat successfully' });
}));

export default router;