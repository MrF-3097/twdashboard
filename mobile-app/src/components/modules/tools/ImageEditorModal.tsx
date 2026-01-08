/**
 * Image Editor Modal
 * Image editing with saturation and contrast adjustments
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { Button } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extendPrompt, setExtendPrompt] = useState('Extend the image outward with matching background and seamless continuation');
  const [isExtending, setIsExtending] = useState(false);
  const [extendedImage, setExtendedImage] = useState<string | null>(null);

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
      setSourceImage(result.assets[0].uri);
      setResultImage(null);
      setExtendedImage(null);
    }
  };

  const processImage = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);

    try {
      // For mobile, we'll use the fix-photo API which does similar processing
      const formData = new FormData();
      const filename = sourceImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: sourceImage,
        name: filename,
        type,
      } as any);
      formData.append('angle', '0');
      formData.append('expansionPercent', '0');

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
        throw new Error(result.error || 'Failed to process image');
      }

      // Convert base64 to URI
      const base64Data = result.fixedImage;
      const fileUri = `${FileSystem.cacheDirectory}processed-${Date.now()}.jpg`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setResultImage(fileUri);
      Alert.alert('Succes', 'Imaginea a fost procesată cu succes!');
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la procesarea imaginii.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extendImageWithAI = async () => {
    if (!sourceImage) {
      Alert.alert('Eroare', 'Vă rugăm să încărcați o imagine mai întâi.');
      return;
    }

    setIsExtending(true);

    try {
      const formData = new FormData();
      const filename = sourceImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: sourceImage,
        name: filename,
        type,
      } as any);
      formData.append('prompt', extendPrompt);

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
        throw new Error(result.error || 'Failed to extend image');
      }

      // Convert base64 to URI
      const base64Data = result.extendedImage.split(',')[1] || result.extendedImage;
      const fileUri = `${FileSystem.cacheDirectory}extended-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setExtendedImage(fileUri);
      Alert.alert('Succes', 'Imaginea a fost extinsă cu succes!');
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la extinderea imaginii.');
    } finally {
      setIsExtending(false);
    }
  };

  const downloadImage = async (imageUri: string, filename: string) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri);
      } else {
        Alert.alert('Succes', 'Imaginea a fost salvată.');
      }
    } catch (error) {
      Alert.alert('Eroare', 'A apărut o eroare la descărcarea imaginii.');
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setResultImage(null);
    setExtendedImage(null);
    setExtendPrompt('Extend the image outward with matching background and seamless continuation');
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
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Editor Imagini</Text>
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
            {!sourceImage ? (
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={colors.text.muted} />
                <Text style={styles.uploadText}>Încarcă Imagine</Text>
                <Text style={styles.uploadSubtext}>Acceptă PNG, JPG, JPEG, WEBP</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Image Preview Section */}
                <View style={styles.previewSection}>
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Original</Text>
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: sourceImage }} style={styles.image} resizeMode="contain" />
                    </View>
                  </View>

                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>Rezultat</Text>
                    <View style={styles.imageContainer}>
                      {isProcessing ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={colors.primary} />
                          <Text style={styles.loadingText}>Se procesează...</Text>
                        </View>
                      ) : resultImage ? (
                        <Image source={{ uri: resultImage }} style={styles.image} resizeMode="contain" />
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <Text style={styles.placeholderText}>Încă nu există rezultat</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsSection}>
                  {!resultImage && (
                    <Button
                      onPress={processImage}
                      disabled={isProcessing}
                      style={styles.actionButton}
                    >
                      {isProcessing ? (
                        <>
                          <ActivityIndicator color="#FFFFFF" />
                          <Text style={styles.buttonText}>Se procesează...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="color-filter-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.buttonText}>Procesează (+35% saturație, +10% contrast)</Text>
                        </>
                      )}
                    </Button>
                  )}

                  {resultImage && (
                    <Button
                      onPress={() => downloadImage(resultImage, 'image-edited.jpg')}
                      style={styles.actionButton}
                    >
                      <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Descarcă Rezultat</Text>
                    </Button>
                  )}

                  {/* AI Extension */}
                  <View style={styles.extensionSection}>
                    <Text style={styles.label}>Extindere AI (Opțional)</Text>
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      value={extendPrompt}
                      onChangeText={setExtendPrompt}
                      placeholder="Extend the image outward with matching background..."
                      placeholderTextColor={colors.text.muted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    {!extendedImage ? (
                      <Button
                        onPress={extendImageWithAI}
                        disabled={isExtending}
                        style={[styles.actionButton, styles.extendButton]}
                      >
                        {isExtending ? (
                          <>
                            <ActivityIndicator color="#FFFFFF" />
                            <Text style={styles.buttonText}>Se extinde...</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Extinde cu AI</Text>
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <View style={styles.extendedImageContainer}>
                          <Image source={{ uri: extendedImage }} style={styles.extendedImage} resizeMode="contain" />
                        </View>
                        <Button
                          onPress={() => downloadImage(extendedImage, 'image-extended.png')}
                          style={styles.actionButton}
                        >
                          <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.buttonText}>Descarcă Imagine Extinsă</Text>
                        </Button>
                      </>
                    )}
                  </View>

                  <Button
                    variant="outline"
                    onPress={handleReset}
                    style={styles.resetButton}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Resetează</Text>
                  </Button>
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
  previewLabel: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
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
    padding: 24,
  },
  placeholderText: {
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  extendButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  extensionSection: {
    gap: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
  },
  extendedImageContainer: {
    width: '100%',
    minHeight: 200,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  extendedImage: {
    width: '100%',
    height: 200,
  },
  resetButton: {
    marginTop: 8,
    borderColor: '#334155',
  },
});



