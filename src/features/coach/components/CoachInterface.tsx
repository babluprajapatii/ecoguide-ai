'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useCoach } from '@/features/coach/hooks/useCoach';
import { SuggestedPrompts } from './SuggestedPrompts';

interface CoachInterfaceProps {
  /** User's highest footprint category from assessment database */
  readonly highestCategory?: string;
}

/**
 * Basic markdown-to-HTML parser.
 * Supports bold, italics, inline code, code blocks, bullet points, and numbered lists.
 */
function parseMarkdownToHtml(text: string): string {
  let html = text;

  // 1. Escaping basic HTML to prevent injection before parsing markdown tags
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Code blocks (```code```)
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-slate-900 dark:bg-slate-950 text-slate-100 p-3 rounded-lg my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>',
  );

  // 3. Inline code (`code`)
  html = html.replace(
    /`([^`\n]+)`/g,
    '<code class="bg-slate-200 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>',
  );

  // 4. Bold (**text**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. Italic (*text*)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Bullet lists (- item)
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-5 list-disc my-1">$1</li>');

  // 7. Numbered lists (1. item)
  html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li class="ml-5 list-decimal my-1">$2</li>');

  // 8. Paragraphs and line breaks
  const lines = html.split(/\n\n+/);
  return lines
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';

      // If it contains list items or pre tags, don't wrap the block in a p tag
      if (trimmed.startsWith('<li') || trimmed.startsWith('<pre')) {
        return trimmed;
      }
      return `<p class="mb-3 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

/**
 * Sustainability Coach Interface Component.
 * Implements chat bubbles, typing indicators, auto-scroll, and accessibility constraints.
 */
export function CoachInterface({ highestCategory = 'default' }: CoachInterfaceProps) {
  const { messages, isStreaming, error, sendMessage, clearChat } = useCoach();
  const [input, setInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /** Scrolls the chat window to the bottom, checking client motion preferences */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'nearest' });
    }
  }, []);

  // Scroll on message length change or stream activity
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollToBottom(prefersReducedMotion ? 'auto' : 'smooth');
  }, [messages, isStreaming, scrollToBottom]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key press without Shift key (which behaves as a newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isStreaming) return;
    await sendMessage(prompt);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden h-[600px] max-h-[600px] w-full">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold text-foreground">Chat with EcoGuide</h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear Conversation
          </button>
        )}
      </div>

      {/* Message List Container */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-label="Conversation with EcoGuide"
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-medium text-foreground">Meet EcoGuide AI</h3>
              <p className="text-sm text-muted-foreground">
                Your personal sustainability assistant. Ask questions or select a prompt
                below to receive actionable tips focused on your highest-impact categories.
              </p>
            </div>

            <div className="w-full max-w-md pt-2">
              <SuggestedPrompts
                highestCategory={highestCategory}
                onSelectPrompt={handleSelectPrompt}
                disabled={isStreaming}
              />
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const rawHtml = isUser ? msg.content : parseMarkdownToHtml(msg.content);
              const sanitizedHtml = DOMPurify.sanitize(rawHtml);

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted text-foreground rounded-tl-none'
                    }`}
                  >
                    {!isUser ? (
                      <div
                        className="prose prose-slate dark:prose-invert prose-sm"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{sanitizedHtml}</p>
                    )}
                    <span className="block mt-1 text-[10px] text-right opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bouncing typing indicator */}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3 text-muted-foreground rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-1.5" aria-label="EcoGuide is typing">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between">
                <span>Error: {error.message}</span>
                <button
                  type="button"
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      void sendMessage(lastUserMsg.content);
                    }
                  }}
                  className="underline hover:text-destructive/80 transition-colors font-medium ml-2"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input container */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-card px-4 py-3 space-y-3"
      >
        {messages.length > 0 && (
          <div className="pt-1">
            <SuggestedPrompts
              highestCategory={highestCategory}
              onSelectPrompt={handleSelectPrompt}
              disabled={isStreaming}
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            aria-label="Send message to EcoGuide coach"
            placeholder="Type a message to your sustainability coach..."
            className="flex-1 min-h-[40px] max-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-primary h-10 w-10 text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
export default CoachInterface;
