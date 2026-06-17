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
  /** Clears the chat message log and resets error state in both client and DB. */
  clearChat: () => void;
  /** Indicates if initial history is being loaded. */
  isLoadingHistory: boolean;
}

/**
 * Custom hook for interacting with the Sustainability Coach API.
 * Synchronizes client message state with PostgreSQL logs on the Supabase backend.
 */
export function useCoach(): UseCoachReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history from DB on mount
  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const res = await fetch('/api/coach/history');
        if (!res.ok) {
          throw new Error(`Failed to load history: ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          const mappedHistory: Message[] = (data || []).map((item: any, idx: number) => ({
            id: `history-${idx}-${item.created_at}`,
            role: item.role,
            content: item.message,
            createdAt: item.created_at,
          }));
          setMessages(mappedHistory);
        }
      } catch (err) {
        console.error('[useCoach] Error loading conversation history:', err);
      } finally {
        if (active) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearChat = useCallback(() => {
    // Optimistic UI clear
    setMessages([]);
    setError(null);
    setIsStreaming(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Call DELETE API to sync database
    void fetch('/api/coach/history', { method: 'DELETE' }).catch((err) => {
      console.error('[useCoach] Failed to clear DB history:', err);
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      setError(null);
      setIsStreaming(true);

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

      // 2. Prepare conversation history (last 10 messages)
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
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('[useCoach] Failed to send message:', err);
        const resolvedError = err instanceof Error ? err : new Error('An unknown error occurred.');
        setError(resolvedError);
      } finally {
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
    isLoadingHistory,
  };
}
export default useCoach;
