/**
 * Request Card Component
 * EXACT copy of webapp - matching every div, className, spacing, and structure
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

export interface Request {
  id: number;
  display_id?: string;
  title?: string;
  transaction_type?: number | null;
  property_type?: number | null;
  rooms_filter_gte?: number | null;
  rooms_filter_lte?: number | null;
  price_filter_gte?: number | null;
  price_filter_lte?: number | null;
  date_added?: string | null;
  details?: string | null;
  comments_general?: string | null;
  cities?: string[];
  agent?: { id: number; name: string } | number;
  [key: string]: any;
}

interface RequestCardProps {
  request: Request;
  onPress?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onPress }) => {

  const formatPrice = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(min)} - ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(max)}`;
    }
    if (min) {
      return `De la ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(min)}`;
    }
    if (max) {
      return `Până la ${new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(max)}`;
    }
    return 'Preț flexibil';
  };

  const formatRooms = (min?: number | null, max?: number | null) => {
    if (min && max) {
      return `${min} - ${max} camere`;
    }
    if (min) {
      return `De la ${min} camere`;
    }
    if (max) {
      return `Până la ${max} camere`;
    }
    return 'Număr camere flexibil';
  };

  const getPropertyTypeLabel = (type?: number | null) => {
    const typeMap: Record<number, string> = {
      1: 'Apartament',
      3: 'Casă/Vilă',
      6: 'Teren',
      4: 'Spațiu birouri',
      5: 'Spațiu comercial',
    };
    return type ? typeMap[type] || 'Nespecificat' : 'Nespecificat';
  };

  const getTransactionTypeLabel = (type?: number | null) => {
    if (type === 1) return 'Închiriere';
    if (type === 2) return 'Vânzare';
    return 'Nespecificat';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Data necunoscută';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ro-RO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Data necunoscută';
    }
  };

  const getAgentName = () => {
    if (typeof request.agent === 'object' && request.agent?.name) {
      return request.agent.name;
    }
    if (typeof request.agent === 'number') {
      return `Agent #${request.agent}`;
    }
    return 'Fără agent';
  };

  const handleWhatsAppShare = () => {
    const title = request.title || `Cerere #${request.display_id || request.id}`;
    const transactionType = getTransactionTypeLabel(request.transaction_type);
    const propertyType = getPropertyTypeLabel(request.property_type);
    const rooms = formatRooms(request.rooms_filter_gte, request.rooms_filter_lte);
    const price = formatPrice(request.price_filter_gte, request.price_filter_lte);
    const agent = getAgentName();

    let message = `*${title}*\n\n`;
    message += `Tip tranzacție: ${transactionType}\n`;
    if (propertyType !== 'Nespecificat') {
      message += `Tip proprietate: ${propertyType}\n`;
    }
    if (rooms !== 'Număr camere flexibil') {
      message += `Camere: ${rooms}\n`;
    }
    message += `Preț: ${price}\n`;

    if (request.cities && request.cities.length > 0) {
      message += `Locație: ${request.cities.join(', ')}\n`;
    }

    if (agent !== 'Fără agent') {
      message += `Agent: ${agent}\n`;
    }

    if (request.details) {
      message += `\nDetalii:\n${request.details}\n`;
    }
    if (request.comments_general) {
      message += `\nComentarii:\n${request.comments_general}\n`;
    }

    message += `\nInteresat de această cerere?`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <>
      {/* bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (onPress) onPress();
        }}
        activeOpacity={0.8}
      >
        {/* p-4 space-y-3 */}
        <View style={styles.content}>
          {/* Header - flex items-start justify-between gap-2 */}
          <View style={styles.header}>
            {/* flex-1 min-w-0 */}
            <View style={styles.titleContainer}>
              {/* text-lg font-semibold text-white truncate mb-1 */}
              <Text style={styles.title} numberOfLines={1}>
                {request.title || `Cerere #${request.display_id || request.id}`}
              </Text>
              {/* text-xs text-slate-400 */}
              {request.display_id && (
                <Text style={styles.displayId}>ID: {request.display_id}</Text>
              )}
            </View>
            {/* flex flex-col items-end gap-1 */}
            <View style={styles.badgeContainer}>
              {request.transaction_type && (
                // inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                <View
                  style={[
                    styles.transactionBadge,
                    request.transaction_type === 2
                      ? styles.transactionBadgeSale
                      : styles.transactionBadgeRent,
                  ]}
                >
                  <Text
                    style={[
                      styles.transactionBadgeText,
                      request.transaction_type === 2
                        ? styles.transactionBadgeTextSale
                        : styles.transactionBadgeTextRent,
                    ]}
                  >
                    {getTransactionTypeLabel(request.transaction_type)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Details Grid - grid grid-cols-2 gap-3 text-sm */}
          <View style={styles.detailsGrid}>
            {request.property_type && (
              // flex items-center gap-2 text-slate-300
              <View style={styles.detailItem}>
                <Ionicons name="document-text-outline" size={16} color="#CBD5E1" />
                {/* truncate */}
                <Text style={styles.detailText} numberOfLines={1}>
                  {getPropertyTypeLabel(request.property_type)}
                </Text>
              </View>
            )}

            {(request.rooms_filter_gte || request.rooms_filter_lte) && (
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={16} color="#CBD5E1" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatRooms(request.rooms_filter_gte, request.rooms_filter_lte)}
                </Text>
              </View>
            )}

            {(request.price_filter_gte || request.price_filter_lte) && (
              // col-span-2
              <View style={[styles.detailItem, styles.detailItemFull]}>
                <Ionicons name="cash-outline" size={16} color="#CBD5E1" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatPrice(request.price_filter_gte, request.price_filter_lte)}
                </Text>
              </View>
            )}
          </View>

          {/* Agent and Date - flex items-center justify-between pt-2 border-t border-slate-700/50 */}
          <View style={styles.footer}>
            {/* flex items-center gap-2 text-xs text-slate-400 */}
            <View style={styles.agentRow}>
              <Ionicons name="person-outline" size={14} color="#94A3B8" />
              {/* truncate */}
              <Text style={styles.agentText} numberOfLines={1}>
                {getAgentName()}
              </Text>
            </View>
            {request.date_added && (
              // flex items-center gap-1 text-xs text-slate-500
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.dateText}>{formatDate(request.date_added)}</Text>
              </View>
            )}
          </View>

          {/* Details/Comments - pt-2 border-t border-slate-700/50 */}
          {request.details && (
            <View style={styles.detailsSection}>
              {/* text-xs text-slate-400 line-clamp-2 */}
              <Text style={styles.detailsText} numberOfLines={2}>
                {request.details}
              </Text>
            </View>
          )}

          {/* WhatsApp Share Button - pt-2 border-t border-slate-700/50 */}
          <View style={styles.whatsappSection}>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsAppShare}
              activeOpacity={0.8}
            >
              <SafeLinearGradient
                colors={['rgba(22, 163, 74, 0.1)', 'rgba(22, 163, 74, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.whatsappButtonGradient}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#34D399" />
                {/* text-green-400 */}
                <Text style={styles.whatsappButtonText}>Trimite pe WhatsApp</Text>
              </SafeLinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Request Detail Modal - Will be handled by parent component */}
    </>
  );
};

