/**
 * Structured Logger for Operational Readiness (compliance with JSON logging).
 * Formats outputs as JSON objects to stdout/stderr.
 * Excludes any PII (user emails, messages) to maintain privacy compliance.
 */
export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        ...meta,
      }),
    );
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        ...meta,
      }),
    );
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        error: error instanceof Error ? error.message : String(error || ''),
        stack: error instanceof Error ? error.stack : undefined,
        ...meta,
      }),
    );
  },
};
