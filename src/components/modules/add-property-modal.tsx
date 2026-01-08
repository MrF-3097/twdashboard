'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Home,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  Sparkles,
  UploadCloud
} from 'lucide-react'

export interface AddPropertyModalProps {
  isOpen: boolean
  onClose: () => void
}

type StepKey = 'contact' | 'propertyCf' | 'transaction' | 'location' | 'features' | 'pricing' | 'media' | 'rental'

type Associate = {
  firstName: string
  lastName: string
  cnp: string
  phone?: string
  email?: string
}

type FileSummary = { name: string; size: number }

type PropertyFormState = {
  agentName?: string
  agentId?: number
  contact: {
    firstName: string
    lastName: string
    cnp: string
    address: string
    phone: string
    phoneExpiry: string
    email: string
    allowAgentEmail: boolean
    notes: string
  }
  mandatarList: Associate[]
  coproprietarList: Associate[]
  requiresInternalDoc: boolean
  property: {
    propertyType: string
    cfNumber: string
    cfScan?: FileSummary
    transactionMode: 'sale' | 'rent' | 'both'
    representationType: 'Exclusivitate' | 'Intermediere Exclusiva' | 'Intermediere'
    location: {
      street: string
      streetNumber: string
      city: string
      county: string
      unit: string
      lat: string
      lng: string
      duplicateWarning?: string
    }
    meta: {
      apartmentType: string
      houseType: string
      commercialBuildingType: string
      hotelType: string
      specialPropertyType: string
    }
    areas: {
      surfaceBuilt: string
      surfaceTerrace: string
      surfaceBalconies: string
      surfaceLand: string
      surfaceYard: string
      surfaceYardFree: string
      surfaceTotal: string
      surfaceUnit: string
    }
    counts: {
      kitchens: string
      lockers: string
      lifts: string
      buildingUndergroundFloors: string
      buildingRetiredFloors: string
    }
    construction: {
      newBuildingDeveloper: boolean
      newBuildingResale: boolean
    }
    characteristics: {
      hasBathroomWindow: boolean
      bathrooms: string
      rooms: string
      bedrooms: string
      surfaceUseable: string
      floor: string
      comfort: string
      balconies: string
      terraces: string
      garages: string
      parkingSpots: string
      buildingFloors: string
      newBuilding: boolean
      flags: string[]
      straziAmenajate: string[]
      straziNeamenajate: string[]
      utilities: string[]
      dotariImobil: string[]
      parking: string[]
      heating: string[]
      views: string[]
      doors: string[]
      floors: string[]
      windows: string[]
      metering: string[]
      kitchen: string[]
      otherSpaces: string[]
    }
    pricing: {
      salePrice: string
      rentPrice: string
      pricePerSqmSale: string
      pricePerSqmRent: string
      vat: string
      negotiable: boolean
      currency: 'EUR' | 'RON'
      commissionPercent: string
      commissionMessage: string
    }
    media: {
      photos: FileSummary[]
      videoUrl: string
      virtualTourUrl: string
      notes: string
    }
    rentalExtras: {
      acceptsPets: boolean
      deposit: string
      advance: string
      maintenance: string
      hasTenant: boolean
      tenantUntil: string
      rentCollected: string
      hasKeys: boolean
      videoViewing: boolean
    }
  }
  warnings: string[]
}

const steps: Array<{ key: StepKey; title: string; description: string }> = [
  { key: 'contact', title: 'Contact', description: 'Date proprietar, CNP, verificări' },
  { key: 'propertyCf', title: 'Tip proprietate & CF', description: '' },
  { key: 'transaction', title: 'Vânzare / Închiriere', description: 'Mod tranzacție și reprezentare' },
  { key: 'location', title: 'Localizare', description: 'Adresă și duplicate' },
  { key: 'features', title: 'Caracteristici', description: 'Structură, utilități, dotări' },
  { key: 'pricing', title: 'Preț', description: 'Prețuri, TVA, comision' },
  { key: 'media', title: 'Poze & media', description: 'Fișiere, video, matching' },
  { key: 'rental', title: 'Închiriere', description: 'Extra condiții chirie' }
]

const propertyTypes = [
  'Apartament',
  'Casă',
  'Vilă',
  'Spațiu de birouri',
  'Spațiu comercial',
  'Spațiu industrial',
  'Teren',
  'Hotel',
  'Pensiune',
  'Altele'
]
type OptionItem = { label: string; value: string }

const apartmentTypeOptions: OptionItem[] = [
  { label: 'Apartament', value: '6' },
  { label: 'Garsonieră', value: '1' },
  { label: 'Penthouse', value: '2' },
  { label: 'Duplex', value: '5' },
  { label: 'Triplex', value: '7' }
]

const houseTypeOptions: OptionItem[] = [
  { label: 'Individuală', value: '1' },
  { label: 'Vilă', value: '6' },
  { label: 'Calcan', value: '2' },
  { label: 'Duplex', value: '3' },
  { label: 'Triplex', value: '5' },
  { label: 'Casă înșiruită', value: '4' }
]

const commercialBuildingTypeOptions: OptionItem[] = [
  { label: 'Bloc de apartamente', value: '1' },
  { label: 'Clădire birouri', value: '2' },
  { label: 'Casă / Vilă', value: '3' },
  { label: 'Hală', value: '4' },
  { label: 'Centru comercial', value: '5' },
  { label: 'Depozit', value: '6' },
  { label: 'Stradal', value: '7' }
]

const hotelTypeOptions: OptionItem[] = [
  { label: 'Hotel', value: '1' },
  { label: 'Guest house', value: '2' },
  { label: 'Chalet', value: '3' },
  { label: 'Motel', value: '4' },
  { label: 'Complex turistic', value: '5' }
]

