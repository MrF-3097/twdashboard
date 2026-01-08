/**
 * Add Property Modal
 * Mobile version of the web AddPropertyModal
 * Multi-step form for adding a new property
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { createScopedLogger } from '@/lib/logger';
import { validateContactStep, validateLocationStep, validatePricingStep } from '@/lib/validation/propertySchema';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type StepKey = 'contact' | 'propertyCf' | 'transaction' | 'location' | 'features' | 'pricing' | 'media' | 'rental';

const steps: Array<{ key: StepKey; title: string; description: string }> = [
  { key: 'contact', title: 'Contact', description: 'Date proprietar, CNP, verificări' },
  { key: 'propertyCf', title: 'Tip proprietate & CF', description: '' },
  { key: 'transaction', title: 'Vânzare / Închiriere', description: 'Mod tranzacție și reprezentare' },
  { key: 'location', title: 'Localizare', description: 'Adresă și duplicate' },
  { key: 'features', title: 'Caracteristici', description: 'Structură, utilități, dotări' },
  { key: 'pricing', title: 'Preț', description: 'Prețuri, TVA, comision' },
  { key: 'media', title: 'Poze & media', description: 'Fișiere, video, matching' },
  { key: 'rental', title: 'Închiriere', description: 'Extra condiții chirie' }
];

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
];

const representationOptions = ['Exclusivitate', 'Intermediere Exclusiva', 'Intermediere'];

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { agentData } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepKey>('contact');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [showRepresentationSelect, setShowRepresentationSelect] = useState(false);
  const [cfFile, setCfFile] = useState<any>(null);
  const [photoFiles, setPhotoFiles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
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
    property: {
      propertyType: '',
      cfNumber: '',
      transactionMode: 'sale' as 'sale' | 'rent' | 'both',
      representationType: 'Intermediere' as 'Exclusivitate' | 'Intermediere Exclusiva' | 'Intermediere',
      location: {
        street: '',
        streetNumber: '',
        city: '',
        county: '',
        unit: '',
        lat: '',
        lng: ''
      },
      characteristics: {
        bathrooms: '',
        rooms: '',
        bedrooms: '',
        surfaceUseable: '',
        floor: ''
      },
      pricing: {
        salePrice: '',
        rentPrice: '',
        vat: 'nu',
        negotiable: false,
        currency: 'EUR' as 'EUR' | 'RON',
        commissionPercent: ''
      },
      media: {
        photos: [] as any[],
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
    }
  });

  const stepIndex = steps.findIndex((step) => step.key === currentStep);
  const showRentalExtras = formData.property.transactionMode !== 'sale';

  const handleFieldChange = (path: string[], value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
    setError(null);
    setStepErrors([]);
  };

  const validateStep = (step: StepKey): boolean => {
    const errors: string[] = [];
    
    if (step === 'contact') {
      const result = validateContactStep(formData.contact);
      if (!result.valid) {
        Object.values(result.errors).forEach((error) => errors.push(error));
      }
    }
    
    if (step === 'propertyCf') {
      if (!formData.property.propertyType) errors.push('Selectează tipul proprietății');
      if (!formData.property.cfNumber.trim()) errors.push('Numărul CF este necesar pentru verificare');
    }
    
    if (step === 'transaction') {
      if (!formData.property.representationType) errors.push('Selectează tipul de reprezentare');
    }
    
    if (step === 'location') {
      const result = validateLocationStep(formData.property.location);
      if (!result.valid) {
        Object.values(result.errors).forEach((error) => errors.push(error));
      }
    }
    
    if (step === 'pricing') {
      const result = validatePricingStep(formData.property.pricing);
      if (!result.valid) {
        Object.values(result.errors).forEach((error) => errors.push(error));
      }
      // Additional business logic validation
      if (formData.property.transactionMode !== 'rent' && !formData.property.pricing.salePrice.trim()) {
        errors.push('Prețul de vânzare este obligatoriu');
      }
      if (formData.property.transactionMode !== 'sale' && !formData.property.pricing.rentPrice.trim()) {
        errors.push('Prețul de închiriere este obligatoriu pentru anunțurile de tip chirie');
      }
    }
    
    if (step === 'rental' && showRentalExtras) {
      if (formData.property.rentalExtras.hasTenant && !formData.property.rentalExtras.tenantUntil) {
        errors.push('Specifică data până la care există chiriaș');
      }
    }
    
    setStepErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    setStepErrors([]);
    const nextIndex = Math.min(stepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].key);
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].key);
    setStepErrors([]);
  };

  const handleCfUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCfFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut încărca fișierul');
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        setPhotoFiles(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-au putut încărca fișierele');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!agentData?.name) {
      setError('Trebuie să fiți autentificat pentru a adăuga o proprietate');
      return;
    }

    setLoading(true);
    setError(null);
    setStepErrors([]);

    try {
      // Build payload matching the server schema exactly
      const payload = {
        agentName: agentData.name,
        agentId: agentData.id,
        contact: formData.contact,
        mandatarList: [],
        coproprietarList: [],
        requiresInternalDoc: false,
        property: {
          propertyType: formData.property.propertyType,
          cfNumber: formData.property.cfNumber || '',
          cfScan: cfFile ? { name: cfFile.fileName || cfFile.uri.split('/').pop() || 'cf.jpg', size: cfFile.fileSize || 0 } : undefined,
          transactionMode: formData.property.transactionMode,
          representationType: formData.property.representationType,
          location: {
            street: formData.property.location.street || '',
            streetNumber: formData.property.location.streetNumber || '',
            city: formData.property.location.city || '',
            county: formData.property.location.county || '',
            unit: formData.property.location.unit || '',
            lat: formData.property.location.lat || '',
            lng: formData.property.location.lng || '',
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
            bathrooms: formData.property.characteristics.bathrooms || '',
            rooms: formData.property.characteristics.rooms || '',
            bedrooms: formData.property.characteristics.bedrooms || '',
            surfaceUseable: formData.property.characteristics.surfaceUseable || '',
            floor: formData.property.characteristics.floor || '',
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
            salePrice: formData.property.pricing.salePrice || '',
            rentPrice: formData.property.pricing.rentPrice || '',
            pricePerSqmSale: '',
            pricePerSqmRent: '',
            vat: formData.property.pricing.vat || 'nu',
            negotiable: formData.property.pricing.negotiable || false,
            currency: formData.property.pricing.currency || 'EUR',
            commissionPercent: formData.property.pricing.commissionPercent || '',
            commissionMessage: ''
          },
          media: {
            photos: photoFiles.map(f => ({ 
              name: f.fileName || f.uri.split('/').pop() || 'photo.jpg', 
              size: f.fileSize || 0 
            })),
            videoUrl: formData.property.media.videoUrl || '',
            virtualTourUrl: formData.property.media.virtualTourUrl || '',
            notes: formData.property.media.notes || ''
          },
          rentalExtras: {
            acceptsPets: formData.property.rentalExtras.acceptsPets || false,
            deposit: formData.property.rentalExtras.deposit || '',
            advance: formData.property.rentalExtras.advance || '',
            maintenance: formData.property.rentalExtras.maintenance || '',
            hasTenant: formData.property.rentalExtras.hasTenant || false,
            tenantUntil: formData.property.rentalExtras.tenantUntil || '',
            rentCollected: formData.property.rentalExtras.rentCollected || '',
            hasKeys: formData.property.rentalExtras.hasKeys || false,
            videoViewing: formData.property.rentalExtras.videoViewing || false
          }
        },
        warnings: []
      };

      const submission = new FormData();
      submission.append('payload', JSON.stringify(payload));
      
      if (cfFile) {
        const uri = cfFile.uri;
        const name = cfFile.fileName || cfFile.uri.split('/').pop() || 'cf.jpg';
        const type = cfFile.mimeType || 'image/jpeg';
        
        // React Native FormData format
        submission.append('cf_scan', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name,
          type,
        } as any);
      }

      photoFiles.forEach((file, index) => {
        const uri = file.uri;
        const name = file.fileName || file.uri.split('/').pop() || `photo_${index}.jpg`;
        const type = file.mimeType || 'image/jpeg';
        
        // React Native FormData format
        submission.append('photos', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          name,
          type,
        } as any);
      });

      // Use the same API URL logic as other components
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
          // React Native - use your local IP or production URL
          // For physical device, replace localhost with your computer's IP
          apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-property';
        }
      } else {
        apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-property';
      }

      // DO NOT set Content-Type header - React Native will set it automatically with boundary
      // Validate payload structure
      if (!payload.contact || !payload.property) {
        throw new Error('Datele formularului sunt incomplete');
      }

      if (!payload.contact.firstName || !payload.contact.lastName || !payload.contact.cnp) {
        throw new Error('Datele de contact sunt incomplete (nume, prenume, CNP sunt obligatorii)');
      }

      const logger = createScopedLogger('AddPropertyModal');
      logger.log('Submitting property:', {
        hasPayload: !!payload,
        hasContact: !!payload.contact,
        hasProperty: !!payload.property,
        contactName: `${payload.contact.firstName} ${payload.contact.lastName}`,
        propertyType: payload.property.propertyType,
        hasCfFile: !!cfFile,
        photoCount: photoFiles.length,
        apiUrl,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: submission,
      });

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

      const result = await response.json().catch(() => ({ success: true }));
      logger.log('Success response:', result);

      setSuccess(true);
      
      // Reset form
      setFormData({
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
          characteristics: {
            bathrooms: '',
            rooms: '',
            bedrooms: '',
            surfaceUseable: '',
            floor: ''
          },
          pricing: {
            salePrice: '',
            rentPrice: '',
            vat: 'nu',
            negotiable: false,
            currency: 'EUR',
            commissionPercent: ''
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
        }
      });
      setCfFile(null);
      setPhotoFiles([]);
      setCurrentStep('contact');

      // Close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
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
          characteristics: {
            bathrooms: '',
            rooms: '',
            bedrooms: '',
            surfaceUseable: '',
            floor: ''
          },
          pricing: {
            salePrice: '',
            rentPrice: '',
            vat: 'nu',
            negotiable: false,
            currency: 'EUR',
            commissionPercent: ''
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
        }
      });
      setCfFile(null);
      setPhotoFiles([]);
      setCurrentStep('contact');
      setError(null);
      setSuccess(false);
      setStepErrors([]);
      setShowPropertyTypeSelect(false);
      setShowRepresentationSelect(false);
      onClose();
    }
  };

  const progress = ((stepIndex + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#3B82F6', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Informații Contact</Text>
                <Text style={styles.stepDescription}>Date proprietar, CNP, verificări</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Prenume *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.firstName}
                  onChangeText={(value) => handleFieldChange(['contact', 'firstName'], value)}
                  placeholder="Prenume"
                  placeholderTextColor={colors.text.muted}
                  accessibilityLabel="Prenume"
                  accessibilityHint="Introdu prenumele proprietarului"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nume *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.lastName}
                  onChangeText={(value) => handleFieldChange(['contact', 'lastName'], value)}
                  placeholder="Nume"
                  placeholderTextColor={colors.text.muted}
                  accessibilityLabel="Nume"
                  accessibilityHint="Introdu numele proprietarului"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>CNP *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.cnp}
                  onChangeText={(value) => handleFieldChange(['contact', 'cnp'], value)}
                  placeholder="13 cifre"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                  accessibilityLabel="CNP"
                  accessibilityHint="Introdu codul numeric personal, 13 cifre"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Telefon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.phone}
                  onChangeText={(value) => handleFieldChange(['contact', 'phone'], value)}
                  placeholder="07xx xxx xxx"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  accessibilityLabel="Telefon"
                  accessibilityHint="Introdu numărul de telefon"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.email}
                  onChangeText={(value) => handleFieldChange(['contact', 'email'], value)}
                  placeholder="client@example.com"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Adresă domiciliu</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact.address}
                  onChangeText={(value) => handleFieldChange(['contact', 'address'], value)}
                  placeholder="Str. Exemplu nr. 10, Sibiu"
                  placeholderTextColor={colors.text.muted}
                />
              </View>
            </View>
          </View>
        );

      case 'propertyCf':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Tip Proprietate & CF</Text>
                <Text style={styles.stepDescription}>Selectează tipul și numărul CF</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Tip Proprietate *</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowPropertyTypeSelect(!showPropertyTypeSelect)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectText, !formData.property.propertyType && styles.selectTextPlaceholder]}>
                    {formData.property.propertyType || 'Selectează tipul proprietății'}
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
                          formData.property.propertyType === type && styles.selectOptionActive,
                        ]}
                        onPress={() => {
                          handleFieldChange(['property', 'propertyType'], type);
                          setShowPropertyTypeSelect(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            formData.property.propertyType === type && styles.selectOptionTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Număr CF *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.property.cfNumber}
                  onChangeText={(value) => handleFieldChange(['property', 'cfNumber'], value)}
                  placeholder="123456"
                  placeholderTextColor={colors.text.muted}
                />
              </View>

              <View style={styles.field}>
                <TouchableOpacity style={styles.uploadButton} onPress={handleCfUpload}>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>
                    {cfFile ? cfFile.fileName || 'Fișier încărcat' : 'Încarcă poză CF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'transaction':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#F97316', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Vânzare / Închiriere</Text>
                <Text style={styles.stepDescription}>Mod tranzacție și reprezentare</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Mod Tranzacție</Text>
                <View style={styles.rowFields}>
                  {(['sale', 'rent', 'both'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.modeButton,
                        formData.property.transactionMode === mode && styles.modeButtonActive,
                      ]}
                      onPress={() => handleFieldChange(['property', 'transactionMode'], mode)}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          formData.property.transactionMode === mode && styles.modeButtonTextActive,
                        ]}
                      >
                        {mode === 'sale' ? 'Vânzare' : mode === 'rent' ? 'Închiriere' : 'Ambele'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tip Reprezentare *</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowRepresentationSelect(!showRepresentationSelect)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectText}>
                    {formData.property.representationType}
                  </Text>
                  <Ionicons
                    name={showRepresentationSelect ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
                {showRepresentationSelect && (
                  <View style={styles.selectOptions}>
                    {representationOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.selectOption,
                          formData.property.representationType === option && styles.selectOptionActive,
                        ]}
                        onPress={() => {
                          handleFieldChange(['property', 'representationType'], option);
                          setShowRepresentationSelect(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            formData.property.representationType === option && styles.selectOptionTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#8B5CF6', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Localizare</Text>
                <Text style={styles.stepDescription}>Adresă și duplicate</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Stradă *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.location.street}
                    onChangeText={(value) => handleFieldChange(['property', 'location', 'street'], value)}
                    placeholder="Strada"
                    placeholderTextColor={colors.text.muted}
                    accessibilityLabel="Stradă"
                    accessibilityHint="Introdu numele străzii"
                    accessibilityRole="textbox"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Număr</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.location.streetNumber}
                    onChangeText={(value) => handleFieldChange(['property', 'location', 'streetNumber'], value)}
                    placeholder="Nr."
                    placeholderTextColor={colors.text.muted}
                    accessibilityLabel="Număr"
                    accessibilityHint="Introdu numărul străzii"
                    accessibilityRole="textbox"
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Oraș *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.location.city}
                    onChangeText={(value) => handleFieldChange(['property', 'location', 'city'], value)}
                    placeholder="Sibiu"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Județ</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.location.county}
                    onChangeText={(value) => handleFieldChange(['property', 'location', 'county'], value)}
                    placeholder="Sibiu"
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>
            </View>
          </View>
        );

      case 'features':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#06B6D4', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="home-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Caracteristici</Text>
                <Text style={styles.stepDescription}>Structură, utilități, dotări</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Nr. camere</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.characteristics.rooms}
                    onChangeText={(value) => handleFieldChange(['property', 'characteristics', 'rooms'], value)}
                    placeholder="Ex: 3"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Nr. băi</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.characteristics.bathrooms}
                    onChangeText={(value) => handleFieldChange(['property', 'characteristics', 'bathrooms'], value)}
                    placeholder="Ex: 2"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Suprafață utilă (mp)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.characteristics.surfaceUseable}
                    onChangeText={(value) => handleFieldChange(['property', 'characteristics', 'surfaceUseable'], value)}
                    placeholder="Ex: 75"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Etaj</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.characteristics.floor}
                    onChangeText={(value) => handleFieldChange(['property', 'characteristics', 'floor'], value)}
                    placeholder="Ex: 2"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        );

      case 'pricing':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Preț</Text>
                <Text style={styles.stepDescription}>Prețuri, TVA, comision</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              {formData.property.transactionMode !== 'rent' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Preț vânzare (€) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.pricing.salePrice}
                    onChangeText={(value) => handleFieldChange(['property', 'pricing', 'salePrice'], value)}
                    placeholder="Introduce prețul de vânzare"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {formData.property.transactionMode !== 'sale' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Preț chirie / lună (€) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.pricing.rentPrice}
                    onChangeText={(value) => handleFieldChange(['property', 'pricing', 'rentPrice'], value)}
                    placeholder="Introduce prețul de închiriere"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>TVA</Text>
                <View style={styles.rowFields}>
                  {(['nu', 'da'] as const).map((vat) => (
                    <TouchableOpacity
                      key={vat}
                      style={[
                        styles.modeButton,
                        formData.property.pricing.vat === vat && styles.modeButtonActive,
                      ]}
                      onPress={() => handleFieldChange(['property', 'pricing', 'vat'], vat)}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          formData.property.pricing.vat === vat && styles.modeButtonTextActive,
                        ]}
                      >
                        {vat === 'da' ? 'Da (21%)' : 'Nu'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Comision (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.property.pricing.commissionPercent}
                  onChangeText={(value) => handleFieldChange(['property', 'pricing', 'commissionPercent'], value)}
                  placeholder="Ex: 3"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );

      case 'media':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#EC4899', '#DB2777']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="images-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Poze & Media</Text>
                <Text style={styles.stepDescription}>Fișiere, video, matching</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <TouchableOpacity style={styles.uploadButton} onPress={handlePhotoUpload}>
                  <Ionicons name="images-outline" size={20} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>
                    {photoFiles.length > 0 
                      ? `${photoFiles.length} fișiere selectate` 
                      : 'Încarcă poze proprietate'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Note pentru matching</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={formData.property.media.notes}
                  onChangeText={(value) => handleFieldChange(['property', 'media', 'notes'], value)}
                  placeholder="Note pentru matching automat"
                  placeholderTextColor={colors.text.muted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        );

      case 'rental':
        if (!showRentalExtras) {
          return (
            <View style={styles.stepContent}>
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Modul de tranzacție curent nu necesită informații de închiriere.
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="key-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Închiriere</Text>
                <Text style={styles.stepDescription}>Extra condiții chirie</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Garanție (luni)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.rentalExtras.deposit}
                    onChangeText={(value) => handleFieldChange(['property', 'rentalExtras', 'deposit'], value)}
                    placeholder="Ex: 2"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Avans (luni)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.property.rentalExtras.advance}
                    onChangeText={(value) => handleFieldChange(['property', 'rentalExtras', 'advance'], value)}
                    placeholder="Ex: 1"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Întreținere medie</Text>
                <TextInput
                  style={styles.input}
                  value={formData.property.rentalExtras.maintenance}
                  onChangeText={(value) => handleFieldChange(['property', 'rentalExtras', 'maintenance'], value)}
                  placeholder="Ex: 200"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleFieldChange(['property', 'rentalExtras', 'acceptsPets'], !formData.property.rentalExtras.acceptsPets)}
              >
                <Ionicons
                  name={formData.property.rentalExtras.acceptsPets ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={formData.property.rentalExtras.acceptsPets ? colors.primary : colors.text.muted}
                />
                <Text style={styles.checkboxLabel}>Acceptă animale de companie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => handleFieldChange(['property', 'rentalExtras', 'hasKeys'], !formData.property.rentalExtras.hasKeys)}
              >
                <Ionicons
                  name={formData.property.rentalExtras.hasKeys ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={formData.property.rentalExtras.hasKeys ? colors.primary : colors.text.muted}
                />
                <Text style={styles.checkboxLabel}>Avem cheile apartamentului</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          {/* Progress Steps */}
          <View style={styles.progressSection}>
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = stepIndex > index;

                return (
                  <React.Fragment key={step.key}>
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          isActive && styles.stepCircleActive,
                          isCompleted && styles.stepCircleCompleted,
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                            {index + 1}
                          </Text>
                        )}
                      </View>
                    </View>
                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.stepConnector,
                          isCompleted && styles.stepConnectorCompleted,
                        ]}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>{steps[stepIndex]?.title || 'Contact'}</Text>
              <Text style={styles.progressDescription}>{steps[stepIndex]?.description || ''}</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {stepErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {stepErrors.map((err, idx) => (
                <Text key={idx} style={styles.errorText}>{err}</Text>
              ))}
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={styles.successText}>
                Proprietatea a fost trimisă către CRM REBS!
              </Text>
            </View>
          )}

          {/* Step Content */}
          <ScrollView 
            style={styles.contentScroll} 
            contentContainerStyle={styles.contentScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {renderStepContent()}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              {stepIndex > 0 && (
                <Button
                  variant="outline"
                  onPress={handlePrevious}
                  disabled={loading || success}
                  style={styles.footerButton}
                >
                  <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
                  <Text style={styles.footerButtonText}>Înapoi</Text>
                </Button>
              )}
              {stepIndex < steps.length - 1 ? (
                <Button
                  onPress={handleNext}
                  disabled={loading || success}
                  style={[styles.footerButton, styles.footerButtonPrimary]}
                >
                  <Text style={styles.footerButtonTextPrimary}>Înainte</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit}
                  disabled={loading || success}
                  style={[styles.footerButton, styles.footerButtonSuccess]}
                >
                  {loading ? (
                    <>
                      <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Se salvează...</Text>
                    </>
                  ) : success ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Trimis!</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Trimite</Text>
                    </>
                  )}
                </Button>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  progressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexShrink: 0,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
    transform: [{ scale: 1.1 }],
  },
  stepCircleCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#4ADE80',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#475569',
    marginHorizontal: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: '#22C55E',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressDescription: {
    fontSize: 12,
    color: '#94A3B8',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
  },
  successContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  contentScroll: {
    flex: 1,
    flexGrow: 1,
  },
  contentScrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  stepContent: {
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  formFields: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 48,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
  },
  selectText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  selectTextPlaceholder: {
    color: colors.text.muted,
  },
  selectOptions: {
    marginTop: 8,
    gap: 4,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 4,
    maxHeight: 200,
  },
  selectOption: {
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  selectOptionActive: {
    backgroundColor: '#3B82F6',
  },
  selectOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#4ADE80',
  },
  modeButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    minHeight: 48,
  },
  uploadButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  checkboxLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 16,
    flexShrink: 0,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
  },
  footerButtonPrimary: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  footerButtonSuccess: {
    backgroundColor: '#22C55E',
    borderColor: '#4ADE80',
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footerButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

