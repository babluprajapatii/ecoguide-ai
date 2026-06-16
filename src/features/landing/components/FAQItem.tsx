'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  id: number;
  question: string;
  answer: string;
}

export function FAQItem({ id, question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-b border-eco-500/10 transition-all duration-300 ${
        isOpen ? 'bg-eco-500/5' : ''
      }`}
    >
      <button
        id={`faq-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${id}`}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 px-4 flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-inset"
      >
        <span className="text-white text-base font-semibold pr-4 font-sans leading-snug">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-eco-400 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Accessible CSS Grid transition avoiding janky layout shifts */}
      <div
        id={`faq-panel-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-6 text-stone-400 text-sm font-light leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
