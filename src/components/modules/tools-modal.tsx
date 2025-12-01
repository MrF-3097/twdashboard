'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Building2, Printer, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTool: (toolId: string) => void
}

const tools = [
  { id: 'documents', icon: FileText, label: 'Documente', description: 'Convertește și gestionează documente' },
  { id: 'real-estate', icon: Building2, label: 'Imobiliare', description: 'Generează anunțuri imobiliare cu AI' },
  { id: 'printer', icon: Printer, label: 'Driver', description: 'Gestionare driver-uri imprimantă' },
  { id: 'image-editor', icon: Image, label: 'Imagini', description: 'Editează și extinde imagini' },
]

export const ToolsModal = ({ isOpen, onClose, onSelectTool }: ToolsModalProps) => {
  const handleToolSelect = (toolId: string) => {
    onSelectTool(toolId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-md border-slate-700 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Unelte</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selectează un instrument pentru a continua
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3 mt-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className="w-full justify-start h-auto p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex-shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">{tool.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{tool.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

