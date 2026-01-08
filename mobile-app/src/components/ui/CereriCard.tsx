/**
 * CereriCard Component
 * Based on vortex-haven PropertyCard design
 * Adapted for React Native
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

interface CereriCardProps {
  budget: string;
  budgetExtra?: string;
  type: string;
  specifications: string;
  area?: string;
  zone: string;
  contactName: string;
  agentPhoto?: string;
  agentName?: string;
  agentPhone?: string;
  transactionType?: number; // 1 = Chiriaș (Închiriere), 2 = Cumpărător (Cumpărare)
  requestDetails?: {
    budget?: string;
    budgetExtra?: string;
    propertyType?: string;
    rooms?: string;
    area?: string;
    zone?: string;
  };
  onPress?: () => void;
  cardStyle?: any;
}

export const CereriCard: React.FC<CereriCardProps> = ({
  budget,
  budgetExtra,
  type,
  specifications,
  area,
  zone,
  contactName,
  agentPhoto,
  agentName,
  agentPhone,
  transactionType,
  requestDetails,
  onPress,
  cardStyle,
}) => {
  // Determine transaction type label
  const transactionLabel = transactionType === 2 
    ? 'Cumpărare' 
    : transactionType === 1 
    ? 'Închiriere' 
    : 'Budget';

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string): string | null => {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If empty after cleaning, return null
    if (!cleaned) return null;
    
    // Handle Romanian phone numbers
    // If starts with 0, remove it (Romanian national format)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // If starts with 40 (Romania country code), keep it
    // If doesn't start with country code, add it
    if (!cleaned.startsWith('40')) {
      cleaned = '40' + cleaned;
    }
    
    // Ensure it's a valid length (Romanian numbers with country code should be 10-12 digits)
    if (cleaned.length < 10 || cleaned.length > 12) {
      console.warn('Invalid phone number length:', cleaned);
      return null;
    }
    
    return cleaned;
  };

  // Handle WhatsApp button press
  const handleWhatsAppPress = async () => {
    if (!agentPhone) {
      console.warn('No agent phone number available for agent:', agentName);
      return;
    }

    console.log('Original phone number:', agentPhone);
    
    // Format phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(agentPhone);
    
    if (!formattedPhone) {
      console.error('Could not format phone number:', agentPhone);
      return;
    }
    
    console.log('Formatted phone number for WhatsApp:', formattedPhone);
    
    // Build detailed message in Romanian with request details
    let message = `Bună ziua! Am o întrebare despre cererea de ${transactionLabel.toLowerCase()} menționată în aplicație.\n\n`;
    
    // Add request details if available
    if (requestDetails) {
      const details: string[] = [];
      
      // Add transaction type
      details.push(`Tip: ${transactionLabel}`);
      
      // Add budget if available
      if (requestDetails.budget && requestDetails.budget !== 'N/A' && requestDetails.budget !== '€0K') {
        let budgetText = `Buget: ${requestDetails.budget}`;
        if (requestDetails.budgetExtra) {
          budgetText += ` ${requestDetails.budgetExtra}`;
        }
        details.push(budgetText);
      }
      
      // Add property type if available
      if (requestDetails.propertyType && requestDetails.propertyType !== 'N/A') {
        details.push(`Tip proprietate: ${requestDetails.propertyType}`);
      }
      
      // Add rooms if available
      if (requestDetails.rooms && requestDetails.rooms !== 'N/A') {
        details.push(`Număr camere: ${requestDetails.rooms}`);
      }
      
      // Add area if available
      if (requestDetails.area && requestDetails.area !== 'N/A') {
        details.push(`Suprafață: ${requestDetails.area}`);
      }
      
      // Add zone if available
      if (requestDetails.zone && requestDetails.zone !== 'N/A') {
        details.push(`Zonă: ${requestDetails.zone}`);
      }
      
      // Add details to message if any are available
      if (details.length > 1) { // More than just "Tip: ..."
        message += 'Detalii cerere:\n';
        details.forEach((detail, index) => {
          message += `• ${detail}`;
          if (index < details.length - 1) {
            message += '\n';
          }
        });
        message += '\n\n';
      }
    }
    
    message += 'Ați putea să-mi oferiți mai multe detalii?';
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Build WhatsApp URL - use universal format that works on both iOS and Android
    // wa.me format works on both platforms
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    try {
      // Try to open WhatsApp
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // If wa.me doesn't work, try iOS-specific format
        if (Platform.OS === 'ios') {
          const iosUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`;
          const canOpenIOS = await Linking.canOpenURL(iosUrl);
          if (canOpenIOS) {
            await Linking.openURL(iosUrl);
          } else {
            console.error('WhatsApp is not installed');
          }
        } else {
          console.error('WhatsApp is not installed or cannot be opened');
        }
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };
  return (
    <TouchableOpacity
      style={[styles.card, cardStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top section with budget - 2x bigger, sticks to top */}
      <View style={styles.topSection}>
        <View style={styles.budgetContainer}>
          <Text style={styles.budgetText}>{budget}</Text>
          {budgetExtra && (
            <Text style={styles.budgetExtraText}>{budgetExtra}</Text>
          )}
        </View>
        <View style={[
          styles.budgetLabel,
          transactionType === 2 && styles.budgetLabelPurchase, // Green for Cumpărare
          transactionType === 1 && styles.budgetLabelRent, // Blue for Închiriere
        ]}>
          <Text style={[
            styles.budgetLabelText,
            (transactionType === 2 || transactionType === 1) && styles.budgetLabelTextFilled,
          ]}>
            {transactionLabel}
          </Text>
        </View>
      </View>

      {/* Info grid - Row 1: Tip and Area */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tip</Text>
          <Text style={styles.infoValue}>{type}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Suprafata</Text>
          <Text style={styles.infoValue}>{area || 'N/A'}</Text>
        </View>
      </View>

      {/* Spacing between info rows */}
      <View style={styles.infoRowSpacing} />

      {/* Info grid - Row 2: Specifications and Zone */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Specificati</Text>
          <Text style={styles.infoValue}>{specifications}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Zona</Text>
          <Text style={styles.infoValue}>{zone || 'N/A'}</Text>
        </View>
      </View>

      {/* Bottom section with agent button and agent photo */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.contactButton} 
          activeOpacity={0.8}
          onPress={handleWhatsAppPress}
        >
          <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>{agentName || contactName}</Text>
        </TouchableOpacity>
        <View style={styles.userIconContainer}>
          {agentPhoto ? (
            <Image
              source={{ uri: agentPhoto }}
              style={styles.agentPhoto}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={28} color="#333333" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 280, // Wider (was 250)
    minHeight: 190, // Adjusted (was 200, removed top padding)
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE', // gray-light
    padding: 0,
    overflow: 'hidden',
    // Shadow - 30% stronger
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.26, // 30% stronger (was ~0.20)
    shadowRadius: 6.5, // 30% stronger (was ~5)
    elevation: 8, // Android shadow - 30% stronger (was ~6)
  },
  topSection: {
    flexDirection: 'row',
    height: 40, // 2x bigger (was 20)
    alignItems: 'center',
  },
  budgetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Transparent/white - not filled
    borderWidth: 1,
    borderColor: '#1E6DFF', // Same stroke as transaction type
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 40, // 2x bigger (was 20)
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32, // 2x bigger (was 16)
    justifyContent: 'flex-start',
  },
  budgetText: {
    color: '#333333', // Dark text on white background
    fontSize: 19.3, // Increased by ~15% (16.8 * 1.15 = 19.32)
    fontWeight: '400',
    lineHeight: 19.3, // Increased by ~15% (16.8 * 1.15 = 19.32)
  },
  budgetExtraText: {
    color: '#666666', // Medium gray for extra text
    fontSize: 11.2, // 30% smaller (16 * 0.7 = 11.2)
    fontWeight: '400',
    lineHeight: 11.2, // 30% smaller (16 * 0.7 = 11.2)
    marginLeft: 16, // 2x bigger (was 8)
  },
  budgetLabel: {
    height: 40, // 2x bigger (was 20)
    borderWidth: 1,
    borderColor: '#1E6DFF', // Default blue border
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: '#FFFFFF', // Default white (for "Budget" fallback)
    minWidth: 130, // 2x bigger (was 65)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24, // 2x bigger (was 12)
  },
  budgetLabelPurchase: {
    backgroundColor: '#4CAF50', // Green for Cumpărare
    borderColor: '#4CAF50', // Green border to match
  },
  budgetLabelRent: {
    backgroundColor: '#1E6DFF', // Blue for Închiriere
    borderColor: '#1E6DFF', // Blue border to match
  },
  budgetLabelText: {
    color: '#333333', // gray-dark (for "Budget" fallback)
    fontSize: 16, // 2x bigger (was 8)
    fontWeight: '400',
    lineHeight: 16, // 2x bigger (was 8)
  },
  budgetLabelTextFilled: {
    color: '#FFFFFF', // White text on filled background
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12, // Increased from 9
    gap: 16,
  },
  infoRowSpacing: {
    height: 10, // Spacing between info rows
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#A4A4A4', // gray-medium
    fontSize: 14, // Bigger (was 8)
    fontWeight: '400',
    lineHeight: 14, // Bigger (was 8)
  },
  infoValue: {
    color: '#333333', // gray-dark
    fontSize: 18, // Bigger (was 12)
    fontWeight: '400',
    lineHeight: 18, // Bigger (was 12)
    marginTop: 4, // Bigger (was 2)
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    marginTop: 'auto',
    gap: 12,
  },
  contactButton: {
    backgroundColor: '#1E6DFF', // primary-blue
    borderRadius: 8, // Bigger (was 6)
    height: 38, // Less tall by 10px (was 48)
    paddingHorizontal: 32, // 2x bigger (was 16)
    paddingRight: 62, // Extended 30px more to the right (32 + 30)
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Bigger (was 8)
    flex: 1, // Allow button to expand
    marginRight: -30, // Extend 30px more to the right (negative margin)
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 18, // Bigger (was 12)
    fontWeight: '700',
    lineHeight: 18, // Bigger (was 12)
  },
  userIconContainer: {
    width: 70, // 2x bigger (was 35)
    height: 70, // 2x bigger (was 35)
    borderRadius: 35, // 2x bigger (was 17.5)
    backgroundColor: '#EEEEEE', // gray-light
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1E6DFF', // primary-blue - same color as button
  },
  agentPhoto: {
    width: '100%',
    height: '100%',
  },
});

