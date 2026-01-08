/**
 * PropertiesScreen Component
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 * Translated to Romanian
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Animated, Modal, RefreshControl, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { useProperties, invalidatePropertiesCache } from '@/hooks/useProperties';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createScopedLogger } from '@/lib/logger';
import { SafeBlurView } from '@/components/ui/SafeBlurView';
import { rebsOldClient, type OldApiAgent } from '@/services/api/rebs-old-client';
import { EditPropertyModal } from '@/components/modules/properties/EditPropertyModal';
import { PropertyActionModal } from '@/components/modules/properties/PropertyActionModal';

const logger = createScopedLogger('PropertiesScreen');

interface Property {
  id: string;
  name: string;
  address: string;
  price: string;
  type: string;
  typeColor: string;
  image?: string;
  beds?: number;
  baths?: number;
  sqft?: string;
  status: string;
  propertyType?: number; // For filtering by property type
  priceSale?: number; // For price range filtering
  priceRent?: number; // For price range filtering
  agentId?: number; // For filtering by agent
  agentName?: string; // For display
  agentPhoto?: string; // Agent photo URL
}

interface PropertiesScreenProps {
  filterAgentId?: number | string; // Optional filter to show only specific agent's properties
}

export const PropertiesScreen: React.FC<PropertiesScreenProps> = ({ filterAgentId }) => {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useProperties();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null); // 'rent', 'sale', or null for all
  const [filterStatus, setFilterStatus] = useState<string | null>(null); // 'active', 'sold', 'reserved', or null for all
  const [filterPropertyType, setFilterPropertyType] = useState<number | null>(null); // Property type filter
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [filterRoomsMin, setFilterRoomsMin] = useState<string>('');
  const [filterRoomsMax, setFilterRoomsMax] = useState<string>('');
  const [filterAgentIds, setFilterAgentIds] = useState<number[]>([]); // Multiple agent filter
  const [agents, setAgents] = useState<OldApiAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentsMap, setAgentsMap] = useState<Map<number, { name: string; photo?: string; phone?: string }>>(new Map());
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyActionModal, setShowPropertyActionModal] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch agents for filtering (using OLD API, same as HomeScreen)
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        // Use same approach as HomeScreen - no extra params that cause 400 error
        const response = await rebsOldClient.get('/api/public/agent/');
        const agentsData = response.data?.objects || response.data || [];
        setAgents(agentsData);
        
        // Create agents map for photo lookup (similar to HomeScreen)
        const map = new Map<number, { name: string; photo?: string; phone?: string }>();
        agentsData.forEach((agent: any) => {
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
            map.set(agentId, { name, photo, phone });
          }
        });
        setAgentsMap(map);
        
        logger.log('Fetched agents for filtering:', agentsData.length);
      } catch (err) {
        logger.error('Error fetching agents:', err);
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  // Check if properties have agent data on mount - if not, invalidate cache to force fresh fetch
  useEffect(() => {
    if (properties && Array.isArray(properties) && properties.length > 0) {
      const propertiesWithAgent = properties.filter(p => p.agentId);
      const agentDataCoverage = (propertiesWithAgent.length / properties.length) * 100;
      
      logger.log('Properties agent data coverage:', {
        totalProperties: properties.length,
        propertiesWithAgent: propertiesWithAgent.length,
        coveragePercent: agentDataCoverage.toFixed(1) + '%',
      });
      
      // If less than 10% of properties have agent data, likely cache issue - force refresh
      if (agentDataCoverage < 10 && properties.length > 10) {
        logger.warn('Low agent data coverage detected - invalidating cache to force fresh fetch');
        invalidatePropertiesCache();
        if (refetch) {
          refetch();
        }
      }
    }
  }, [properties, refetch]);

  // Property type mapping from old REBS API
  const getPropertyTypeName = (propertyType: number): string => {
    const typeMap: Record<number, string> = {
      1: 'Apartament',
      2: 'Casa',
      3: 'Casa',
      4: 'Spațiu birouri',
      5: 'Spațiu comercial',
      6: 'Teren',
      7: 'Spațiu industrial',
      8: 'Hotel',
      9: 'Alt tip',
    };
    return typeMap[propertyType] || 'Proprietate';
  };

  // Transform properties data to match Figma design
  const properties: Property[] = React.useMemo(() => {
    if (!data?.data?.objects) return [];
    
    return data.data.objects.map((property: any) => {
      // Use OLD API boolean fields for transaction type
      const isRent = property.for_rent === true;
      const isSale = property.for_sale === true;
      
      // Determine transaction type and price from OLD API fields
      let price = '';
      let type = '';
      let typeColor = 'blue';
      
      if (isRent && isSale) {
        // Both available - show both prices
        const rentPrice = property.price_rent;
        const salePrice = property.price_sale;
        if (rentPrice && salePrice) {
          price = `${rentPrice}€/lună / ${salePrice}€`;
        } else if (rentPrice) {
          price = `${rentPrice}€/lună`;
        } else if (salePrice) {
          price = `${salePrice}€`;
        }
        type = 'De închiriat / De vânzare';
        typeColor = 'blue';
      } else if (isRent) {
        const rentPrice = property.price_rent;
        if (rentPrice && rentPrice > 0) {
          price = `${rentPrice}€/lună`;
        }
        type = 'De închiriat';
        typeColor = 'blue';
      } else if (isSale) {
        const salePrice = property.price_sale;
        if (salePrice && salePrice > 0) {
          price = `${salePrice}€`;
        }
        type = 'De vânzare';
        typeColor = 'green';
      }
      
      // If no price found and no transaction type, show property type name
      if (!price && !type) {
        const propTypeName = getPropertyTypeName(property.property_type);
        price = propTypeName;
        type = propTypeName;
      } else if (!price) {
        // Has type but no price - show type as price placeholder
        price = type;
      } else if (!type) {
        // Has price but no type - determine from price format
        if (price.includes('/lună')) {
          type = 'De închiriat';
          typeColor = 'blue';
        } else {
          type = 'De vânzare';
          typeColor = 'green';
        }
      }
      
      // Build address from OLD API fields
      const addressParts: string[] = [];
      if (property.street) addressParts.push(property.street);
      if (property.zone) addressParts.push(property.zone);
      if (property.city) addressParts.push(property.city);
      const address = addressParts.length > 0 
        ? addressParts.join(', ') 
        : property.address || property.region || '';
      
      // Use OLD API image fields: resized_images, full_images, thumbnail, primaryImageUrl
      const imageUrl = property.primaryImageUrl || 
                      property.thumbnail || 
                      property.resized_images?.[0] || 
                      property.full_images?.[0] ||
                      property.image_url || 
                      property.image;
      
      // Map availability status
      let status = 'Activ';
      if (property.availability === 4) {
        status = 'Vândut';
      } else if (property.availability === 3) {
        status = 'Rezervat';
      } else if (property.availability === 1) {
        status = 'Activ';
      }
      
      // Get agent info - handle different agent field formats
      // OLD API "agent" field is a "related" field, which can be:
      // 1. A URL string like "/api/public/agent/123/" or "https://towerimob.crmrebs.com/api/public/agent/123/"
      // 2. An object with agent details
      // 3. An ID number
      // 4. null/undefined
      // Also check for alternative field names
      const agent = property.agent || property.agent_id || (property as any).agentId;
      let agentId: number | undefined = undefined;
      let agentName: string | undefined = undefined;
      
      if (agent) {
        if (typeof agent === 'number') {
          // Agent is just an ID number
          agentId = agent;
        } else if (typeof agent === 'object' && agent !== null) {
          // Agent is an object with id and name fields
          agentId = (agent as any).id || (agent as any).user_id;
          agentName = `${(agent as any).first_name || ''} ${(agent as any).last_name || ''}`.trim() || 
                     (agent as any).name || 
                     (agent as any).full_name;
        } else if (typeof agent === 'string') {
          // Agent is likely a URL string - extract ID from it
          // Examples: 
          // "/api/public/agent/123/"
          // "https://towerimob.crmrebs.com/api/public/agent/123/"
          // "http://towerimob.crmrebs.com/api/public/agent/123"
          const match = agent.match(/\/agent\/(\d+)/);
          if (match && match[1]) {
            agentId = parseInt(match[1], 10);
          } else {
            // Try to parse as direct number string
            const numMatch = agent.match(/^(\d+)$/);
            if (numMatch) {
              agentId = parseInt(numMatch[1], 10);
            }
          }
        }
      }
      
      // Also check if there's a direct agent_id field
      if (!agentId && property.agent_id) {
        agentId = typeof property.agent_id === 'number' 
          ? property.agent_id 
          : parseInt(String(property.agent_id), 10);
      }
      
      // Ensure agentId is a valid number
      if (agentId !== undefined) {
        agentId = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
        if (isNaN(agentId) || agentId <= 0) {
          agentId = undefined;
        }
      }
      
      // Log first property to debug agent field structure (only once)
      if (property.id === 2858591) {
        logger.log('Sample property agent field structure:', {
          propertyId: property.id,
          agent: property.agent,
          agentType: typeof property.agent,
          agent_id: property.agent_id,
          extractedAgentId: agentId,
          agentName: agentName,
          agentStringified: typeof property.agent === 'object' ? JSON.stringify(property.agent) : property.agent,
          allAgentFields: Object.keys(property).filter(k => k.toLowerCase().includes('agent')),
        });
      }

      return {
        id: property.id || property.display_id || `property-${Math.random()}`,
        name: property.title || property.name || getPropertyTypeName(property.property_type) || 'Proprietate',
        address,
        price,
        type: type || getPropertyTypeName(property.property_type),
        typeColor,
        image: imageUrl,
        beds: property.bedrooms || property.rooms || 0,
        baths: property.bathrooms || 0,
        sqft: property.surface_useable ? `${property.surface_useable}` : undefined,
        status,
        propertyType: property.property_type,
        priceSale: property.price_sale || undefined,
        priceRent: property.price_rent || undefined,
        agentId,
        agentName,
        agentPhoto: undefined, // Will be set later from agentsMap
      };
    }).map((property: Property) => {
      // Add agent photo from agentsMap if available
      if (property.agentId && agentsMap.has(property.agentId)) {
        const agent = agentsMap.get(property.agentId);
        if (agent) {
          property.agentPhoto = agent.photo;
          if (!property.agentName) {
            property.agentName = agent.name;
          }
        }
      }
      return property;
    });
  }, [data, agentsMap]);

  const filteredProperties = properties.filter(property => {
    // Agent filter - if filterAgentId is provided, only show properties for that agent
    if (filterAgentId !== undefined && filterAgentId !== null) {
      const propertyAgentId = property.agentId;
      // Convert both to strings for comparison to handle number/string mismatches
      if (!propertyAgentId || String(propertyAgentId) !== String(filterAgentId)) {
        return false;
      }
    }
    
    // Search filter
    const matchesSearch = property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Transaction type filter
    if (filterType === 'rent' && !property.type.includes('închiriat')) return false;
    if (filterType === 'sale' && !property.type.includes('vânzare')) return false;
    
    // Status filter
    if (filterStatus === 'active' && property.status !== 'Activ') return false;
    if (filterStatus === 'sold' && property.status !== 'Vândut') return false;
    if (filterStatus === 'reserved' && property.status !== 'Rezervat') return false;
    
    // Property type filter
    if (filterPropertyType !== null && property.propertyType !== filterPropertyType) return false;
    
    // Price range filter
    if (filterType === 'sale' || filterType === null) {
      // Filter by sale price
      if (filterPriceMin && property.priceSale) {
        const minPrice = parseFloat(filterPriceMin);
        if (property.priceSale < minPrice) return false;
      }
      if (filterPriceMax && property.priceSale) {
        const maxPrice = parseFloat(filterPriceMax);
        if (property.priceSale > maxPrice) return false;
      }
    }
    if (filterType === 'rent' || filterType === null) {
      // Filter by rent price
      if (filterPriceMin && property.priceRent) {
        const minPrice = parseFloat(filterPriceMin);
        if (property.priceRent < minPrice) return false;
      }
      if (filterPriceMax && property.priceRent) {
        const maxPrice = parseFloat(filterPriceMax);
        if (property.priceRent > maxPrice) return false;
      }
    }
    
    // Rooms filter
    if (filterRoomsMin && property.beds) {
      const minRooms = parseInt(filterRoomsMin);
      if (property.beds < minRooms) return false;
    }
    if (filterRoomsMax && property.beds) {
      const maxRooms = parseInt(filterRoomsMax);
      if (property.beds > maxRooms) return false;
    }
    
    // Agent filter (multiple agents)
    if (filterAgentIds.length > 0) {
      // Try to match by agentId first
      if (property.agentId) {
        const propertyAgentId = typeof property.agentId === 'string' ? parseInt(property.agentId, 10) : property.agentId;
        const matchesAgentId = filterAgentIds.some(filterId => {
          const filterAgentIdNum = typeof filterId === 'string' ? parseInt(filterId, 10) : filterId;
          return propertyAgentId === filterAgentIdNum;
        });
        if (matchesAgentId) return true; // Matched by ID, include property
      }
      
      // Fallback: Try to match by agent name if agentId is not available
      if (property.agentName) {
        const matchesAgentName = filterAgentIds.some(filterId => {
          // Find the agent in our agents list to get their name
          const selectedAgent = agents.find(a => a.id === filterId);
          if (selectedAgent) {
            const selectedAgentName = `${selectedAgent.first_name || ''} ${selectedAgent.last_name || ''}`.trim();
            // Compare names (case-insensitive, partial match)
            if (selectedAgentName && property.agentName) {
              return property.agentName.toLowerCase().includes(selectedAgentName.toLowerCase()) ||
                     selectedAgentName.toLowerCase().includes(property.agentName.toLowerCase());
            }
          }
          return false;
        });
        if (matchesAgentName) return true; // Matched by name, include property
      }
      
      // If we have agent filters but property doesn't match by ID or name, exclude it
      return false;
    }
    
    return true;
  });
  
  const hasActiveFilters = filterType !== null || filterStatus !== null || 
    filterPropertyType !== null || filterPriceMin !== '' || filterPriceMax !== '' ||
    filterRoomsMin !== '' || filterRoomsMax !== '' || filterAgentIds.length > 0;
  
  const clearFilters = () => {
    setFilterType(null);
    setFilterStatus(null);
    setFilterPropertyType(null);
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterRoomsMin('');
    setFilterRoomsMax('');
    setFilterAgentIds([]);
    setShowFilterModal(false);
  };

  const toggleAgentFilter = (agentId: number) => {
    setFilterAgentIds(prev => {
      // Ensure we're comparing numbers
      const agentIdNum = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
      if (prev.includes(agentIdNum)) {
        return prev.filter(id => {
          const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
          return idNum !== agentIdNum;
        });
      } else {
        return [...prev, agentIdNum];
      }
    });
  };
  
  // Pull-to-refresh handler - force fresh API call with agent data
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate cache to force fresh fetch with agent data
      invalidatePropertiesCache();
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      logger.error('Error refreshing properties:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProperty(null);
  };

  const handlePropertyCardPress = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyActionModal(true);
  };

  const handleClosePropertyActionModal = () => {
    setShowPropertyActionModal(false);
    setSelectedProperty(null);
  };

  const generatePropertyLink = (property: Property): string => {
    // Generate property link based on property ID
    // Format: https://towerimob.ro/proprietate/{propertyId}
    const propertyId = property.id;
    return `https://towerimob.ro/proprietate/${propertyId}`;
  };

  const handleViewOnSite = async (property: Property) => {
    const propertyLink = generatePropertyLink(property);
    const Linking = require('react-native').Linking;
    
    try {
      const canOpen = await Linking.canOpenURL(propertyLink);
      if (canOpen) {
        await Linking.openURL(propertyLink);
      } else {
        Alert.alert('Eroare', 'Nu s-a putut deschide link-ul proprietății.');
      }
    } catch (error) {
      logger.error('Error opening property link:', error);
      Alert.alert('Eroare', 'Nu s-a putut deschide link-ul proprietății.');
    }
    handleClosePropertyActionModal();
  };

  const handleShareOnWhatsApp = async (property: Property) => {
    const propertyLink = generatePropertyLink(property);
    
    // Create formal WhatsApp message in Romanian
    const message = `Bună ziua,

Vă prezint următoarea proprietate care ar putea să vă intereseze:

${property.name}
${property.address}
${property.price}

${property.beds ? `${property.beds} camere` : ''}${property.baths ? `, ${property.baths} băi` : ''}${property.sqft ? `, ${property.sqft}` : ''}

Pentru mai multe detalii, vă invit să accesați:
${propertyLink}

Vă mulțumim pentru interes!

Cu respect,
Echipa Tower Imob`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp if app not installed
        const webWhatsAppUrl = `https://wa.me/?text=${encodedMessage}`;
        await Linking.openURL(webWhatsAppUrl);
      }
    } catch (error) {
      logger.error('Error opening WhatsApp:', error);
      Alert.alert('Eroare', 'Nu s-a putut deschide WhatsApp.');
    }
    handleClosePropertyActionModal();
  };
  
  // Debug logging for agent filtering
  React.useEffect(() => {
    if (filterAgentIds.length > 0) {
      const propertiesWithAgent = properties.filter(p => p.agentId);
      logger.log('Agent filter active:', {
        selectedAgentIds: filterAgentIds,
        totalProperties: properties.length,
        propertiesWithAgent: propertiesWithAgent.length,
        matchingProperties: filteredProperties.length,
        sampleAgentIds: properties.slice(0, 10).map(p => ({ 
          propertyId: p.id, 
          agentId: p.agentId,
          agentName: p.agentName 
        })),
        sampleFilterIds: filterAgentIds,
      });
    }
  }, [filterAgentIds, properties.length, filteredProperties.length]);

  const getTypeStyle = (typeColor: string) => {
    switch (typeColor) {
      case 'blue':
        return { bg: colors.accent, text: colors.primary, border: colors.primaryLight };
      case 'green':
        return { bg: colors.accent, text: '#4CAF50', border: '#4CAF50' }; // Green for "De vânzare" - same fill as blue
      default:
        return { bg: colors.secondary, text: colors.text.muted, border: colors.border };
    }
  };

  if (isLoading && properties.length === 0) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

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
        <Text style={styles.title}>Proprietăți</Text>
        <Text style={styles.subtitle}>{properties.length} anunțuri în total</Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
        <Ionicons name="search" size={20} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută proprietăți..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]} 
          activeOpacity={0.7}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={hasActiveFilters ? colors.primary : colors.text.muted} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Property Cards */}
      <View style={styles.propertiesList}>
        {filteredProperties.map((property, index) => {
          const typeStyle = getTypeStyle(property.typeColor);

          return (
            <TouchableOpacity
              key={property.id}
              style={[styles.propertyCard, { opacity: fadeAnim }]}
              onPress={() => handlePropertyCardPress(property)}
              activeOpacity={0.9}
            >
              {/* Property Image */}
              <View style={styles.imageContainer}>
                {property.image ? (
                  <Image
                    source={{ uri: property.image }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="home" size={48} color={colors.text.muted} />
                  </View>
                )}
                
                {/* Edit Button - Pencil Icon - Only show in personal portfolio */}
                {filterAgentId !== undefined && filterAgentId !== null && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent card press
                      handleEditProperty(property);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
                
                {/* Badges */}
                <View style={styles.imageBadges}>
                  <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
                    <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>{property.type}</Text>
                  </View>
                </View>
              </View>

              {/* Property Info */}
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName}>{property.name}</Text>
                
                {/* Location, Features, Agent Photo, and Price Row */}
                <View style={styles.bottomRow}>
                  <View style={styles.leftSection}>
                    {/* Address */}
                    <View style={styles.addressRow}>
                      <Ionicons name="location" size={16} color={colors.text.muted} />
                      <Text style={styles.address}>{property.address}</Text>
                    </View>
                    
                    {/* Property Features - Numbers only */}
                    <View style={styles.featuresRow}>
                      {property.beds !== undefined && property.beds > 0 && (
                        <View style={styles.feature}>
                          <Ionicons name="bed" size={16} color={colors.text.muted} />
                          <Text style={styles.featureText}>{property.beds}</Text>
                        </View>
                      )}
                      {property.baths !== undefined && property.baths > 0 && (
                        <View style={styles.feature}>
                          <Ionicons name="water" size={16} color={colors.text.muted} />
                          <Text style={styles.featureText}>{property.baths}</Text>
                        </View>
                      )}
                      {property.sqft && (
                        <View style={styles.feature}>
                          <Ionicons name="square" size={16} color={colors.text.muted} />
                          <Text style={styles.featureText}>{property.sqft}</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Price aligned left */}
                    <View style={styles.cardPriceContainer}>
                      <Text style={styles.cardPriceText}>{property.price}</Text>
                    </View>
                  </View>
                  
                  {/* Agent Photo - Bottom right */}
                  {property.agentPhoto ? (
                    <Image
                      source={{ uri: property.agentPhoto }}
                      style={styles.agentPhoto}
                      resizeMode="cover"
                    />
                  ) : property.agentId ? (
                    <View style={styles.agentPhotoPlaceholder}>
                      <Ionicons name="person" size={24} color={colors.text.muted} />
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredProperties.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={64} color={colors.text.muted} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Nu s-au găsit proprietăți</Text>
        </View>
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Blur and darken backdrop */}
          <TouchableOpacity
            style={styles.modalBackdropTouchable}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          >
            <SafeBlurView
              style={styles.modalBackdropBlur}
              blurType="light"
              blurAmount={24}
            />
            <View style={styles.modalBackdropDarken} />
          </TouchableOpacity>

          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtrează Proprietăți</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)} 
                style={styles.filterModalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              {/* Transaction Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tip Tranzacție</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === null && styles.filterOptionActive]}
                    onPress={() => setFilterType(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterType === null && styles.filterOptionTextActive]}>
                      Toate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === 'rent' && styles.filterOptionActive]}
                    onPress={() => setFilterType('rent')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterType === 'rent' && styles.filterOptionTextActive]}>
                      De închiriat
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterType === 'sale' && styles.filterOptionActive]}
                    onPress={() => setFilterType('sale')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterType === 'sale' && styles.filterOptionTextActive]}>
                      De vânzare
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[styles.filterOption, filterStatus === null && styles.filterOptionActive]}
                    onPress={() => setFilterStatus(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterStatus === null && styles.filterOptionTextActive]}>
                      Toate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterStatus === 'active' && styles.filterOptionActive]}
                    onPress={() => setFilterStatus('active')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterStatus === 'active' && styles.filterOptionTextActive]}>
                      Activ
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterStatus === 'sold' && styles.filterOptionActive]}
                    onPress={() => setFilterStatus('sold')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterStatus === 'sold' && styles.filterOptionTextActive]}>
                      Vândut
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterOption, filterStatus === 'reserved' && styles.filterOptionActive]}
                    onPress={() => setFilterStatus('reserved')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterStatus === 'reserved' && styles.filterOptionTextActive]}>
                      Rezervat
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Property Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tip Proprietate</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsHorizontal}>
                  <TouchableOpacity
                    style={[styles.filterOption, filterPropertyType === null && styles.filterOptionActive]}
                    onPress={() => setFilterPropertyType(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterOptionText, filterPropertyType === null && styles.filterOptionTextActive]}>
                      Toate
                    </Text>
                  </TouchableOpacity>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((typeId) => (
                    <TouchableOpacity
                      key={typeId}
                      style={[styles.filterOption, filterPropertyType === typeId && styles.filterOptionActive]}
                      onPress={() => setFilterPropertyType(typeId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, filterPropertyType === typeId && styles.filterOptionTextActive]}>
                        {getPropertyTypeName(typeId)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Interval Preț</Text>
                <View style={styles.rangeInputContainer}>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeInputLabel}>Min (€)</Text>
                    <TextInput
                      style={styles.rangeInput}
                      value={filterPriceMin}
                      onChangeText={setFilterPriceMin}
                      placeholder="0"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeInputLabel}>Max (€)</Text>
                    <TextInput
                      style={styles.rangeInput}
                      value={filterPriceMax}
                      onChangeText={setFilterPriceMax}
                      placeholder="Fără limită"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Rooms Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Număr Camere</Text>
                <View style={styles.rangeInputContainer}>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeInputLabel}>Min</Text>
                    <TextInput
                      style={styles.rangeInput}
                      value={filterRoomsMin}
                      onChangeText={setFilterRoomsMin}
                      placeholder="0"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.rangeInputGroup}>
                    <Text style={styles.rangeInputLabel}>Max</Text>
                    <TextInput
                      style={styles.rangeInput}
                      value={filterRoomsMax}
                      onChangeText={setFilterRoomsMax}
                      placeholder="Fără limită"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Agent Filter (Multiple Selection) */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Agent</Text>
                  {filterAgentIds.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setFilterAgentIds([])}
                      style={styles.clearAgentsButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.clearAgentsText}>Șterge ({filterAgentIds.length})</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.agentSelectContainer}>
                  <ScrollView 
                    style={styles.agentScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    scrollEnabled={true}
                  >
                    {loadingAgents ? (
                      <View style={styles.loadingAgents}>
                        <Text style={styles.loadingAgentsText}>Se încarcă agenții...</Text>
                      </View>
                    ) : (
                      agents.map((agent) => {
                        const agentName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || `Agent ${agent.id}`;
                        const isSelected = filterAgentIds.includes(agent.id);
                        return (
                          <TouchableOpacity
                            key={agent.id}
                            style={[styles.agentOption, isSelected && styles.agentOptionActive]}
                            onPress={() => toggleAgentFilter(agent.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.agentOptionContent}>
                              <View style={[styles.agentCheckbox, isSelected && styles.agentCheckboxActive]}>
                                {isSelected && (
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                )}
                              </View>
                              <Text style={[styles.agentOptionText, isSelected && styles.agentOptionTextActive]}>
                                {agentName}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearFiltersText}>Șterge Filtrele</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.applyFiltersText}>Aplică</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Property Modal */}
      <EditPropertyModal
        visible={showEditModal}
        property={editingProperty}
        onClose={handleCloseEditModal}
        onSave={handleRefresh}
      />

      {/* Property Action Modal */}
      <PropertyActionModal
        visible={showPropertyActionModal}
        property={selectedProperty}
        onClose={handleClosePropertyActionModal}
        onViewOnSite={handleViewOnSite}
        onShareOnWhatsApp={handleShareOnWhatsApp}
      />
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
    borderRadius: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  modalBackdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBackdropDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterModalCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  filterModalBody: {
    padding: 20,
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAgentsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  clearAgentsText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  propertiesList: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 192,
    width: '100%',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: colors.text.muted,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500',
  },
  cardPriceContainer: {
    marginTop: 4,
    alignItems: 'flex-start',
  },
  cardPriceText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  agentPhoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: colors.border,
  },
  agentPhotoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    opacity: 0.2,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  filterOptionsHorizontal: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInputGroup: {
    flex: 1,
  },
  rangeInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
    marginBottom: 8,
  },
  rangeInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  agentSelectContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  agentScrollView: {
    flex: 1,
  },
  agentOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  agentOptionActive: {
    backgroundColor: colors.primary + '20', // 20% opacity
  },
  agentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  agentCheckboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  agentOptionText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  agentOptionTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  loadingAgents: {
    padding: 16,
    alignItems: 'center',
  },
  loadingAgentsText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});

