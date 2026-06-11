'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Message } from '@/features/coach/types/coach.types';

export interface UseCoachReturn {
  /** Chat messages history shown in the UI. */
  messages: Message[];
  /** Indicates if a response is currently streaming from the backend. */
  isStreaming: boolean;
  /** Current error state, if any API request failed. */
  error: Error | null;
  /** Sends a new chat message to the coaching API. */
  sendMessage: (text: string) => Promise<void>;
  /** Clears the chat message log and resets error state. */
  clearChat: () => void;
}

/**
 * Custom hook for interacting with the Sustainability Coach API.
 * Handles request aborting, message history slicing, and streaming decode chunks.
 */
export function useCoach(): UseCoachReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      // Reset error, set loading states
      setError(null);
      setIsStreaming(true);

      // Abort any ongoing request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 1. Construct user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmedText,
        createdAt: new Date().toISOString(),
      };

      // 2. Prepare conversation history (keep last 5 exchanges, max 10 messages)
      // Filter out temporary empty messages if they exist
      const activeMessages = messages.filter((m) => m.content.length > 0);
      const conversationHistory = activeMessages.slice(-10);

      // Add user message to UI state immediately
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmedText,
            conversationHistory,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Server responded with ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response stream is not readable.');
        }

        const decoder = new TextDecoder('utf-8');

        // Create an empty assistant message template in state
        const assistantMessageId = crypto.randomUUID();
        const assistantPlaceholder: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantPlaceholder]);

        let accumulatedContent = '';

        let isReading = true;
        while (isReading) {
          const { done, value } = await reader.read();
          if (done) {
            isReading = false;
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // Reactively update the assistant message content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg,
            ),
          );
        }
      } catch (err: unknown) {
        // Ignore AbortController signal cancel exceptions
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('[useCoach] Failed to send message:', err);
        const resolvedError = err instanceof Error ? err : new Error('An unknown error occurred.');
        setError(resolvedError);
      } finally {
        // Turn off streaming loader if it's the active request
        if (abortControllerRef.current === abortController) {
          setIsStreaming(false);
          abortControllerRef.current = null;
        }
      }
    },
    [messages],
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
  };
}
export default useCoach;
