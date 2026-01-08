/**
 * Property Card Component
 * Displays property information (matching web app design)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { colors } from '@/lib/colors';
import { Ionicons } from '../icons/Ionicons';

export interface Property {
  id: number;
  title?: string;
  location?: string;
  price_sale?: number;
  price_rent?: number;
  bedrooms?: number;
  surface?: number;
  property_type?: number;
  for_sale?: boolean;
  for_rent?: boolean;
  images?: string[];
  [key: string]: any;
}

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

const propertyTypeMap: Record<number, string> = {
  1: 'Apartament',
  3: 'Casă/Vilă',
  6: 'Teren',
  4: 'Spațiu birouri',
  5: 'Spațiu comercial',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const displayPrice = property.for_sale && property.price_sale
    ? property.price_sale
    : property.for_rent && property.price_rent
    ? property.price_rent
    : property.price_sale || property.price_rent || 0;

  const transactionType = property.for_sale && property.price_sale ? 'Vânzare' : 'Închiriere';
  const propertyTypeName = property.property_type
    ? propertyTypeMap[property.property_type] || 'Proprietate'
    : 'Proprietate';

  const location = property.location || property.address || 'Locație necunoscută';
  const title = property.title || `${propertyTypeName} ${property.bedrooms ? `${property.bedrooms} camere` : ''}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      {property.images && property.images.length > 0 ? (
        <Image source={{ uri: property.images[0] }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="home-outline" size={48} color={colors.text.muted} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{transactionType}</Text>
          </View>
          {property.bedrooms && (
            <View style={styles.badge}>
              <Ionicons name="bed-outline" size={12} color={colors.text.muted} />
              <Text style={styles.badgeText}>{property.bedrooms}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.text.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          {property.surface && (
            <View style={styles.detailItem}>
              <Ionicons name="expand-outline" size={14} color={colors.text.muted} />
              <Text style={styles.detailText}>{property.surface} m²</Text>
            </View>
          )}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(displayPrice)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceLight,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: colors.text.muted,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  priceContainer: {
    marginLeft: 'auto',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
});


