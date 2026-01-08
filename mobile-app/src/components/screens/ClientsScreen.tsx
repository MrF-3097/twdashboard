/**
 * ClientsScreen Component
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 * Translated to Romanian
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { useRequests } from '@/hooks/useRequests';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createScopedLogger } from '@/lib/logger';
import { CereriCard } from '@/components/ui/CereriCard';
import { rebsOldClient } from '@/services/api/rebs-old-client';

const logger = createScopedLogger('ClientsScreen');

interface Client {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  lastInteraction: string;
  type: string;
  budget: string;
  budgetExtra?: string;
  propertyType: string;
  phone?: string;
  email?: string;
  specifications?: string;
  area?: string;
  zone?: string;
  agentPhoto?: string;
  agentName?: string;
  agentPhone?: string;
  requestDetails?: {
    budget?: string;
    budgetExtra?: string;
    propertyType?: string;
    rooms?: string;
    area?: string;
    zone?: string;
  };
}

interface ClientsScreenProps {
  filterAgentId?: number | string; // Optional filter to show only specific agent's requests
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ filterAgentId }) => {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useRequests();
  const [isVisible, setIsVisible] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [agentsMap, setAgentsMap] = useState<Map<number, { name: string; photo?: string; phone?: string }>>(new Map());

  // Fetch agents from OLD API and create a map by ID
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
        logger.log('Fetching agents from OLD API...');
        const response = await rebsOldClient.get('/api/public/agent/');
        const agents = response.data?.objects || response.data || [];
        
        const map = new Map<number, { name: string; photo?: string; phone?: string }>();
        agents.forEach((agent: any) => {
          const agentId = agent.id;
          if (agentId) {
            const name = agent.name || 
                        (agent.first_name && agent.last_name 
                          ? `${agent.first_name} ${agent.last_name}`.trim()
                          : agent.first_name || agent.last_name || 'Agent');
            let photo = agent.photo || agent.profile_picture || agent.avatar || agent.image_url;
            // Construct full URL if photo is a relative path
            if (photo && !photo.startsWith('http://') && !photo.startsWith('https://')) {
              if (photo.startsWith('/')) {
                photo = `https://towerimob.crmrebs.com${photo}`;
              } else {
                photo = `https://towerimob.crmrebs.com/${photo}`;
              }
            }
            const phone = agent.phone || agent.mobile || agent.telefon;
            if (phone) {
              logger.log(`Agent ${name} (ID: ${agentId}) has phone: ${phone}`);
            }
            map.set(agentId, { name, photo, phone });
          }
        });
        
        logger.log(`Loaded ${map.size} agents into map`);
        setAgentsMap(map);
      } catch (err) {
        logger.error('Error fetching agents:', err);
      }
    };

    fetchAgents();
  }, []);

  useEffect(() => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Transform requests data to clients format
  const clients: Client[] = React.useMemo(() => {
    if (!data?.data?.objects) return [];
    
    // Filter by agent ID if filterAgentId is provided
    let filteredRequests = data.data.objects;
    if (filterAgentId !== undefined) {
      filteredRequests = data.data.objects.filter((request: any) => {
        const requestAgentId = typeof request.agent === 'object' && request.agent?.id
          ? request.agent.id
          : typeof request.agent === 'number'
          ? request.agent
          : request.agent_id;
        
        // Compare agent IDs (handle both string and number)
        return String(requestAgentId) === String(filterAgentId);
      });
    }
    
    return filteredRequests.map((request: any) => {
      // Get request ID for fallback
      const requestId = request.id || request.display_id || '?';
      
      // Extract client name from various possible fields
      let name: string | null = null;
      
      // Try different name sources
      if (request.name) {
        name = request.name;
      } else if (request.contact) {
        // If contact is an object
        if (typeof request.contact === 'object') {
          const firstName = request.contact.first_name || request.contact.prenume || '';
          const lastName = request.contact.last_name || request.contact.nume || '';
          name = `${firstName} ${lastName}`.trim() || request.contact.name || null;
        } else {
          name = request.contact;
        }
      } else if (request.contacts && Array.isArray(request.contacts) && request.contacts.length > 0) {
        // If contacts is an array, use first contact
        const contact = request.contacts[0];
        if (typeof contact === 'object') {
          const firstName = contact.first_name || contact.prenume || '';
          const lastName = contact.last_name || contact.nume || '';
          name = `${firstName} ${lastName}`.trim() || contact.name || null;
        } else {
          name = contact;
        }
      } else {
        // Try direct fields
        const firstName = request.first_name || request.prenume || '';
        const lastName = request.last_name || request.nume || '';
        name = `${firstName} ${lastName}`.trim() || null;
      }
      
      // Fallback to request ID format if no name found
      if (!name || name.trim() === '') {
        name = `Cerere #${requestId}`;
      }
      
      // Extract phone from various possible fields
      let phone = request.phone || 
                  request.telefon || 
                  request.contact?.phone || 
                  request.contact?.telefon ||
                  (request.contacts && Array.isArray(request.contacts) && request.contacts[0]?.phone) ||
                  (request.contacts && Array.isArray(request.contacts) && request.contacts[0]?.telefon) ||
                  undefined;
      
      // Extract email
      let email = request.email || 
                  request.contact?.email ||
                  (request.contacts && Array.isArray(request.contacts) && request.contacts[0]?.email) ||
                  undefined;
      
      const status = request.status || 'Active';
      const statusColor = 
        status === 'Hot Lead' || status === 'Urgent' ? 'gold' : // Gold for important/urgent
        status === 'Active' ? 'blue' : // Blue for active
        'muted';
      
      // Extract budget from price filters or budget fields (NEW API)
      // Try multiple field names that might contain budget data
      const budgetMin = request.price_filter_gte || 
                       request.price_min || 
                       request.budget_min || 
                       request.buget_min ||
                       request.min_price ||
                       request.price_min_filter ||
                       undefined;
      
      const budgetMax = request.price_filter_lte || 
                       request.price_max || 
                       request.budget_max || 
                       request.buget_max ||
                       request.max_price ||
                       request.price_max_filter ||
                       undefined;
      
      // Check if this is a rent request
      const isRentRequest = request.transaction_type === 1 || 
                           request.for_rent === true ||
                           request.type === 'Chiriaș' ||
                           request.type === 'Renter';
      
      // Format budget for card - only show if we have actual data
      // For rent requests, show full amount (not truncated)
      // For purchase requests, show truncated (€XK format)
      let budgetFormatted: string;
      let budgetExtra: string | undefined;
      
      if (budgetMin && budgetMax && budgetMin > 0 && budgetMax > 0) {
        // Both min and max available
        if (isRentRequest) {
          // Rent: show full amounts
          budgetFormatted = `€${budgetMin.toLocaleString('ro-RO')}`;
          budgetExtra = `+ €${(budgetMax - budgetMin).toLocaleString('ro-RO')}`;
        } else {
          // Purchase: show truncated
          budgetFormatted = `€${Math.round(budgetMin / 1000)}K`;
          budgetExtra = `+ €${Math.round((budgetMax - budgetMin) / 1000)}K`;
        }
      } else if (budgetMin && budgetMin > 0) {
        // Only min available
        if (isRentRequest) {
          budgetFormatted = `€${budgetMin.toLocaleString('ro-RO')}`;
        } else {
          budgetFormatted = `€${Math.round(budgetMin / 1000)}K`;
        }
        budgetExtra = undefined;
      } else if (budgetMax && budgetMax > 0) {
        // Only max available
        if (isRentRequest) {
          budgetFormatted = `€${budgetMax.toLocaleString('ro-RO')}`;
        } else {
          budgetFormatted = `€${Math.round(budgetMax / 1000)}K`;
        }
        budgetExtra = undefined;
      } else {
        // No budget data available - show N/A instead of €0K
        budgetFormatted = 'N/A';
        budgetExtra = undefined;
      }
      
      // Get rooms and bathrooms for specifications
      const roomsMin = request.rooms_filter_gte || request.rooms_min;
      const roomsMax = request.rooms_filter_lte || request.rooms_max;
      const rooms = roomsMin && roomsMax 
        ? `${roomsMin}-${roomsMax} camere`
        : roomsMin 
        ? `${roomsMin}+ camere`
        : roomsMax
        ? `până la ${roomsMax} camere`
        : 'N/A';
      
      // Get area (surface) - use surface_useable from NEW CRM REBS API
      // surface_useable is a nullable double/number field from NEW API
      const area = request.surface_useable !== null && request.surface_useable !== undefined
        ? Number(request.surface_useable)
        : null;
      const areaFormatted = area !== null && !isNaN(area) ? `${area} mp` : undefined;
      
      // Get preferred area/zone
      const zone = request.preferred_area || request.zone || request.city || 'N/A';
      
      // Get property type - map property_type enum to name
      const propertyType = request.property_type || request.tip_proprietate;
      const propertyTypeName = propertyType !== undefined && propertyType !== null
        ? (() => {
            const typeMap: Record<number, string> = {
              1: 'Apartament',
              3: 'Casă / Vilă',
              6: 'Teren',
              4: 'Spațiu de birouri',
              5: 'Spațiu comercial',
              7: 'Spațiu industrial',
              8: 'Hotel / Pensiune',
              9: 'Proprietate specială',
            };
            return typeMap[propertyType] || request.property_type_name || 'N/A';
          })()
        : request.property_type_name || request.tip_proprietate || 'N/A';
      
      // Extract agent ID and match with agents map
      let agentPhoto: string | undefined = undefined;
      let agentName: string | undefined = undefined;
      let agentPhone: string | undefined = undefined;
      
      const agentId = typeof request.agent === 'object' && request.agent?.id
        ? request.agent.id
        : typeof request.agent === 'number'
        ? request.agent
        : request.agent_id;
      
      if (agentId && agentsMap.has(agentId)) {
        const agent = agentsMap.get(agentId);
        if (agent) {
          agentName = agent.name;
          agentPhoto = agent.photo;
          agentPhone = agent.phone;
          if (agentPhone) {
            logger.log(`Found agent phone from map for agent ${agentName}: ${agentPhone}`);
          } else {
            logger.warn(`No phone found in map for agent ${agentName} (ID: ${agentId})`);
          }
        }
      } else if (request.agent && typeof request.agent === 'object') {
        // Fallback to direct agent object if not in map
        agentPhoto = request.agent.photo || 
                    request.agent.profile_picture || 
                    request.agent.avatar ||
                    request.agent.image_url ||
                    undefined;
        agentName = request.agent.name ||
                   request.agent.first_name && request.agent.last_name
                     ? `${request.agent.first_name} ${request.agent.last_name}`.trim()
                     : request.agent.first_name ||
                     request.agent.last_name ||
                     undefined;
        agentPhone = request.agent.phone || request.agent.mobile || request.agent.telefon;
        if (agentPhone) {
          logger.log(`Found agent phone from request object for agent ${agentName}: ${agentPhone}`);
        }
      } else {
        logger.warn(`No agent found for request ${requestId}, agentId: ${agentId}`);
      }
      
      return {
        id: request.id || request.display_id || `client-${Math.random()}`,
        name,
        status,
        statusColor,
        lastInteraction: request.updated_at || request.modified_at ? formatTimeAgo(request.updated_at || request.modified_at) : 'Necunoscut',
        type: request.transaction_type === 2 ? 'Cumpărător' : request.transaction_type === 1 ? 'Chiriaș' : 'Necunoscut',
        budget: budgetFormatted,
        budgetExtra,
        propertyType: propertyTypeName,
        phone,
        email,
        // Additional fields for CereriCard
        specifications: rooms,
        area: areaFormatted,
        zone,
        agentPhoto,
        agentName,
        agentPhone,
        // Request details for WhatsApp message
        requestDetails: {
          budget: budgetFormatted,
          budgetExtra,
          propertyType: propertyTypeName,
          rooms,
          area: areaFormatted,
          zone,
        },
      };
    });
  }, [data, agentsMap]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (statusColor: string) => {
    switch (statusColor) {
      case 'gold':
        return { bg: '#FFF9E6', text: colors.gold, border: '#FFE5A0' }; // Gold for important/urgent
      case 'blue':
        return { bg: colors.accent, text: colors.primary, border: colors.primaryLight }; // Blue for active
      case 'muted':
        return { bg: colors.secondary, text: colors.text.muted, border: colors.border };
      default:
        return { bg: colors.secondary, text: colors.text.muted, border: colors.border };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `Acum ${diffMins} minute`;
      if (diffHours < 24) return `Acum ${diffHours} ore`;
      if (diffDays < 7) return `Acum ${diffDays} zile`;
      return date.toLocaleDateString('ro-RO');
    } catch {
      return 'Necunoscut';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && clients.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Clienți</Text>
        <Text style={styles.subtitle}>{clients.length} clienți în total</Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
        <Ionicons name="search" size={20} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută clienți..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Ionicons name="filter" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </Animated.View>

      {/* Client Cards */}
      <View style={styles.clientsList}>
        {filteredClients.map((client, index) => (
          <Animated.View
            key={client.id}
            style={[
              { opacity: fadeAnim },
              styles.cardWrapper,
            ]}
          >
            <CereriCard
              budget={client.budget}
              budgetExtra={client.budgetExtra}
              type={client.propertyType || 'N/A'}
              specifications={client.specifications || 'N/A'}
              area={client.area}
              zone={client.zone || 'N/A'}
              contactName={client.name.split(' ')[0] || client.name}
              agentPhoto={client.agentPhoto}
              agentName={client.agentName}
              agentPhone={client.agentPhone}
              transactionType={client.type === 'Cumpărător' ? 2 : client.type === 'Chiriaș' ? 1 : undefined}
              requestDetails={client.requestDetails}
              cardStyle={{ width: 340, minHeight: 210 }}
            />
          </Animated.View>
        ))}
      </View>

      {filteredClients.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyText}>Nu s-au găsit clienți</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96, // Space for bottom nav
    // paddingTop is now set dynamically to match Hero section
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  filterButton: {
    padding: 6,
    marginLeft: 8,
  },
  clientsList: {
    gap: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  clientCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  clientCardExpanded: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clientInfo: {
    flex: 1,
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  lastInteraction: {
    fontSize: 12,
    color: colors.text.muted,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.secondary + '20',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailItemFull: {
    flexBasis: '100%',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
  },
  quickActionButtonSecondary: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  quickActionTextSecondary: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
    marginTop: 16,
  },
});

