/**
 * EditPropertyModal Component
 * Modal for editing property information using PATCH from NEW CRM REBS API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('EditPropertyModal');

interface Property {
  id: string;
  name: string;
  address: string;
  price: string;
  type: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  status: string;
}

interface EditPropertyModalProps {
  visible: boolean;
  property: Property | null;
  onClose: () => void;
  onSave: () => void; // Callback to refresh properties list
}

const REBS_NEW_API_BASE = 'https://towerimob.crmrebs.com/api';
const REBS_NEW_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  visible,
  property,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [priceSale, setPriceSale] = useState('');
  const [priceRent, setPriceRent] = useState('');
  const [rooms, setRooms] = useState('');
  const [baths, setBaths] = useState('');
  const [sqft, setSqft] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setAddress(property.address || '');
      
      // Extract prices from property.price string (format: "€X/lună / €Y" or "€X")
      const priceMatch = property.price.match(/€([\d,]+)/g);
      if (priceMatch) {
        if (property.type.includes('închiriat')) {
          setPriceRent(priceMatch[0].replace('€', '').replace(/,/g, ''));
        } else if (property.type.includes('vânzare')) {
          setPriceSale(priceMatch[0].replace('€', '').replace(/,/g, ''));
        }
      }
      
      setRooms(property.beds?.toString() || '');
      setBaths(property.baths?.toString() || '');
      setSqft(property.sqft?.replace(' mp', '') || '');
    }
  }, [property]);

  const handleSave = async () => {
    if (!property) return;

    setIsLoading(true);
    try {
      const propertyId = property.id;
      
      // Prepare PATCH payload
      const patchData: any = {};
      
      if (name.trim()) patchData.name = name.trim();
      if (address.trim()) patchData.address = address.trim();
      if (priceSale.trim()) patchData.price_sale = parseFloat(priceSale.replace(/,/g, ''));
      if (priceRent.trim()) patchData.price_rent = parseFloat(priceRent.replace(/,/g, ''));
      if (rooms.trim()) patchData.rooms = parseInt(rooms, 10);
      if (baths.trim()) patchData.bathrooms = parseInt(baths, 10);
      if (sqft.trim()) patchData.surface_useable = parseFloat(sqft.replace(/,/g, ''));

      logger.log('Patching property:', { propertyId, patchData });

      const response = await fetch(`${REBS_NEW_API_BASE}/properties/${propertyId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to update property:', errorText);
        Alert.alert('Eroare', 'Nu s-a putut actualiza proprietatea. Te rugăm să încerci din nou.');
        return;
      }

      const result = await response.json();
      logger.log('Property updated successfully:', result);

      Alert.alert('Succes', 'Proprietatea a fost actualizată cu succes!');
      onSave();
      onClose();
    } catch (error: any) {
      logger.error('Error updating property:', error);
      Alert.alert('Eroare', 'A apărut o eroare la actualizarea proprietății.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!property) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
            <Text style={styles.headerTitle}>Editează Proprietate</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nume Proprietate</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Introdu numele proprietății"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Adresă</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Introdu adresa"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preț Vânzare (€)</Text>
              <TextInput
                style={styles.input}
                value={priceSale}
                onChangeText={setPriceSale}
                placeholder="Introdu prețul de vânzare"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preț Închiriere (€/lună)</Text>
              <TextInput
                style={styles.input}
                value={priceRent}
                onChangeText={setPriceRent}
                placeholder="Introdu prețul de închiriere"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Număr Camere</Text>
              <TextInput
                style={styles.input}
                value={rooms}
                onChangeText={setRooms}
                placeholder="Introdu numărul de camere"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Număr Băi</Text>
              <TextInput
                style={styles.input}
                value={baths}
                onChangeText={setBaths}
                placeholder="Introdu numărul de băi"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Suprafață Utilă (mp)</Text>
              <TextInput
                style={styles.input}
                value={sqft}
                onChangeText={setSqft}
                placeholder="Introdu suprafața utilă"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvează</Text>
              )}
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
    justifyContent: 'flex-end',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
  content: {
    padding: 20,
    maxHeight: '70%',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});











