import DOMPurify from 'isomorphic-dompurify';

/**
 * Default DOMPurify configuration for sanitizing AI-generated HTML.
 *
 * Allows a safe subset of HTML elements and attributes commonly
 * used in formatted AI responses (paragraphs, lists, links, code blocks)
 * while stripping dangerous elements like `<script>`, `<iframe>`,
 * event handlers, and `javascript:` URIs.
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'figure',
    'figcaption',
    'mark',
    'sub',
    'sup',
    'hr',
    'dl',
    'dt',
    'dd',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'width',
    'height',
    'loading',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 *
 * Uses DOMPurify with a restrictive allowlist of tags and attributes
 * appropriate for rendering AI-generated content. All `javascript:`
 * URIs, event handlers, and dangerous elements are stripped.
 *
 * @param dirty - The untrusted HTML string to sanitize.
 * @param config - Optional DOMPurify config to override defaults.
 * @returns A sanitized HTML string safe for `dangerouslySetInnerHTML`.
 *
 * @example
 * ```tsx
 * import { sanitizeHtml } from '@/lib/sanitize';
 *
 * function AIResponse({ html }: { html: string }) {
 *   return (
 *     <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
 *   );
 * }
 * ```
 */
export function sanitizeHtml(dirty: string, config?: DOMPurify.Config): string {
  const mergedConfig = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;
  return DOMPurify.sanitize(dirty, mergedConfig as Parameters<typeof DOMPurify.sanitize>[1]);
}

/**
 * Strips all HTML tags from a string, returning plain text.
 *
 * Useful for extracting text content from AI responses where
 * no HTML rendering is needed (e.g., meta descriptions, previews).
 *
 * @param dirty - The HTML string to strip.
 * @returns A plain-text string with all HTML removed.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
