/**
 * Request Detail Modal
 * EXACT copy of webapp - matching every div, className, spacing, and structure
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { PropertyCard } from '@/components/modules/properties/PropertyCard';
import { useProperties } from '@/hooks/useProperties';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import type { Request } from './RequestCard';

interface RequestDetailModalProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
}) => {
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.data?.objects || [];

  // Flexible property matching logic (same as webapp)
  const matchingProperties = useMemo(() => {
    if (!request || !properties.length) return [];

    return properties.filter((property: any) => {
      // Match transaction type
      if (request.transaction_type) {
        if (request.transaction_type === 2) {
          if (!property.for_sale && (!property.price_sale || property.price_sale === 0)) {
            return false;
          }
        } else if (request.transaction_type === 1) {
          if (!property.for_rent && (!property.price_rent || property.price_rent === 0)) {
            return false;
          }
        }
      }

      // Match property type
      if (request.property_type && property.property_type !== request.property_type) {
        return false;
      }

      // Flexible price matching: within budget OR up to 10,000 EUR more
      if (request.price_filter_lte) {
        const maxRequestPrice = request.price_filter_lte;
        const maxAllowedPrice = maxRequestPrice + 10000;
        
        let propertyPrice = 0;
        if (request.transaction_type === 2) {
          propertyPrice = property.price_sale || 0;
        } else if (request.transaction_type === 1) {
          propertyPrice = property.price_rent || 0;
        } else {
          propertyPrice = Math.max(property.price_sale || 0, property.price_rent || 0);
        }

        if (propertyPrice > maxAllowedPrice) {
          return false;
        }
        if (request.price_filter_gte && propertyPrice < request.price_filter_gte) {
          return false;
        }
      } else if (request.price_filter_gte) {
        let propertyPrice = 0;
        if (request.transaction_type === 2) {
          propertyPrice = property.price_sale || 0;
        } else if (request.transaction_type === 1) {
          propertyPrice = property.price_rent || 0;
        } else {
          propertyPrice = Math.max(property.price_sale || 0, property.price_rent || 0);
        }
        
        if (propertyPrice < request.price_filter_gte) {
          return false;
        }
      }

      // Flexible room matching
      if (request.rooms_filter_gte || request.rooms_filter_lte) {
        const propertyBedrooms = property.bedrooms || 0;
        const propertyTotalRooms = propertyBedrooms + 1;

        if (request.rooms_filter_gte && request.rooms_filter_lte) {
          const minRequestRooms = request.rooms_filter_gte;
          const maxRequestRooms = request.rooms_filter_lte + 1;
          
          if (propertyTotalRooms < minRequestRooms || propertyTotalRooms > maxRequestRooms) {
            return false;
          }
        } else if (request.rooms_filter_gte) {
          const minRequestRooms = request.rooms_filter_gte;
          if (propertyTotalRooms < minRequestRooms) {
            return false;
          }
          if (propertyTotalRooms > minRequestRooms + 1) {
            return false;
          }
        } else if (request.rooms_filter_lte) {
          const maxRequestRooms = request.rooms_filter_lte + 1;
          if (propertyTotalRooms > maxRequestRooms) {
            return false;
          }
        }
      }

      // Only show active properties
      const availability = property.availability ?? property.active;
      if (availability !== 1 && availability !== true && availability !== '1') {
        return false;
      }

      return true;
    });
  }, [request, properties]);

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
    if (typeof request?.agent === 'object' && request.agent?.name) {
      return request.agent.name;
    }
    if (typeof request?.agent === 'number') {
      return `Agent #${request.agent}`;
    }
    return 'Fără agent';
  };

  const handleWhatsAppShare = () => {
    if (!request) return;
    
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

  if (!request) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {request.title || `Cerere #${request.display_id || request.id}`}
              </Text>
              {request.display_id && (
                <Text style={styles.headerSubtitle}>ID: {request.display_id}</Text>
              )}
            </View>
            <View style={styles.headerActions}>
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
                  <Text style={styles.whatsappButtonText}>Trimite pe WhatsApp</Text>
                </SafeLinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content - Scrollable */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Request Details */}
            <Card style={styles.detailsCard}>
              <CardContent style={styles.detailsCardContent}>
                <View style={styles.detailsHeader}>
                  <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.detailsTitle}>Detalii Cerere</Text>
                </View>

                <View style={styles.detailsGrid}>
                  {/* Transaction Type */}
                  {request.transaction_type && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="document-text-outline" size={16} color="#CBD5E1" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Tip Tranzacție</Text>
                        <Text style={styles.detailValue}>
                          {getTransactionTypeLabel(request.transaction_type)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Property Type */}
                  {request.property_type && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="business-outline" size={16} color="#CBD5E1" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Tip Proprietate</Text>
                        <Text style={styles.detailValue}>
                          {getPropertyTypeLabel(request.property_type)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Rooms */}
                  {(request.rooms_filter_gte || request.rooms_filter_lte) && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="bed-outline" size={16} color="#CBD5E1" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Număr Camere</Text>
                        <Text style={styles.detailValue}>
                          {formatRooms(request.rooms_filter_gte, request.rooms_filter_lte)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Price */}
                  {(request.price_filter_gte || request.price_filter_lte) && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="cash-outline" size={16} color="#CBD5E1" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Buget</Text>
                        <Text style={styles.detailValue}>
                          {formatPrice(request.price_filter_gte, request.price_filter_lte)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Agent */}
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="person-outline" size={16} color="#CBD5E1" />
                    </View>
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Agent</Text>
                      <Text style={styles.detailValue}>{getAgentName()}</Text>
                    </View>
                  </View>

                  {/* Date */}
                  {request.date_added && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar-outline" size={16} color="#CBD5E1" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Data Adăugării</Text>
                        <Text style={styles.detailValue}>
                          {formatDate(request.date_added)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Details/Comments */}
                {request.details && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionLabel}>Detalii</Text>
                    <Text style={styles.detailsSectionText}>{request.details}</Text>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Matching Properties */}
            <View style={styles.propertiesSection}>
              <View style={styles.propertiesHeader}>
                <Ionicons name="business-outline" size={20} color="#FFFFFF" />
                <Text style={styles.propertiesTitle}>
                  Proprietăți Potrivite ({matchingProperties.length})
                </Text>
              </View>

              {matchingProperties.length > 0 ? (
                <View style={styles.propertiesGrid}>
                  {matchingProperties.map((property: any) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onPress={() => {
                        // Property card already handles opening URL
                      }}
                    />
                  ))}
                </View>
              ) : (
                <Card style={styles.emptyPropertiesCard}>
                  <CardContent style={styles.emptyPropertiesContent}>
                    <Ionicons name="business-outline" size={48} color="#64748B" />
                    <Text style={styles.emptyPropertiesTitle}>
                      Nu s-au găsit proprietăți potrivite
                    </Text>
                    <Text style={styles.emptyPropertiesText}>
                      Încearcă să ajustezi criteriile cererii pentru a găsi mai multe opțiuni.
                    </Text>
                  </CardContent>
                </Card>
              )}
            </View>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappButton: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  whatsappButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  whatsappButtonText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  detailsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailsCardContent: {
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  detailsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  detailsSectionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  detailsSectionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  propertiesSection: {
    gap: 16,
  },
  propertiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  propertiesGrid: {
    gap: 16,
  },
  emptyPropertiesCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyPropertiesContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyPropertiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPropertiesText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});













