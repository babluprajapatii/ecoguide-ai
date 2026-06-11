'use client';

import { useRef, useState, useEffect, useMemo, type KeyboardEvent } from 'react';

interface SuggestedPromptsProps {
  /** User's highest emissions category (e.g. 'Transport', 'Diet', 'Energy', 'Shopping') */
  readonly highestCategory?: string;
  /** Callback fired when a prompt chip is clicked or selected. */
  readonly onSelectPrompt: (prompt: string) => void;
  /** Disabled state (e.g., while streaming). */
  readonly disabled?: boolean;
}

const CATEGORY_PROMPTS: Record<string, string[]> = {
  transport: [
    'How can I reduce my transport emissions?',
    'Are hybrid cars actually better for the planet?',
    'What is the carbon footprint of public transit vs driving?',
    'What are the most effective ways to offset travel emissions?',
  ],
  diet: [
    'What are the easiest diet changes to save CO2?',
    'Is eating vegetarian enough to help the environment?',
    'Which plant milks have the lowest carbon footprint?',
    'How does food waste affect my climate footprint?',
  ],
  energy: [
    'How can I lower my electricity footprint at home?',
    'Is natural gas or electric heating cleaner?',
    'What are the benefits of switching to green energy?',
    'How can I make my home more energy efficient on a budget?',
  ],
  shopping: [
    'How do my purchasing habits affect my carbon footprint?',
    'What is fast fashion\'s carbon impact?',
    'Are eco-labelled products actually greener?',
    'How does a circular economy reduce shopping emissions?',
  ],
  default: [
    'What are the easiest ways to start reducing my footprint?',
    'How can I calculate my carbon footprint accurately?',
    'What is a sustainable annual carbon footprint target?',
    'How do individual choices impact global climate goals?',
  ],
};

/**
 * SuggestedPrompts component.
 * Renders 4 contextual prompt chips based on the user's highest footprint category.
 * Implements accessible keyboard navigation via roving tabindex.
 */
export function SuggestedPrompts({
  highestCategory = 'default',
  onSelectPrompt,
  disabled = false,
}: SuggestedPromptsProps) {
  const normalizedCategory = highestCategory.toLowerCase();
  
  const prompts = useMemo(() => {
    return CATEGORY_PROMPTS[normalizedCategory] || CATEGORY_PROMPTS.default || [];
  }, [normalizedCategory]);

  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialize button refs array
  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, prompts.length);
  }, [prompts]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;

    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % prompts.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + prompts.length) % prompts.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = prompts.length - 1;
        break;
      default:
        return; // Let browser handle other keys
    }

    e.preventDefault();
    setFocusedIndex(nextIndex);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Suggested prompts based on your assessment:
      </p>
      <div
        role="group"
        aria-label="Suggested coaching prompts"
        className="flex flex-wrap gap-2"
      >
        {prompts.map((prompt, index) => {
          const isTabFocusable = index === focusedIndex;

          return (
            <button
              key={prompt}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              tabIndex={isTabFocusable ? 0 : -1}
              disabled={disabled}
              onClick={() => onSelectPrompt(prompt)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
            >
              {prompt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default SuggestedPrompts;
