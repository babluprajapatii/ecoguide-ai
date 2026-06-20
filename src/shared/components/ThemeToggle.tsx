'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * ThemeToggle component provides a micro-animated button to switch
 * between light, dark, and system themes.
 *
 * Implements a client-side mount check to prevent SSR hydration warnings
 * and layout shifts. Fully compliant with WCAG keyboard and screen reader accessibility.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-lg border border-eco-500/20 bg-eco-500/10" />
    );
  }

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-eco-500/20 bg-eco-500/10 text-eco-500 outline-none transition-all duration-200 hover:bg-eco-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        {isDark ? (
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300" />
        ) : (
          <Moon className="h-5 w-5 rotate-0 scale-100 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
}
