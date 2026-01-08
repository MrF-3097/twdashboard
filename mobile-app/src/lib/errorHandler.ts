/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the app
 * 
 * @module errorHandler
 */

import { AxiosError } from 'axios';
import { logger } from './logger';

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  isNetworkError: boolean;
  isServerError: boolean;
  isAuthError: boolean;
  originalError: any;
}

/**
 * Error codes that indicate network issues
 */
const NETWORK_ERROR_CODES = [
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
  'ERR_NETWORK',
];

/**
 * Extracts user-friendly error message from various error types
 */
export const getErrorMessage = (error: any): string => {
  if (!error) {
    return 'A apărut o eroare necunoscută';
  }

  // Axios errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Try to get message from response data
    if (data?.error) {
      return data.error;
    }
    if (data?.message) {
      return data.message;
    }

    // Status code based messages
    switch (status) {
      case 400:
        return 'Cerere invalidă. Te rugăm să verifici datele introduse.';
      case 401:
        return 'Sesiunea a expirat. Te rugăm să te autentifici din nou.';
      case 403:
        return 'Nu ai permisiunea de a accesa această resursă.';
      case 404:
        return 'Resursa solicitată nu a fost găsită.';
      case 429:
        return 'Prea multe cereri. Te rugăm să aștepți puțin.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Eroare de server. Te rugăm să încerci din nou mai târziu.';
      default:
        return `Eroare de server (${status}). Te rugăm să încerci din nou.`;
    }
  }

  // Network errors
  if (error.code && NETWORK_ERROR_CODES.includes(error.code)) {
    return 'Eroare de conexiune. Te rugăm să verifici conexiunea la internet.';
  }

  if (error.message) {
    // Don't expose technical error messages to users
    if (error.message.includes('Network Error')) {
      return 'Eroare de conexiune. Te rugăm să verifici conexiunea la internet.';
    }
    return error.message;
  }

  return 'A apărut o eroare. Te rugăm să încerci din nou.';
};

/**
 * Normalizes errors into a consistent ApiError format
 */
export const normalizeError = (error: any): ApiError => {
  const axiosError = error as AxiosError;
  const statusCode = axiosError.response?.status;
  const code = axiosError.code || axiosError.response?.statusText;

  const isNetworkError =
    !axiosError.response &&
    (axiosError.code === 'ERR_NETWORK' ||
      NETWORK_ERROR_CODES.includes(axiosError.code || ''));

  const isServerError =
    statusCode !== undefined && statusCode >= 500 && statusCode < 600;

  const isAuthError = statusCode === 401 || statusCode === 403;

  return {
    message: getErrorMessage(error),
    statusCode,
    code,
    isNetworkError,
    isServerError,
    isAuthError,
    originalError: error,
  };
};

/**
 * Handles API errors with appropriate logging and user feedback
 * 
 * @param error - The error to handle
 * @param context - Additional context about where the error occurred
 * @returns Normalized error information
 * 
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/endpoint');
 * } catch (error) {
 *   const apiError = handleApiError(error, 'fetching properties');
 *   // Show error to user
 * }
 * ```
 */
export const handleApiError = (
  error: any,
  context?: string
): ApiError => {
  const normalizedError = normalizeError(error);

  // Log network errors as warnings (non-critical)
  // Log server errors as warnings (temporary issues)
  // Only log auth/client errors as errors (actionable)
  if (normalizedError.isNetworkError || normalizedError.isServerError) {
    if (context) {
      logger.warn(`[${context}]`, {
        message: normalizedError.message,
        code: normalizedError.code,
        type: normalizedError.isNetworkError ? 'network' : 'server',
      });
    } else {
      logger.warn('API Error (non-critical):', {
        message: normalizedError.message,
        code: normalizedError.code,
        type: normalizedError.isNetworkError ? 'network' : 'server',
      });
    }
  } else {
    // Log auth/client errors as errors (these are actionable)
    if (context) {
      logger.error(`[${context}]`, normalizedError);
    } else {
      logger.error('API Error:', normalizedError);
    }
  }

  // Log full error details in development (only for non-network errors)
  if (__DEV__ && !normalizedError.isNetworkError) {
    logger.debug('Full error details:', {
      error,
      normalizedError,
      stack: error?.stack,
    });
  }

  // In production, you might want to send to error tracking service
  // Example: Sentry.captureException(error, { extra: { context } });

  return normalizedError;
};

/**
 * Checks if an error is retryable
 * Network errors and 5xx server errors are retryable
 */
export const isRetryableError = (error: ApiError): boolean => {
  return error.isNetworkError || error.isServerError;
};

/**
 * Determines if an error should trigger logout
 * Auth errors (401, 403) typically require re-authentication
 */
export const shouldLogout = (error: ApiError): boolean => {
  return error.isAuthError;
};


