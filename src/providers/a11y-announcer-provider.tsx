'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type AnnouncementType = 'polite' | 'assertive';

interface A11yContextProps {
  announce: (message: string, type?: AnnouncementType) => void;
}

const A11yContext = createContext<A11yContextProps | null>(null);

export function A11yProvider({ children }: { readonly children: ReactNode }) {
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');

  const announce = useCallback((message: string, type: AnnouncementType = 'polite') => {
    if (type === 'assertive') {
      setAssertiveAnnouncement('');
      // Use micro-delay to trigger screen reader announcement update
      setTimeout(() => setAssertiveAnnouncement(message), 50);
    } else {
      setPoliteAnnouncement('');
      setTimeout(() => setPoliteAnnouncement(message), 50);
    }
  }, []);

  return (
    <A11yContext.Provider value={{ announce }}>
      {children}
      {/* Visually hidden but read by screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {politeAnnouncement}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true" role="alert">
        {assertiveAnnouncement}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}
