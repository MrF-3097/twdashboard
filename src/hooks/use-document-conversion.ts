'use client'

import { useState, useCallback } from 'react'
import { DocumentConversion, ConversionStatus } from '@/types'
import { documentApi, mockApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export function useDocumentConversion() {
  const [conversions, setConversions] = useState<DocumentConversion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const addConversion = useCallback((conversion: DocumentConversion) => {
    setConversions(prev => [conversion, ...prev])
  }, [])

  const updateConversion = useCallback((id: string, updates: Partial<ConversionStatus>) => {
    setConversions(prev => prev.map(conv => 
      conv.id === id 
        ? { ...conv, status: { ...conv.status, ...updates } }
        : conv
    ))
  }, [])

  const processConversion = useCallback(async (
    conversion: DocumentConversion,
    file: File
  ) => {
    setIsProcessing(true)
    
    try {
      // Update status to processing
      updateConversion(conversion.id, { status: 'processing', progress: 0 })

      // Simulate progress updates
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300))
        updateConversion(conversion.id, { progress })
      }

      // Use mock API for development
      const response = await mockApi.convertDocument(
        file,
        conversion.fromFormat,
        conversion.toFormat
      )

      if (response.success && response.data) {
        updateConversion(conversion.id, {
          status: 'completed',
          progress: 100,
          downloadUrl: response.data.downloadUrl,
          message: 'Conversion completed successfully'
        })

        toast({
          title: "Conversion completed",
          description: `${conversion.fileName} has been converted to ${conversion.toFormat.toUpperCase()}`,
        })
      } else {
        throw new Error(response.error || 'Conversion failed')
      }

    } catch (error) {
      updateConversion(conversion.id, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Conversion failed'
      })

      toast({
        title: "Conversion failed",
        description: "There was an error converting your document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [updateConversion, toast])

  const downloadFile = useCallback((conversion: DocumentConversion) => {
    if (conversion.status.downloadUrl) {
      const link = document.createElement('a')
      link.href = conversion.status.downloadUrl
      link.download = conversion.fileName.replace(/\.[^/.]+$/, `.${conversion.toFormat}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [])

  const clearConversions = useCallback(() => {
    setConversions([])
  }, [])

  return {
    conversions,
    isProcessing,
    addConversion,
    updateConversion,
    processConversion,
    downloadFile,
    clearConversions
  }
}

