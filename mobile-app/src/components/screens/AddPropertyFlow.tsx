/**
 * AddPropertyFlow Component
 * Multi-step form for adding a new property
 * Based on AddClientFlow structure
 * Translated to Romanian
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { createScopedLogger } from '@/lib/logger';

interface AddPropertyFlowProps {
  onBack?: () => void;
  onComplete?: () => void;
}

const logger = createScopedLogger('AddPropertyFlow');

export const AddPropertyFlow: React.FC<AddPropertyFlowProps> = ({ onBack, onComplete }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agentData } = useAuth();
  const [step, setStep] = useState(1);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [transactionMode, setTransactionMode] = useState<'sale' | 'rent' | 'both' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [formData, setFormData] = useState({
    // Contact info
    firstName: '',
    lastName: '',
    cnp: '',
    phone: '',
    email: '',
    // Location
    street: '',
    streetNumber: '',
    city: '',
    county: '',
    // Property details
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    surfaceUseable: '',
    floor: '',
    // Pricing
    salePrice: '',
    rentPrice: '',
  });

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
  ];

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // Animation refs for smooth step transitions
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const previousStep = useRef(step);

  // Animate step transitions
  useEffect(() => {
    if (previousStep.current !== step) {
      // Fade out and slide out current step
      Animated.parallel([
        Animated.timing(stepOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset position for new step
        stepTranslateX.setValue(20);
        previousStep.current = step;
        
        // Fade in and slide in new step
        Animated.parallel([
          Animated.timing(stepOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(stepTranslateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [step]);

  // Characteristics organized by groups (only valid tags from REBS API schema)
  const characteristicGroups: Record<string, string[]> = {
    'Dotări': [
      'Aer condiționat',
      'Aeroterme',
      'Aragaz',
      'Bideu',
      'Cabină de duș',
      'Cadă',
      'Dressing',
      'Duș exterior',
      'Frigider',
      'Hotă',
      'Jacuzzi',
      'Mașină de spălat rufe',
      'Mașină de spălat vase',
      'Scară interioară',
      'Șemineu',
      'Sistem de alarmă',
      'TV',
    ],
    'Dotări imobil': [
      'Acces pentru persoane cu dizabilități',
      'Acoperiș',
      'Beach',
      'Cameră de aburi',
      'Facilități sportive',
      'Fitness',
      'Hot tub',
      'Interfon',
      'Lift',
      'Parcare biciclete',
      'Pază',
      'Pază permanentă',
      'Piscină comunală',
      'Piscină exterioară',
      'Piscină interioară',
      'Piscină privată',
      'Recepție',
      'Restaurant în clădire',
      'Saună',
      'Senzor de fum',
      'Spa',
      'Spălătorie',
      'Spații agrement',
      'Supraveghere video',
      'Telecomandă poartă acces auto',
      'Telecomandă poartă garaj',
      'Uscătorie',
      'Videointerfon',
      'Wireless',
      'Zonă pentru barbeque',
    ],
    'Amenajare străzi': [
      'Iluminat stradal',
      'Mijloace de transport în comun',
      'Străzi asfaltate',
      'Străzi betonate',
      'Străzi de pământ',
      'Străzi neamenajate',
      'Străzi pietruite',
    ],
    'Utilități generale': [
      'Apă',
      'Canalizare',
      'CATV',
      'Curent',
      'Curent trifazic (380V)',
      'Fosă septică',
      'Gaz',
      'Internet',
      'Panouri solare',
      'Telefon',
      'Telefon internațional',
    ],
    'Izolații termice': [
      'Izolație exterioară',
      'Izolație interioară',
    ],
    'Parcare': [
      'Garaj',
      'Garaj subteran',
      'Parcare acoperită',
      'Parcare deschisă',
    ],
    'Sistem încălzire': [
      'Calorifere',
      'Centrală cu lemne',
      'Centrală cu peleți',
      'Centrală imobil',
      'Centrală proprie',
      'Încălzire diesel',
      'Încălzire prin pardoseală',
      'Pompă de căldură',
      'Sobă / Teracotă',
      'Termoficare',
      'Ventiloconvectoare',
    ],
    'Priveliște': [
      'Vedere panoramică',
      'Vedere spre lac',
      'Vedere spre mare',
      'Vedere spre munte',
      'Vedere spre oraș',
    ],
    'Ușă intrare': [
      'Ușă intrare lemn',
      'Ușă intrare metal',
      'Ușă intrare pal',
      'Ușă intrare PVC',
      'Ușă intrare sticlă',
    ],
    'Pereți': [
      'Faianță',
      'Glet',
      'Lambriu',
      'Pereți piatră naturală',
      'Tapet',
      'Var',
      'Vopsea lavabilă',
    ],
    'Mobilat': [
      'Mobilat complet',
      'Mobilat lux',
      'Mobilat parțial',
      'Nemobilat',
    ],
    'Bucătărie': [
      'Bucătărie deschisă',
      'Bucătărie închisă',
      'Bucătărie mobilată',
      'Bucătărie parțial mobilată',
      'Bucătărie parțial utilată',
      'Bucătărie utilată',
      'Chicinetă',
    ],
    'Ferestre': [
      'Ferestre aluminiu',
      'Ferestre care se deschid',
      'Ferestre lemn',
      'Ferestre PVC',
      'Geamuri cu izolație fonică',
      'Geamuri cu protecție UV',
      'Geamuri termopan',
      'Geamuri tripan',
    ],
    'Contorizare': [
      'Apometre',
      'Contor căldură',
      'Contor electric',
      'Contor gaz',
    ],
    'Uși interior': [
      'Uși interior celulare',
      'Uși interior cu panel',
      'Uși interior lemn',
      'Uși interior MDF',
      'Uși interior PVC',
      'Uși interior sticlă',
    ],
    'Podele': [
      'Dușumea',
      'Gresie',
      'Linoleum',
      'Mochetă',
      'Parchet',
      'Parchet laminat',
      'Podele granit',
      'Podele marmură',
      'Podele piatră naturală',
      'Șapă',
    ],
    'Alte spații': [
      'Boxă la subsol',
      'Curte',
      'Curte comună',
      'Debara',
      'Grădină proprie',
      'Irigații',
      'Loc de joacă copii',
      'Magazie',
      'Pivniță',
      'WC Serviciu',
      'Cameră de aburi',
      'Facilități sportive',
      'Spații agrement',
      'Zonă pentru barbeque',
    ],
    'Rulouri / Obloane': [
      'Rulouri / obloane aluminiu',
      'Rulouri / obloane electrice',
      'Rulouri / obloane lemn',
      'Rulouri / obloane manuale',
      'Rulouri / obloane PVC',
    ],
    'Jaluzele': [
      'Jaluzele orizontale',
      'Jaluzele verticale',
    ],
    'Elemente ECO': [
      'Building management system',
      'Certificare Green Building',
      'Echipamente moderne / silențioase',
      'Fațadă ventilată',
      'Incărcător auto electrice',
      'Panouri solare',
      'Parcare biciclete',
      'Sistem electric inteligent',
      'Sistem inteligent ascensoare',
    ],
    'Facilități clădire / proximități': [
      'Cafenea la parter',
      'Centru comercial în apropiere',
      'Restaurant în clădire',
      'Stație de autobuz în apropiere',
      'Stație de metrou în apropiere',
      'Stație de tramvai în apropiere',
    ],
    'Servicii asigurate în clădire': [
      'Acces pentru persoane cu dizabilități',
      'Administrare și management imobiliar',
      'Afișare logo pe clădire',
      'Consumabile grupuri sociale',
      'Contorizare separată',
      'Curățenie exterioară',
      'Curățenie parcare',
      'Curățenie spații comune',
      'Îndepărtarea zăpezii',
      'Îngrijirea spațiilor verzi',
      'Salubritate',
      'Servicii de întreținere și reparații lifturi',
      'Sistem de ventilație',
      'Vestiar',
    ],
    'Climatizare birou': [
      'Aport de aer proaspăt',
      'Centrală termică',
      'Control individual AC pentru fiecare zonă de birou',
      'Sistem climatizare 2 țevi',
      'Sistem climatizare 4 țevi',
      'Unități Split',
      'Ventilație mecanică',
    ],
    'Sistem electric': [
      'Control electric individual pe zona de birou',
      'Generator de urgență',
      'Necesită surse suplimentare de energie',
      'Sursă principală de alimentare',
      'Sursa UPS',
    ],
    'Siguranță și securitate': [
      'Acces securizat parcare',
      'Cameră server',
      'CCTV',
      'Control acces securizat pe bază de cartele',
      'Control al accesului pe zone',
      'Detectoare de fum/incendiu',
      'Extinctoare sprinkler',
      'Pază permanentă',
      'Recepție',
      'Semaforizare parcare',
      'Server room cu rack, ventilație, control acces',
      'Sistem de alarmă',
      'Sistem de evacuare',
      'Sisteme de securitate integrate BMS',
    ],
    'IT&C': [
      'Internet',
      'Posibilitatea alegerii operator date / telefonie',
      'Sistem modern de telecomunicații',
      'Telefon',
      'Telefon internațional',
    ],
    'Arhitectură': [
      'Cortină de sticlă',
      'Ferestre care se deschid',
      'Ferestre înclinate',
      'Gresie',
      'Grupuri sanitare amenajate și utilate',
      'Lift cu destinație programată',
      'Mochetă',
      'Parchet',
      'Podea înălțată',
      'Post trafo',
      'Tavan fals',
    ],
    'Alte caracteristici': [
      'Acces auto',
      'Construcție demolabilă',
      'La șosea',
      'Oportunitate de investiții',
      'Parcelabil',
      'Studiu Geo',
      'Teren împrejmuit',
      'Acces pentru persoane cu dizabilități',
      'Acces secundar marfă',
      'Centrală termică',
      'Sistem de alarmă',
      'Sistem de ventilație',
      'Vestiar',
    ],
    'Alte caracteristici spațiu comercial': [
      'Acces pentru persoane cu dizabilități',
      'Acces secundar marfă',
      'Afișare logo pe clădire',
      'Centrală termică',
      'Contorizare separată',
      'Grupuri sanitare amenajate și utilate',
      'Posibilitate terasă',
      'Sistem de alarmă',
      'Sistem de ventilație',
      'Vestiar',
    ],
    'Alte caracteristici spațiu industrial': [
      'Acces auto',
      'Acces TIR',
      'Construcție demolabilă',
      'Curent trifazic (380V)',
      'La șosea',
      'Luminatoare',
      'Oportunitate de investiții',
      'Panouri solare',
      'Pod rulant',
      'Posibilitate de compartimentare',
      'Sistem de alarmă',
      'Teren împrejmuit',
      'Uși de acces',
      'Vestiar',
    ],
    'Utilități teren': [
      'Apă',
      'Canalizare',
      'CATV',
      'Curent',
      'Curent trifazic (380V)',
      'Fosă septică',
      'Gaz',
      'Internet',
      'Telefon',
      'Irigații',
      'Utilități în zonă',
    ],
  };

  // State for selected characteristics (organized by group)
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<Record<string, string[]>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Icon mapping for each characteristic group (filled monochrome icons)
  const groupIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'Dotări': 'star',
    'Dotări imobil': 'home',
    'Amenajare străzi': 'map',
    'Utilități generale': 'flash',
    'Izolații termice': 'snow',
    'Parcare': 'car',
    'Sistem încălzire': 'flame',
    'Priveliște': 'eye',
    'Ușă intrare': 'home',
    'Pereți': 'square',
    'Mobilat': 'bed',
    'Bucătărie': 'restaurant',
    'Ferestre': 'square',
    'Contorizare': 'speedometer',
    'Uși interior': 'grid',
    'Podele': 'layers',
    'Alte spații': 'cube',
    'Rulouri / Obloane': 'eye',
    'Jaluzele': 'eye',
    'Elemente ECO': 'leaf',
    'Facilități clădire / proximități': 'location',
    'Servicii asigurate în clădire': 'business',
    'Climatizare birou': 'snow',
    'Sistem electric': 'flash',
    'Siguranță și securitate': 'shield',
    'IT&C': 'wifi',
    'Arhitectură': 'construct',
    'Alte caracteristici': 'ellipsis-horizontal',
    'Alte caracteristici spațiu comercial': 'storefront',
    'Alte caracteristici spațiu industrial': 'build',
    'Utilități teren': 'water',
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.cnp.trim() || !formData.phone.trim()) {
      setError('Completează toate câmpurile obligatorii (prenume, nume, CNP, telefon)');
      return;
    }

    if (!propertyType) {
      setError('Selectează tipul proprietății');
      return;
    }

    if (!transactionMode) {
      setError('Selectează modul de tranzacție');
      return;
    }

    if (!formData.street.trim() || !formData.city.trim()) {
      setError('Completează adresa proprietății');
      return;
    }

    if (!agentData?.name) {
      setError('Trebuie să fiți autentificat pentru a adăuga o proprietate');
      return;
    }

    setLoading(true);
    setError(null);

    const startTime = Date.now();
    logger.log('=== Starting property submission with AI title/description generation ===');

    try {
      // Build payload matching the server schema exactly (same as AddPropertyModal)
      // This will use the /api/rebs/add-property endpoint which generates title and description via OpenAI
      const payload = {
        agentName: agentData.name,
        agentId: agentData.id,
        contact: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          cnp: formData.cnp.trim(),
          address: '',
          phone: formData.phone.trim(),
          phoneExpiry: '',
          email: formData.email.trim() || '',
          allowAgentEmail: false,
          notes: ''
        },
        mandatarList: [],
        coproprietarList: [],
        requiresInternalDoc: false,
        property: {
          propertyType: propertyType,
          cfNumber: '',
          cfScan: undefined,
          transactionMode: transactionMode,
          representationType: 'Intermediere' as 'Exclusivitate' | 'Intermediere Exclusiva' | 'Intermediere',
          location: {
            street: formData.street.trim(),
            streetNumber: formData.streetNumber.trim() || '',
            city: formData.city.trim(),
            county: formData.county.trim() || '',
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
            bathrooms: formData.bathrooms.trim() || '',
            rooms: formData.rooms.trim() || '',
            bedrooms: formData.bedrooms.trim() || '',
            surfaceUseable: formData.surfaceUseable.trim() || '',
            floor: formData.floor.trim() || '',
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
            salePrice: formData.salePrice.trim() || '',
            rentPrice: formData.rentPrice.trim() || '',
            pricePerSqmSale: '',
            pricePerSqmRent: '',
            vat: 'nu',
            negotiable: false,
            currency: 'EUR' as 'EUR' | 'RON',
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
      };

      // Add selected characteristics to the appropriate arrays
      const allSelectedTags: string[] = [];
      Object.values(selectedCharacteristics).forEach((tags) => {
        allSelectedTags.push(...tags);
      });
      
      // Map characteristics to the correct arrays in the payload
      // This is a simplified mapping - you may need to adjust based on your characteristic groups
      if (allSelectedTags.length > 0) {
        // Add to dotariImobil as a default - adjust based on your needs
        payload.property.characteristics.dotariImobil = allSelectedTags;
        logger.log('Selected characteristics:', allSelectedTags);
      }

      const submission = new FormData();
      submission.append('payload', JSON.stringify(payload));

      // Use the same API URL logic as AddPropertyModal
      let apiUrl: string;
      if (__DEV__) {
        // In development, try to detect if we're on web or native
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            apiUrl = 'http://localhost:3000/api/rebs/add-property';
          } else {
            apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-property';
          }
        } else {
          // React Native - use production URL
          apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-property';
        }
      } else {
        apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-property';
      }

      logger.log('Submitting property to:', apiUrl);
      logger.log('Payload structure:', {
        hasPayload: !!payload,
        hasContact: !!payload.contact,
        hasProperty: !!payload.property,
        contactName: `${payload.contact.firstName} ${payload.contact.lastName}`,
        propertyType: payload.property.propertyType,
        transactionMode: payload.property.transactionMode,
        location: `${payload.property.location.street}, ${payload.property.location.city}`,
        characteristicsCount: allSelectedTags.length
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logger.error('Request timeout after 30 seconds');
      }, 30000);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: submission,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        logger.log(`Response received in ${elapsed}ms`);
        logger.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = 'Nu am putut salva proprietatea';
          try {
            const body = await response.json();
            logger.error('API Error Response:', JSON.stringify(body, null, 2));
            
            // Log detailed field errors
            if (body?.issues?.fieldErrors) {
              logger.error('Field Errors:', JSON.stringify(body.issues.fieldErrors, null, 2));
              const fieldErrorMessages: string[] = [];
              Object.entries(body.issues.fieldErrors).forEach(([field, errors]) => {
                if (Array.isArray(errors)) {
                  errors.forEach((err: string) => {
                    fieldErrorMessages.push(`${field}: ${err}`);
                  });
                }
              });
              if (fieldErrorMessages.length > 0) {
                errorMessage = fieldErrorMessages.join(', ');
              }
            }
            
            if (body?.issues?.formErrors && body.issues.formErrors.length > 0) {
              errorMessage = body.issues.formErrors[0];
            } else if (body?.error && errorMessage === 'Nu am putut salva proprietatea') {
              errorMessage = body.error;
            }
          } catch (e) {
            const text = await response.text().catch(() => '');
            logger.error('API Error Text:', text);
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        logger.log('Success response:', JSON.stringify(result, null, 2));

        if (!result.success) {
          throw new Error(result.error || 'Nu am putut adăuga proprietatea');
        }

        const totalElapsed = Date.now() - startTime;
        logger.log(`=== Property submission successful in ${totalElapsed}ms ===`);
        logger.log('Property ID:', result.propertyId);
        logger.log('Title and description were auto-generated by OpenAI');

        // Success - navigate back or call onComplete
        if (onComplete) {
          onComplete();
        } else {
          router.back();
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          logger.error('Request timed out');
          throw new Error('Cererea a expirat. Verifică conexiunea la internet și încearcă din nou.');
        }

        throw fetchError;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger.error(`=== Property submission failed after ${elapsed}ms ===`);
      logger.error('Error details:', err);

      if (err instanceof Error) {
        logger.error('Error message:', err.message);
        logger.error('Error stack:', err.stack);
        setError(err.message);
      } else {
        logger.error('Unknown error type:', typeof err, err);
        setError('A apărut o eroare neașteptată');
      }
    } finally {
      setLoading(false);
      logger.log('=== Submission process completed ===');
    }
  };

  const canProceedStep1 = propertyType !== null;
  const canProceedStep2 = transactionMode !== null;
  const canProceedStep3 = formData.firstName.trim() && formData.lastName.trim() && formData.cnp.trim() && formData.phone.trim() && formData.street.trim() && formData.city.trim();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Adaugă Proprietate Nouă</Text>
            <Text style={styles.headerSubtitle}>Pasul {step} din {totalSteps}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Property Type */}
        {step === 1 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Ce tip de proprietate?</Text>
              <Text style={styles.stepDescription}>Selectează tipul proprietății</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tip proprietate *</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowPropertyTypeSelect(!showPropertyTypeSelect)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <Text style={[styles.selectText, !propertyType && styles.selectTextPlaceholder]}>
                    {propertyType || 'Selectează tipul proprietății'}
                  </Text>
                  <Ionicons
                    name={showPropertyTypeSelect ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>

                {showPropertyTypeSelect && (
                  <View style={styles.selectOptions}>
                    {propertyTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.selectOption,
                          propertyType === type && styles.selectOptionActive,
                        ]}
                        onPress={() => {
                          setPropertyType(type);
                          setShowPropertyTypeSelect(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            propertyType === type && styles.selectOptionTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                        {propertyType === type && (
                          <Ionicons name="checkmark" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 2: Transaction Mode */}
        {step === 2 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Mod tranzacție</Text>
              <Text style={styles.stepDescription}>Selectează modul de tranzacție</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  transactionMode === 'sale' && styles.optionCardActive,
                ]}
                onPress={() => setTransactionMode('sale')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  transactionMode === 'sale' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="cash"
                    size={24}
                    color={transactionMode === 'sale' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>De vânzare</Text>
                </View>
                {transactionMode === 'sale' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  transactionMode === 'rent' && styles.optionCardActive,
                ]}
                onPress={() => setTransactionMode('rent')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  transactionMode === 'rent' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="calendar"
                    size={24}
                    color={transactionMode === 'rent' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>De închiriat</Text>
                </View>
                {transactionMode === 'rent' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  transactionMode === 'both' && styles.optionCardActive,
                ]}
                onPress={() => setTransactionMode('both')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  transactionMode === 'both' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="swap-horizontal"
                    size={24}
                    color={transactionMode === 'both' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Ambele</Text>
                </View>
                {transactionMode === 'both' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Step 3: Property Details */}
        {step === 3 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Detalii proprietate</Text>
              <Text style={styles.stepDescription}>Informații de bază și contact</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prenume proprietar *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.firstName}
                    onChangeText={(value) => setFormData({ ...formData, firstName: value })}
                    placeholder="Ion"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nume proprietar *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.lastName}
                    onChangeText={(value) => setFormData({ ...formData, lastName: value })}
                    placeholder="Popescu"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CNP *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="card" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.cnp}
                    onChangeText={(value) => setFormData({ ...formData, cnp: value })}
                    placeholder="13 cifre"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    maxLength={13}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(value) => setFormData({ ...formData, phone: value })}
                    placeholder="0721234567"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => setFormData({ ...formData, email: value })}
                    placeholder="ion@example.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Stradă *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.street}
                    onChangeText={(value) => setFormData({ ...formData, street: value })}
                    placeholder="Strada Exemplu"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>

              <View style={styles.budgetRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Număr</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={formData.streetNumber}
                      onChangeText={(value) => setFormData({ ...formData, streetNumber: value })}
                      placeholder="123"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Oraș *</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(value) => setFormData({ ...formData, city: value })}
                      placeholder="București"
                      placeholderTextColor={colors.text.muted}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Județ</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="map" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.county}
                    onChangeText={(value) => setFormData({ ...formData, county: value })}
                    placeholder="București"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 4: Additional Details */}
        {step === 4 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Detalii suplimentare</Text>
              <Text style={styles.stepDescription}>Caracteristici și prețuri</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.budgetRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Camere</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="bed" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.rooms}
                      onChangeText={(value) => setFormData({ ...formData, rooms: value })}
                      placeholder="3"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Dormitoare</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="bed" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.bedrooms}
                      onChangeText={(value) => setFormData({ ...formData, bedrooms: value })}
                      placeholder="2"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.budgetRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Băi</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="water" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.bathrooms}
                      onChangeText={(value) => setFormData({ ...formData, bathrooms: value })}
                      placeholder="1"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Suprafață utilă (mp)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="square" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.surfaceUseable}
                      onChangeText={(value) => setFormData({ ...formData, surfaceUseable: value })}
                      placeholder="75"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Etaj</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="layers" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.floor}
                    onChangeText={(value) => setFormData({ ...formData, floor: value })}
                    placeholder="2"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {(transactionMode === 'sale' || transactionMode === 'both') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Preț vânzare (€)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="cash" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.salePrice}
                      onChangeText={(value) => setFormData({ ...formData, salePrice: value })}
                      placeholder="150000"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {(transactionMode === 'rent' || transactionMode === 'both') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Preț închiriere (€/lună)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.rentPrice}
                      onChangeText={(value) => setFormData({ ...formData, rentPrice: value })}
                      placeholder="500"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Step 5: Characteristics */}
        {step === 5 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Caracteristici</Text>
              <Text style={styles.stepDescription}>Selectează caracteristicile proprietății</Text>
            </View>

            <View style={styles.formContainer}>
              {Object.entries(characteristicGroups).map(([groupName, characteristics]) => {
                const isOpen = openDropdowns[groupName] || false;
                const selected = selectedCharacteristics[groupName] || [];
                const selectedCount = selected.length;

                return (
                  <View key={groupName} style={styles.inputGroup}>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setOpenDropdowns({ ...openDropdowns, [groupName]: !isOpen })}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectLeftContent}>
                        <Ionicons
                          name={groupIcons[groupName] || 'ellipse'}
                          size={20}
                          color={colors.primary}
                          style={styles.selectIcon}
                        />
                        <Text style={styles.selectText}>{groupName}</Text>
                      </View>
                      <View style={styles.selectRightContent}>
                        {selectedCount > 0 && (
                          <View style={styles.selectedCountContainer}>
                            <Text style={styles.selectedCountText}>{selectedCount}</Text>
                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                          </View>
                        )}
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.text.muted}
                        />
                      </View>
                    </TouchableOpacity>

                    {isOpen && (
                      <ScrollView
                        style={styles.selectOptions}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {characteristics.map((characteristic) => {
                          const isSelected = selected.includes(characteristic);
                          return (
                            <TouchableOpacity
                              key={characteristic}
                              style={[
                                styles.selectOption,
                                isSelected && styles.selectOptionActive,
                              ]}
                              onPress={() => {
                                const newSelected = isSelected
                                  ? selected.filter((c) => c !== characteristic)
                                  : [...selected, characteristic];
                                setSelectedCharacteristics({
                                  ...selectedCharacteristics,
                                  [groupName]: newSelected,
                                });
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.selectOptionText,
                                  isSelected && styles.selectOptionTextActive,
                                ]}
                              >
                                {characteristic}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[
        styles.footer, 
        { 
          paddingBottom: Math.max(insets.bottom, 16) + 80, // Add 80px for navbar height
          zIndex: 10010, // Above navbar (which is typically 10000-10002)
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            ((step === 1 && canProceedStep1) ||
            (step === 2 && canProceedStep2) ||
            (step === 3 && canProceedStep3) ||
            (step === 4) ||
            (step === 5))
              ? styles.actionButtonActive
              : styles.actionButtonDisabled,
          ]}
          onPress={step === totalSteps ? handleSubmit : handleNext}
          disabled={
            loading ||
            (step === 1 && !canProceedStep1) ||
            (step === 2 && !canProceedStep2) ||
            (step === 3 && !canProceedStep3)
          }
          activeOpacity={0.7}
        >
          {loading ? (
            <Text style={styles.actionButtonText}>Se trimite...</Text>
          ) : (
            <Text style={styles.actionButtonText}>
              {step === totalSteps ? 'Adaugă Proprietate' : 'Continuă'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Reuse styles from AddClientFlow
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.text.muted,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconContainerActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: colors.gold, // Gold for important actions (submit/finalize)
  },
  actionButtonDisabled: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  selectLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectIcon: {
    marginRight: 0,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 12,
    flex: 1,
  },
  selectRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectTextPlaceholder: {
    color: colors.text.muted,
  },
  selectOptions: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 400,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  selectOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

