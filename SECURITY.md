# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities using one of the following methods:

1. **GitHub Private Security Advisory** *(preferred)*  
   Go to the [Security tab](../../security/advisories/new) → "Report a vulnerability"

2. **Direct contact**  
   Reach out to the maintainers via GitHub

### What to Include

When reporting, please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Affected versions / components
- Any suggested remediation (optional)

### What to Expect

- **Acknowledgement**: within 48 hours
- **Assessment**: within 5 business days
- **Fix & disclosure**: coordinated timeline based on severity

We follow responsible disclosure practices. We'll credit you in the release notes (if you wish) once a fix is published.

## Security Design

EcoGuide AI implements multiple security layers:

- **Authentication**: Supabase JWT sessions with server-side validation
- **Authorization**: Row Level Security (RLS) on all database tables  
- **Input Validation**: Zod schemas on all API endpoints
- **Output Sanitization**: DOMPurify for AI-generated content
- **Rate Limiting**: Sliding-window rate limiter on mutation endpoints
- **Security Headers**: CSP (with Trusted Types), HSTS, COOP/CORP/COEP, X-Frame-Options
- **No Secrets in Code**: All credentials via environment variables
- **npm audit**: Run on every CI/CD pipeline (`--audit-level=high`)

See the [Security section in README.md](README.md#security) for the full OWASP Top 10 mapping.
