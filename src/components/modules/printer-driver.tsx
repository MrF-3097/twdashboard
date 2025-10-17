'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  Printer, 
  Download, 
  Monitor, 
  Smartphone, 
  Laptop,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FileText
} from 'lucide-react'
import { detectOS } from '@/lib/utils'
import { PrinterDriver } from '@/types'

export function PrinterDriver() {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'mac' | 'linux' | 'unknown'>('unknown')
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | 'linux'>('windows')
  const [selectedDriver, setSelectedDriver] = useState<PrinterDriver | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // UPDPS Printer Driver
  const printerDrivers: PrinterDriver[] = [
    {
      os: 'windows',
      name: 'UPDPS Universal Print Driver',
      downloadUrl: '/UPDPSWin_3912040MU.zip',
      version: '3.9.1',
      fileSize: '39.1 MB'
    }
  ]

  useEffect(() => {
    // Detect OS on component mount
    const os = detectOS()
    setDetectedOS(os)
    
    if (os !== 'unknown') {
      setSelectedOS(os)
    }
  }, [])

  const getOSIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <Monitor className="h-4 w-4" />
      case 'mac':
        return <Laptop className="h-4 w-4" />
      case 'linux':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Printer className="h-4 w-4" />
    }
  }

  const getOSName = (os: string) => {
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
  }

  // Always show the UPDPS driver regardless of OS selection
  const filteredDrivers = printerDrivers

  const handleDownload = async (driver: PrinterDriver) => {
    setIsDownloading(true)
    setSelectedDriver(driver)

    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Trigger direct download of the UPDPS driver
      const link = document.createElement('a')
      link.href = driver.downloadUrl
      link.download = 'UPDPSWin_3912040MU.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Descărcare inițiată",
        description: `Descărcarea ${driver.name} a fost inițiată.`,
      })

    } catch (error) {
      toast({
        title: "Descărcare eșuată",
        description: "A apărut o eroare la inițierea descărcării. Vă rugăm să încercați din nou.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
      setSelectedDriver(null)
    }
  }

  const handleContractDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Descărcare inițiată",
      description: `Descărcarea ${fileName} a fost inițiată.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* OS Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Detectarea Sistemului de Operare
          </CardTitle>
          <CardDescription>
            Am detectat automat sistemul dvs. de operare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {getOSIcon(detectedOS)}
              <div>
                <p className="font-medium">
                  {detectedOS !== 'unknown' ? 'SO Detectat' : 'Detectare SO'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {detectedOS !== 'unknown' 
                    ? `${getOSName(detectedOS)} detectat automat`
                    : 'Nu se poate detecta SO automat'
                  }
                </p>
              </div>
            </div>
            {detectedOS !== 'unknown' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Detectat</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OS Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selectați Sistemul de Operare</CardTitle>
          <CardDescription>
            Alegeți sistemul dvs. de operare pentru a vedea driverele de imprimantă compatibile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedOS} onValueChange={(value: any) => setSelectedOS(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="windows">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Windows
                </div>
              </SelectItem>
              <SelectItem value="mac">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  macOS
                </div>
              </SelectItem>
              <SelectItem value="linux">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Linux
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Available Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Drivere de Imprimantă Disponibile
          </CardTitle>
          <CardDescription>
            Driver UPDPS Universal Print
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDrivers.map((driver) => (
              <div
                key={`${driver.os}-${driver.name}`}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{driver.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                        <span>Version {driver.version}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{driver.fileSize}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end sm:justify-start">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(driver)}
                      disabled={isDownloading && selectedDriver?.name === driver.name}
                      className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
                    >
                      {isDownloading && selectedDriver?.name === driver.name ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          <span className="hidden sm:inline">Se descarcă...</span>
                          <span className="sm:hidden">Se descarcă...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          <span className="hidden sm:inline">Descarcă</span>
                          <span className="sm:hidden">Descarcă</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contract Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Șabloane Contracte Tower Imob
          </CardTitle>
          <CardDescription>
            Descărcați șabloanele de contracte pentru documentele dvs. imobiliare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Contract CERERE */}
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Contracte CERERE Tower Imob</h3>
                    <p className="text-sm text-muted-foreground">
                      Șabloane pentru contracte de cerere și aplicații imobiliare
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    size="sm"
                    onClick={() => handleContractDownload(
                      '/Contracte CERERE Tower Imob 22.09.2023-20251017T085909Z-1-001.zip',
                      'Contracte-CERERE-Tower-Imob.zip'
                    )}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Descarcă Contracte CERERE</span>
                    <span className="sm:hidden">Descarcă</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contract VÂNZARE-ÎNCHIRIERE */}
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 flex-shrink-0">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">Contracte VÂNZARE-ÎNCHIRIERE</h3>
                    <p className="text-sm text-muted-foreground">
                      Șabloane pentru contracte de vânzare și închiriere imobiliară
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    size="sm"
                    onClick={() => handleContractDownload(
                      '/Contracte VÂNZARE-ÎNCHIRIERE 22.09.2023-20251017T085901Z-1-001.zip',
                      'Contracte-VANZARE-INCHIRIERE.zip'
                    )}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                  >
                    <Download className="h-3 w-3" />
                    <span className="hidden sm:inline">Descarcă Contracte VÂNZARE</span>
                    <span className="sm:hidden">Descarcă</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucțiuni de Instalare</CardTitle>
          <CardDescription>
            Urmați acești pași pentru a instala driverul de imprimantă
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Descărcați driverul</p>
                <p className="text-sm text-muted-foreground">
                  Faceți clic pe butonul de descărcare de mai sus pentru a obține cel mai recent driver pentru sistemul dvs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Rulați instalatorul</p>
                <p className="text-sm text-muted-foreground">
                  Faceți dublu clic pe fișierul descărcat și urmați asistentul de instalare
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Conectați imprimanta</p>
                <p className="text-sm text-muted-foreground">
                  Conectați imprimanta prin USB sau configurați-o pe rețeaua dvs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Testați imprimarea</p>
                <p className="text-sm text-muted-foreground">
                  Imprimați o pagină de test pentru a vă asigura că totul funcționează corect
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Depanare
          </CardTitle>
          <CardDescription>
            Probleme comune și soluții
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-2">Driverul nu se instalează</h4>
            <p className="text-sm text-muted-foreground">
              Asigurați-vă că descărcați driverul corect pentru versiunea sistemului dvs. de operare. 
              Rulați instalatorul ca administrator (Windows) sau cu sudo (Linux).
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-2">Imprimanta nu este detectată</h4>
            <p className="text-sm text-muted-foreground">
              Verificați conexiunea USB sau setările de rețea. Asigurați-vă că imprimanta este pornită 
              și conectată la aceeași rețea ca computerul dvs.
            </p>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium mb-2">Probleme de calitate a imprimării</h4>
            <p className="text-sm text-muted-foreground">
              Actualizați la cea mai recentă versiune de driver, verificați nivelurile de cerneală/toner și rulați 
              utilitățile de întreținere ale imprimantei.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
