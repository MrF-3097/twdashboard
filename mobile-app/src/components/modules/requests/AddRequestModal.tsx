/**
 * Add Request Modal
 * EXACT copy of webapp - matching every div, className, spacing, and structure
 * Multi-step form for adding a new client request
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { createScopedLogger } from '@/lib/logger';

interface AddRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: 'Contact', description: 'Informații de contact', icon: 'person-outline' as const },
  { id: 2, title: 'Proprietate', description: 'Tip și camere', icon: 'business-outline' as const },
  { id: 3, title: 'Buget', description: 'Buget minim și maxim', icon: 'cash-outline' as const },
  { id: 4, title: 'Comentarii', description: 'Detalii suplimentare', icon: 'chatbubble-outline' as const },
  { id: 5, title: 'Confirmă', description: 'Verifică și finalizează', icon: 'checkmark-circle-outline' as const },
];

const PROPERTY_TYPES = [
  'Apartament',
  'Casă',
  'Vilă',
  'Teren',
  'Spațiu comercial',
  'Spațiu birouri',
  'Alt tip',
];

const CONTACT_TYPES = [
  'Telefon',
  'Email',
  'WhatsApp',
  'SMS',
  'Alt tip',
];

export const AddRequestModal: React.FC<AddRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { agentData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [showContactTypeSelect, setShowContactTypeSelect] = useState(false);
  
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
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.nume.trim() !== '' && formData.prenume.trim() !== '';
      case 2:
      case 3:
      case 4:
        return true; // Optional steps
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep()) {
      setError(null);
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      setError('Completează câmpurile obligatorii pentru a continua');
    }
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!formData.nume.trim() || !formData.prenume.trim()) {
      setError('Numele și prenumele sunt obligatorii');
      return;
    }

    if (!agentData?.name) {
      setError('Trebuie să fiți autentificat pentru a adăuga o cerere');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the same API URL logic as other components
      let apiUrl: string;
      if (__DEV__) {
        // In development, try to detect if we're on web or native
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            apiUrl = 'http://localhost:3000/api/rebs/add-request';
          } else {
            apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-request';
          }
        } else {
          // React Native - use production URL
          apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-request';
        }
      } else {
        apiUrl = 'https://dashboard.towerimob.ro/api/rebs/add-request';
      }

      // Build payload - convert empty strings to undefined for optional fields
      const payload: Record<string, any> = {
        nume: formData.nume.trim(),
        prenume: formData.prenume.trim(),
        agent_name: agentData.name,
        agentId: agentData.id,
      };

      // Only include optional fields if they have values
      if (formData.telefon?.trim()) {
        payload.telefon = formData.telefon.trim();
      }
      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }
      if (formData.tip_contact?.trim()) {
        payload.tip_contact = formData.tip_contact.trim();
      }
      if (formData.tip_proprietate?.trim()) {
        payload.tip_proprietate = formData.tip_proprietate.trim();
      }
      if (formData.camere_min?.trim()) {
        payload.camere_min = formData.camere_min.trim();
      }
      if (formData.camere_max?.trim()) {
        payload.camere_max = formData.camere_max.trim();
      }
      if (formData.buget_min?.trim()) {
        payload.buget_min = formData.buget_min.trim();
      }
      if (formData.buget_max?.trim()) {
        payload.buget_max = formData.buget_max.trim();
      }
      if (formData.comentarii_generale?.trim()) {
        payload.comentarii_generale = formData.comentarii_generale.trim();
      }

      // Validate form with Zod schema
      const validation = validateRequestForm(formData);
      if (!validation.valid) {
        const firstError = Object.values(validation.errors)[0];
        setError(firstError || 'Datele introduse nu sunt valide. Verifică toate câmpurile.');
        setLoading(false);
        return;
      }

      // Validate that at least telefon or email is provided
      if (!payload.telefon && !payload.email) {
        setError('Este necesar cel puțin un canal de contact (telefon sau email).');
        setLoading(false);
        return;
      }

      const logger = createScopedLogger('AddRequestModal');
      logger.log('Submitting request:', {
        apiUrl,
        contactName: `${payload.prenume} ${payload.nume}`,
        hasPhone: !!payload.telefon,
        hasEmail: !!payload.email,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      logger.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Nu am putut adăuga cererea';
        try {
          const body = await response.json();
          logger.error('API Error Response:', JSON.stringify(body, null, 2));
          errorMessage = body?.error || body?.message || errorMessage;
        } catch (e) {
          const text = await response.text().catch(() => '');
          logger.error('API Error Text:', text);
          errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      logger.log('Success response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add request');
      }

      // Success
      setSuccess(true);
      
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
      });
      setCurrentStep(1);

      // Close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
      });
      setCurrentStep(1);
      setError(null);
      setSuccess(false);
      setShowPropertyTypeSelect(false);
      setShowContactTypeSelect(false);
      onClose();
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
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
                <Text style={styles.stepTitle}>Informații de Contact</Text>
                <Text style={styles.stepDescription}>Nume, prenume și telefon</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Nume *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nume}
                  onChangeText={(value) => handleFieldChange('nume', value)}
                  placeholder="Ex: Popescu"
                  placeholderTextColor={colors.text.muted}
                  autoFocus
                  accessibilityLabel="Nume"
                  accessibilityHint="Introdu numele clientului"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Prenume *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.prenume}
                  onChangeText={(value) => handleFieldChange('prenume', value)}
                  placeholder="Ex: Ion"
                  placeholderTextColor={colors.text.muted}
                  accessibilityLabel="Prenume"
                  accessibilityHint="Introdu prenumele clientului"
                  accessibilityRole="textbox"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Ionicons name="call-outline" size={16} color={colors.text.muted} />
                  <Text style={styles.label}>Telefon</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.telefon}
                  onChangeText={(value) => handleFieldChange('telefon', value)}
                  placeholder="Ex: 0721234567"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  accessibilityLabel="Telefon"
                  accessibilityHint="Introdu numărul de telefon al clientului"
                  accessibilityRole="textbox"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="business-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Detalii Proprietate</Text>
                <Text style={styles.stepDescription}>Tip proprietate și număr de camere</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Tip Proprietate</Text>
                <TouchableOpacity
                  style={styles.selectContainer}
                  onPress={() => setShowPropertyTypeSelect(!showPropertyTypeSelect)}
                  activeOpacity={0.7}
                  accessibilityLabel={formData.tip_proprietate || 'Tip proprietate'}
                  accessibilityHint="Selectează tipul de proprietate dorit"
                  accessibilityRole="button"
                >
                  <Text style={[styles.selectText, !formData.tip_proprietate && styles.selectTextPlaceholder]}>
                    {formData.tip_proprietate || 'Selectează tipul proprietății'}
                  </Text>
                  <Ionicons
                    name={showPropertyTypeSelect ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text.muted}
                  />
                </TouchableOpacity>
                {showPropertyTypeSelect && (
                  <View style={styles.selectOptions}>
                    {PROPERTY_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.selectOption,
                          formData.tip_proprietate === type && styles.selectOptionActive,
                        ]}
                        onPress={() => {
                          handleFieldChange('tip_proprietate', type);
                          setShowPropertyTypeSelect(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            formData.tip_proprietate === type && styles.selectOptionTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Camere Min</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.camere_min}
                    onChangeText={(value) => handleFieldChange('camere_min', value)}
                    placeholder="Ex: 2"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    accessibilityLabel="Camere minim"
                    accessibilityHint="Introdu numărul minim de camere dorite"
                    accessibilityRole="textbox"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Camere Max</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.camere_max}
                    onChangeText={(value) => handleFieldChange('camere_max', value)}
                    placeholder="Ex: 4"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    accessibilityLabel="Camere maxim"
                    accessibilityHint="Introdu numărul maxim de camere dorite"
                    accessibilityRole="textbox"
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => handleFieldChange('email', value)}
                    placeholder="Ex: client@example.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Email"
                    accessibilityHint="Introdu adresa de email a clientului"
                    accessibilityRole="textbox"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Tip Contact</Text>
                  <TouchableOpacity
                    style={styles.selectContainer}
                    onPress={() => setShowContactTypeSelect(!showContactTypeSelect)}
                    activeOpacity={0.7}
                    accessibilityLabel={formData.tip_contact || 'Tip contact'}
                    accessibilityHint="Selectează tipul de contact preferat"
                    accessibilityRole="button"
                  >
                    <Text style={[styles.selectText, !formData.tip_contact && styles.selectTextPlaceholder]}>
                      {formData.tip_contact || 'Selectează tipul de contact'}
                    </Text>
                    <Ionicons
                      name={showContactTypeSelect ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.text.muted}
                    />
                  </TouchableOpacity>
                  {showContactTypeSelect && (
                    <View style={styles.selectOptions}>
                      {CONTACT_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.selectOption,
                            formData.tip_contact === type && styles.selectOptionActive,
                          ]}
                          onPress={() => {
                            handleFieldChange('tip_contact', type);
                            setShowContactTypeSelect(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.selectOptionText,
                              formData.tip_contact === type && styles.selectOptionTextActive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#F97316', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Buget</Text>
                <Text style={styles.stepDescription}>Buget minim și maxim</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.rowFields}>
                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Buget Min (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.buget_min}
                    onChangeText={(value) => handleFieldChange('buget_min', value)}
                    placeholder="Ex: 50000"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    accessibilityLabel="Buget minim"
                    accessibilityHint="Introdu bugetul minim în euro"
                    accessibilityRole="textbox"
                  />
                </View>

                <View style={[styles.field, styles.halfField]}>
                  <Text style={styles.label}>Buget Max (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.buget_max}
                    onChangeText={(value) => handleFieldChange('buget_max', value)}
                    placeholder="Ex: 150000"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    accessibilityLabel="Buget maxim"
                    accessibilityHint="Introdu bugetul maxim în euro"
                    accessibilityRole="textbox"
                  />
                </View>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Comentarii Generale</Text>
                <Text style={styles.stepDescription}>Detalii suplimentare despre cerere</Text>
              </View>
            </View>

            <View style={styles.formFields}>
              <View style={styles.field}>
                <Text style={styles.label}>Comentarii Generale</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={formData.comentarii_generale}
                  onChangeText={(value) => handleFieldChange('comentarii_generale', value)}
                  placeholder="Adaugă detalii suplimentare despre cererea clientului..."
                  placeholderTextColor={colors.text.muted}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  accessibilityLabel="Comentarii generale"
                  accessibilityHint="Introdu detalii suplimentare despre cererea clientului"
                  accessibilityRole="textbox"
                />
              </View>
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <SafeLinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stepIconContainer}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              </SafeLinearGradient>
              <View style={styles.stepHeaderText}>
                <Text style={styles.stepTitle}>Confirmare</Text>
                <Text style={styles.stepDescription}>Verifică informațiile înainte de trimitere</Text>
              </View>
            </View>

            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationGrid}>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Nume:</Text>
                  <Text style={styles.confirmationValue}>{formData.nume || '-'}</Text>
                </View>
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Prenume:</Text>
                  <Text style={styles.confirmationValue}>{formData.prenume || '-'}</Text>
                </View>
                {formData.telefon && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Telefon:</Text>
                    <Text style={styles.confirmationValue}>{formData.telefon}</Text>
                  </View>
                )}
                {formData.email && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Email:</Text>
                    <Text style={styles.confirmationValue}>{formData.email}</Text>
                  </View>
                )}
                {formData.tip_contact && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Tip Contact:</Text>
                    <Text style={styles.confirmationValue}>{formData.tip_contact}</Text>
                  </View>
                )}
                {formData.tip_proprietate && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Tip Proprietate:</Text>
                    <Text style={styles.confirmationValue}>{formData.tip_proprietate}</Text>
                  </View>
                )}
                {(formData.camere_min || formData.camere_max) && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Camere:</Text>
                    <Text style={styles.confirmationValue}>
                      {formData.camere_min || '0'} - {formData.camere_max || '∞'}
                    </Text>
                  </View>
                )}
                {(formData.buget_min || formData.buget_max) && (
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Buget:</Text>
                    <Text style={styles.confirmationValue}>
                      {formData.buget_min ? `€${parseInt(formData.buget_min).toLocaleString()}` : '€0'} - {formData.buget_max ? `€${parseInt(formData.buget_max).toLocaleString()}` : '∞'}
                    </Text>
                  </View>
                )}
              </View>
              {formData.comentarii_generale && (
                <View style={styles.confirmationComments}>
                  <Text style={styles.confirmationLabel}>Comentarii:</Text>
                  <Text style={styles.confirmationCommentsText}>{formData.comentarii_generale}</Text>
                </View>
              )}
              {agentData && (
                <View style={styles.confirmationAgent}>
                  <Text style={styles.confirmationLabel}>Agent:</Text>
                  <Text style={styles.confirmationValue}>{agentData.name}</Text>
                </View>
              )}
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
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <React.Fragment key={step.id}>
                    <View style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepCircle,
                          isActive && styles.stepCircleActive,
                          isCompleted && styles.stepCircleCompleted,
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        ) : (
                          <Ionicons
                            name={step.icon}
                            size={16}
                            color={isActive ? '#FFFFFF' : '#94A3B8'}
                          />
                        )}
                      </View>
                    </View>
                    {index < STEPS.length - 1 && (
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
              <Text style={styles.progressTitle}>{STEPS[currentStep - 1].title}</Text>
              <Text style={styles.progressDescription}>{STEPS[currentStep - 1].description}</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {success && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              <Text style={styles.successText}>
                Cererea a fost adăugată cu succes în CRM REBS!
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
              {currentStep > 1 && (
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
              {currentStep < STEPS.length ? (
                <Button
                  onPress={handleNext}
                  disabled={loading || success || !canProceedToNextStep()}
                  style={[styles.footerButton, styles.footerButtonPrimary]}
                >
                  <Text style={styles.footerButtonTextPrimary}>Continuă</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit}
                  disabled={loading || success || !formData.nume.trim() || !formData.prenume.trim()}
                  style={[styles.footerButton, styles.footerButtonSuccess]}
                >
                  {loading ? (
                    <>
                      <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Se trimite...</Text>
                    </>
                  ) : success ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Trimis!</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.footerButtonTextPrimary}>Adaugă Cerere</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    minHeight: 120,
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
  },
  selectOption: {
    padding: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
  },
  selectOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  selectOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confirmationContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 400,
  },
  confirmationGrid: {
    gap: 12,
  },
  confirmationItem: {
    gap: 4,
  },
  confirmationLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  confirmationComments: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  confirmationCommentsText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  confirmationAgent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 4,
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

