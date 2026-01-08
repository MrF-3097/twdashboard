/**
 * Input Sanitization Utility
 * Sanitizes user input to prevent XSS attacks
 */

/**
 * Sanitizes a string by removing potentially dangerous HTML/script tags
 * 
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 * 
 * @example
 * ```typescript
 * const safe = sanitizeString('<script>alert("xss")</script>Hello')
 * // Returns: "Hello"
 * ```
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input)
  }

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '')
  
  // Remove data: URLs that could contain scripts
  sanitized = sanitized.replace(/data:text\/html/gi, '')
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
  
  return sanitized.trim()
}

/**
 * Sanitizes an object by recursively sanitizing all string values
 * 
 * @param {unknown} input - Input object to sanitize
 * @returns {T} Sanitized object with same type
 * 
 * @example
 * ```typescript
 * const safe = sanitizeObject({ name: '<script>alert("xss")</script>', age: 25 })
 * // Returns: { name: '', age: 25 }
 * ```
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || input === undefined) {
    return input
  }

  if (typeof input === 'string') {
    return sanitizeString(input) as T
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeObject(item)) as T
  }

  if (typeof input === 'object') {
    const sanitized = {} as T
    for (const [key, value] of Object.entries(input)) {
      ;(sanitized as Record<string, unknown>)[key] = sanitizeObject(value)
    }
    return sanitized
  }

  return input
}

/**
 * Sanitizes user input from a request body
 * Useful for sanitizing JSON request bodies before processing
 * 
 * @param {unknown} body - Request body to sanitize
 * @returns {T} Sanitized body
 */
export function sanitizeRequestBody<T>(body: unknown): T {
  return sanitizeObject(body) as T
}




















