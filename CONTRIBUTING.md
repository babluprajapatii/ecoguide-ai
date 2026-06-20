# CONTRIBUTING.md — EcoGuide AI

Thank you for your interest in contributing to EcoGuide AI! 🌿

We welcome all contributions — bug fixes, features, documentation improvements, accessibility enhancements, and security hardening.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/my-improvement
   ```
4. **Install** dependencies:
   ```bash
   npm install
   ```
5. **Set up** environment variables:
   ```bash
   cp .env.example .env.local
   # (mock mode works without Supabase credentials)
   ```
6. **Start** the dev server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Style

- TypeScript **strict mode** — zero `any` in production code
- Follow the **feature-based folder structure** (`src/features/<feature>/`)
- Components should be **under 150 lines** — extract sub-components when larger
- No **barrel exports** (`index.ts`) — use direct imports for tree-shaking

### Before Committing

Pre-commit hooks (Husky) automatically run:
```bash
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run typecheck     # TypeScript check
```

### Testing Requirements

All PRs must:
- Add tests for new functionality
- Maintain **≥ 90% test coverage** (lines, functions, statements)
- Maintain **≥ 80% branch coverage**
- Pass all E2E tests

```bash
npm run test              # Run all unit tests
npm run test:coverage     # Run with coverage threshold
npx playwright test       # Run E2E tests
```

### Accessibility Requirements

All UI contributions must:
- Pass axe-core automated checks (`npm run test`)
- Be keyboard navigable
- Have correct ARIA labels and roles
- Meet WCAG 2.1 AA color contrast (≥ 4.5:1)
- Have touch targets ≥ 44×44px

### Pull Request Process

1. Use the [PR template](.github/pull_request_template.md)
2. Ensure CI passes (lint → typecheck → tests → build)
3. Request review from at least one maintainer
4. Squash commits when merging

## Reporting Issues

- 🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- 🔒 [Security Report](SECURITY.md) *(do NOT open public issues for security)*

## Code of Conduct

Be kind, respectful, and constructive. We're all here to make the planet a little greener. 🌍

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
