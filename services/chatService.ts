// backend/services/chatService.ts
// Chat management and persistence

import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export interface ChatMessage {
  id?: string;
  chat_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  created_at?: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title?: string;
  medical_context?: string;
  created_at?: string;
  updated_at?: string;
  is_archived: boolean;
}

export class ChatService {
  /**
   * Create new chat session
   */
  async createChat(
    userId: string,
    title?: string,
    medicalContext?: string
  ): Promise<Chat | null> {
    try {
      const { data, error } = await supabase.from('chats').insert([
        {
          user_id: userId,
          title: title || `Chat ${new Date().toLocaleDateString()}`,
          medical_context: medicalContext,
          is_archived: false,
        },
      ]).select().single();

      if (error) {
        logger.error('Failed to create chat', error as Error, userId);
        return null;
      }

      logger.info('Chat created', { chatId: data.id }, userId);
      return data as Chat;
    } catch (error) {
      logger.error('Chat creation error', error as Error, userId);
      return null;
    }
  }

  /**
   * Get user's chats
   */
  async getUserChats(userId: string, limit = 20): Promise<Chat[]> {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch chats', error as Error, userId);
        return [];
      }

      return data as Chat[];
    } catch (error) {
      logger.error('Fetch chats error', error as Error, userId);
      return [];
    }
  }

  /**
   * Get chat messages with limit
   */
  async getChatMessages(chatId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch messages', error as Error);
        return [];
      }

      return data as ChatMessage[];
    } catch (error) {
      logger.error('Fetch messages error', error as Error);
      return [];
    }
  }

  /**
   * Save message to database
   */
  async saveMessage(
    chatId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    tokensUsed?: number
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase.from('messages').insert([
        {
          chat_id: chatId,
          user_id: userId,
          role,
          content,
          tokens_used: tokensUsed,
        },
      ]).select().single();

      if (error) {
        logger.error('Failed to save message', error as Error, userId);
        return null;
      }

      return data as ChatMessage;
    } catch (error) {
      logger.error('Save message error', error as Error, userId);
      return null;
    }
  }

  /**
   * Get conversation context (for AI)
   */
  async getConversationContext(
    chatId: string,
    maxMessages = 20
  ): Promise<{ role: string; content: string }[]> {
    const messages = await this.getChatMessages(chatId, maxMessages);
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Archive chat
   */
  async archiveChat(chatId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_archived: true })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to archive chat', error as Error, userId);
        return false;
      }

      logger.info('Chat archived', { chatId }, userId);
      return true;
    } catch (error) {
      logger.error('Archive chat error', error as Error, userId);
      return false;
    }
  }

  /**
   * Delete chat
   */
  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to delete chat', error as Error, userId);
        return false;
      }

      logger.info('Chat deleted', { chatId }, userId);
      return true;
    } catch (error) {
      logger.error('Delete chat error', error as Error, userId);
      return false;
    }
  }

  /**
   * Update chat title
   */
  async updateChatTitle(chatId: string, userId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to update chat title', error as Error, userId);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Update chat title error', error as Error, userId);
      return false;
    }
  }
}

export const chatService = new ChatService();
