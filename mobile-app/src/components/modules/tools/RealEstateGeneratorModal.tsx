/**
 * Real Estate Generator Modal
 * AI-powered real estate ad generation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { createScopedLogger } from '@/lib/logger';

interface RealEstateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratedAd {
  id: string;
  adText: string;
  generatedAt: string;
  wordCount: number;
}

export const RealEstateGeneratorModal: React.FC<RealEstateGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { agentData } = useAuth();
  const [propertyType, setPropertyType] = useState<'apartment' | 'house' | 'commercial' | 'land'>('apartment');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [tone, setTone] = useState<'professional' | 'persuasive' | 'friendly'>('professional');
  const [propertyDetails, setPropertyDetails] = useState('');
  const [aiRules, setAiRules] = useState(`Reguli pentru generarea anunțurilor imobiliare:

1. Întotdeauna menționează că proprietatea este o oportunitate excelentă de investiție
2. Includeți informații despre transportul public și accesibilitate
3. Menționați siguranța zonei și vecinătatea
4. Adăugați detalii despre potențialul de apreciere a valorii
5. Folosiți cuvinte cheie: "excepțional", "unic", "rar", "oportunitate"
6. Întotdeauna includeți un apel la acțiune pentru contact
7. Menționați că vizionarea este disponibilă imediat
8. Evidențiați avantajele financiare (chirie, investiție, etc.)
9. IMPORTANT: Începeți întotdeauna cu "Tower Imob va prezinta..."`);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isExpandingImage, setIsExpandingImage] = useState(false);
  const [expandedImageResult, setExpandedImageResult] = useState<any | null>(null);
  const [showPropertyTypeSelect, setShowPropertyTypeSelect] = useState(false);
  const [showToneSelect, setShowToneSelect] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisiune necesară', 'Avem nevoie de permisiune pentru a accesa galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
    }
  };

  const handleExpandImage = async () => {
    if (!uploadedImage) {
      Alert.alert('Eroare', 'Vă rugăm să încărcați o imagine mai întâi.');
      return;
    }

    setIsExpandingImage(true);

    try {
      const formData = new FormData();
      const filename = uploadedImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: uploadedImage,
        name: filename,
        type,
      } as any);
      
      if (imagePrompt) {
        formData.append('prompt', imagePrompt);
      }

      // Determine API URL - always use production for React Native (physical devices)
      let apiUrl: string;
      if (typeof window !== 'undefined') {
        // Web browser - can use localhost
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          apiUrl = 'http://localhost:3001/api/extend-image';
        } else {
          apiUrl = 'https://dashboard.towerimob.ro/api/extend-image';
        }
      } else {
        // React Native - always use production URL (localhost doesn't work on physical devices)
        apiUrl = 'https://dashboard.towerimob.ro/api/extend-image';
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to expand image');
      }

      setExpandedImageResult(result);
      Alert.alert(
        'Succes',
        `Imagine extinsă cu succes: ${result.originalSize.width}x${result.originalSize.height} → ${result.extendedSize.width}x${result.extendedSize.height}`
      );
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la extinderea imaginii. Vă rugăm să încercați din nou.');
    } finally {
      setIsExpandingImage(false);
    }
  };

  const generateAd = async () => {
    // Client-side validation
    const trimmedLocation = location?.trim() || '';
    const trimmedPrice = price?.trim() || '';
    const trimmedDetails = propertyDetails?.trim() || '';

    if (!trimmedLocation || !trimmedPrice || !trimmedDetails) {
      Alert.alert('Informații lipsă', 'Vă rugăm să completați locația, prețul și detaliile proprietății.');
      return;
    }

    setIsGenerating(true);

    try {
      // Build request payload - only include fields with values
      const request: any = {
        property: {
          location: trimmedLocation,
          price: trimmedPrice,
          propertyType: propertyType, // 'apartment' | 'house' | 'commercial' | 'land'
          details: trimmedDetails,
        },
        tone: tone, // 'professional' | 'persuasive' | 'friendly'
        aiRules: aiRules?.trim() || '', // Ensure aiRules is a string, even if empty
      };

      // Only include agentId and agentName if they exist
      if (agentData?.id) {
        request.agentId = agentData.id;
      }
      if (agentData?.name?.trim()) {
        request.agentName = agentData.name.trim();
      }

      // Determine API URL - always use production for React Native (physical devices)
      // localhost only works in web browser, not on physical devices
      let apiUrl: string;
      if (typeof window !== 'undefined') {
        // Web browser - can use localhost
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          apiUrl = 'http://localhost:3001/api/real-estate/generate';
        } else {
          apiUrl = 'https://dashboard.towerimob.ro/api/real-estate/generate';
        }
      } else {
        // React Native - always use production URL (localhost doesn't work on physical devices)
        apiUrl = 'https://dashboard.towerimob.ro/api/real-estate/generate';
      }

      const logger = createScopedLogger('RealEstateGenerator');
      logger.log('Sending request:', {
        apiUrl,
        property: request.property,
        tone: request.tone,
        hasAiRules: !!request.aiRules,
        hasAgentId: !!request.agentId,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'A apărut o eroare la generarea anunțului.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          logger.error('API Error:', {
            status: response.status,
            error: errorData,
          });
        } catch (parseError) {
          const errorText = await response.text();
          logger.error('API Error (text):', {
            status: response.status,
            text: errorText,
          });
          errorMessage = `Eroare HTTP ${response.status}: ${errorText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate ad');
      }

      if (!result.data || !result.data.adText) {
        throw new Error('Răspuns invalid de la server - lipsește textul anunțului.');
      }

      const newAd: GeneratedAd = {
        id: Date.now().toString(),
        adText: result.data.adText,
        generatedAt: new Date().toISOString(),
        wordCount: result.data.adText.split(/\s+/).length,
      };

      setGeneratedAds(prev => [newAd, ...prev]);
      Alert.alert('Succes', 'Anunțul a fost generat cu succes!');
    } catch (error) {
      logger.error('Error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'A apărut o eroare la generarea anunțului.';
      Alert.alert('Eroare', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copiat', 'Anunțul a fost copiat în clipboard.');
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-a putut copia în clipboard.');
    }
  };

  const downloadAd = async (ad: GeneratedAd) => {
    try {
      const filename = `real-estate-ad-${ad.id}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, ad.adText);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Succes', 'Fișierul a fost salvat.');
      }
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la descărcarea anunțului.');
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Blur and darken backdrop */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <SafeBlurView
            style={styles.backdropBlur}
            blurType="light"
            blurAmount={24}
          />
          <View style={styles.backdropDarken} />
        </TouchableOpacity>

        <View 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="business-outline" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Anunțuri Imobiliare</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Tip Proprietate *</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowPropertyTypeSelect(!showPropertyTypeSelect)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectText}>
                  {propertyType === 'apartment' ? 'Apartament' :
                   propertyType === 'house' ? 'Casă' :
                   propertyType === 'commercial' ? 'Comercial' : 'Teren'}
                </Text>
                <Ionicons
                  name={showPropertyTypeSelect ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              {showPropertyTypeSelect && (
                <View style={styles.selectOptions}>
                  {[
                    { value: 'apartment', label: 'Apartament' },
                    { value: 'house', label: 'Casă' },
                    { value: 'commercial', label: 'Comercial' },
                    { value: 'land', label: 'Teren' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.selectOption,
                        propertyType === option.value && styles.selectOptionActive,
                      ]}
                      onPress={() => {
                        setPropertyType(option.value as any);
                        setShowPropertyTypeSelect(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          propertyType === option.value && styles.selectOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Location */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Ionicons name="location-outline" size={16} color={colors.text.muted} />
                <Text style={styles.label}>Locația *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="ex: București, Sector 1"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            {/* Price */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Ionicons name="cash-outline" size={16} color={colors.text.muted} />
                <Text style={styles.label}>Prețul *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="ex: 120,000 EUR"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            {/* Tone */}
            <View style={styles.section}>
              <Text style={styles.label}>Tonul</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowToneSelect(!showToneSelect)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectText}>
                  {tone === 'professional' ? 'Profesional' :
                   tone === 'persuasive' ? 'Persuasiv' : 'Prietenos'}
                </Text>
                <Ionicons
                  name={showToneSelect ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              {showToneSelect && (
                <View style={styles.selectOptions}>
                  {[
                    { value: 'professional', label: 'Profesional' },
                    { value: 'persuasive', label: 'Persuasiv' },
                    { value: 'friendly', label: 'Prietenos' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.selectOption,
                        tone === option.value && styles.selectOptionActive,
                      ]}
                      onPress={() => {
                        setTone(option.value as any);
                        setShowToneSelect(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          tone === option.value && styles.selectOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Property Details */}
            <View style={styles.section}>
              <Text style={styles.label}>Detalii Proprietate *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={propertyDetails}
                onChangeText={setPropertyDetails}
                placeholder="ex: 3 camere, 300 euro chirie, balcon, etaj 4, centrală termică, parcare, lift..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Image Upload (Optional) */}
            <View style={styles.section}>
              <Text style={styles.label}>Imagine Proprietate (Opțional)</Text>
              {!uploadedImage ? (
                <TouchableOpacity
                  style={styles.imageUploadButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.imageUploadText}>Încarcă Imagine</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewText}>Imagine încărcată</Text>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setUploadedImage(null);
                      setExpandedImageResult(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
              {uploadedImage && !expandedImageResult && (
                <Button
                  onPress={handleExpandImage}
                  disabled={isExpandingImage}
                  style={styles.expandButton}
                >
                  {isExpandingImage ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Extinde Imagine (10%)</Text>
                    </>
                  )}
                </Button>
              )}
            </View>

            {/* AI Rules */}
            <View style={styles.section}>
              <Text style={styles.label}>Reguli AI & Instrucțiuni</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={aiRules}
                onChangeText={setAiRules}
                placeholder="Introduceți regulile personalizate pentru generarea AI..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Generate Button */}
            <Button
              onPress={generateAd}
              disabled={isGenerating || !location || !price || !propertyDetails.trim()}
              style={styles.generateButton}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.buttonText}>Se generează...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Generează Anunț Română</Text>
                </>
              )}
            </Button>

            {/* Generated Ads */}
            {generatedAds.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Anunțuri Generate</Text>
                {generatedAds.map((ad) => (
                  <View key={ad.id} style={styles.adCard}>
                    <View style={styles.adHeader}>
                      <Text style={styles.adTime}>
                        Generat {new Date(ad.generatedAt).toLocaleTimeString('ro-RO')}
                      </Text>
                      <Text style={styles.adWordCount}>{ad.wordCount} cuvinte</Text>
                    </View>
                    <TextInput
                      style={[styles.input, styles.textarea, styles.adText]}
                      value={ad.adText}
                      editable={false}
                      multiline
                      numberOfLines={8}
                    />
                    <View style={styles.adActions}>
                      <Button
                        variant="outline"
                        onPress={() => copyToClipboard(ad.adText)}
                        style={styles.adActionButton}
                      >
                        <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.adActionText}>Copiază</Text>
                      </Button>
                      <Button
                        onPress={() => downloadAd(ad)}
                        style={styles.adActionButton}
                      >
                        <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.adActionText}>Descarcă</Text>
                      </Button>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // 20% darkening tint
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexShrink: 0, // Prevent header from shrinking
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  scrollView: {
    flex: 1,
    flexGrow: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
  },
  section: {
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text.primary,
    fontSize: 16,
    minHeight: 48,
  },
  textarea: {
    minHeight: 100,
    paddingTop: 12,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
  },
  selectText: {
    color: colors.text.primary,
    fontSize: 16,
    flex: 1,
  },
  selectOptions: {
    marginTop: 8,
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  selectOption: {
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectOptionActive: {
    backgroundColor: colors.primary,
  },
  selectOptionText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  imageUploadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  imagePreviewText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  removeImageButton: {
    padding: 4,
  },
  expandButton: {
    marginTop: 8,
    backgroundColor: '#3B82F6',
  },
  generateButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 20,
    gap: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  adCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    gap: 12,
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTime: {
    fontSize: 12,
    color: colors.text.muted,
  },
  adWordCount: {
    fontSize: 12,
    color: colors.text.muted,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adText: {
    backgroundColor: colors.surface,
    minHeight: 120,
  },
  adActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

