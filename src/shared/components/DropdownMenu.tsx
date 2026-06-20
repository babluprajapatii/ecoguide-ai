'use client';

import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react';

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

/**
 * DropdownMenu is a highly accessible, keyboard-navigable component.
 *
 * Implements:
 * 1. Escape key to close.
 * 2. Focus return handling (returns focus to the trigger button on close).
 * 3. ARIA attributes (aria-haspopup, aria-expanded).
 * 4. Keyboard focus trapping and arrow navigation.
 */
export default function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle open/close
  const toggle = () => setIsOpen((prev) => !prev);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus return handling on close
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events inside the dropdown menu
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = menuRef.current?.querySelectorAll(
        'a, button, [tabindex="0"]',
      ) as NodeListOf<HTMLElement>;
      if (!focusableElements || focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const focusableElements = Array.from(
        menuRef.current?.querySelectorAll('a, button, [tabindex="0"]') || [],
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const activeIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      let nextIndex = activeIndex;

      if (e.key === 'ArrowDown') {
        nextIndex = activeIndex + 1 >= focusableElements.length ? 0 : activeIndex + 1;
      } else {
        nextIndex = activeIndex - 1 < 0 ? focusableElements.length - 1 : activeIndex - 1;
      }

      focusableElements[nextIndex]?.focus();
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        onClick={toggle}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center outline-none"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          onKeyDown={handleKeyDown}
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 mt-2 w-56 overflow-hidden rounded-xl border border-eco-500/20 bg-background/95 shadow-2xl outline-none backdrop-blur-md duration-100 animate-in fade-in`}
          role="menu"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
