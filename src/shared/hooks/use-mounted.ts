'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to safely detect client-side mounting.
 * Prevents hydration mismatches when rendering client-specific HTML
 * (such as animations, charts, or localized dates).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
