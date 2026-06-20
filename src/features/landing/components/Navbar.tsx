'use client';

import { useState, useEffect, useRef } from 'react';
import { Leaf, Menu, X } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  // Monitor scroll for visual glass effect transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trap focus inside mobile menu drawer for accessibility (WCAG AA)
  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement as HTMLElement | null;

    // Focus on close button when opened
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        if (!menuRef.current) return;
        const focusableElements = menuRef.current.querySelectorAll(
          'a[href], button:not([disabled])',
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activeElement) {
        activeElement.focus();
      }
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      triggerButtonRef.current?.focus();
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
  };

  const scrollToSection = (id: string) => {
    closeMenu();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Add visual focus indicator or update browser location safely
      setTimeout(() => {
        element.setAttribute('tabindex', '-1');
        element.focus({ preventScroll: true });
      }, 800);
    }
  };

  return (
    <>
      <nav
        id="navbar"
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'border-b border-eco-500/10 bg-dark-900/80 py-2 shadow-lg backdrop-blur-md'
            : 'bg-transparent py-4'
        }`}
        aria-label="Main Navigation"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-2 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              aria-label="EcoGuide AI Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-eco-400 to-eco-600 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-white">
                EcoGuide<span className="text-eco-400">AI</span>
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('dashboard');
                }}
                className="nav-link rounded px-1.5 text-sm font-medium text-stone-400 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                Dashboard
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                }}
                className="nav-link rounded px-1.5 text-sm font-medium text-stone-400 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }}
                className="nav-link rounded px-1.5 text-sm font-medium text-stone-400 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                How It Works
              </a>
              <a
                href="#analytics"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('analytics');
                }}
                className="nav-link rounded px-1.5 text-sm font-medium text-stone-400 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                Analytics
              </a>
              <a
                href="#community"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('community');
                }}
                className="nav-link rounded px-1.5 text-sm font-medium text-stone-400 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                Community
              </a>
            </div>

            {/* Desktop CTA + Hamburger toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollToSection('cta')}
                className="btn-primary hidden rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 md:inline-flex"
              >
                Meet My AI Coach
              </button>
              <button
                ref={triggerButtonRef}
                onClick={toggleMenu}
                className="rounded-lg p-2 text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 md:hidden"
                aria-label={isOpen ? 'Close mobile menu' : 'Open mobile menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`fixed inset-y-0 right-0 z-[60] w-72 transform border-l border-eco-900/50 bg-dark-800/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="flex items-center justify-between border-b border-eco-500/10 p-6">
          <span className="font-serif text-lg font-semibold text-white">Menu</span>
          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            aria-label="Close mobile menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-1 px-4">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('dashboard');
            }}
            className="rounded-lg px-4 py-3 font-medium text-stone-300 transition-all hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          >
            Dashboard
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('features');
            }}
            className="rounded-lg px-4 py-3 font-medium text-stone-300 transition-all hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('how-it-works');
            }}
            className="rounded-lg px-4 py-3 font-medium text-stone-300 transition-all hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          >
            How It Works
          </a>
          <a
            href="#analytics"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('analytics');
            }}
            className="rounded-lg px-4 py-3 font-medium text-stone-300 transition-all hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          >
            Analytics
          </a>
          <a
            href="#community"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('community');
            }}
            className="rounded-lg px-4 py-3 font-medium text-stone-300 transition-all hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
          >
            Community
          </a>
          <div className="mt-6 px-4">
            <button
              onClick={() => scrollToSection('cta')}
              className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            >
              Meet My AI Coach
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
