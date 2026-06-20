'use client';

import { useEffect, useState } from 'react';
import { useMounted } from '@/shared/hooks/use-mounted';

interface Leaf {
  id: number;
  left: number;
  delay: number;
  duration: number;
  scale: number;
  rotate: number;
  opacity: number;
}

export function LeafParticles() {
  const mounted = useMounted();
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    if (!mounted) return;

    // Generate a fixed set of randomized parameters on client mount
    // to keep it stable and avoid layout shift during render cycles.
    const generatedLeaves: Leaf[] = Array.from({ length: 12 }).map((_, index) => ({
      id: index,
      left: Math.random() * 100, // 0% to 100% of viewport
      delay: Math.random() * 10, // 0s to 10s delay
      duration: 10 + Math.random() * 15, // 10s to 25s fall time
      scale: 0.5 + Math.random() * 0.8, // size
      rotate: Math.random() * 360,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    setLeaves(generatedLeaves);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {leaves.map((leaf) => (
        <svg
          key={leaf.id}
          className="leaf-particle fill-current text-eco-400/35"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
            transform: `scale(${leaf.scale}) rotate(${leaf.rotate}deg)`,
            opacity: leaf.opacity,
            top: '-5%',
            width: '24px',
            height: '24px',
          }}
          viewBox="0 0 24 24"
        >
          <path d="M17 8C8 10 7 17 7 17S14 16 16 7M2 22C2 22 8 21 12 17C16 13 22 2 22 2S11 8 7 12C3 16 2 22 2 22Z" />
        </svg>
      ))}
    </div>
  );
}