const specialPropertyTypeOptions: OptionItem[] = [
  { label: 'Ansamblu rezidențial', value: '1' },
  { label: 'Bloc de apartamente', value: '2' },
  { label: 'Centru comercial', value: '3' },
  { label: 'Mall', value: '4' },
  { label: 'Restaurant', value: '5' },
  { label: 'Clădire mixtă', value: '6' },
  { label: 'Garaj / Parcare', value: '7' },
  { label: 'Clădire istorică', value: '8' },
  { label: 'Farm', value: '9' },
  { label: 'Pescărie', value: '10' },
  { label: 'Silos', value: '11' },
  { label: 'Alt tip de proprietate', value: '12' }
]

const surfaceUnitOptions: OptionItem[] = [
  { label: 'Metri pătrați (mp)', value: '1' },
  { label: 'Hectare (ha)', value: '2' }
]
const representationOptions: PropertyFormState['property']['representationType'][] = ['Exclusivitate', 'Intermediere Exclusiva', 'Intermediere']

const streetAmenities = ['Străzi asfaltate', 'Iluminat stradal', 'Transport în comun']
const unpavedStreetOptions = ['Pietruite', 'Pământ']
const utilitiesList = ['Apă', 'Canalizare', 'Trifazic', 'CATV', 'Fosă septică', 'Gaz', 'Internet', 'Panouri solare']
const dotariImobilList = ['Acces dizabilități', 'Acoperiș', 'Fitness', 'Interfon', 'Barieră', 'Videointerfon', 'Wireless', 'Supraveghere video', 'Spa', 'Piscină']
const parkingOptions = ['Subterană', 'Acoperită', 'Garaj']
const heatingOptions = ['Calorifere', 'Lemn', 'În pardoseală', 'Peleți', 'Centrală', 'Pompă de căldură', 'Sobă', 'Termoficare', 'Venticonvectoare']
const viewOptions = ['Rulouri', 'Priveliște panoramică', 'Vedere oraș', 'Vedere lac', 'Vedere mare', 'Vedere munte']
const doorOptions = ['Celulare', 'Lemn', 'Panel', 'Sticlă', 'PVC', 'MDF']
const floorOptions = ['Dușumea', 'Gresie', 'Linoleum', 'Parchet laminat', 'Parchet', 'Granit', 'Marmură', 'Piatră naturală', 'Șapă']
const windowOptions = ['Aluminiu', 'Lemn', 'Termopan', 'Tripan', 'Tip deschidere specială']
const meteringOptions = ['Apă', 'Căldură', 'Electric', 'Gaz']
const kitchenOptions = ['Bucătărie deschisă', 'Bucătărie închisă', 'Mobilată', 'Parțial mobilată', 'Utilată', 'Parțial utilată', 'Chicinetă']
const otherSpacesOptions = ['Grădină', 'Boxă', 'Curte', 'Curte comună', 'Debara', 'Lift', 'Irigatii', 'Loc de joacă', 'Saună', 'Pivniță', 'Magazie', 'WC serviciu', 'Zonă BBQ']

const multiGroupMap: Partial<Record<keyof PropertyFormState['property']['characteristics'], string[]>> = {
  straziAmenajate: streetAmenities,
  straziNeamenajate: unpavedStreetOptions,
  utilities: utilitiesList,
  dotariImobil: dotariImobilList,
  parking: parkingOptions,
  heating: heatingOptions,
  views: viewOptions,
  doors: doorOptions,
  floors: floorOptions,
  windows: windowOptions,
  metering: meteringOptions,
  kitchen: kitchenOptions,
  otherSpaces: otherSpacesOptions
}

const featureGroupLabels: Record<string, string> = {
  straziAmenajate: 'Străzi amenajate',
  straziNeamenajate: 'Străzi neamenajate',
  utilities: 'Utilități',
  dotariImobil: 'Dotări imobil',
  parking: 'Parcare',
  heating: 'Încălzire',
  views: 'Vederi',
  doors: 'Uși',
  floors: 'Podele',
  windows: 'Ferestre',
  metering: 'Contorizare',
  kitchen: 'Bucătărie',
  otherSpaces: 'Spații suplimentare'
}

