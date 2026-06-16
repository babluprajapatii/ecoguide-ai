'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Bot, Check, Send } from 'lucide-react';

interface ChatMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  isCustom?: boolean;
}

export function AICoachPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: "⚡ **Peak Alert:** Your area's electricity demand peaks between 6–8 PM tonight. I recommend pre-cooling your home now to save on your bill.",
    },
    {
      id: 2,
      sender: 'ai',
      text: "Set your thermostat to 72°F before 5 PM, then raise to 76°F during peak hours. Estimated savings: **$3.20 tonight** 🌿",
    },
    {
      id: 3,
      sender: 'user',
      text: "Apply that setting please! 👍",
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

  const scrollToCTA = () => {
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="ai-coach" className="relative py-20 md:py-32 overflow-hidden bg-dark-900 border-t border-eco-500/10">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-eco-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Product Info */}
          <div>
            <span className="text-xs font-semibold text-eco-400 tracking-[0.2em] uppercase">
              AI Coach
            </span>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mt-3 text-white leading-tight">
              Personalized Carbon Coaching, <span className="text-gradient">Available 24/7</span>
            </h2>
            <p className="text-stone-400 mt-5 font-light leading-relaxed">
              Your AI sustainability coach connects to utility APIs and smart appliances to deliver real-time, personalized energy-saving pathways. It learns your patterns and proactively suggests actions.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-eco-500/10 flex items-center justify-center shrink-0">
                  <Check className="text-eco-400 w-4 h-4" />
                </div>
                <span className="text-stone-300 text-sm font-light">
                  Proactive peak-hour alerts & recommendations
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-eco-500/10 flex items-center justify-center shrink-0">
                  <Check className="text-eco-400 w-4 h-4" />
                </div>
                <span className="text-stone-300 text-sm font-light">
                  Smart thermostat & appliance automation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-eco-500/10 flex items-center justify-center shrink-0">
                  <Check className="text-eco-400 w-4 h-4" />
                </div>
                <span className="text-stone-300 text-sm font-light">
                  Utility bill optimization & ROI tracking
                </span>
              </div>
            </div>

            <button
              onClick={scrollToCTA}
              className="btn-primary mt-8 text-sm font-semibold text-white px-7 py-3.5 rounded-full tracking-wide inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            >
              <Bot className="w-4 h-4" />
              <span>Meet My AI Coach</span>
            </button>
          </div>

          {/* Right: Chat UI Simulator */}
          <div className="w-full">
            <div className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-eco-500/15">
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-eco-500/10 bg-dark-800/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center">
                  <Bot className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">EcoGuide AI Coach</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-eco-400 animate-pulse" />
                    <span className="text-xs text-eco-400 font-medium">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                className="px-6 py-5 space-y-4 h-[350px] overflow-y-auto"
                aria-label="Coach conversation history"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-7 h-7 rounded-full bg-eco-500/20 flex items-center justify-center shrink-0 mr-3 mt-1">
                        <Bot className="text-eco-400 w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-eco-600/30 rounded-tr-sm text-eco-200'
                          : 'bg-dark-600/80 rounded-tl-sm text-stone-300'
                      }`}
                    >
                      <p
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                            .replace(/\* (.*?):/g, ' <strong class="text-eco-400">$1:</strong>'),
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-eco-500/20 flex items-center justify-center shrink-0 mr-3 mt-1">
                      <Bot className="text-eco-400 w-4 h-4" />
                    </div>
                    <div className="bg-dark-600/80 rounded-2xl rounded-tl-sm px-4 py-3 text-stone-300">
                      <div className="typing-indicator flex items-center h-4" aria-label="AI Coach is typing">
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
              <form onSubmit={handleSendMessage} className="px-6 py-4 border-t border-eco-500/10 bg-dark-800/30">
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
                    className="flex-1 bg-dark-700/80 border border-eco-500/15 rounded-full px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-eco-500/30 transition-all focus-visible:ring-2 focus-visible:ring-eco-400"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 rounded-full bg-eco-500 hover:bg-eco-600 flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
                    aria-label="Send message"
                  >
                    <Send className="text-white w-4 h-4" />
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
