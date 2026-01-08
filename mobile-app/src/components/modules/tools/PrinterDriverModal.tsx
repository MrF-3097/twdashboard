/**
 * Printer Driver Modal
 * Downloads printer drivers
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

interface PrinterDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrinterDriver {
  os: string;
  name: string;
  downloadUrl: string;
  version: string;
  fileSize: string;
}

const printerDrivers: PrinterDriver[] = [
  {
    os: 'windows',
    name: 'UPDPS Universal Print Driver',
    downloadUrl: 'https://dashboard.towerimob.ro/UPDPSWin_3912040MU.zip',
    version: '3.9.1',
    fileSize: '39.1 MB',
  },
];

export const PrinterDriverModal: React.FC<PrinterDriverModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (driver: PrinterDriver) => {
    setDownloading(driver.name);
    
    try {
      // On mobile, we'll open the URL which will trigger download
      const canOpen = await Linking.canOpenURL(driver.downloadUrl);
      if (canOpen) {
        await Linking.openURL(driver.downloadUrl);
        Alert.alert(
          'Descărcare inițiată',
          `Descărcarea ${driver.name} a fost inițiată.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      Alert.alert(
        'Descărcare eșuată',
        'A apărut o eroare la inițierea descărcării. Vă rugăm să încercați din nou.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(null);
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
            <View style={styles.headerContent}>
              <Ionicons name="print-outline" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Driver Imprimantă</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Drivere de imprimantă disponibile pentru descărcare.
            </Text>

            <View style={styles.driversContainer}>
              {printerDrivers.map((driver) => (
                <View key={driver.os} style={styles.driverCard}>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <View style={styles.driverDetails}>
                      <Text style={styles.driverDetail}>Versiune: {driver.version}</Text>
                      <Text style={styles.driverDetail}>Mărime: {driver.fileSize}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(driver)}
                    disabled={downloading === driver.name}
                    activeOpacity={0.7}
                  >
                    {downloading === driver.name ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.downloadButtonText}>Descarcă</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
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
  content: {
    padding: 20,
    gap: 20,
  },
  description: {
    fontSize: 14,
    color: colors.text.muted,
    lineHeight: 20,
  },
  driversContainer: {
    gap: 16,
  },
  driverCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  driverInfo: {
    gap: 8,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  driverDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  driverDetail: {
    fontSize: 14,
    color: colors.text.muted,
  },
  downloadButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  downloadButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});








