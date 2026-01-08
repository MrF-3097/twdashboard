/**
 * Document Converter Modal
 * Opens iLovePDF for document conversion
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking } from 'react-native';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { createScopedLogger } from '@/lib/logger';

interface DocumentConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentConverterModal: React.FC<DocumentConverterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const openILovePDF = async (conversionType: 'docx-to-pdf' | 'pdf-to-docx') => {
    let url = '';
    if (conversionType === 'docx-to-pdf') {
      url = 'https://www.ilovepdf.com/word_to_pdf';
    } else {
      url = 'https://www.ilovepdf.com/pdf_to_word';
    }
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        onClose();
      }
    } catch (error) {
      const logger = createScopedLogger('DocumentConverterModal');
      logger.error('Error opening URL:', error);
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

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Convertor Documente</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Selectează tipul de conversie. Vei fi redirecționat către ILOVEPDF pentru a converti documentul.
            </Text>

            <View style={styles.optionsContainer}>
              {/* DOCX to PDF */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => openILovePDF('docx-to-pdf')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="document-text-outline" size={32} color="#DC2626" />
                </View>
                <Text style={styles.optionTitle}>DOCX → PDF</Text>
                <Text style={styles.optionDescription}>
                  Convertește documentele Word în PDF
                </Text>
              </TouchableOpacity>

              {/* PDF to DOCX */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => openILovePDF('pdf-to-docx')}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="document-outline" size={32} color="#2563EB" />
                </View>
                <Text style={styles.optionTitle}>PDF → DOCX</Text>
                <Text style={styles.optionDescription}>
                  Convertește PDF-urile în documente Word
                </Text>
              </TouchableOpacity>
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
    maxHeight: '80%',
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
  content: {
    padding: 20,
    gap: 20,
  },
  description: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
});