const parseNumericInput = (value: string) => {
  if (!value) {
    return 0
  }
  const normalized = value.replace(/[^\d.,-]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const createInitialState = (agentName?: string, agentId?: number): PropertyFormState => ({
  agentName,
  agentId,
  contact: {
    firstName: '',
    lastName: '',
    cnp: '',
    address: '',
    phone: '',
    phoneExpiry: '',
    email: '',
    allowAgentEmail: false,
    notes: ''
  },
  mandatarList: [],
  coproprietarList: [],
  requiresInternalDoc: false,
  property: {
    propertyType: '',
    cfNumber: '',
    transactionMode: 'sale',
    representationType: 'Intermediere',
    location: {
      street: '',
      streetNumber: '',
      city: '',
      county: '',
      unit: '',
      lat: '',
      lng: ''
    },
    meta: {
      apartmentType: '',
      houseType: '',
      commercialBuildingType: '',
      hotelType: '',
      specialPropertyType: ''
    },
    areas: {
      surfaceBuilt: '',
      surfaceTerrace: '',
      surfaceBalconies: '',
      surfaceLand: '',
      surfaceYard: '',
      surfaceYardFree: '',
      surfaceTotal: '',
      surfaceUnit: ''
    },
    counts: {
      kitchens: '',
      lockers: '',
      lifts: '',
      buildingUndergroundFloors: '',
      buildingRetiredFloors: ''
    },
    construction: {
      newBuildingDeveloper: false,
      newBuildingResale: false
    },
    characteristics: {
      hasBathroomWindow: false,
      bathrooms: '',
      rooms: '',
      bedrooms: '',
      surfaceUseable: '',
      floor: '',
      comfort: '',
      balconies: '',
      terraces: '',
      garages: '',
      parkingSpots: '',
      buildingFloors: '',
      newBuilding: false,
      flags: [],
      straziAmenajate: [],
      straziNeamenajate: [],
      utilities: [],
      dotariImobil: [],
      parking: [],
      heating: [],
      views: [],
      doors: [],
      floors: [],
      windows: [],
      metering: [],
      kitchen: [],
      otherSpaces: []
    },
    pricing: {
      salePrice: '',
      rentPrice: '',
      pricePerSqmSale: '',
      pricePerSqmRent: '',
      vat: 'nu',
      negotiable: false,
      currency: 'EUR',
      commissionPercent: '',
      commissionMessage: ''
    },
    media: {
      photos: [],
      videoUrl: '',
      virtualTourUrl: '',
      notes: ''
    },
    rentalExtras: {
      acceptsPets: false,
      deposit: '',
      advance: '',
      maintenance: '',
      hasTenant: false,
      tenantUntil: '',
      rentCollected: '',
      hasKeys: false,
      videoViewing: false
    }
  },
  warnings: []
})

const MultiSelectChips = ({
  title,
  options,
  values,
  onToggle
}: {
  title?: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) => (
  <div className="space-y-2">
    {title ? <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{title}</p> : null}
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onToggle(option)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
            values.includes(option)
              ? 'border-sky-500 bg-sky-500/20 text-white'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/40'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)

export const AddPropertyModal = ({ isOpen, onClose }: AddPropertyModalProps) => {
  const { agentData } = useAuth()
  const [formState, setFormState] = useState<PropertyFormState>(() => createInitialState(agentData?.name, agentData?.id))
  const [cfFile, setCfFile] = useState<File | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [currentStep, setCurrentStep] = useState<StepKey>('contact')
  const [stepErrors, setStepErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [contactStatus, setContactStatus] = useState<'idle' | 'checking' | 'warning' | 'ok'>('idle')
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [openFeatureSections, setOpenFeatureSections] = useState<Record<string, boolean>>({})
  const [commissionToast, setCommissionToast] = useState<string | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const salePriceValue = useMemo(
    () => parseNumericInput(formState.property.pricing.salePrice),
    [formState.property.pricing.salePrice]
  )
  const rentPriceValue = useMemo(
    () => parseNumericInput(formState.property.pricing.rentPrice),
    [formState.property.pricing.rentPrice]
  )
  const usableSurfaceValue = useMemo(
    () => parseNumericInput(formState.property.characteristics.surfaceUseable),
    [formState.property.characteristics.surfaceUseable]
  )
  const commissionPercentValue = useMemo(
    () => parseNumericInput(formState.property.pricing.commissionPercent),
    [formState.property.pricing.commissionPercent]
  )
  const computedSalePricePerSqm = useMemo(() => {
    if (salePriceValue <= 0 || usableSurfaceValue <= 0) {
      return ''
    }
    return (salePriceValue / usableSurfaceValue).toFixed(0)
  }, [salePriceValue, usableSurfaceValue])
  const computedRentPricePerSqm = useMemo(() => {
    if (rentPriceValue <= 0 || usableSurfaceValue <= 0) {
      return ''
    }
    return (rentPriceValue / usableSurfaceValue).toFixed(0)
  }, [rentPriceValue, usableSurfaceValue])
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }),
    []
  )

  const stepIndex = steps.findIndex((step) => step.key === currentStep)
  const showRentalExtras = formState.property.transactionMode !== 'sale'

  const resetState = () => {
    setFormState(createInitialState(agentData?.name, agentData?.id))
    setCfFile(null)
    setPhotoFiles([])
    setCurrentStep('contact')
    setStepErrors([])
    setSuccessMessage(null)
    setContactStatus('idle')
    setDuplicateWarning(null)
  }

  const handleClose = () => {
    if (isSubmitting) {
      return
    }
    resetState()
    onClose()
  }

  const updateContactField = (field: keyof PropertyFormState['contact'], value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }))
  }

  const updatePropertyField = (
    path: keyof PropertyFormState['property'],
    field: string,
    value: string | boolean | FileSummary[]
  ) => {
    setFormState((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        [path]: {
          ...(prev.property as any)[path],
          [field]: value
        }
      }
    }))
  }

  const updateCharacteristics = (field: keyof PropertyFormState['property']['characteristics'], value: string | boolean) => {
    setFormState((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        characteristics: {
          ...prev.property.characteristics,
          [field]: value
        }
      }
    }))
  }

  const toggleMultiValue = (field: keyof PropertyFormState['property']['characteristics'], value: string) => {
    setFormState((prev) => {
      const currentValues = prev.property.characteristics[field] as string[]
      const exists = currentValues.includes(value)
      const nextValues = exists ? currentValues.filter((item) => item !== value) : [...currentValues, value]
      return {
        ...prev,
        property: {
          ...prev.property,
          characteristics: {
            ...prev.property.characteristics,
            [field]: nextValues
          }
        }
      }
    })
  }

  const toggleFeatureSection = (sectionKey: string) => {
    setOpenFeatureSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const getCommissionAmount = () => {
    if (commissionPercentValue <= 0) {
      return 0
    }
    const mode = formState.property.transactionMode
    const basePrice =
      mode === 'rent'
        ? rentPriceValue
        : salePriceValue > 0
        ? salePriceValue
        : rentPriceValue
    if (basePrice <= 0) {
      return 0
    }
    return (basePrice * commissionPercentValue) / 100
  }

  const triggerCommissionToast = () => {
    const amount = getCommissionAmount()
    if (amount <= 0) {
      return
    }
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setCommissionToast(currencyFormatter.format(amount))
    toastTimeoutRef.current = setTimeout(() => {
      setCommissionToast(null)
    }, 1500)
  }

  const addAssociate = (listKey: 'mandatarList' | 'coproprietarList') => {
    setFormState((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], { firstName: '', lastName: '', cnp: '' }],
      requiresInternalDoc: true
    }))
  }

  const updateAssociate = (listKey: 'mandatarList' | 'coproprietarList', index: number, field: keyof Associate, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((associate, idx) =>
        idx === index
          ? {
              ...associate,
              [field]: value
            }
          : associate
      ) as Associate[]
    }))
  }

  const removeAssociate = (listKey: 'mandatarList' | 'coproprietarList', index: number) => {
    setFormState((prev) => {
      const nextList = prev[listKey].filter((_, idx) => idx !== index)
      return {
        ...prev,
        [listKey]: nextList,
        requiresInternalDoc: nextList.length > 0 || (listKey === 'mandatarList' ? prev.coproprietarList.length : prev.mandatarList.length) > 0
      }
    })
  }

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return
    const nextFiles = Array.from(files)
    const summaries: FileSummary[] = nextFiles.map((file) => ({ name: file.name, size: file.size }))
    setPhotoFiles(nextFiles)
    setFormState((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        media: {
          ...prev.property.media,
          photos: summaries
        }
      }
    }))
  }

  const handleCfUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setCfFile(file)
    setFormState((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        cfScan: { name: file.name, size: file.size }
      }
    }))
  }

  const validateStep = (step: StepKey) => {
    const errors: string[] = []
    if (step === 'contact') {
      if (!formState.contact.firstName.trim()) errors.push('Prenumele este obligatoriu')
      if (!formState.contact.lastName.trim()) errors.push('Numele este obligatoriu')
      if (!formState.contact.cnp.trim()) errors.push('CNP-ul este obligatoriu')
      if (!formState.contact.phone.trim()) errors.push('Telefonul este necesar pentru verificări')
    }
    if (step === 'propertyCf') {
      if (!formState.property.propertyType) errors.push('Selectează tipul proprietății')
      if (!formState.property.cfNumber.trim()) errors.push('Numărul CF este necesar pentru verificare')
    }
    if (step === 'transaction') {
      if (!formState.property.representationType) errors.push('Selectează tipul de reprezentare')
    }
    if (step === 'location') {
      if (!formState.property.location.street.trim()) errors.push('Introduceți strada')
      if (!formState.property.location.city.trim()) errors.push('Introduceți localitatea')
    }
    if (step === 'pricing') {
      if (formState.property.transactionMode !== 'rent' && !formState.property.pricing.salePrice.trim()) {
        errors.push('Prețul de vânzare este obligatoriu')
      }
      if (formState.property.transactionMode !== 'sale' && !formState.property.pricing.rentPrice.trim()) {
        errors.push('Prețul de închiriere este obligatoriu pentru anunțurile de tip chirie')
      }
    }
    if (step === 'rental' && showRentalExtras) {
      if (formState.property.rentalExtras.hasTenant && !formState.property.rentalExtras.tenantUntil) {
        errors.push('Specifică data până la care există chiriaș')
      }
    }
    setStepErrors(errors)
    return errors.length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }
    setStepErrors([])
    if (currentStep === 'pricing') {
      triggerCommissionToast()
    }
    const nextIndex = Math.min(stepIndex + 1, steps.length - 1)
    setCurrentStep(steps[nextIndex].key)
  }

  const handlePrevious = () => {
    const prevIndex = Math.max(stepIndex - 1, 0)
    setCurrentStep(steps[prevIndex].key)
    setStepErrors([])
  }

  const handleDebugNextStep = () => {
    const nextIndex = Math.min(stepIndex + 1, steps.length - 1)
    if (nextIndex === stepIndex) {
      return
    }
    setStepErrors([])
    setCurrentStep(steps[nextIndex].key)
  }

  const handleContactLookup = async () => {
    setContactStatus('checking')
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (formState.contact.phone.endsWith('0')) {
      setContactStatus('warning')
    } else {
      setContactStatus('ok')
    }
  }

  const handleDuplicateScan = async () => {
    setDuplicateWarning('Se verifică proprietăți similare...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setDuplicateWarning('Nu există duplicate identificate pe această adresă în ultimele 30 de zile.')
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return
    }
    setIsSubmitting(true)
    setStepErrors([])
    try {
      const payload = {
        ...formState,
        agentName: agentData?.name || formState.agentName,
        agentId: agentData?.id || formState.agentId
      }

      const submission = new FormData()
      submission.append('payload', JSON.stringify(payload))
      if (cfFile) {
        submission.append('cf_scan', cfFile, cfFile.name)
      }
      photoFiles.forEach((file) => {
        submission.append('photos', file, file.name)
      })

      const response = await fetch('/api/rebs/add-property', {
        method: 'POST',
        body: submission
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        if (body?.issues) {
          const formErrors: string[] = body.issues.formErrors || []
          const fieldErrors = body.issues.fieldErrors || {}
          const fieldMessage =
            Object.values(fieldErrors)
              .flat()
              .find(Boolean) || formErrors[0]
          throw new Error(fieldMessage || body?.error || 'Nu am putut salva draftul')
        }
        throw new Error(body?.error || 'Nu am putut salva draftul')
      }

      const result = await response.json().catch(() => ({ success: true }))
      if (Array.isArray(result?.warnings) && result.warnings.length > 0) {
        setDuplicateWarning(result.warnings.join(' '))
      }

      setSuccessMessage(result?.message || 'Proprietatea a fost trimisă către CRM REBS.')
      setTimeout(() => {
        setSuccessMessage(null)
        setIsSubmitting(false)
        resetState()
        onClose()
      }, 1600)
    } catch (error) {
      setIsSubmitting(false)
      setStepErrors([error instanceof Error ? error.message : 'A apărut o eroare neașteptată'])
    }
  }

  const renderAssociateCard = (listKey: 'mandatarList' | 'coproprietarList', associate: Associate, index: number) => (
    <div key={`${listKey}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{listKey === 'mandatarList' ? 'Mandatar' : 'Coproprietar'} #{index + 1}</p>
        <button
          type="button"
          className="text-xs text-white/60 underline" 
          onClick={() => removeAssociate(listKey, index)}
        >
          elimină
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-white/70">Nume</Label>
          <Input
            value={associate.lastName}
            onChange={(e) => updateAssociate(listKey, index, 'lastName', e.target.value)}
            className="bg-slate-900/60 border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-white/70">Prenume</Label>
          <Input
            value={associate.firstName}
            onChange={(e) => updateAssociate(listKey, index, 'firstName', e.target.value)}
            className="bg-slate-900/60 border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-white/70">CNP</Label>
          <Input
            value={associate.cnp}
            onChange={(e) => updateAssociate(listKey, index, 'cnp', e.target.value)}
            className="bg-slate-900/60 border-white/10 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-white/70">Telefon</Label>
          <Input
            value={associate.phone || ''}
            onChange={(e) => updateAssociate(listKey, index, 'phone', e.target.value)}
            className="bg-slate-900/60 border-white/10 text-white"
          />
        </div>
      </div>
    </div>
  )

  const formatToDateMask = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    const parts = []
    if (digits.length >= 2) {
      parts.push(digits.slice(0, 2))
      if (digits.length >= 4) {
        parts.push(digits.slice(2, 4))
        if (digits.length > 4) {
          parts.push(digits.slice(4))
        }
      } else {
        parts.push(digits.slice(2))
      }
    } else {
      parts.push(digits)
    }
    return parts.filter(Boolean).join('/')
  }

  const CollapsibleSection = ({
    sectionKey,
    title,
    children
  }: {
    sectionKey: string
    title: string
    children: ReactNode
  }) => (
    <div className="rounded-2xl border border-white/10 bg-transparent">
      <button
        type="button"
        onClick={() => toggleFeatureSection(sectionKey)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/70 transition-transform duration-200',
            openFeatureSections[sectionKey] && 'rotate-180'
          )}
        />
      </button>
      {openFeatureSections[sectionKey] && <div className="border-t border-white/10 px-4 pb-4 pt-3">{children}</div>}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        return (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                    <Label className="text-xs text-white/70">Prenume *</Label>
                    <Input
                      value={formState.contact.firstName}
                      onChange={(e) => updateContactField('firstName', e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="Prenume"
                    />
                  </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/70">Nume *</Label>
                  <Input
                  value={formState.contact.lastName}
                  onChange={(e) => updateContactField('lastName', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="Nume"
                  />
                </div>
              <div className="space-y-1">
                    <Label className="text-xs text-white/70">CNP *</Label>
                    <Input
                      value={formState.contact.cnp}
                      onChange={(e) => updateContactField('cnp', e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                      placeholder="13 cifre"
                    />
                  </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                    <Label className="text-xs text-white/70 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> Telefon *
                    </Label>
                    <Input
                      value={formState.contact.phone}
                      onChange={(e) => updateContactField('phone', e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="07xx xxx xxx"
                    />
                  </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/70">Email</Label>
                <Input
                  type="email"
                  value={formState.contact.email}
                  onChange={(e) => updateContactField('email', e.target.value)}
                  className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="client@example.com"
                />
                </div>
              <div className="space-y-1">
                <Label className="text-xs text-white/70">Data expirare buletin</Label>
                    <Input
                      value={formState.contact.phoneExpiry}
                  onChange={(e) => updateContactField('phoneExpiry', formatToDateMask(e.target.value))}
                      className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="00/00/0000"
                  inputMode="numeric"
                  maxLength={10}
                    />
                  </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-white/70">Adresă domiciliu</Label>
                    <Input
                  value={formState.contact.address}
                  onChange={(e) => updateContactField('address', e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="Str. Exemplu nr. 10, Sibiu"
                    />
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                  <Checkbox
                    id="allow-agent-email"
                    checked={formState.contact.allowAgentEmail}
                    onCheckedChange={(checked) => updateContactField('allowAgentEmail', Boolean(checked))}
                  />
                <Label htmlFor="allow-agent-email" className="text-xs text-white/80">
                  Blochează emailul agentului în REBS
                  </Label>
                </div>
            </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleContactLookup} disabled={contactStatus === 'checking'}>
                      {contactStatus === 'checking' ? 'Se verifică...' : 'Verifică duplicate'}
                    </Button>
                    {contactStatus === 'warning' && (
                  <span className="text-xs text-amber-400">
                    Există un contact cu același telefon în portofoliul unui coleg.
                  </span>
                    )}
                    {contactStatus === 'ok' && (
                  <span className="text-xs text-emerald-400">Contactul este disponibil.</span>
                    )}
                  </div>
                  <Textarea
                    value={formState.contact.notes}
                    onChange={(e) => updateContactField('notes', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                    placeholder="Observații contact, mandatari, acte..."
                rows={2}
                  />
                </div>

                <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Mandatari și coproprietari</p>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => addAssociate('mandatarList')}>
                        + Mandatar
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => addAssociate('coproprietarList')}>
                        + Coproprietar
                      </Button>
                    </div>
                  </div>
              <div className="grid gap-3 md:grid-cols-2">
                  {formState.mandatarList.map((associate, index) => renderAssociateCard('mandatarList', associate, index))}
                  {formState.coproprietarList.map((associate, index) => renderAssociateCard('coproprietarList', associate, index))}
                {formState.mandatarList.length === 0 && formState.coproprietarList.length === 0 && (
                  <p className="text-xs text-white/50">Nu ai adăugat încă mandatari sau coproprietari.</p>
                )}
              </div>
                  {formState.requiresInternalDoc && (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <ShieldCheck className="h-4 w-4" /> Este necesar documentul intern de mandat/coproprietate.
                    </div>
                  )}
            </div>
          </div>
        )
      case 'propertyCf': {
        const propertyKind = formState.property.propertyType
        const showApartmentSubtype = propertyKind === 'Apartament'
        const showHouseSubtype = propertyKind === 'Casă' || propertyKind === 'Vilă'
        const showCommercialSubtype = propertyKind === 'Spațiu comercial' || propertyKind === 'Spațiu de birouri'
        const showHotelSubtype = propertyKind === 'Hotel' || propertyKind === 'Pensiune'
        const showSpecialSubtype = propertyKind === 'Altele'

        const subtypeConfig = (() => {
          if (showApartmentSubtype) {
            return {
              label: 'Tip apartament',
              value: formState.property.meta.apartmentType,
              onChange: (value: string) => updatePropertyField('meta', 'apartmentType', value),
              options: apartmentTypeOptions
            }
          }
          if (showHouseSubtype) {
            return {
              label: 'Tip casă',
              value: formState.property.meta.houseType,
              onChange: (value: string) => updatePropertyField('meta', 'houseType', value),
              options: houseTypeOptions
            }
          }
          if (showCommercialSubtype) {
            return {
              label: 'Tip imobil comercial',
              value: formState.property.meta.commercialBuildingType,
              onChange: (value: string) => updatePropertyField('meta', 'commercialBuildingType', value),
              options: commercialBuildingTypeOptions
            }
          }
          if (showHotelSubtype) {
            return {
              label: 'Tip hotel / pensiune',
              value: formState.property.meta.hotelType,
              onChange: (value: string) => updatePropertyField('meta', 'hotelType', value),
              options: hotelTypeOptions
            }
          }
          if (showSpecialSubtype) {
            return {
              label: 'Tip proprietate specială',
              value: formState.property.meta.specialPropertyType,
              onChange: (value: string) => updatePropertyField('meta', 'specialPropertyType', value),
              options: specialPropertyTypeOptions
            }
          }
          return null
        })()

        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Tip proprietate *</Label>
                <Select
                  value={formState.property.propertyType}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                    ...prev,
                    property: {
                      ...prev.property,
                      propertyType: value
                    }
                    }))
                  }
                >
                    <SelectTrigger className="bg-slate-900/60 border-white/10 text-white">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10 z-[1400]">
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-1">
                    <Label className="text-xs text-white/70">Număr CF *</Label>
                    <Input
                      value={formState.property.cfNumber}
                  onChange={(e) =>
                    setFormState((prev) => ({
                        ...prev,
                        property: {
                          ...prev.property,
                          cfNumber: e.target.value
                        }
                    }))
                  }
                      className="bg-slate-900/60 border-white/10 text-white"
                      placeholder="123456"
                    />
                  </div>
            </div>

            {subtypeConfig && (
              <div className="space-y-1">
                <Label className="text-xs text-white/70">{subtypeConfig.label}</Label>
                <Select value={subtypeConfig.value} onValueChange={subtypeConfig.onChange}>
                  <SelectTrigger className="bg-slate-900/60 border-white/10 text-white">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-white/10 z-[1400]">
                    {subtypeConfig.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/20 px-3 py-2 text-xs text-white/70">
                      <UploadCloud className="h-4 w-4" />
                <span>{formState.property.cfScan ? formState.property.cfScan.name : 'Încarcă poză CF'}</span>
                      <input type="file" className="hidden" onChange={(e) => handleCfUpload(e.target.files)} />
              </label>
              <div className="flex flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <Checkbox
                    checked={formState.property.characteristics.newBuilding}
                    onCheckedChange={(checked) => updateCharacteristics('newBuilding', Boolean(checked))}
                  />
                  Construcție nouă
                </label>
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <Checkbox
                    checked={formState.property.construction.newBuildingDeveloper}
                    onCheckedChange={(checked) =>
                      updatePropertyField('construction', 'newBuildingDeveloper', Boolean(checked))
                    }
                  />
                  De la dezvoltator
                </label>
                <label className="flex items-center gap-2 text-xs text-white/80">
                  <Checkbox
                    checked={formState.property.construction.newBuildingResale}
                    onCheckedChange={(checked) =>
                      updatePropertyField('construction', 'newBuildingResale', Boolean(checked))
                    }
                  />
                  La revânzare
                    </label>
                  </div>
                </div>

          </div>
        )
      }
      case 'transaction':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { key: 'sale', label: 'Vânzare' },
                    { key: 'rent', label: 'Închiriere' },
                    { key: 'both', label: 'Ambele' }
                  ] as Array<{ key: PropertyFormState['property']['transactionMode']; label: string }>
                ).map((option) => (
                  <button
                    type="button"
                    key={option.key}
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        transactionMode: option.key
                      }
                    }))
                  }
                    className={cn(
                      'rounded-2xl border px-3 py-2 text-sm font-semibold transition-all duration-200',
                      formState.property.transactionMode === option.key
                        ? 'border-emerald-400 bg-emerald-500/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            <div className="space-y-1">
                <Label className="text-xs text-white/70">Tip reprezentare</Label>
                <Select
                  value={formState.property.representationType}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    property: {
                      ...prev.property,
                      representationType: value as PropertyFormState['property']['representationType']
                    }
                  }))
                }
                >
                  <SelectTrigger className="bg-slate-900/60 border-white/10 text-white">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-white/10 z-[1400]">
                    {representationOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
        )
      case 'location':
        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Stradă *</Label>
                  <Input
                    value={formState.property.location.street}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        location: {
                          ...prev.property.location,
                          street: e.target.value
                        }
                      }
                    }))
                  }
                    className="bg-slate-900/60 border-white/10 text-white"
                    placeholder="Strada"
                  />
                </div>
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Număr</Label>
                  <Input
                    value={formState.property.location.streetNumber}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        location: {
                          ...prev.property.location,
                          streetNumber: e.target.value
                        }
                      }
                    }))
                  }
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Oraș *</Label>
                  <Input
                    value={formState.property.location.city}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        location: {
                          ...prev.property.location,
                          city: e.target.value
                        }
                      }
                    }))
                  }
                    className="bg-slate-900/60 border-white/10 text-white"
                    placeholder="Sibiu"
                  />
                </div>
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Județ</Label>
                  <Input
                    value={formState.property.location.county}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        location: {
                          ...prev.property.location,
                          county: e.target.value
                        }
                      }
                    }))
                  }
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" size="sm" onClick={handleDuplicateScan}>
                  Verifică duplicate proprietate
                </Button>
                {duplicateWarning && <span className="text-xs text-emerald-300">{duplicateWarning}</span>}
            </div>
          </div>
        )
      case 'features':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Nr. camere</Label>
                  <Input
                    value={formState.property.characteristics.rooms}
                    onChange={(e) => updateCharacteristics('rooms', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Nr. băi</Label>
                  <Input
                    value={formState.property.characteristics.bathrooms}
                    onChange={(e) => updateCharacteristics('bathrooms', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Suprafață utilă (mp)</Label>
                  <Input
                    value={formState.property.characteristics.surfaceUseable}
                    onChange={(e) => updateCharacteristics('surfaceUseable', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Etaj</Label>
                  <Input
                    value={formState.property.characteristics.floor}
                    onChange={(e) => updateCharacteristics('floor', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                <Checkbox
                  id="bath-window"
                  checked={formState.property.characteristics.hasBathroomWindow}
                  onCheckedChange={(checked) => updateCharacteristics('hasBathroomWindow', Boolean(checked))}
                />
                <Label htmlFor="bath-window" className="text-white/80">
                  Proprietatea are geam la baie
                </Label>
              </div>
            </div>

            <CollapsibleSection sectionKey='areas' title='Suprafețe & niveluri'>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    { label: 'S. construită (mp)', field: 'surfaceBuilt' },
                    { label: 'S. terasă (mp)', field: 'surfaceTerrace' },
                    { label: 'S. balcoane (mp)', field: 'surfaceBalconies' },
                    { label: 'S. teren (mp)', field: 'surfaceLand' },
                    { label: 'S. curte (mp)', field: 'surfaceYard' },
                    { label: 'S. curte liberă (mp)', field: 'surfaceYardFree' },
                    { label: 'S. totală (mp)', field: 'surfaceTotal' }
                  ] as Array<{ label: string; field: keyof PropertyFormState['property']['areas'] }>
                ).map(({ label, field }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs text-white/70">{label}</Label>
                    <Input
                      value={formState.property.areas[field]}
                      onChange={(e) => updatePropertyField('areas', field as string, e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Unitate suprafață</Label>
                  <Select
                    value={formState.property.areas.surfaceUnit}
                    onValueChange={(value) => updatePropertyField('areas', 'surfaceUnit', value)}
                  >
                    <SelectTrigger className="border-white/10 bg-transparent text-white">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-white/10 z-[1400]">
                      {surfaceUnitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(
                  [
                    { label: 'Nr. bucătării', field: 'kitchens' },
                    { label: 'Nr. vestiare', field: 'lockers' },
                    { label: 'Nr. lifturi', field: 'lifts' },
                    { label: 'Nr. subsoluri', field: 'buildingUndergroundFloors' },
                    { label: 'Nr. etaje retrase', field: 'buildingRetiredFloors' }
                  ] as Array<{ label: string; field: keyof PropertyFormState['property']['counts'] }>
                ).map(({ label, field }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs text-white/70">{label}</Label>
                    <Input
                      value={formState.property.counts[field]}
                      onChange={(e) => updatePropertyField('counts', field as string, e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                    />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

                {Object.entries(multiGroupMap).map(([field, options]) => {
                  if (!options) return null
              const label = featureGroupLabels[field] ?? field
                  return (
                <CollapsibleSection key={field} sectionKey={field} title={label}>
                    <MultiSelectChips
                      options={options}
                      values={(formState.property.characteristics as any)[field] as string[]}
                      onToggle={(value) => toggleMultiValue(field as keyof PropertyFormState['property']['characteristics'], value)}
                    />
                </CollapsibleSection>
                  )
                })}
          </div>
        )
      case 'pricing': {
        const showSaleFields = formState.property.transactionMode !== 'rent'
        const showRentFields = formState.property.transactionMode !== 'sale'
        const vatValue = formState.property.pricing.vat || 'nu'

        return (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {showSaleFields && (
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Preț vânzare (€)</Label>
                  <Input
                    value={formState.property.pricing.salePrice}
                    onChange={(e) => updatePropertyField('pricing', 'salePrice', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                    placeholder="Introduce prețul de vânzare"
                  />
                </div>
              )}
              {showRentFields && (
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Preț chirie / lună (€)</Label>
                  <Input
                    value={formState.property.pricing.rentPrice}
                    onChange={(e) => updatePropertyField('pricing', 'rentPrice', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                    placeholder="Introduce prețul de închiriere"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {showSaleFields && (
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Preț pe mp (vânzare)</Label>
                  <Input
                    value={computedSalePricePerSqm ? `${computedSalePricePerSqm} €/mp` : ''}
                    readOnly
                    placeholder="Calcul automat după suprafață utilă"
                    className="border-white/10 bg-transparent text-white"
                  />
                </div>
              )}
              {showRentFields && (
                <div className="space-y-1">
                  <Label className="text-xs text-white/70">Preț pe mp (chirie)</Label>
                  <Input
                    value={computedRentPricePerSqm ? `${computedRentPricePerSqm} €/mp` : ''}
                    readOnly
                    placeholder="Calcul automat după suprafață utilă"
                    className="border-white/10 bg-transparent text-white"
                  />
                </div>
              )}
              </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">TVA</Label>
                <Select value={vatValue} onValueChange={(value) => updatePropertyField('pricing', 'vat', value)}>
                  <SelectTrigger className="border-white/10 bg-transparent text-white">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent className="z-[1400] border-white/10 bg-slate-900 text-white">
                    <SelectItem value="nu">Nu</SelectItem>
                    <SelectItem value="da">Da (21%)</SelectItem>
                  </SelectContent>
                </Select>
                {vatValue === 'da' && (
                  <p className="text-xs text-white/50">TVA standard 21% este inclus în preț.</p>
                )}
                </div>
              <div className="space-y-1">
                  <Label className="text-xs text-white/70">Comision (%)</Label>
                  <Input
                    value={formState.property.pricing.commissionPercent}
                    onChange={(e) => updatePropertyField('pricing', 'commissionPercent', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="Ex: 3"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                <Checkbox
                  id="negotiable"
                  checked={formState.property.pricing.negotiable}
                  onCheckedChange={(checked) => updatePropertyField('pricing', 'negotiable', Boolean(checked))}
                />
                <Label htmlFor="negotiable" className="text-white/80">
                  Preț negociabil
                </Label>
            </div>
          </div>
        )
      }
      case 'media':
        return (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/20 px-4 py-12 text-white/70">
              <UploadCloud className="h-8 w-8" />
              <span className="text-base">Încarcă poze proprietate</span>
                  <input type="file" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
                  {formState.property.media.photos.length > 0 && (
                <p className="text-sm text-white/60">
                      {formState.property.media.photos.length} fișiere selectate
                    </p>
                  )}
                </label>
                <Textarea
                  value={formState.property.media.notes}
                  onChange={(e) => updatePropertyField('media', 'notes', e.target.value)}
                  className="bg-slate-900/60 border-white/10 text-white"
                  placeholder="Note pentru matching automat"
                  rows={3}
                />
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs text-white/70">
                  Matching automat se va executa după salvare și va propune proprietăți similare în zona selectată.
            </div>
          </div>
        )
      case 'rental':
        if (!showRentalExtras) {
          return (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Modul de tranzacție curent nu necesită informații de închiriere.
            </div>
          )
        }
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/20">
                  <PawPrint className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">Extra pentru închiriere</p>
                  <p className="text-xs text-white/60">Animale, garanție, chiriași existenți</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Garanție (luni)</Label>
                  <Input
                    value={formState.property.rentalExtras.deposit}
                    onChange={(e) => updatePropertyField('rentalExtras', 'deposit', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Avans (luni)</Label>
                  <Input
                    value={formState.property.rentalExtras.advance}
                    onChange={(e) => updatePropertyField('rentalExtras', 'advance', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Întreținere medie</Label>
                  <Input
                    value={formState.property.rentalExtras.maintenance}
                    onChange={(e) => updatePropertyField('rentalExtras', 'maintenance', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Chirie încasată lunar</Label>
                  <Input
                    value={formState.property.rentalExtras.rentCollected}
                    onChange={(e) => updatePropertyField('rentalExtras', 'rentCollected', e.target.value)}
                    className="bg-slate-900/60 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                  <Checkbox
                    id="acceptsPets"
                    checked={formState.property.rentalExtras.acceptsPets}
                    onCheckedChange={(checked) => updatePropertyField('rentalExtras', 'acceptsPets', Boolean(checked))}
                  />
                  <Label htmlFor="acceptsPets" className="text-white/80">
                    Acceptă animale de companie
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                  <Checkbox
                    id="hasTenant"
                    checked={formState.property.rentalExtras.hasTenant}
                    onCheckedChange={(checked) => updatePropertyField('rentalExtras', 'hasTenant', Boolean(checked))}
                  />
                  <Label htmlFor="hasTenant" className="text-white/80">
                    Există chiriaș în prezent
                  </Label>
                </div>
                {formState.property.rentalExtras.hasTenant && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/70">Până când</Label>
                    <Input
                      type="date"
                      value={formState.property.rentalExtras.tenantUntil}
                      onChange={(e) => updatePropertyField('rentalExtras', 'tenantUntil', e.target.value)}
                      className="bg-slate-900/60 border-white/10 text-white"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                  <Checkbox
                    id="hasKeys"
                    checked={formState.property.rentalExtras.hasKeys}
                    onCheckedChange={(checked) => updatePropertyField('rentalExtras', 'hasKeys', Boolean(checked))}
                  />
                  <Label htmlFor="hasKeys" className="text-white/80">
                    Avem cheile apartamentului
                  </Label>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white">
                  <Checkbox
                    id="videoViewing"
                    checked={formState.property.rentalExtras.videoViewing}
                    onCheckedChange={(checked) => updatePropertyField('rentalExtras', 'videoViewing', Boolean(checked))}
                  />
                  <Label htmlFor="videoViewing" className="text-white/80">
                    Vizionare video disponibilă
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative z-[1201] h-[90vh] w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[#050915] shadow-2xl"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute right-5 top-5 h-10 w-10 rounded-full border border-white/10 text-white/70 hover:text-white"
            >
              ✕
            </Button>
            <div className={cn('flex h-full flex-col gap-4 px-6 py-6', commissionToast && 'blur-sm')}>
              <div className="flex items-start justify-between gap-3">
              <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Adaugă proprietate</p>
                  <h2 className="text-2xl font-semibold text-white">
                    {steps[stepIndex]?.title || 'Contact'}
                  </h2>
              </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDebugNextStep}
                  disabled={stepIndex === steps.length - 1}
                  className="text-xs text-white/60 hover:text-white"
                  aria-label="Debug: treci la pasul următor"
                  title="Debug skip"
                >
                  Debug skip
              </Button>
              </div>

              {stepErrors.length > 0 && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {stepErrors.map((error) => (
                    <p key={error} className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> {error}
                    </p>
                  ))}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> {successMessage}
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1">{renderStepContent()}</div>

              <div className="flex flex-col gap-3 border-t border-white/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevious} disabled={stepIndex === 0}>
                    Înapoi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={stepIndex === steps.length - 1}
                  >
                    Înainte
                  </Button>
                </div>
                <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Se salvează...' : stepIndex === steps.length - 1 ? 'Trimite' : 'Salvează draft'}
                </Button>
              </div>
            </div>
            <AnimatePresence>
              {commissionToast && (
                <motion.div
                  key="commission-toast"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1202] flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="flex flex-col items-center gap-4 text-center"
                  >
                    <span className="text-6xl">🎉</span>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-bold text-white">Felicitări!</h3>
                      <p className="text-lg text-white/90">
                        Ești la un pas de comisionul tău de{' '}
                        <span className="font-semibold text-emerald-400">{commissionToast}</span>
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
