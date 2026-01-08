/**
 * PropertyActionModal Component
 * Modal for property actions: View on Site and Share on WhatsApp
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { SafeBlurView } from '@/components/ui/SafeBlurView';

interface Property {
  id: string;
  name: string;
  address: string;
  price: string;
  beds?: number;
  baths?: number;
  sqft?: string;
}

interface PropertyActionModalProps {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  onViewOnSite: (property: Property) => void;
  onShareOnWhatsApp: (property: Property) => void;
}

export const PropertyActionModal: React.FC<PropertyActionModalProps> = ({
  visible,
  property,
  onClose,
  onViewOnSite,
  onShareOnWhatsApp,
}) => {
  if (!property) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
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
            <Text style={styles.headerTitle}>Acțiuni Proprietate</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName} numberOfLines={2}>{property.name}</Text>
            <Text style={styles.propertyAddress} numberOfLines={1}>{property.address}</Text>
            <Text style={styles.propertyPrice}>{property.price}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onViewOnSite(property)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="globe-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Vizualizează pe site</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onShareOnWhatsApp(property)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              </View>
              <Text style={styles.actionButtonText}>Trimite pe WhatsApp</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
  propertyInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});











