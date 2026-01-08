/**
 * HomeScreen Component
 * Matching Figma Design - Mobile CRM Design
 * Based on Mobile crm design from figma make
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useRequests } from '@/hooks/useRequests';
import { useProperties } from '@/hooks/useProperties';
import { CereriCard } from '@/components/ui/CereriCard';
import { rebsOldClient } from '@/services/api/rebs-old-client';
import { useTour } from '@/context/TourContext';
import type { TourStep } from '@/context/TourContext';

interface HomeScreenProps {
  onNavigate?: (screen: string) => void;
}

interface RecentClient {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  type: string;
  budget: string;
  budgetExtra?: string;
  propertyType?: string;
  phone?: string;
  createdAt?: string;
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

interface RecentProperty {
  id: string;
  name: string;
  address: string;
  price: string;
  type: string;
  typeColor: string;
  image?: string;
  createdAt?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agentData, logout } = useAuth();
  const { startTour, registerSteps, registerScrollRef, getGlobalRef, currentStep } = useTour();
  const { data: requestsData } = useRequests();
  const { data: propertiesData } = useProperties();
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current; // Progress bar animation
  const waveAnim1 = React.useRef(new Animated.Value(0)).current;
  const waveAnim2 = React.useRef(new Animated.Value(0)).current;
  const waveAnim3 = React.useRef(new Animated.Value(0)).current;
  const purpleWaveAnim = React.useRef(new Animated.Value(0)).current;
  const [agentsMap, setAgentsMap] = useState<Map<number, { name: string; photo?: string; phone?: string }>>(new Map());
  
  // Refs for tour highlighting
  const scrollViewRef = useRef<ScrollView>(null);
  const commissionCardRef = useRef<View>(null);
  const quickActionsRef = useRef<View>(null);
  const recentRequestsRef = useRef<View>(null);
  const recentPropertiesRef = useRef<View>(null);

  // Fetch agents from OLD API and create a map by ID
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
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
            map.set(agentId, { name, photo, phone });
          }
        });
        
        setAgentsMap(map);
      } catch (err) {
        // Silently fail - agents are optional
      }
    };

    fetchAgents();
  }, []);

  // Register scroll ref and tour steps
  useEffect(() => {
    // Register scroll view ref for auto-scrolling
    if (scrollViewRef.current) {
      registerScrollRef(scrollViewRef);
    }

    // Get global refs for navbar
    const navbarRef = getGlobalRef('navbar');

    // Register tour steps
    const steps: TourStep[] = [
      {
        id: 'commission',
        title: 'Cardul de Comision',
        description: 'Aici poți vedea comisionul tău lunar și progresul către obiectiv. Cardul se actualizează automat cu ultimele tranzacții.',
        targetRef: commissionCardRef,
        position: 'bottom',
        icon: 'trending-up',
      },
      {
        id: 'quick-actions',
        title: 'Acțiuni Rapide',
        description: 'Accesează rapid funcțiile principale: adaugă client sau proprietate. Acestea sunt cele mai frecvente acțiuni în aplicație.',
        targetRef: quickActionsRef,
        position: 'bottom',
        icon: 'flash',
      },
      {
        id: 'recent-requests',
        title: 'Cereri Recente',
        description: 'Vezi ultimele cereri de la clienți. Scroll orizontal pentru a vedea toate cererile recente și apasă pe una pentru detalii.',
        targetRef: recentRequestsRef,
        position: 'bottom',
        icon: 'clipboard',
      },
      {
        id: 'recent-properties',
        title: 'Proprietăți Recente',
        description: 'Browșează ultimele proprietăți adăugate în sistem. Scroll orizontal pentru a explora toate proprietățile disponibile.',
        targetRef: recentPropertiesRef,
        position: 'bottom',
        icon: 'home',
      },
      {
        id: 'navbar',
        title: 'Bara de Navigare',
        description: 'Navighează între secțiunile principale ale aplicației: Acasă, Clienți, Proprietăți, Clasament și Noutăți.',
        targetRef: navbarRef,
        position: 'top',
        icon: 'apps',
      },
    ];

    registerSteps(steps);
  }, [registerSteps, registerScrollRef, getGlobalRef]);

  useEffect(() => {
    setIsVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Progress bar animation - resets to 0 and grows to commissionProgress every 30 seconds
    const commissionProgress = 62; // %
    const animateProgress = () => {
      // Reset to 0 instantly
      progressAnim.setValue(0);
      
      // Animate smoothly from 0 to commissionProgress
      Animated.timing(progressAnim, {
        toValue: commissionProgress,
        duration: 2000, // 2 seconds smooth animation
        useNativeDriver: false, // width animation requires layout, not transform
      }).start();
    };

    // Start initial animation
    animateProgress();

    // Set up interval to repeat every 30 seconds
    const progressInterval = setInterval(() => {
      animateProgress();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(progressInterval);
    };

    // Water-like wave animation for commission card
    const animateWaves = () => {
      // Create smooth, continuous wave movements with different speeds
      // Each wave loops continuously, creating a water-like effect
      Animated.parallel([
        // Wave 1 - Slow, gentle movement (12 seconds cycle)
        Animated.loop(
          Animated.sequence([
            Animated.timing(waveAnim1, {
              toValue: 1,
              duration: 12000,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim1, {
              toValue: 0,
              duration: 0, // Instant reset for seamless loop
              useNativeDriver: true,
            }),
          ])
        ),
        // Wave 2 - Medium speed, slightly offset (15 seconds cycle)
        Animated.loop(
          Animated.sequence([
            Animated.timing(waveAnim2, {
              toValue: 1,
              duration: 15000,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim2, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
        // Wave 3 - Faster, creates depth (10 seconds cycle)
        Animated.loop(
          Animated.sequence([
            Animated.timing(waveAnim3, {
              toValue: 1,
              duration: 10000,
              useNativeDriver: true,
            }),
            Animated.timing(waveAnim3, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    animateWaves();

    // Purple wave accent - appears periodically and blends smoothly
    const animatePurpleWave = () => {
      Animated.sequence([
        // Fade in smoothly
        Animated.timing(purpleWaveAnim, {
          toValue: 1,
          duration: 3000, // 3 seconds to fade in
          useNativeDriver: true,
        }),
        // Stay visible for a moment
        Animated.delay(2000), // 2 seconds visible
        // Fade out smoothly
        Animated.timing(purpleWaveAnim, {
          toValue: 0,
          duration: 3000, // 3 seconds to fade out
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Wait before next appearance (8-12 seconds) with random delay
        setTimeout(() => {
          animatePurpleWave();
        }, 8000 + Math.random() * 4000);
      });
    };

    // Start purple wave after initial delay
    setTimeout(animatePurpleWave, 5000);
  }, []);

  // Format time ago helper
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Necunoscut';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `Acum ${diffMins} min`;
    if (diffHours < 24) return `Acum ${diffHours} h`;
    if (diffDays < 7) return `Acum ${diffDays} zile`;
    return date.toLocaleDateString('ro-RO');
  };

  // Get initials helper
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Transform and sort recent requests
  const recentClients: RecentClient[] = useMemo(() => {
    // useRequests returns { data: { objects: [...] } } format
    const requests = requestsData?.data?.objects || requestsData?.data?.results || [];
    if (!requests || requests.length === 0) return [];
    
    const clients = requests.map((request: any) => {
      const requestId = request.id || request.display_id || '';
      
      // Extract name from various possible fields
      let name = request.name || 
                 request.contact?.name ||
                 request.contact?.first_name && request.contact?.last_name 
                   ? `${request.contact.first_name} ${request.contact.last_name}`.trim()
                   : request.first_name && request.last_name
                   ? `${request.first_name} ${request.last_name}`.trim()
                   : request.contacts && Array.isArray(request.contacts) && request.contacts[0]?.name ||
                   undefined;
      
      if (!name || name.trim() === '') {
        name = `Cerere #${requestId}`;
      }
      
      const phone = request.phone || 
                    request.telefon || 
                    request.contact?.phone || 
                    request.contact?.telefon ||
                    (request.contacts && Array.isArray(request.contacts) && request.contacts[0]?.phone) ||
                    undefined;
      
      const status = request.status || 'Active';
      const statusColor = 
        status === 'Hot Lead' || status === 'Urgent' ? 'gold' :
        status === 'Active' ? 'blue' :
        'muted';
      
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
      }
      
      return {
        id: request.id || request.display_id || `client-${Math.random()}`,
        name,
        status,
        statusColor,
        type: request.transaction_type === 2 ? 'Buyer' : request.transaction_type === 1 ? 'Renter' : 'Unknown',
        budget: budgetFormatted,
        budgetExtra,
        propertyType: propertyTypeName,
        phone,
        createdAt: request.created_at || request.created || new Date().toISOString(),
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

    // Sort by most recent (created_at descending) and take first 10
    // Reverse so newest appears first (left side) in horizontal scroll
    return clients
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 10)
      .reverse(); // Reverse so newest is on the left in horizontal scroll
  }, [requestsData, agentsMap]);

  // Transform and sort recent properties
  const recentProperties: RecentProperty[] = useMemo(() => {
    if (!propertiesData?.data?.objects) return [];
    
    const getPropertyTypeName = (propertyType: number) => {
      const typeMap: Record<number, string> = {
        1: 'Apartament',
        2: 'Casă',
        3: 'Vilă',
        4: 'Teren',
        5: 'Spațiu comercial',
      };
      return typeMap[propertyType] || 'Proprietate';
    };

    const properties = propertiesData.data.objects.map((property: any) => {
      const isRent = property.for_rent === true;
      const isSale = property.for_sale === true;
      
      let price = '';
      let type = '';
      let typeColor = 'blue';
      
      if (isRent && isSale) {
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
      } else if (isRent) {
        const rentPrice = property.price_rent;
        if (rentPrice && rentPrice > 0) {
          price = `${rentPrice}€/lună`;
        }
        type = 'De închiriat';
      } else if (isSale) {
        const salePrice = property.price_sale;
        if (salePrice && salePrice > 0) {
          price = `${salePrice}€`;
        }
        type = 'De vânzare';
      }
      
      if (!price && !type) {
        const propTypeName = getPropertyTypeName(property.property_type);
        price = propTypeName;
        type = propTypeName;
      }
      
      const addressParts: string[] = [];
      if (property.street) addressParts.push(property.street);
      if (property.zone) addressParts.push(property.zone);
      if (property.city) addressParts.push(property.city);
      const address = addressParts.length > 0 
        ? addressParts.join(', ') 
        : property.address || property.region || '';
      
      const imageUrl = property.primaryImageUrl || 
                      property.thumbnail || 
                      property.resized_images?.[0] || 
                      property.full_images?.[0] ||
                      property.image_url || 
                      property.image ||
                      undefined;
      
      const name = getPropertyTypeName(property.property_type) || 'Proprietate';
      
      return {
        id: property.id || property.display_id || `property-${Math.random()}`,
        name,
        address,
        price: price || 'Preț la cerere',
        type,
        typeColor,
        image: imageUrl,
        createdAt: property.created_at || property.created || property.date_added || new Date().toISOString(),
      };
    });

    // Sort by most recent (created_at descending) and take first 10
    return properties
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 10);
  }, [propertiesData]);

  const todayStats = {
    clientsAdded: 3,
    propertiesAdded: 5,
    dealsClosed: 1,
  };

  const weekStats = {
    clientsAdded: 12,
    propertiesAdded: 18,
    dealsClosed: 4,
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bună dimineața';
    if (hour < 18) return 'Bună ziua';
    return 'Bună seara';
  };

  const handleNavigate = (screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      if (screen === 'add-client' || screen === 'add-request') {
        // Use relative path since we're in the tabs group
        router.push('./add-client' as any);
      } else if (screen === 'add-property') {
        router.push('./add-property' as any);
      }
    }
  };

  const getStatusStyle = (statusColor: string) => {
    switch (statusColor) {
      case 'gold':
        return { bg: '#FFF9E6', text: colors.gold, border: '#FFE5A0' };
      case 'blue':
        return { bg: colors.accent, text: colors.primary, border: colors.primaryLight };
      default:
        return { bg: colors.secondary, text: colors.text.muted, border: colors.border };
    }
  };

  const getTypeStyle = (typeColor: string) => {
    return { bg: colors.accent, text: colors.primary, border: colors.primaryLight };
  };

  // Calculate commission (mock data for now - can be replaced with real data)
  const commissionAmount = 1350; // €
  const commissionPercentage = 12; // %
  // commissionProgress is now defined in useEffect for animation

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <Animated.View style={[styles.heroSection, { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim }]}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {getGreeting()}, {agentData?.name?.split(' ')[0] || 'John'}
            </Text>
            <Text style={styles.subtitle}>Actualizări noi te așteaptă</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => {
                startTour();
              }}
              accessibilityLabel="Ajutor"
              accessibilityHint="Apasă pentru a începe turul ghidat al aplicației"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                try {
                  await logout();
                  router.replace('/(auth)/login');
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              accessibilityLabel="Deconectare"
              accessibilityHint="Apasă pentru a te deconecta din aplicație"
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Commission Card */}
        <View ref={commissionCardRef} style={styles.commissionCard}>
          {/* Base gradient */}
          <SafeLinearGradient
            colors={['#5B9CFF', '#1E6DFF']}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Water wave layer 1 - Slow, gentle wave */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: 0.15, // Subtle, barely noticeable
                transform: [
                  {
                    translateX: waveAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 50], // Horizontal wave movement
                    }),
                  },
                  {
                    scaleY: waveAnim1.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.1, 1], // Subtle vertical wave
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeLinearGradient
              colors={['rgba(91, 156, 255, 0.3)', 'rgba(30, 109, 255, 0.2)', 'rgba(91, 156, 255, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Water wave layer 2 - Medium speed, offset */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: 0.12,
                transform: [
                  {
                    translateX: waveAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, -50], // Opposite direction for wave interference
                    }),
                  },
                  {
                    scaleY: waveAnim2.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0.95, 1], // Different wave pattern
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeLinearGradient
              colors={['rgba(30, 109, 255, 0.25)', 'rgba(59, 95, 204, 0.15)', 'rgba(30, 109, 255, 0.25)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Water wave layer 3 - Faster, creates depth */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: 0.10,
                transform: [
                  {
                    translateX: waveAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 30], // Smaller movement for subtlety
                    }),
                  },
                  {
                    scaleY: waveAnim3.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: [1, 1.05, 1, 1.05, 1], // More frequent wave pattern
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeLinearGradient
              colors={['rgba(74, 123, 217, 0.2)', 'rgba(91, 156, 255, 0.15)', 'rgba(74, 123, 217, 0.2)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Purple wave accent - appears periodically */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: purpleWaveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.18], // Subtle purple accent
                }),
                transform: [
                  {
                    translateX: purpleWaveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-40, 40], // Smooth horizontal movement
                    }),
                  },
                  {
                    scaleY: purpleWaveAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.08, 1], // Gentle vertical wave
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeLinearGradient
              colors={[
                'rgba(139, 92, 246, 0.25)', // Purple-blue blend
                'rgba(91, 156, 255, 0.20)',  // Blue-purple transition
                'rgba(124, 58, 237, 0.25)',  // Purple
                'rgba(91, 156, 255, 0.20)',  // Back to blue-purple
                'rgba(139, 92, 246, 0.25)',  // Purple-blue blend
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Content */}
          <View style={styles.commissionCardContent}>
            <View style={styles.commissionHeader}>
              <View style={styles.commissionPercentageContainer}>
                <Ionicons name="trending-up" size={11} color="#FFFFFF" />
                <Text style={styles.commissionPercentage}>{commissionPercentage}%</Text>
              </View>
            </View>
            
            <View style={styles.commissionContent}>
              <Text style={styles.commissionAmount}>{commissionAmount.toLocaleString('ro-RO')} €</Text>
              <Text style={styles.commissionLabel}>Comisionul Tău</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                {/* Animated progress fill - grows from 0 to commissionProgress */}
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View ref={quickActionsRef} style={[styles.quickActions, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Acțiuni Rapide</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => handleNavigate('add-client')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="person-add" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Adaugă Client</Text>
            <Text style={styles.quickActionSubtitle}>Cumpărător sau chiriaș</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => handleNavigate('add-property')}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Adaugă Proprietate</Text>
            <Text style={styles.quickActionSubtitle}>Casă sau apartament</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Recent Leads */}
      <Animated.View ref={recentRequestsRef} style={[styles.recentLeads, { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Cereri Recente</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {recentClients && recentClients.length > 0 ? (
            recentClients.map((client) => (
              <CereriCard
                key={client.id}
                budget={client.budget}
                budgetExtra={undefined}
                type={client.propertyType || 'N/A'}
                specifications={client.specifications || 'N/A'}
                area={client.area}
                zone={client.zone || 'N/A'}
                contactName={client.name.split(' ')[0] || client.name}
                agentPhoto={client.agentPhoto}
                agentName={client.agentName}
                agentPhone={client.agentPhone}
                transactionType={client.type === 'Buyer' ? 2 : client.type === 'Renter' ? 1 : undefined}
                requestDetails={client.requestDetails}
                onPress={() => router.push('/(tabs)/requests')}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nu există cereri recente</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Recent Properties */}
      <Animated.View ref={recentPropertiesRef} style={[styles.recentProperties, { paddingTop: Math.max(insets.top, 20), opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Proprietăți Recente</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {recentProperties.length > 0 ? (
            recentProperties.map((property) => {
              const typeStyle = getTypeStyle(property.typeColor);
              return (
                <TouchableOpacity
                  key={property.id}
                  style={styles.recentPropertyCard}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/properties')}
                >
                  <View style={styles.propertyImageContainer}>
                    {property.image ? (
                      <Image
                        source={{ uri: property.image }}
                        style={styles.propertyImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.propertyImagePlaceholder}>
                        <Ionicons name="home" size={32} color={colors.text.muted} />
                      </View>
                    )}
                    <View style={[styles.propertyTypeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
                      <Text style={[styles.propertyTypeText, { color: typeStyle.text }]}>{property.type}</Text>
                    </View>
                  </View>
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyName} numberOfLines={1}>{property.name}</Text>
                    <View style={styles.propertyAddressRow}>
                      <Ionicons name="location" size={12} color={colors.text.muted} />
                      <Text style={styles.propertyAddress} numberOfLines={1}>{property.address}</Text>
                    </View>
                    <Text style={styles.propertyPrice}>{property.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Nu există proprietăți recente</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 96, // Space for bottom nav
    gap: 24,
  },
  heroSection: {
    marginBottom: 48,
  },
  welcomeHeader: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 28,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  helpButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 22,
    marginTop: 2,
  },
  commissionCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginTop: -64,
    overflow: 'hidden',
    position: 'relative',
  },
  commissionCardContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  commissionPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  commissionPercentage: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    paddingTop: 0,
  },
  commissionContent: {
    alignItems: 'center',
  },
  commissionAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 50,
    fontFamily: 'System',
  },
  commissionLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 22,
    marginTop: 4,
  },
  progressBarContainer: {
    marginTop: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statCardGold: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFE5A0',
  },
  statCardBlue: {
    backgroundColor: colors.accent,
    borderColor: colors.primaryLight,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: colors.text.muted,
  },
  weekCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.accent,
    marginBottom: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  weekIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  weekSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekStatItem: {
    alignItems: 'center',
  },
  weekStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 0,
  },
  weekStatLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  quickActions: {
    gap: 2,
    marginBottom: 24,
    marginTop: -40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 28,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  quickActionIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.muted,
    lineHeight: 16,
  },
  recentLeads: {
    gap: 16,
    marginBottom: 24,
    marginTop: -50, // Reduced by 30px (from -20 to -50) to bring closer to Quick Actions
  },
  recentProperties: {
    gap: 16,
    marginBottom: 24,
    marginTop: -50, // Same spacing as between Quick Actions and Cereri Recente
  },
  horizontalScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  recentPropertyCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  propertyImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  propertyTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 12,
    gap: 6,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  propertyAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyAddress: {
    fontSize: 11,
    color: colors.text.muted,
    flex: 1,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  leadsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  leadCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  leadAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 22,
    flex: 1,
  },
  leadDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  leadInfoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  leadInfoItem: {
    flex: 1,
  },
  leadInfoItemCenter: {
    alignItems: 'center',
  },
  leadInfoItemRight: {
    alignItems: 'flex-end',
  },
  leadInfoLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.muted,
    lineHeight: 16,
    marginBottom: 4,
  },
  leadInfoValue: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 16,
  },
  messageButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.muted,
  },
});

