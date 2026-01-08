/**
 * Logger Utility
 * Environment-aware logging that disables console output in production
 * and provides structured logging with levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors and warnings
    if (this.isProduction) {
      return level === 'error' || level === 'warn'
    }
    // In development, log everything
    return true
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data !== undefined) {
      try {
        const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
        return `${prefix} ${message}\n${dataStr}`
      } catch {
        return `${prefix} ${message}\n${String(data)}`
      }
    }
    
    return `${prefix} ${message}`
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return
    }

    const formatted = this.formatMessage(level, message, data)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted)
        }
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        // In production, you might want to send to error tracking service
        if (this.isProduction) {
          // TODO: Send to error tracking service (Sentry, etc.)
        }
        break
    }
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  /**
   * Error level logging
   */
  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.log('error', message, {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })
    } else {
      this.log('error', message, error)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export class for testing
export { Logger }




















