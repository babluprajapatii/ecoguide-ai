import { Navigation } from '@/shared/components/Navigation';
import type { ReactNode } from 'react';

interface LayoutProps {
  readonly children: ReactNode;
}

/**
 * Route group layout for (dashboard) routes.
 *
 * Injects the global Navigation bar at the top of all dashboard,
 * simulator, coach, assessment, and achievements pages.
 */
export default function DashboardRouteGroupLayout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
