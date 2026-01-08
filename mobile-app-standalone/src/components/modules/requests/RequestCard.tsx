/**
 * Request Card Component
 * Displays client request information (matching web app design)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { Ionicons } from '../icons/Ionicons';

export interface Request {
  id: number;
  display_id?: string;
  name?: string;
  transaction_type?: string;
  property_type?: number;
  bedrooms?: number;
  price_min?: number;
  price_max?: number;
  agent_name?: string;
  created_at?: string;
  message?: string;
  [key: string]: any;
}

interface RequestCardProps {
  request: Request;
  onPress: () => void;
}

const propertyTypeMap: Record<number, string> = {
  1: 'Apartament',
  3: 'Casă/Vilă',
  6: 'Teren',
  4: 'Spațiu birouri',
  5: 'Spațiu comercial',
};

export const RequestCard: React.FC<RequestCardProps> = ({ request, onPress }) => {
  const transactionType = request.transaction_type === 'sale' ? 'Vânzare' : 'Închiriere';
  const propertyTypeName = request.property_type
    ? propertyTypeMap[request.property_type] || 'Proprietate'
    : 'Proprietate';

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{transactionType}</Text>
        </View>
        {request.display_id && (
          <Text style={styles.displayId}>#{request.display_id}</Text>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {request.name || 'Cerere fără nume'}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="home-outline" size={16} color={colors.text.muted} />
          <Text style={styles.detailText}>{propertyTypeName}</Text>
        </View>

        {request.bedrooms && (
          <View style={styles.detailRow}>
            <Ionicons name="bed-outline" size={16} color={colors.text.muted} />
            <Text style={styles.detailText}>{request.bedrooms} camere</Text>
          </View>
        )}

        {(request.price_min || request.price_max) && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={colors.text.muted} />
            <Text style={styles.detailText}>
              {request.price_min && request.price_max
                ? `${new Intl.NumberFormat('ro-RO', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(request.price_min)} - ${new Intl.NumberFormat('ro-RO', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(request.price_max)}`
                : request.price_min
                ? `Min: ${new Intl.NumberFormat('ro-RO', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(request.price_min)}`
                : `Max: ${new Intl.NumberFormat('ro-RO', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(request.price_max)}`}
            </Text>
          </View>
        )}
      </View>

      {request.agent_name && (
        <View style={styles.footer}>
          <Ionicons name="person-outline" size={14} color={colors.text.muted} />
          <Text style={styles.agentName}>{request.agent_name}</Text>
          {request.created_at && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.date}>{formatDate(request.created_at)}</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  displayId: {
    fontSize: 12,
    color: colors.text.muted,
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  details: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  agentName: {
    fontSize: 12,
    color: colors.text.muted,
  },
  separator: {
    fontSize: 12,
    color: colors.text.muted,
  },
  date: {
    fontSize: 12,
    color: colors.text.muted,
  },
});


