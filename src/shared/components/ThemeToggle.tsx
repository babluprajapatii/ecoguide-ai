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
      <div className="w-9 h-9 rounded-lg bg-eco-500/10 border border-eco-500/20 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-eco-500/10 border border-eco-500/20 text-eco-500 hover:bg-eco-500/20 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
    </button>
  );
}