const styles = StyleSheet.create({
  // bg-slate-800/50 border-slate-700/50
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // bg-slate-800/50
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)', // border-slate-700/50
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // p-4 space-y-3
  content: {
    padding: 16, // p-4
    gap: 12, // space-y-3
  },
  // flex items-start justify-between gap-2
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8, // gap-2
  },
  // flex-1 min-w-0
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  // text-lg font-semibold text-white truncate mb-1
  title: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#FFFFFF',
    marginBottom: 4, // mb-1
  },
  // text-xs text-slate-400
  displayId: {
    fontSize: 12, // text-xs
    color: '#94A3B8', // text-slate-400
  },
  // flex flex-col items-end gap-1
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4, // gap-1
  },
  // inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
  transactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
  },
  // bg-emerald-500/15 text-emerald-300
  transactionBadgeSale: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // bg-emerald-500/15
  },
  // bg-sky-500/15 text-sky-300
  transactionBadgeRent: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)', // bg-sky-500/15
  },
  transactionBadgeText: {
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
  },
  transactionBadgeTextSale: {
    color: '#6EE7B7', // text-emerald-300
  },
  transactionBadgeTextRent: {
    color: '#7DD3FC', // text-sky-300
  },
  // grid grid-cols-2 gap-3 text-sm
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // gap-3
  },
  // flex items-center gap-2 text-slate-300
  detailItem: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
  },
  // col-span-2
  detailItemFull: {
    width: '100%',
    flex: 1,
    minWidth: '100%',
  },
  // text-slate-300
  detailText: {
    fontSize: 14, // text-sm
    color: '#CBD5E1', // text-slate-300
    flex: 1,
  },
  // flex items-center justify-between pt-2 border-t border-slate-700/50
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8, // pt-2
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)', // border-slate-700/50
  },
  // flex items-center gap-2 text-xs text-slate-400
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2
    flex: 1,
    minWidth: 0,
  },
  // text-xs text-slate-400 truncate
  agentText: {
    fontSize: 12, // text-xs
    color: '#94A3B8', // text-slate-400
    flex: 1,
  },
  // flex items-center gap-1 text-xs text-slate-500
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1
  },
  // text-xs text-slate-500
  dateText: {
    fontSize: 12, // text-xs
    color: '#64748B', // text-slate-500
  },
  // pt-2 border-t border-slate-700/50
  detailsSection: {
    paddingTop: 8, // pt-2
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)', // border-slate-700/50
  },
  // text-xs text-slate-400 line-clamp-2
  detailsText: {
    fontSize: 12, // text-xs
    color: '#94A3B8', // text-slate-400
  },
  // pt-2 border-t border-slate-700/50
  whatsappSection: {
    paddingTop: 8, // pt-2
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)', // border-slate-700/50
  },
  // w-full bg-green-600/10 hover:bg-green-600/20 border-green-600/30 text-green-400
  whatsappButton: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.3)', // border-green-600/30
  },
  whatsappButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  // text-green-400
  whatsappButtonText: {
    color: '#34D399', // text-green-400
    fontSize: 14,
    fontWeight: '500',
  },
});
