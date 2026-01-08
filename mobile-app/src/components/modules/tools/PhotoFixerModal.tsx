/**
 * Photo Fixer Modal
 * Automatic photo correction with rotation and expansion
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PhotoFixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoFixerModal: React.FC<PhotoFixerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [fixedImage, setFixedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [expansionPercent, setExpansionPercent] = useState('20');
  const [processingTime, setProcessingTime] = useState(0);
  const [showExpansionSelect, setShowExpansionSelect] = useState(false);

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
      setOriginalImage(result.assets[0].uri);
      setFixedImage(null);
      setProcessingTime(0);
    }
  };

  const handleFixPhoto = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const formData = new FormData();
      const filename = originalImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: originalImage,
        name: filename,
        type,
      } as any);
      formData.append('angle', rotationAngle.toString());
      formData.append('expansionPercent', expansionPercent);

      // Determine API URL - always use production for React Native (physical devices)
      let apiUrl: string;
      if (typeof window !== 'undefined') {
        // Web browser - can use localhost
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          apiUrl = 'http://localhost:3001/api/fix-photo';
        } else {
          apiUrl = 'https://dashboard.towerimob.ro/api/fix-photo';
        }
      } else {
        // React Native - always use production URL (localhost doesn't work on physical devices)
        apiUrl = 'https://dashboard.towerimob.ro/api/fix-photo';
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
        throw new Error(result.error || 'Failed to fix photo');
      }

      // Convert base64 to URI
      const base64Data = result.fixedImage;
      const fileUri = `${FileSystem.cacheDirectory}fixed-${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setFixedImage(fileUri);
      setProcessingTime(Date.now() - startTime);
      Alert.alert('Succes', 'Fotografia a fost corectată cu succes!');
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la corectarea fotografiei.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!fixedImage) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fixedImage);
      } else {
        Alert.alert('Succes', 'Fotografia a fost salvată.');
      }
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la descărcarea fotografiei.');
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setFixedImage(null);
    setRotationAngle(0);
    setExpansionPercent('20');
    setProcessingTime(0);
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
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Expansiune Imagini</Text>
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
            {!originalImage ? (
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={colors.text.muted} />
                <Text style={styles.uploadText}>Încarcă Fotografie</Text>
                <Text style={styles.uploadSubtext}>Acceptă JPG, PNG, WEBP</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Controls */}
                <View style={styles.controlsSection}>
                  {/* Rotation Angle */}
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>
                      Unghi Rotație: {rotationAngle}°
                    </Text>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>-10°</Text>
                      <View style={styles.sliderTrack}>
                        <View
                          style={[
                            styles.sliderFill,
                            { width: `${((rotationAngle + 10) / 20) * 100}%` },
                          ]}
                        />
                        <View
                          style={[
                            styles.sliderThumb,
                            { left: `${((rotationAngle + 10) / 20) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.sliderLabel}>+10°</Text>
                    </View>
                    <View style={styles.sliderButtons}>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() => setRotationAngle(Math.max(-10, rotationAngle - 0.5))}
                      >
                        <Ionicons name="remove" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() => setRotationAngle(0)}
                      >
                        <Text style={styles.sliderButtonText}>0°</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() => setRotationAngle(Math.min(10, rotationAngle + 0.5))}
                      >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Expansion Percent */}
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Expansiune Margini</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setShowExpansionSelect(!showExpansionSelect)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectText}>
                        {expansionPercent}% Expansiune
                      </Text>
                      <Ionicons
                        name={showExpansionSelect ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.text.muted}
                      />
                    </TouchableOpacity>
                    {showExpansionSelect && (
                      <View style={styles.selectOptions}>
                        {['15', '20', '25', '30'].map((percent) => (
                          <TouchableOpacity
                            key={percent}
                            style={[
                              styles.selectOption,
                              expansionPercent === percent && styles.selectOptionActive,
                            ]}
                            onPress={() => {
                              setExpansionPercent(percent);
                              setShowExpansionSelect(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.selectOptionText,
                                expansionPercent === percent && styles.selectOptionTextActive,
                              ]}
                            >
                              {percent}% Expansiune
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <Text style={styles.controlHint}>
                      Proces: Rotație → Zoom 35% → Recadare → Expansiune {expansionPercent}%
                    </Text>
                  </View>
                </View>

                {/* Preview Section */}
                <View style={styles.previewSection}>
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <Ionicons name="image-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.previewLabel}>Original</Text>
                    </View>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: originalImage }} style={styles.image} resizeMode="contain" />
                    </View>
                  </View>

                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      {fixedImage ? (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                          <Text style={[styles.previewLabel, styles.previewLabelSuccess]}>Corectat</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
                          <Text style={styles.previewLabel}>Rezultat</Text>
                        </>
                      )}
                    </View>
                    <View style={styles.imageContainer}>
                      {isProcessing ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Se procesează...</Text>
                        </View>
                      ) : fixedImage ? (
                        <Image source={{ uri: fixedImage }} style={styles.image} resizeMode="contain" />
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Ionicons name="sparkles-outline" size={48} color={colors.text.muted} />
                          <Text style={styles.placeholderText}>
                            Apăsați "Corectează Fotografia" pentru a procesa
                          </Text>
                        </View>
                      )}
                    </View>
                    {fixedImage && processingTime > 0 && (
                      <Text style={styles.processingTime}>
                        Procesat în {(processingTime / 1000).toFixed(1)} secunde
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                  {!fixedImage ? (
                    <Button
                      onPress={handleFixPhoto}
                      disabled={isProcessing}
                      style={styles.fixButton}
                    >
                      {isProcessing ? (
                        <>
                          <ActivityIndicator color="#FFFFFF" />
                          <Text style={styles.buttonText}>Se procesează...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.buttonText}>Corectează Fotografia</Text>
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onPress={handleDownload}
                        style={styles.downloadButton}
                      >
                        <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Descarcă</Text>
                      </Button>
                      <Button
                        variant="outline"
                        onPress={handleReset}
                        style={styles.resetButton}
                      >
                        <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.buttonText}>Resetează</Text>
                      </Button>
                    </>
                  )}
                </View>
              </>
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
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.text.muted,
  },
  controlsSection: {
    gap: 20,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlGroup: {
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.text.muted,
    minWidth: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    top: -8,
    marginLeft: -10,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
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
  controlHint: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  previewSection: {
    gap: 16,
  },
  previewCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewLabelSuccess: {
    color: '#22C55E',
  },
  imageContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  placeholderContainer: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  placeholderText: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  processingTime: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  actionsSection: {
    gap: 12,
  },
  fixButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  downloadButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  resetButton: {
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});



