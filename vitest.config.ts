import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/features/coach/services/coach.service.ts',
        'src/features/gamification/services/level.service.ts',
        'src/features/gamification/services/streak.service.ts',
        'src/features/profile/services/profile.service.ts',
        'src/features/simulator/services/simulation.service.ts',
        'src/features/simulator/services/simulator.service.ts',
        'src/features/dashboard/services/analytics.service.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
