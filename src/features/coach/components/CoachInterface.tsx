'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useCoach } from '@/features/coach/hooks/useCoach';
import { SuggestedPrompts } from './SuggestedPrompts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBadges } from '@/features/gamification/hooks/useBadges';
import { Sparkles, Trash2, Send, Copy, Check, Info } from 'lucide-react';

interface CoachInterfaceProps {
  /** User's highest footprint category from assessment database */
  readonly highestCategory?: string;
  /** Custom prompt callback to trigger chat sends from external widgets */
  readonly externalPromptTrigger?: string | null;
  readonly onClearExternalPrompt?: () => void;
}

/**
 * Basic markdown-to-HTML parser.
 * Supports bold, italics, inline code, code blocks, bullet points, and numbered lists.
 */
function parseMarkdownToHtml(text: string): string {
  let html = text;

  // 1. Escaping basic HTML to prevent injection before parsing markdown tags
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

export function CoachInterface({
  highestCategory = 'default',
  externalPromptTrigger = null,
  onClearExternalPrompt,
}: CoachInterfaceProps) {
  const { messages, isStreaming, error, sendMessage, clearChat, isLoadingHistory } = useCoach();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { user } = useAuth();
  const { refresh } = useBadges(user?.id ?? null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prevIsStreamingRef = useRef(false);

  // Automatically refresh badges/XP when the AI stops streaming its response
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      void refresh();
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, refresh]);

  // Handle external prompts (e.g. from ActionPlans or suggested prompts)
  useEffect(() => {
    if (externalPromptTrigger) {
      void sendMessage(externalPromptTrigger);
      if (onClearExternalPrompt) {
        onClearExternalPrompt();
      }
    }
  }, [externalPromptTrigger, sendMessage, onClearExternalPrompt]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'nearest' });
    }
  }, []);

  // Scroll on message change
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollToBottom(prefersReducedMotion ? 'auto' : 'smooth');
  }, [messages, isStreaming, scrollToBottom]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    // Auto-focus input text area back after send
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleSelectPrompt = async (prompt: string) => {
    if (isStreaming) return;
    await sendMessage(prompt);
  };

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[600px] max-h-[600px] w-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-sm backdrop-blur-md dark:bg-card/25">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
            <Sparkles size={13} className="text-emerald-500" />
            <span>Chat workspace</span>
          </h3>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground transition-colors hover:text-red-500"
          >
            <Trash2 size={12} />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Message List Container */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-label="Conversation with EcoGuide Coach"
        aria-live="polite"
        className="flex-1 space-y-4 overflow-y-auto bg-background/10 p-4"
      >
        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}
              >
                <div className="h-14 w-2/3 rounded-xl bg-muted/40" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-5 p-6 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
              <Sparkles size={32} />
            </div>
            <div className="max-w-sm space-y-2">
              <h4 className="text-sm font-bold text-foreground">Meet EcoGuide Coach</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your conversational carbon coach. Type below to ask habit recommendations or request
                tailored reduction action plans.
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
              const sanitizedHtml = isUser ? '' : sanitizeHtml(parseMarkdownToHtml(msg.content));

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} group/msg relative`}
                >
                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                      isUser
                        ? 'rounded-tr-none bg-emerald-600 text-white'
                        : 'rounded-tl-none border border-border/40 bg-muted/60 text-foreground'
                    }`}
                  >
                    <span className="sr-only">
                      {isUser ? 'Message from user' : 'Message from EcoGuide AI'}
                    </span>
                    {/* Copy Button for Coach Answers */}
                    {!isUser && msg.content && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        aria-label="Copy response text"
                        className="absolute right-2 top-2 rounded-lg border border-border/40 bg-background p-1 text-muted-foreground opacity-0 transition-all hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100"
                      >
                        {copiedId === msg.id ? (
                          <Check size={11} className="text-emerald-500" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}

                    {!isUser ? (
                      <div
                        className="prose prose-emerald dark:prose-invert prose-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml as string }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}

                    <span className="mt-1 block text-right text-[9px] opacity-60">
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
                <div className="rounded-2xl rounded-tl-none border border-border/40 bg-muted/60 px-4 py-3 text-muted-foreground shadow-sm">
                  <div className="flex items-center gap-1.5" aria-label="EcoGuide is typing">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500">
                <span>Error: {error.message}</span>
                <button
                  type="button"
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      void sendMessage(lastUserMsg.content);
                    }
                  }}
                  className="ml-2 font-medium underline transition-colors hover:text-red-400"
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
        className="space-y-3 border-t border-border/60 bg-card/20 px-4 py-3"
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

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            aria-label="Ask EcoGuide coach"
            placeholder="Ask a question about your carbon footprint..."
            className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-input bg-background/50 px-3 py-2 font-sans text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message to EcoGuide coach"
            disabled={isStreaming || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
          <Info size={10} />
          <span>EcoGuide provides estimates and standard climate-tech recommendations.</span>
        </div>
      </form>
    </div>
  );
}
export default CoachInterface;
