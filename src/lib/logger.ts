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
    let resolvedError = error;
    let resolvedMeta = meta || {};

    if (error && typeof error === 'object' && !(error instanceof Error)) {
      const errObj = error as Record<string, unknown>;
      if (errObj.error) {
        resolvedError = errObj.error;
        const { error: _removed, ...rest } = errObj;
        void _removed;
        resolvedMeta = { ...rest, ...resolvedMeta };
      }
    }

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        error:
          resolvedError instanceof Error
            ? resolvedError.message
            : resolvedError
              ? String(resolvedError)
              : '',
        stack: resolvedError instanceof Error ? resolvedError.stack : undefined,
        ...resolvedMeta,
      }),
    );
  },
};
