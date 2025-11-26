'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ChevronRight, ChevronLeft, Loader2, User, Building2, Euro, MessageSquare, CheckCircle, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface AddRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Contact', description: 'Informații de contact', icon: User },
  { id: 2, title: 'Proprietate', description: 'Tip și camere', icon: Building2 },
  { id: 3, title: 'Buget', description: 'Buget minim și maxim', icon: Euro },
  { id: 4, title: 'Comentarii', description: 'Detalii suplimentare', icon: MessageSquare },
  { id: 5, title: 'Confirmă', description: 'Verifică și finalizează', icon: CheckCircle },
]

const PROPERTY_TYPES = [
  'Apartament',
  'Casă',
  'Vilă',
  'Teren',
  'Spațiu comercial',
  'Spațiu birouri',
  'Alt tip',
]

const CONTACT_TYPES = [
  'Telefon',
  'Email',
  'WhatsApp',
  'SMS',
  'Alt tip',
]

export const AddRequestModal = ({ isOpen, onClose }: AddRequestModalProps) => {
  const { agentData } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    nume: '',
    prenume: '',
    telefon: '',
    tip_contact: '',
    email: '',
    tip_proprietate: '',
    camere_min: '',
    camere_max: '',
    buget_min: '',
    buget_max: '',
    comentarii_generale: '',
  })

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.nume.trim() !== '' && formData.prenume.trim() !== ''
      case 2:
        return true // Optional step
      case 3:
        return true // Optional step
      case 4:
        return true // Optional step
      default:
        return true
    }
  }

  const handleNext = () => {
    if (canProceedToNextStep()) {
      setError(null)
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    } else {
      setError('Completează câmpurile obligatorii pentru a continua')
    }
  }

  const handlePrevious = () => {
    setError(null)
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!formData.nume.trim() || !formData.prenume.trim()) {
      setError('Numele și prenumele sunt obligatorii')
      return
    }

    if (!agentData?.name) {
      setError('Trebuie să fiți autentificat pentru a adăuga o cerere')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rebs/add-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nume: formData.nume,
          prenume: formData.prenume,
          telefon: formData.telefon,
          tip_contact: formData.tip_contact,
          email: formData.email,
          tip_proprietate: formData.tip_proprietate,
          camere_min: formData.camere_min,
          camere_max: formData.camere_max,
          buget_min: formData.buget_min,
          buget_max: formData.buget_max,
          comentarii_generale: formData.comentarii_generale,
          agent_name: agentData.name,
          agentId: agentData.id,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add request')
      }

      // Success
      setSuccess(true)
      
      // Reset form
      setFormData({
        nume: '',
        prenume: '',
        telefon: '',
        tip_contact: '',
        email: '',
        tip_proprietate: '',
        camere_min: '',
        camere_max: '',
        buget_min: '',
        buget_max: '',
        comentarii_generale: '',
      })
      setCurrentStep(1)

      // Close after 2 seconds
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        nume: '',
        prenume: '',
        telefon: '',
        tip_contact: '',
        email: '',
        tip_proprietate: '',
        camere_min: '',
        camere_max: '',
        buget_min: '',
        buget_max: '',
        comentarii_generale: '',
      })
      setCurrentStep(1)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Informații de Contact</h3>
                <p className="text-xs sm:text-sm text-slate-400">Nume, prenume și telefon</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="nume" className="text-white/80 text-xs sm:text-sm font-medium">
                  Nume *
                </Label>
                <Input
                  id="nume"
                  type="text"
                  value={formData.nume}
                  onChange={(e) => handleFieldChange('nume', e.target.value)}
                  placeholder="Ex: Popescu"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="prenume" className="text-white/80 text-xs sm:text-sm font-medium">
                  Prenume *
                </Label>
                <Input
                  id="prenume"
                  type="text"
                  value={formData.prenume}
                  onChange={(e) => handleFieldChange('prenume', e.target.value)}
                  placeholder="Ex: Ion"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="telefon" className="text-white/80 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Telefon
                </Label>
                <Input
                  id="telefon"
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => handleFieldChange('telefon', e.target.value)}
                  placeholder="Ex: 0721234567"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Detalii Proprietate</h3>
                <p className="text-xs sm:text-sm text-slate-400">Tip proprietate și număr de camere</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="tip_proprietate" className="text-white/80 text-xs sm:text-sm font-medium">
                  Tip Proprietate
                </Label>
                <Select
                  value={formData.tip_proprietate}
                  onValueChange={(value) => handleFieldChange('tip_proprietate', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11 sm:h-12 text-sm sm:text-base">
                    <SelectValue placeholder="Selectează tipul proprietății" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-slate-700 focus:bg-slate-700 text-sm">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="camere_min" className="text-white/80 text-xs sm:text-sm font-medium">
                    Camere Min
                  </Label>
                  <Input
                    id="camere_min"
                    type="number"
                    min="0"
                    value={formData.camere_min}
                    onChange={(e) => handleFieldChange('camere_min', e.target.value)}
                    placeholder="Ex: 2"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="camere_max" className="text-white/80 text-xs sm:text-sm font-medium">
                    Camere Max
                  </Label>
                  <Input
                    id="camere_max"
                    type="number"
                    min="0"
                    value={formData.camere_max}
                    onChange={(e) => handleFieldChange('camere_max', e.target.value)}
                    placeholder="Ex: 4"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-xs sm:text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="Ex: client@example.com"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="tip_contact" className="text-white/80 text-xs sm:text-sm font-medium">
                    Tip Contact
                  </Label>
                  <Select
                    value={formData.tip_contact}
                    onValueChange={(value) => handleFieldChange('tip_contact', value)}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11 sm:h-12 text-sm sm:text-base">
                      <SelectValue placeholder="Selectează tipul de contact" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {CONTACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-slate-700 focus:bg-slate-700 text-sm">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <Euro className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Buget</h3>
                <p className="text-xs sm:text-sm text-slate-400">Buget minim și maxim</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="buget_min" className="text-white/80 text-xs sm:text-sm font-medium">
                    Buget Min (€)
                  </Label>
                  <Input
                    id="buget_min"
                    type="number"
                    min="0"
                    value={formData.buget_min}
                    onChange={(e) => handleFieldChange('buget_min', e.target.value)}
                    placeholder="Ex: 50000"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="buget_max" className="text-white/80 text-xs sm:text-sm font-medium">
                    Buget Max (€)
                  </Label>
                  <Input
                    id="buget_max"
                    type="number"
                    min="0"
                    value={formData.buget_max}
                    onChange={(e) => handleFieldChange('buget_max', e.target.value)}
                    placeholder="Ex: 150000"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-11 sm:h-12 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Comentarii Generale</h3>
                <p className="text-xs sm:text-sm text-slate-400">Detalii suplimentare despre cerere</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="comentarii_generale" className="text-white/80 text-xs sm:text-sm font-medium">
                  Comentarii Generale
                </Label>
                <Textarea
                  id="comentarii_generale"
                  value={formData.comentarii_generale}
                  onChange={(e) => handleFieldChange('comentarii_generale', e.target.value)}
                  placeholder="Adaugă detalii suplimentare despre cererea clientului..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[120px] sm:min-h-[150px] resize-none text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white">Confirmare</h3>
                <p className="text-xs sm:text-sm text-slate-400">Verifică informațiile înainte de trimitere</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Nume:</span>
                  <p className="text-white font-medium text-sm sm:text-base break-words">{formData.nume || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Prenume:</span>
                  <p className="text-white font-medium text-sm sm:text-base break-words">{formData.prenume || '-'}</p>
                </div>
                {formData.telefon && (
                  <div>
                    <span className="text-slate-400 text-xs">Telefon:</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{formData.telefon}</p>
                  </div>
                )}
                {formData.email && (
                  <div>
                    <span className="text-slate-400 text-xs">Email:</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{formData.email}</p>
                  </div>
                )}
                {formData.tip_contact && (
                  <div>
                    <span className="text-slate-400 text-xs">Tip Contact:</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{formData.tip_contact}</p>
                  </div>
                )}
                {formData.tip_proprietate && (
                  <div>
                    <span className="text-slate-400 text-xs">Tip Proprietate:</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">{formData.tip_proprietate}</p>
                  </div>
                )}
                {(formData.camere_min || formData.camere_max) && (
                  <div>
                    <span className="text-slate-400 text-xs">Camere:</span>
                    <p className="text-white font-medium text-sm sm:text-base">
                      {formData.camere_min || '0'} - {formData.camere_max || '∞'}
                    </p>
                  </div>
                )}
                {(formData.buget_min || formData.buget_max) && (
                  <div>
                    <span className="text-slate-400 text-xs">Buget:</span>
                    <p className="text-white font-medium text-sm sm:text-base break-words">
                      {formData.buget_min ? `€${parseInt(formData.buget_min).toLocaleString()}` : '€0'} - {formData.buget_max ? `€${parseInt(formData.buget_max).toLocaleString()}` : '∞'}
                    </p>
                  </div>
                )}
              </div>
              {formData.comentarii_generale && (
                <div className="mt-3 sm:mt-4">
                  <span className="text-slate-400 text-xs sm:text-sm">Comentarii:</span>
                  <p className="text-white text-xs sm:text-sm mt-1 break-words">{formData.comentarii_generale}</p>
                </div>
              )}
              {agentData && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700">
                  <span className="text-slate-400 text-xs sm:text-sm">Agent:</span>
                  <p className="text-white font-medium text-sm sm:text-base mt-1 break-words">{agentData.name}</p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalBody>
        <ModalContent>
          {/* Progress Steps */}
          <div className="border-b border-slate-700 p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id

                return (
                  <div key={step.id} className="flex-1 flex items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isActive 
                          ? 'rgb(59 130 246)' 
                          : isCompleted 
                            ? 'rgb(34 197 94)' 
                            : 'rgb(71 85 105)',
                        borderColor: isActive 
                          ? 'rgb(96 165 250)' 
                          : isCompleted 
                            ? 'rgb(74 222 128)' 
                            : 'rgb(100 116 139)',
                      }}
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted ? 'ring-1 sm:ring-2 ring-green-500 ring-offset-1 sm:ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${isActive || isCompleted ? 'text-white' : 'text-slate-400'}`} />
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400" />
                        </motion.div>
                      )}
                    </motion.div>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
            <div className="mt-2 sm:mt-3 text-center">
              <p className="text-xs sm:text-sm font-semibold text-white">{STEPS[currentStep - 1].title}</p>
              <p className="text-[10px] sm:text-xs text-slate-400">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 sm:gap-3"
            >
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 font-medium text-xs sm:text-sm">Cererea a fost adăugată cu succes în CRM REBS!</p>
            </motion.div>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Action Buttons - Inside Modal Content */}
          <div className="border-t border-slate-700 bg-slate-800/50">
            <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 md:p-6">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading || success}
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-10 sm:h-11 text-xs sm:text-sm px-3 sm:px-4"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Înapoi</span>
                  <span className="sm:hidden">←</span>
                </Button>
              )}
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={loading || success || !canProceedToNextStep()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  Continuă
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5 sm:ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || success || !formData.nume.trim() || !formData.prenume.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 h-10 sm:h-11 text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Se trimite...</span>
                      <span className="sm:hidden">Trimite...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Trimis!
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Adaugă Cerere</span>
                      <span className="sm:hidden">Adaugă</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </ModalContent>
      </ModalBody>
    </Modal>
  )
}
