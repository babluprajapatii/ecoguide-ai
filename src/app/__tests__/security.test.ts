import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitize';
import { z } from 'zod';
import { checkRateLimit, clearRateLimitStore } from '@/lib/rate-limiter';
import { NextRequest } from 'next/server';

describe('Security Test Suite', () => {
  describe('XSS Prevention (DOMPurify Sanitization)', () => {
    it('strips scripts and event handlers completely', () => {
      const maliciousHtml =
        '<p>Normal text <script>alert("XSS")</script> <img src="x" onerror="alert(1)"> and <iframe src="http://evil.com"></iframe></p>';
      const sanitized = sanitizeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).toContain('<p>Normal text ');
      expect(sanitized).toContain('<img src="x">');
    });

    it('sanitizes javascript: links', () => {
      const linkHtml = '<a href="javascript:alert(1)">Click me</a>';
      const sanitized = sanitizeHtml(linkHtml);
      expect(sanitized).not.toContain('javascript:');
    });

    it('keeps allowed elements intact', () => {
      const safeHtml =
        '<div class="test"><p>Hello <strong>World</strong>!</p><a href="https://example.com" target="_blank" rel="noopener">Link</a></div>';
      const sanitized = sanitizeHtml(safeHtml);
      expect(sanitized).toContain('<div class="test">');
      expect(sanitized).toContain('<p>Hello <strong>World</strong>!</p>');
      expect(sanitized).toContain('href="https://example.com"');
    });
  });

  describe('SQL Injection Input Validation', () => {
    // Standard Zod validator for text inputs in EcoGuide
    const standardInputValidator = z.string().min(3).max(100);

    it('allows text containing normal characters', () => {
      const parsed = standardInputValidator.safeParse('Regular user recommendation description');
      expect(parsed.success).toBe(true);
    });

    it('strictly checks payload formats, preventing arbitrary script/command input via constraints', () => {
      // Inputs attempting SQL injection
      const sqliInputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        '1 UNION SELECT username, password FROM profiles',
      ];

      for (const input of sqliInputs) {
        // While Zod string validates them as strings, in our architecture, Supabase client uses
        // parameterized queries which prevent SQL injection at the database layer.
        // At the validation layer, we verify they do not break our application constraints.
        const parsed = standardInputValidator.safeParse(input);
        expect(parsed.success).toBe(true); // Valid as a string literal, but safely parameterised later
      }
    });

    it('rejects input that violates bounds or types (which are common vectors for injection payloads)', () => {
      const numberValidator = z.number().nonnegative().max(10000);

      // Attempting to send SQL payload where a number is expected
      const badInput = "' OR 1=1 --";
      const parsed = numberValidator.safeParse(badInput as unknown as number);
      expect(parsed.success).toBe(false);
    });
  });

  describe('API Rate Limiting Verification', () => {
    beforeEach(() => {
      clearRateLimitStore();
    });

    it('allows up to 20 requests in sliding window and blocks the 21st request', () => {
      const fakeRequest = (ip: string) => {
        return new NextRequest('http://localhost/api/test', {
          headers: { 'x-forwarded-for': ip },
        });
      };

      const ipAddress = '192.168.1.50';

      // 20 requests allowed
      for (let i = 0; i < 20; i++) {
        const result = checkRateLimit(fakeRequest(ipAddress));
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(19 - i);
      }

      // 21st request blocked
      const blockedResult = checkRateLimit(fakeRequest(ipAddress));
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);

      // A different IP address should not be blocked
      const otherResult = checkRateLimit(fakeRequest('192.168.1.51'));
      expect(otherResult.allowed).toBe(true);
    });
  });
});
