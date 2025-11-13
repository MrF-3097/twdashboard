'use client'

import { useEffect, useState, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LogEntry {
  id: number
  timestamp: string
  level: 'log' | 'warn' | 'error' | 'info'
  prefix: string
  message: string
  args: any[]
}

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any, maxDepth = 3, currentDepth = 0): string => {
  if (currentDepth > maxDepth) {
    return '[Max Depth Reached]'
  }

  // Handle null and undefined
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'

  // Handle primitives
  if (typeof obj !== 'object') {
    return String(obj)
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    const items = obj.slice(0, 5).map(item => safeStringify(item, maxDepth, currentDepth + 1))
    return `[${items.join(', ')}${obj.length > 5 ? '...' : ''}]`
  }

  // Handle special objects
  if (obj instanceof Error) {
    return `Error: ${obj.name} - ${obj.message}`
  }
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  if (obj instanceof RegExp) {
    return obj.toString()
  }
  if (obj instanceof Event) {
    return `Event(${obj.type})`
  }
  if (obj instanceof Promise) {
    return 'Promise'
  }
  if (typeof obj === 'function') {
    return `Function(${obj.name || 'anonymous'})`
  }

  // Handle DOM elements
  if (obj instanceof HTMLElement) {
    return `HTMLElement(${obj.tagName})`
  }
  if (obj instanceof Node) {
    return `Node(${obj.nodeName})`
  }

  // Try to stringify object, handling circular references
  const seen = new WeakSet()
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
        
        // Skip complex objects
        if (value instanceof Event || value instanceof HTMLElement || value instanceof Node) {
          return `[${value.constructor.name}]`
        }
      }
      return value
    }, 2)
  } catch (error) {
    // If JSON.stringify fails, try to extract useful info
    try {
      const keys = Object.keys(obj).slice(0, 10)
      const preview = keys.map(key => `${key}: ${typeof obj[key]}`).join(', ')
      return `{${preview}${Object.keys(obj).length > 10 ? '...' : ''}}`
    } catch {
      return `[Object ${obj.constructor?.name || 'Unknown'}]`
    }
  }
}

export const OnScreenDebugPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false)
  const logIdRef = useRef(0)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && isOpen && !isMinimized) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isOpen, isMinimized])

  useEffect(() => {
    if (!isEnabled) return

    // Store original console methods
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error
    const originalInfo = console.info

    // Intercept console.log
    console.log = (...args: any[]) => {
      originalLog(...args)
      const message = args.find(arg => typeof arg === 'string') || ''
      const prefixMatch = message.match(/\[([^\]]+)\]/)
      const prefix = prefixMatch ? prefixMatch[1] : 'Console'
      
      setLogs(prev => [...prev.slice(-99), {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: 'log',
        prefix,
        message: args.map(arg => safeStringify(arg)).join(' '),
        args: [] // Don't store args to avoid circular reference issues
      }])
    }

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      originalWarn(...args)
      const message = args.find(arg => typeof arg === 'string') || ''
      const prefixMatch = message.match(/\[([^\]]+)\]/)
      const prefix = prefixMatch ? prefixMatch[1] : 'Console'
      
      setLogs(prev => [...prev.slice(-99), {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: 'warn',
        prefix,
        message: args.map(arg => safeStringify(arg)).join(' '),
        args: [] // Don't store args to avoid circular reference issues
      }])
    }

    // Intercept console.error
    console.error = (...args: any[]) => {
      originalError(...args)
      const message = args.find(arg => typeof arg === 'string') || ''
      const prefixMatch = message.match(/\[([^\]]+)\]/)
      const prefix = prefixMatch ? prefixMatch[1] : 'Console'
      
      setLogs(prev => [...prev.slice(-99), {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        prefix,
        message: args.map(arg => safeStringify(arg)).join(' '),
        args: [] // Don't store args to avoid circular reference issues
      }])
    }

    // Intercept console.info
    console.info = (...args: any[]) => {
      originalInfo(...args)
      const message = args.find(arg => typeof arg === 'string') || ''
      const prefixMatch = message.match(/\[([^\]]+)\]/)
      const prefix = prefixMatch ? prefixMatch[1] : 'Console'
      
      setLogs(prev => [...prev.slice(-99), {
        id: logIdRef.current++,
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        prefix,
        message: args.map(arg => safeStringify(arg)).join(' '),
        args: [] // Don't store args to avoid circular reference issues
      }])
    }

    // Cleanup: restore original console methods
    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.info = originalInfo
    }
  }, [isEnabled])

  // Enable debug panel on mount (can be toggled via localStorage)
  useEffect(() => {
    const debugEnabled = localStorage.getItem('pwa_debug_enabled') === 'true'
    setIsEnabled(debugEnabled)
    setIsOpen(debugEnabled)
  }, [])

  const toggleEnabled = () => {
    const newState = !isEnabled
    setIsEnabled(newState)
    setIsOpen(newState)
    localStorage.setItem('pwa_debug_enabled', String(newState))
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-300'
    }
  }

  const getLogBgColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-900/20 border-red-500/30'
      case 'warn': return 'bg-yellow-900/20 border-yellow-500/30'
      case 'info': return 'bg-blue-900/20 border-blue-500/30'
      default: return 'bg-slate-800/50 border-slate-700/50'
    }
  }

  // Show toggle button if disabled
  if (!isEnabled) {
    return (
      <button
        onClick={toggleEnabled}
        className="fixed bottom-4 right-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-semibold"
        aria-label="Enable Debug Panel"
      >
        🐛 Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-[9999] w-full max-w-md">
      {/* Header */}
      <div className="bg-slate-900 border-t border-l border-r border-white/20 rounded-t-lg shadow-2xl">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/70 hover:text-white"
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="text-white font-semibold text-sm">Debug Console</span>
            <span className="text-white/50 text-xs">({logs.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEnabled}
              className="h-7 w-7 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Panel */}
      {!isMinimized && (
        <div className="bg-slate-950 border-l border-r border-b border-white/20 max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-sm">
              No logs yet. Click the "Descarcă App" button to see debug output.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded text-xs border ${getLogBgColor(log.level)} ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-white/40 text-[10px] font-mono flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span className="text-white/60 font-semibold flex-shrink-0">
                      [{log.prefix}]
                    </span>
                    <span className="flex-1 break-words">
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

