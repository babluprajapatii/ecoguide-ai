'use client';

import { useEffect, type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { A11yProvider } from '@/providers/a11y-announcer-provider';

interface AppProvidersProps {
  children: ReactNode;
}

interface SafeExtensionEvent {
  addListener: (cb: unknown) => void;
  removeListener: (cb: unknown) => void;
  hasListener: () => boolean;
  hasListeners: () => boolean;
}

interface SafeExtensionRuntime {
  onMessage?: SafeExtensionEvent;
  onConnect?: SafeExtensionEvent;
  sendMessage?: () => Promise<void>;
  connect?: () => {
    onMessage: SafeExtensionEvent;
    onDisconnect: SafeExtensionEvent;
    postMessage: () => void;
    disconnect: () => void;
  };
}

interface CustomWindow {
  chrome?: {
    runtime?: SafeExtensionRuntime;
  };
  browser?: {
    runtime?: SafeExtensionRuntime;
  };
}

/**
 * AppProviders mounts all root-level React providers including error boundary,
 * next-themes ThemeProvider, React Query provider, and Supabase AuthProvider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Browser extension polyfills / compatibility shims to prevent runtime crashes from third-party scripts/extensions
    try {
      const safeEvent: SafeExtensionEvent = {
        addListener: (_cb: unknown) => {},
        removeListener: (_cb: unknown) => {},
        hasListener: () => false,
        hasListeners: () => false,
      };

      const safeRuntime: SafeExtensionRuntime = {
        onMessage: safeEvent,
        onConnect: safeEvent,
        sendMessage: () => Promise.resolve(),
        connect: () => ({
          onMessage: safeEvent,
          onDisconnect: safeEvent,
          postMessage: () => {},
          disconnect: () => {},
        }),
      };

      const win = window as unknown as CustomWindow;

      // Polyfill window.chrome
      if (typeof win.chrome === 'undefined') {
        win.chrome = {
          runtime: safeRuntime,
        };
      } else {
        const chromeObj = win.chrome;
        if (!chromeObj.runtime) {
          chromeObj.runtime = safeRuntime;
        } else {
          if (!chromeObj.runtime.onMessage) {
            chromeObj.runtime.onMessage = safeEvent;
          } else if (typeof chromeObj.runtime.onMessage.addListener !== 'function') {
            chromeObj.runtime.onMessage.addListener = safeEvent.addListener;
          }
          if (!chromeObj.runtime.onConnect) {
            chromeObj.runtime.onConnect = safeEvent;
          } else if (typeof chromeObj.runtime.onConnect.addListener !== 'function') {
            chromeObj.runtime.onConnect.addListener = safeEvent.addListener;
          }
        }
      }

      // Polyfill window.browser
      if (typeof win.browser === 'undefined') {
        win.browser = {
          runtime: safeRuntime,
        };
      } else {
        const browserObj = win.browser;
        if (!browserObj.runtime) {
          browserObj.runtime = safeRuntime;
        } else {
          if (!browserObj.runtime.onMessage) {
            browserObj.runtime.onMessage = safeEvent;
          } else if (typeof browserObj.runtime.onMessage.addListener !== 'function') {
            browserObj.runtime.onMessage.addListener = safeEvent.addListener;
          }
          if (!browserObj.runtime.onConnect) {
            browserObj.runtime.onConnect = safeEvent;
          } else if (typeof browserObj.runtime.onConnect.addListener !== 'function') {
            browserObj.runtime.onConnect.addListener = safeEvent.addListener;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to inject browser extension compatibility shims:', err);
    }

    // 1. Shim matchMedia for legacy and environment compatibility
    if (window.matchMedia) {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = function (query) {
        const mql = originalMatchMedia(query);
        if (mql) {
          if (!mql.addListener) {
            mql.addListener = function (cb: Parameters<MediaQueryList['addListener']>[0]) {
              if (cb) {
                mql.addEventListener('change', cb as unknown as EventListenerOrEventListenerObject);
              }
            };
          }
          if (!mql.removeListener) {
            mql.removeListener = function (cb: Parameters<MediaQueryList['removeListener']>[0]) {
              if (cb) {
                mql.removeEventListener(
                  'change',
                  cb as unknown as EventListenerOrEventListenerObject,
                );
              }
            };
          }
        }
        return mql;
      };
    } else {
      window.matchMedia = function (query) {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        } as unknown as MediaQueryList;
      };
    }

    // 2. Intercept and suppress third-party browser extension errors
    const originalError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      const msgStr = typeof message === 'string' ? message : '';
      const srcStr = source || '';
      if (
        srcStr.includes('chrome-extension') ||
        srcStr.includes('extension') ||
        srcStr.includes('blob:') ||
        msgStr.includes('chrome-extension') ||
        msgStr.includes('extension') ||
        msgStr.includes('addListener')
      ) {
        console.warn('Suppressed third-party browser extension runtime error:', message);
        return true; // Suppress Next.js unhandled runtime error overlay
      }
      if (originalError) {
        return originalError.apply(window, [message, source, lineno, colno, error]);
      }
      return false;
    };

    const originalRejection = window.onunhandledrejection;
    window.onunhandledrejection = function (event) {
      const reason = event.reason;
      if (reason && reason.stack) {
        const stackStr = reason.stack.toString();
        if (
          stackStr.includes('chrome-extension') ||
          stackStr.includes('extension') ||
          stackStr.includes('addListener')
        ) {
          console.warn(
            'Suppressed third-party browser extension promise rejection:',
            reason.message,
          );
          event.preventDefault();
          return;
        }
      }
      if (originalRejection) {
        originalRejection.call(window, event);
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>
          <AuthProvider>
            <A11yProvider>{children}</A11yProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
