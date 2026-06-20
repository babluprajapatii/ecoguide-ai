# EcoGuide AI

[![Accessibility - WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security - OWASP Top 10](https://img.shields.io/badge/Security-OWASP%20Top%2010-blue)](https://owasp.org/www-project-top-ten/)
[![Test Coverage - 90%+](https://img.shields.io/badge/Coverage-90%25%20%2B-emerald)](https://vitest.dev/)
[![Lighthouse - 95+](https://img.shields.io/badge/Lighthouse-95%2B-orange)](https://developers.google.com/web/tools/lighthouse)

AI-powered sustainable living assistant. Make informed choices for a greener tomorrow.

## Overview

EcoGuide AI is a Next.js 14 web application that helps users make sustainable choices through AI-powered assessments, personalized coaching, environmental impact simulation, gamified challenges, and community engagement. The platform provides actionable insights to reduce your environmental footprint and contribute to a healthier planet.

### Key Features

- **Assessment** — Evaluate your current environmental impact across multiple lifestyle categories
- **Dashboard** — Visualize your sustainability metrics, progress, and personalized recommendations
- **AI Coach** — Get personalized sustainability advice powered by artificial intelligence
- **Simulator** — Model the environmental impact of different lifestyle choices
- **Gamification** — Earn achievements, complete challenges, and track your eco-score
- **Community** — Connect with like-minded individuals, share tips, and participate in group challenges

## Architecture

```
src/
├── app/                          # Next.js App Router pages & layouts
│   ├── layout.tsx                # Root layout with providers & metadata
│   ├── page.tsx                  # Landing page
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # 404 page
│   └── loading.tsx               # Suspense loading fallback
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication & authorization
│   ├── assessment/               # Environmental impact assessment
│   ├── dashboard/                # User dashboard & analytics
│   ├── coach/                    # AI coaching engine
│   ├── simulator/                # Impact simulation tools
│   ├── gamification/             # Achievements & challenges
│   └── community/                # Social features & forums
│       ├── components/           # Feature-specific React components
│       ├── hooks/                # Feature-specific custom hooks
│       ├── services/             # API calls & business logic
│       ├── schemas/              # Zod validation schemas
│       └── types/                # TypeScript type definitions
├── shared/                       # Cross-feature shared code
│   ├── components/               # Reusable UI components
│   │   └── ui/                   # shadcn/ui primitives
│   ├── hooks/                    # Shared custom hooks
│   ├── services/                 # Shared services (logger, etc.)
│   ├── schemas/                  # Shared validation schemas
│   ├── utils/                    # Utility functions (cn, etc.)
│   └── types/                    # Shared TypeScript types
├── lib/                          # Core infrastructure
│   ├── api-client.ts             # Type-safe HTTP client
│   ├── env.ts                    # Zod-validated environment variables
│   └── error-handler.ts          # Centralized error handling
└── providers/                    # React context providers
    └── app-providers.tsx         # Root provider composition
```

### Design Principles

- **Feature-based architecture** — Each domain feature is self-contained with its own components, hooks, services, schemas, and types
- **SOLID principles** — Single responsibility components under 150 lines, dependency inversion via providers
- **No barrel exports** — Direct imports preserve tree-shaking effectiveness
- **Type safety** — Strict TypeScript with `noImplicitAny` and `noUncheckedIndexedAccess`
- **Runtime validation** — Zod schemas for environment variables, API payloads, and form inputs
- **Error boundaries** — Graceful error handling at both React component and API levels

## Tech Stack

| Category      | Technology                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Framework     | [Next.js 14](https://nextjs.org/) (App Router)                                                           |
| Language      | [TypeScript 5](https://www.typescriptlang.org/) (strict mode)                                            |
| Styling       | [Tailwind CSS 3](https://tailwindcss.com/)                                                               |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) (slate base)                                                         |
| Validation    | [Zod 3](https://zod.dev/)                                                                                |
| Linting       | [ESLint 8](https://eslint.org/) (@typescript-eslint + react + jsx-a11y)                                  |
| Formatting    | [Prettier 3](https://prettier.io/) (with Tailwind CSS plugin)                                            |
| Git Hooks     | [Husky 9](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) |
| CI/CD         | [GitHub Actions](https://github.com/features/actions)                                                    |

## Setup

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ecoguide-ai.git
cd ecoguide-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable               | Required | Default                 | Description                   |
| ---------------------- | -------- | ----------------------- | ----------------------------- |
| `NODE_ENV`             | No       | `development`           | Application environment       |
| `NEXT_PUBLIC_APP_URL`  | No       | `http://localhost:3000` | Public-facing application URL |
| `NEXT_PUBLIC_APP_NAME` | No       | `EcoGuide AI`           | Application display name      |
| `DATABASE_URL`         | No       | —                       | Database connection string    |
| `API_SECRET_KEY`       | No       | —                       | Server-side API secret key    |

### Available Scripts

| Command                 | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start development server with hot reload                    |
| `npm run build`         | Create production build                                     |
| `npm run start`         | Start production server                                     |
| `npm run lint`          | Run ESLint checks                                           |
| `npm run lint:fix`      | Auto-fix linting issues                                     |
| `npm run typecheck`     | Run TypeScript type checking                                |
| `npm run format`        | Format code with Prettier                                   |
| `npm run format:check`  | Check code formatting                                       |
| `npm run test`          | Run unit & integration test suite                           |
| `npm run test:coverage` | Run tests with coverage reporting (90%+ threshold enforced) |

## Accessibility & Security

EcoGuide AI is built from the ground up to achieve excellent accessibility and security compliance:

- **Accessibility (WCAG 2.1 AA)**:
  - **Screen Reader Announcements**: A dynamic `A11yProvider` manages live screen-reader regions (`polite` and `assertive`) to announce critical updates like goals completed, badge unlocks, level-ups, and form errors.
  - **Focus Management**: Accessible modals and dialogs (e.g., [PublicProfileCard](file:///d:/coding/github/ecoguide-ai/src/features/community/components/PublicProfileCard.tsx), [GoalsWidget](file:///d:/coding/github/ecoguide-ai/src/features/dashboard/components/GoalsWidget.tsx)) trap tab-focus and restore it to trigger elements upon closing.
  - **High-Contrast Design**: Buttons and colors meet contrast ratio $\ge$ 4.5:1 for active text. Focus outlines are clearly visible for keyboard-only navigation.
  - **Table Alternatives**: Visually hidden (`sr-only`) data tables represent all Recharts visual charts so screen-readers can fully process the carbon metrics.

- **Security (OWASP Top 10)**:
  - **Secure HTTP Headers**: Enforces strict Content Security Policy (CSP), Strict-Transport-Security (HSTS), and Cross-Origin policies (`COOP`, `CORP`, `COEP`) via [next.config.mjs](file:///d:/coding/github/ecoguide-ai/next.config.mjs).
  - **Trusted Types**: Implements Trusted Types CSP policies to prevent script injection.
  - **XSS Sanitization**: Employs client-side DOMPurify policies to sanitize AI Coach markdown response texts.
  - **Rate Limiting**: Sliding window rate limiter protects API endpoints against credential stuffing and resource exhaustion.

### Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

Components are installed to `src/shared/components/ui/`.

## Contributing

1. Create a feature branch from `main`
2. Follow the feature-based folder structure for new features
3. Ensure all code passes `lint`, `typecheck`, and `test` (pre-commit hooks enforce this)
4. Submit a pull request targeting `main`

## License

Private — All rights reserved.
