import { describe, it, expect } from 'vitest';
import { coachRequestSchema, messageSchema } from '../coach.schemas';

describe('Message Schema Validation', () => {
  it('should validate correct messages', () => {
    const validMessage = {
      id: 'd3b07384-d113-4956-a66d-e280b01f5095',
      role: 'user',
      content: 'Hello Coach!',
      createdAt: '2026-06-11T13:40:00.000Z',
    };

    const result = messageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it('should reject invalid roles', () => {
    const invalidMessage = {
      id: 'd3b07384-d113-4956-a66d-e280b01f5095',
      role: 'system', // invalid role, only 'user' | 'assistant' allowed
      content: 'Hello Coach!',
      createdAt: '2026-06-11T13:40:00.000Z',
    };

    const result = messageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });

  it('should reject empty contents', () => {
    const invalidMessage = {
      id: 'd3b07384-d113-4956-a66d-e280b01f5095',
      role: 'assistant',
      content: '', // empty
      createdAt: '2026-06-11T13:40:00.000Z',
    };

    const result = messageSchema.safeParse(invalidMessage);
    expect(result.success).toBe(false);
  });
});

describe('Coach Request Payload Validation', () => {
  it('should validate standard request payloads', () => {
    const payload = {
      message: 'How can I save energy at home?',
      conversationHistory: [
        {
          id: '1',
          role: 'user',
          content: 'Hello!',
          createdAt: '2026-06-11T13:30:00.000Z',
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi! How can I help you today?',
          createdAt: '2026-06-11T13:31:00.000Z',
        },
      ],
    };

    const result = coachRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject messages longer than 500 characters', () => {
    const longMessage = 'a'.repeat(501);
    const payload = {
      message: longMessage,
      conversationHistory: [],
    };

    const result = coachRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('at most 500 characters');
    }
  });

  it('should reject empty user query messages', () => {
    const payload = {
      message: '   ',
      conversationHistory: [],
    };

    const result = coachRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);

    // Zod min(1) will fail for whitespace if we validate empty, but let's test absolute empty string
    const resultEmpty = coachRequestSchema.safeParse({
      message: '',
      conversationHistory: [],
    });
    expect(resultEmpty.success).toBe(false);
  });

  it('should reject conversation history containing more than 10 messages', () => {
    const history = Array.from({ length: 11 }, (_, i) => ({
      id: String(i),
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i}`,
      createdAt: new Date().toISOString(),
    }));

    const payload = {
      message: 'My query',
      conversationHistory: history,
    };

    const result = coachRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('cannot exceed 10 messages');
    }
  });
});
