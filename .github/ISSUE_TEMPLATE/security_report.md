---
name: Security Vulnerability Report
about: Report a security vulnerability (please do NOT disclose publicly)
title: '[SECURITY] '
labels: security, critical
assignees: ''
---

> ⚠️ **IMPORTANT**: If this is a critical security vulnerability, please do NOT open a public issue.
> Instead, email the maintainers directly or use GitHub's private security advisory feature.

## Vulnerability Summary

A high-level description of the vulnerability (do not include exploit details here).

## Severity Assessment

- [ ] **Critical** — Remote code execution, authentication bypass, data breach
- [ ] **High** — Privilege escalation, sensitive data exposure
- [ ] **Medium** — Cross-site scripting (XSS), CSRF
- [ ] **Low** — Information disclosure, minor security misconfiguration

## Affected Component

Which part of EcoGuide AI is affected?

- [ ] Authentication (login / signup / session)
- [ ] API Routes (rate limiting, authorization)
- [ ] Database (Row Level Security, SQL injection)
- [ ] Frontend (XSS, CSP bypass)
- [ ] Third-party dependencies
- [ ] Configuration / Environment variables
- [ ] Other: ___

## OWASP Category (if applicable)

- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable and Outdated Components
- [ ] A07: Identification and Authentication Failures
- [ ] A08: Software and Data Integrity Failures
- [ ] A09: Security Logging and Monitoring Failures
- [ ] A10: Server-Side Request Forgery (SSRF)

## Reproduction Steps

Describe how to reproduce the vulnerability (general terms only — do not include working exploits in public issues).

## Impact

What could an attacker do if this vulnerability were exploited?

## Suggested Remediation

If you have suggestions for fixing this issue, please describe them here.

## Disclosure Timeline

When did you discover this vulnerability?

## Checklist

- [ ] I have verified this is a real security issue
- [ ] I have not shared this vulnerability publicly before reporting
- [ ] I am not requesting a bounty (this is an open source project)
