'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Check, Send } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ChatMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  isCustom?: boolean;
}

export function AICoachPreview() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: "⚡ **Peak Alert:** Your area's electricity demand peaks between 6–8 PM tonight. I recommend pre-cooling your home now to save on your bill.",
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Set your thermostat to 72°F before 5 PM, then raise to 76°F during peak hours. Estimated savings: **$3.20 tonight** 🌿',
    },
    {
      id: 3,
      sender: 'user',
      text: 'Apply that setting please! 👍',
    },
    {
      id: 4,
      sender: 'ai',
      text: "✅ Done! Nest Thermostat schedule updated. I'll also shift your dishwasher to off-peak hours. You're on track to save **$47 this month**!",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageId = Date.now();
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: inputText,
      isCustom: true,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText('');
    setIsTyping(true);

    // AI Coach reply simulation after 1.5 seconds
    setTimeout(() => {
      setIsTyping(false);
      const aiReply: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `🌱 Thanks for asking! By shifting high-power usage to off-peak hours or optimizing your home temperature settings, you can expect to save around **$12–$25 per month** and offset **180 lbs of CO₂**! Let me know if you want me to automate this in your Nest or Ecobee settings.`,
        isCustom: true,
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1500);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  /**
   * Handles the "Meet My AI Coach" CTA:
   * - Authenticated users go directly to /coach
   * - Unauthenticated users are sent to /login?redirectTo=/coach
   */
  const handleMeetCoach = () => {
    if (user) {
      router.push('/coach');
    } else {
      router.push('/login?redirectTo=%2Fcoach');
    }
  };

  return (
    <section
      id="ai-coach"
      className="relative overflow-hidden border-t border-eco-500/10 bg-dark-900 py-20 md:py-32"
    >
      <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-eco-500/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Product Info */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-eco-400">
              AI Coach
            </span>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-white md:text-4xl">
              Personalized Carbon Coaching, <span className="text-gradient">Available 24/7</span>
            </h2>
            <p className="mt-5 font-light leading-relaxed text-stone-400">
              Your AI sustainability coach connects to utility APIs and smart appliances to deliver
              real-time, personalized energy-saving pathways. It learns your patterns and
              proactively suggests actions.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-eco-500/10">
                  <Check className="h-4 w-4 text-eco-400" />
                </div>
                <span className="text-sm font-light text-stone-300">
                  Proactive peak-hour alerts & recommendations
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-eco-500/10">
                  <Check className="h-4 w-4 text-eco-400" />
                </div>
                <span className="text-sm font-light text-stone-300">
                  Smart thermostat & appliance automation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-eco-500/10">
                  <Check className="h-4 w-4 text-eco-400" />
                </div>
                <span className="text-sm font-light text-stone-300">
                  Utility bill optimization & ROI tracking
                </span>
              </div>
            </div>

            <button
              onClick={handleMeetCoach}
              className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              aria-label="Meet My AI Coach"
            >
              <Bot className="h-4 w-4" />
              <span>Meet My AI Coach</span>
            </button>
          </div>

          {/* Right: Chat UI Simulator */}
          <div className="w-full">
            <div className="glass-card overflow-hidden rounded-2xl border border-eco-500/15 shadow-2xl">
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-eco-500/10 bg-dark-800/50 px-6 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-eco-400 to-eco-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">EcoGuide AI Coach</p>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-eco-400" />
                    <span className="text-xs font-medium text-eco-400">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                className="h-[350px] space-y-4 overflow-y-auto px-6 py-5"
                aria-label="Coach conversation history"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-500/20">
                        <Bot className="h-4 w-4 text-eco-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'rounded-tr-sm bg-eco-600/30 text-eco-200'
                          : 'rounded-tl-sm bg-dark-600/80 text-stone-300'
                      }`}
                    >
                      <p
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(
                            msg.text
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                              .replace(/\* (.*?):/g, ' <strong class="text-eco-400">$1:</strong>'),
                          ),
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-500/20">
                      <Bot className="h-4 w-4 text-eco-400" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-dark-600/80 px-4 py-3 text-stone-300">
                      <div
                        className="typing-indicator flex h-4 items-center"
                        aria-label="AI Coach is typing"
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-eco-500/10 bg-dark-800/30 px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <label htmlFor="coach-message-input" className="sr-only">
                    Ask a question to your AI Coach
                  </label>
                  <input
                    id="coach-message-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your AI coach..."
                    className="flex-1 rounded-full border border-eco-500/15 bg-dark-700/80 px-4 py-2.5 text-sm text-white placeholder-stone-500 transition-all focus:border-eco-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-eco-500 transition-colors hover:bg-eco-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
