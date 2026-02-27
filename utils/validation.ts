// backend/utils/validation.ts
// Input validation using Zod

import { z } from 'zod';

// Chat message validation
export const chatMessageSchema = z.object({
  chat_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  role: z.enum(['user', 'assistant']),
});

// Report upload validation
export const reportUploadSchema = z.object({
  title: z.string().min(1).max(255),
  file_size_bytes: z.number().positive(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
});

// Health metric validation (for API input)
export const healthMetricSchema = z.object({
  user_id: z.string().uuid(),
  heartRate: z.number().min(30).max(200).optional(),
  oxygen: z.number().min(70).max(100).optional(),
  temperature: z.number().min(35).max(42).optional(),
  bloodPressure: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Create chat validation
export const createChatSchema = z.object({
  title: z.string().optional(),
  medical_context: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ReportUpload = z.infer<typeof reportUploadSchema>;
export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type CreateChat = z.infer<typeof createChatSchema>;
