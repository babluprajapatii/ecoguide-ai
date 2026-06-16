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
          'a[href], button:not([disabled])'
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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-dark-900/80 backdrop-blur-md border-b border-eco-500/10 shadow-lg py-2'
            : 'bg-transparent py-4'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded-lg p-1"
              aria-label="EcoGuide AI Home"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Leaf className="text-white w-4 h-4" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-white">
                EcoGuide<span className="text-eco-400">AI</span>
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('dashboard');
                }}
                className="nav-link text-sm text-stone-400 font-medium hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded px-1.5"
              >
                Dashboard
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('features');
                }}
                className="nav-link text-sm text-stone-400 font-medium hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded px-1.5"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('how-it-works');
                }}
                className="nav-link text-sm text-stone-400 font-medium hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded px-1.5"
              >
                How It Works
              </a>
              <a
                href="#analytics"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('analytics');
                }}
                className="nav-link text-sm text-stone-400 font-medium hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded px-1.5"
              >
                Analytics
              </a>
              <a
                href="#community"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('community');
                }}
                className="nav-link text-sm text-stone-400 font-medium hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded px-1.5"
              >
                Community
              </a>
            </div>

            {/* Desktop CTA + Hamburger toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => scrollToSection('cta')}
                className="hidden md:inline-flex btn-primary text-xs font-semibold text-white px-5 py-2.5 rounded-full tracking-wide uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
              >
                Meet My AI Coach
              </button>
              <button
                ref={triggerButtonRef}
                onClick={toggleMenu}
                className="md:hidden text-stone-400 hover:text-eco-400 transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded-lg"
                aria-label={isOpen ? 'Close mobile menu' : 'Open mobile menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        ref={menuRef}
        className={`fixed inset-y-0 right-0 w-72 z-[60] bg-dark-800/95 backdrop-blur-xl border-l border-eco-900/50 shadow-2xl transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        <div className="flex items-center justify-between p-6 border-b border-eco-500/10">
          <span className="font-serif text-lg font-semibold text-white">Menu</span>
          <button
            ref={closeButtonRef}
            onClick={closeMenu}
            className="text-stone-400 hover:text-eco-400 transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 rounded-lg"
            aria-label="Close mobile menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-1 px-4 mt-6">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('dashboard');
            }}
            className="px-4 py-3 rounded-lg text-stone-300 hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 transition-all font-medium"
          >
            Dashboard
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('features');
            }}
            className="px-4 py-3 rounded-lg text-stone-300 hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 transition-all font-medium"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('how-it-works');
            }}
            className="px-4 py-3 rounded-lg text-stone-300 hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 transition-all font-medium"
          >
            How It Works
          </a>
          <a
            href="#analytics"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('analytics');
            }}
            className="px-4 py-3 rounded-lg text-stone-300 hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 transition-all font-medium"
          >
            Analytics
          </a>
          <a
            href="#community"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('community');
            }}
            className="px-4 py-3 rounded-lg text-stone-300 hover:bg-eco-900/30 hover:text-eco-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 transition-all font-medium"
          >
            Community
          </a>
          <div className="mt-6 px-4">
            <button
              onClick={() => scrollToSection('cta')}
              className="btn-primary w-full text-sm font-semibold text-white px-5 py-3 rounded-full tracking-wide uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-400"
            >
              Meet My AI Coach
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
