import { z } from 'zod';

/**
 * Zod schema to validate individual chat messages in the conversation history.
 */
export const messageSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  createdAt: z.string().datetime().or(z.string().min(1)),
});

/**
 * Zod schema for validating the incoming payload on the Sustainability Coach API.
 * Ensures the message is <= 500 characters and the conversation history is <= 10 messages.
 */
export const coachRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty.')
    .max(500, 'Message must be at most 500 characters.'),
  conversationHistory: z.array(messageSchema).max(10, 'History cannot exceed 10 messages.'),
});

/** Typings derived from Zod schemas */
export type CoachRequestSchemaType = z.infer<typeof coachRequestSchema>;
export type MessageSchemaType = z.infer<typeof messageSchema>;
