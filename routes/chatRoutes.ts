// backend/routes/chatRoutes.ts
// Chat API endpoints

import { Router, Response } from 'express';
import { chatService } from '../services/chatService';
import { geminiService } from '../services/geminiService';
import { chatMessageSchema } from '../utils/validation';
import { verifyAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// All chat routes require authentication
router.use(verifyAuth);

/**
 * POST /api/chats - Create new chat
 */
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, medical_context } = req.body;
    const userId = req.user!.id;

    const chat = await chatService.createChat(userId, title, medical_context);

    if (!chat) {
      return res.status(500).json({ error: 'Failed to create chat' });
    }

    res.status(201).json(chat);
  })
);

/**
 * GET /api/chats - Get user's chats
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const chats = await chatService.getUserChats(userId, limit);
    res.json(chats);
  })
);

/**
 * GET /api/chats/:chatId - Get single chat with messages
 */
router.get(
  '/:chatId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;

    const messages = await chatService.getChatMessages(chatId, 50);
    res.json({ chat_id: chatId, messages });
  })
);

/**
 * POST /api/chats/:chatId/messages - Send message to chat
 */
router.post(
  '/:chatId/messages',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { content, medical_context } = req.body;
    const userId = req.user!.id;

    // Validate input
    const validation = chatMessageSchema.safeParse({
      chat_id: chatId,
      content,
      role: 'user',
    });

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    // Save user message
    const userMessage = await chatService.saveMessage(chatId, userId, 'user', content);

    if (!userMessage) {
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Get conversation context for AI
    const conversationContext = await chatService.getConversationContext(chatId, 20);

    // Generate AI response
    let aiResponse: string;
    try {
      aiResponse = await geminiService.chat(content, medical_context);
    } catch (error) {
      logger.error('Gemini service error', error as Error, userId);
      aiResponse = 'Sorry, I encountered an error processing your request. Please try again.';
    }

    // Save assistant response
    const assistantMessage = await chatService.saveMessage(
      chatId,
      userId,
      'assistant',
      aiResponse
    );

    res.json({
      userMessage,
      assistantMessage,
    });
  })
);

/**
 * PUT /api/chats/:chatId - Update chat title
 */
router.put(
  '/:chatId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user!.id;

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const success = await chatService.updateChatTitle(chatId, userId, title);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update chat' });
    }

    res.json({ success: true });
  })
);

/**
 * DELETE /api/chats/:chatId - Delete chat
 */
router.delete(
  '/:chatId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user!.id;

    const success = await chatService.deleteChat(chatId, userId);

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete chat' });
    }

    res.json({ success: true });
  })
);

export default router;
