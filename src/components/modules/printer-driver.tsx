'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { 
  Printer, 
  Download, 
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import type { PrinterDriver } from '@/types'

export function PrinterDriver() {
  const [selectedDriver, setSelectedDriver] = useState<PrinterDriver | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isInstallationOpen, setIsInstallationOpen] = useState(false)
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false)
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


  return (
    <div className="space-y-6">
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

      {/* Installation Instructions - Collapsible */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setIsInstallationOpen(!isInstallationOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <CardTitle>Instrucțiuni de Instalare</CardTitle>
              <CardDescription>
                Urmați acești pași pentru a instala driverul de imprimantă
              </CardDescription>
            </div>
            <ChevronDown 
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                isInstallationOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </CardHeader>
        {isInstallationOpen && (
          <CardContent className="space-y-4 pt-0">
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
        )}
      </Card>

      {/* Troubleshooting - Collapsible */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setIsTroubleshootingOpen(!isTroubleshootingOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <CardTitle>Depanare</CardTitle>
                <CardDescription>
                  Probleme comune și soluții
                </CardDescription>
              </div>
            </div>
            <ChevronDown 
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                isTroubleshootingOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </CardHeader>
        {isTroubleshootingOpen && (
          <CardContent className="space-y-3 pt-0">
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
        )}
      </Card>
    </div>
  )
}
