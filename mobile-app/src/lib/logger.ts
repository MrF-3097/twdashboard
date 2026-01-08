/**
 * Centralized Logging Utility
 * Provides consistent logging across the app with production-safe behavior
 * 
 * @module logger
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Creates a logger instance that only logs in development mode
 * In production, all logs are disabled to improve performance
 */
const createLogger = (): Logger => {
  const shouldLog = __DEV__;

  return {
    log: (...args: any[]) => {
      if (shouldLog) {
        console.log('[LOG]', ...args);
      }
    },
    warn: (...args: any[]) => {
      if (shouldLog) {
        console.warn('[WARN]', ...args);
      }
    },
    error: (...args: any[]) => {
      // Always log errors, even in production (but can be filtered)
      if (shouldLog) {
        console.error('[ERROR]', ...args);
      }
      // In production, you might want to send to error tracking service
      // Example: Sentry.captureException(args[0]);
    },
    info: (...args: any[]) => {
      if (shouldLog) {
        console.info('[INFO]', ...args);
      }
    },
    debug: (...args: any[]) => {
      if (shouldLog) {
        console.debug('[DEBUG]', ...args);
      }
    },
  };
};

/**
 * Default logger instance
 * Import this throughout the app instead of using console directly
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.log('User logged in', userId);
 * logger.error('API request failed', error);
 * ```
 */
export const logger = createLogger();

/**
 * Creates a scoped logger with a prefix for easier debugging
 * 
 * @param scope - The scope/context name (e.g., 'AuthContext', 'API Client')
 * @returns A logger instance with scoped logging
 * 
 * @example
 * ```typescript
 * const apiLogger = createScopedLogger('API Client');
 * apiLogger.log('Request sent'); // Logs: [API Client] Request sent
 * ```
 */
export const createScopedLogger = (scope: string): Logger => {
  const shouldLog = __DEV__;

  return {
    log: (...args: any[]) => {
      if (shouldLog) {
        console.log(`[${scope}]`, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (shouldLog) {
        console.warn(`[${scope}]`, ...args);
      }
    },
    error: (...args: any[]) => {
      if (shouldLog) {
        console.error(`[${scope}]`, ...args);
      }
    },
    info: (...args: any[]) => {
      if (shouldLog) {
        console.info(`[${scope}]`, ...args);
      }
    },
    debug: (...args: any[]) => {
      if (shouldLog) {
        console.debug(`[${scope}]`, ...args);
      }
    },
  };
};









