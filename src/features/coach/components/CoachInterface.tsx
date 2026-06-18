'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import DOMPurify from 'isomorphic-dompurify';
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
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card/40 shadow-sm overflow-hidden h-[600px] max-h-[600px] w-full backdrop-blur-md dark:bg-card/25">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles size={13} className="text-emerald-500" />
            <span>Chat workspace</span>
          </h3>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
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
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/10"
      >
        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}>
                <div className="h-14 w-2/3 rounded-xl bg-muted/40" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-5">
            <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-500">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2 max-w-sm">
              <h4 className="text-sm font-bold text-foreground">Meet EcoGuide Coach</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your conversational carbon coach. Type below to ask habit recommendations or request tailored reduction action plans.
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
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} group/msg relative`}
                >
                  <div
                    className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm group ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-muted/60 text-foreground rounded-tl-none border border-border/40'
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
                        className="absolute top-2 right-2 opacity-0 group-hover/msg:opacity-100 focus-visible:opacity-100 p-1 rounded-lg bg-background border border-border/40 text-muted-foreground hover:text-foreground transition-all"
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
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{sanitizedHtml}</p>
                    )}

                    <span className="block mt-1 text-[9px] text-right opacity-60">
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
                <div className="rounded-2xl bg-muted/60 border border-border/40 px-4 py-3 text-muted-foreground rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-1.5" aria-label="EcoGuide is typing">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-500 flex items-center justify-between">
                <span>Error: {error.message}</span>
                <button
                  type="button"
                  onClick={() => {
                    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUserMsg) {
                      void sendMessage(lastUserMsg.content);
                    }
                  }}
                  className="underline hover:text-red-400 transition-colors font-medium ml-2"
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
        className="border-t border-border/60 bg-card/20 px-4 py-3 space-y-3"
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
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            aria-label="Ask EcoGuide coach"
            placeholder="Ask a question about your carbon footprint..."
            className="flex-1 min-h-[40px] max-h-[120px] rounded-xl border border-input bg-background/50 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-sans"
          />
          <button
            type="submit"
            aria-label="Send message to EcoGuide coach"
            disabled={isStreaming || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 h-10 w-10 text-white shadow transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground justify-center">
          <Info size={10} />
          <span>EcoGuide provides estimates and standard climate-tech recommendations.</span>
        </div>
      </form>
    </div>
  );
}
export default CoachInterface;
