'use client'

import { useState, useEffect, useCallback } from 'react'
import { detectOS } from '@/lib/utils'
import { printerApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export interface PrinterDriver {
  os: 'windows' | 'mac' | 'linux'
  name: string
  downloadUrl: string
  version: string
  fileSize: string
}

export function usePrinterDrivers() {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'mac' | 'linux' | 'unknown'>('unknown')
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | 'linux'>('windows')
  const [availableDrivers, setAvailableDrivers] = useState<PrinterDriver[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingDriver, setDownloadingDriver] = useState<string | null>(null)
  const { toast } = useToast()

  // Mock printer drivers data
  const mockDrivers: PrinterDriver[] = [
    {
      os: 'windows',
      name: 'HP Universal Print Driver',
      downloadUrl: 'https://support.hp.com/drivers/universal-print-driver',
      version: '7.0.0',
      fileSize: '45.2 MB'
    },
    {
      os: 'windows',
      name: 'Canon Generic Plus PCL6',
      downloadUrl: 'https://www.canon.com/support/printers',
      version: '2.30',
      fileSize: '32.1 MB'
    },
    {
      os: 'windows',
      name: 'Epson Universal Print Driver',
      downloadUrl: 'https://support.epson.com/printers',
      version: '6.8.0',
      fileSize: '28.7 MB'
    },
    {
      os: 'mac',
      name: 'HP Easy Start',
      downloadUrl: 'https://support.hp.com/drivers/hp-easy-start',
      version: '4.0.0',
      fileSize: '15.3 MB'
    },
    {
      os: 'mac',
      name: 'Canon IJ Network Tool',
      downloadUrl: 'https://www.canon.com/support/printers',
      version: '4.8.0',
      fileSize: '22.4 MB'
    },
    {
      os: 'mac',
      name: 'Epson Printer Utility',
      downloadUrl: 'https://support.epson.com/printers',
      version: '3.2.1',
      fileSize: '18.9 MB'
    },
    {
      os: 'linux',
      name: 'CUPS Print System',
      downloadUrl: 'https://www.cups.org/',
      version: '2.4.0',
      fileSize: '12.5 MB'
    },
    {
      os: 'linux',
      name: 'HP Linux Imaging and Printing',
      downloadUrl: 'https://developers.hp.com/hp-linux-imaging-and-printing',
      version: '3.22.0',
      fileSize: '35.8 MB'
    },
    {
      os: 'linux',
      name: 'Gutenprint',
      downloadUrl: 'https://gutenprint.sourceforge.net/',
      version: '5.3.4',
      fileSize: '8.2 MB'
    }
  ]

  // Detect OS on component mount
  useEffect(() => {
    const os = detectOS()
    setDetectedOS(os)
    
    if (os !== 'unknown') {
      setSelectedOS(os)
    }
  }, [])

  // Load drivers when OS changes
  useEffect(() => {
    loadDrivers(selectedOS)
  }, [selectedOS])

  const loadDrivers = useCallback(async (os: 'windows' | 'mac' | 'linux') => {
    setIsLoading(true)
    
    try {
      // For now, use mock data
      // In production, you would call: const response = await printerApi.getDrivers(os)
      const filteredDrivers = mockDrivers.filter(driver => driver.os === os)
      setAvailableDrivers(filteredDrivers)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      toast({
        title: "Failed to load drivers",
        description: "There was an error loading printer drivers. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const downloadDriver = useCallback(async (driver: PrinterDriver) => {
    setIsDownloading(true)
    setDownloadingDriver(driver.name)

    try {
      // Log download for analytics
      await printerApi.logDownload(driver.name, driver.os)
      
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Open download URL in new tab
      window.open(driver.downloadUrl, '_blank')
      
      toast({
        title: "Download started",
        description: `${driver.name} download has been initiated.`,
      })

    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error starting the download. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
      setDownloadingDriver(null)
    }
  }, [toast])

  const getOSName = useCallback((os: string) => {
    switch (os) {
      case 'windows':
        return 'Windows'
      case 'mac':
        return 'macOS'
      case 'linux':
        return 'Linux'
      default:
        return 'Unknown'
    }
  }, [])

  const getOSIcon = useCallback((os: string) => {
    switch (os) {
      case 'windows':
        return '🖥️'
      case 'mac':
        return '💻'
      case 'linux':
        return '🐧'
      default:
        return '🖨️'
    }
  }, [])

  return {
    // State
    detectedOS,
    selectedOS,
    availableDrivers,
    isLoading,
    isDownloading,
    downloadingDriver,
    
    // Actions
    setSelectedOS,
    downloadDriver,
    loadDrivers,
    
    // Utilities
    getOSName,
    getOSIcon
  }
}

