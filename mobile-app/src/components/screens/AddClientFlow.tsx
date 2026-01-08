/**
 * AddClientFlow Component
 * Matching Figma Design - Multi-step form for adding a new client
 * Based on Mobile crm design from figma make
 * Translated to Romanian
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { createScopedLogger } from '@/lib/logger';

interface AddClientFlowProps {
  onBack?: () => void;
  onComplete?: () => void;
}

const logger = createScopedLogger('AddClientFlow');

export const AddClientFlow: React.FC<AddClientFlowProps> = ({ onBack, onComplete }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { agentData } = useAuth();
  const [step, setStep] = useState(1);
  const [clientType, setClientType] = useState<'buyer' | 'renter' | null>(null);
  const [propertyType, setPropertyType] = useState<'house' | 'apartment' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budgetMin: '',
    budgetMax: '',
    budgetBonus: '', // Bonus budget - amount willing to go over budget
    roomsMin: '',
    roomsMax: '',
    preferredArea: '',
    additionalInfo: '', // For "Informatii utile" step
  });

  const totalSteps = 6; // Step 1: Name/Phone/Email, Step 2: Client Type, Step 3: Property Type, Step 4: Budget/Rooms/Area, Step 5: Additional Info, Step 6: Matching Properties
  const progress = (step / totalSteps) * 100;
  const [requestId, setRequestId] = useState<number | null>(null);
  const [matchingProperties, setMatchingProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Animation refs for smooth step transitions
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const stepTranslateX = useRef(new Animated.Value(0)).current;
  const previousStep = useRef(step);

  // Animate step transitions
  useEffect(() => {
    if (previousStep.current !== step) {
      // Fade out and slide out current step
      Animated.parallel([
        Animated.timing(stepOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateX, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset position for new step
        stepTranslateX.setValue(20);
        previousStep.current = step;
        
        // Fade in and slide in new step
        Animated.parallel([
          Animated.timing(stepOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(stepTranslateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [step]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      // Step 1: Submit name, phone, email to OLD API and create cerere
      if (!canProceedStep1) {
        setError('Numele și numărul de telefon sunt obligatorii');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        await submitStep1();
        setStep(2);
      } catch (err: any) {
        setError(err.message || 'Eroare la crearea cererii');
      } finally {
        setLoading(false);
      }
    } else if (step === 4) {
      // Step 4: PATCH the cerere with budget/rooms/area
      setLoading(true);
      setError(null);
      try {
        await patchStep4();
        setStep(step + 1);
      } catch (err: any) {
        setError(err.message || 'Eroare la actualizarea cererii');
      } finally {
        setLoading(false);
      }
    } else if (step === 5) {
      // Step 5: PATCH the cerere with additional info
      setLoading(true);
      setError(null);
      try {
        await patchStep5();
        setStep(step + 1);
      } catch (err: any) {
        setError(err.message || 'Eroare la actualizarea cererii');
      } finally {
        setLoading(false);
      }
    } else if (step < totalSteps) {
      // For other steps, just move forward
      setStep(step + 1);
      setError(null);
    }
  };

  const fetchMatchingProperties = async (reqId: number) => {
    setLoadingProperties(true);
    try {
      // Use NEW API for matching properties endpoint
      const REBS_API_BASE = 'https://towerimob.crmrebs.com/api';
      const REBS_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

      // Calculate extended max price with bonus budget
      const parseInteger = (value?: string | null) => {
        if (!value) return null;
        const numeric = Number(value.toString().replace(/[^\d-]/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
      };

      const baseMaxPrice = parseInteger(formData.budgetMax.trim()) || 0;
      const bonusBudget = parseInteger(formData.budgetBonus.trim()) || 0;
      const extendedMaxPrice = baseMaxPrice + bonusBudget;

      logger.log(`Fetching matching properties for request ${reqId}...`);
      if (bonusBudget > 0) {
        logger.log(`Budget: ${baseMaxPrice} EUR + Bonus: ${bonusBudget} EUR = Extended: ${extendedMaxPrice} EUR`);
      }

      // Temporarily update price_filter_lte to include bonus budget for matching
      let originalMaxPrice: number | null = null;
      if (bonusBudget > 0 && baseMaxPrice > 0) {
        try {
          // Fetch current request to get original max price
          const currentRequestResponse = await fetch(`${REBS_API_BASE}/requests/${reqId}/`, {
            headers: {
              'Authorization': `Token ${REBS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (currentRequestResponse.ok) {
            const currentRequest = await currentRequestResponse.json();
            originalMaxPrice = currentRequest.price_filter_lte || baseMaxPrice;
            
            // Temporarily update to extended max price
            await fetch(`${REBS_API_BASE}/requests/${reqId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${REBS_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                price_filter_lte: extendedMaxPrice,
              }),
            });
            logger.log(`Temporarily updated price_filter_lte to ${extendedMaxPrice} EUR for matching`);
          }
        } catch (updateError) {
          logger.error('Error updating price filter for bonus budget:', updateError);
          // Continue with original matching if update fails
        }
      }
      
      const matchingUrl = `${REBS_API_BASE}/requests/${reqId}/matching_properties/`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(matchingUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${REBS_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          logger.error('Failed to fetch matching properties:', response.status, response.statusText);
          setMatchingProperties([]);
          return;
        }

        const propertyIds = await response.json();
        logger.log('Matching property IDs:', propertyIds);

        // If propertyIds is an array of IDs, fetch full property details
        if (Array.isArray(propertyIds) && propertyIds.length > 0) {
          // Fetch property details for each ID
          const propertyPromises = propertyIds.slice(0, 20).map(async (id: number) => {
            try {
              const propResponse = await fetch(`${REBS_API_BASE}/properties/${id}/`, {
                headers: {
                  'Authorization': `Token ${REBS_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
              });
              if (propResponse.ok) {
                return await propResponse.json();
              }
            } catch (err) {
              logger.error(`Error fetching property ${id}:`, err);
            }
            return null;
          });

          let properties = (await Promise.all(propertyPromises)).filter(p => p !== null);
          
          // Apply client-side filtering for extended budget (backup/verification)
          if (bonusBudget > 0 && baseMaxPrice > 0) {
            const transactionType = clientType === 'buyer' ? 2 : 1;
            properties = properties.filter((property: any) => {
              // Get property price based on transaction type
              const propertyPrice = transactionType === 2 
                ? property.price_sale 
                : property.price_rent;
              
              if (!propertyPrice) return true; // Include if no price available
              
              // Include if within extended budget (base + bonus)
              return propertyPrice <= extendedMaxPrice;
            });
            logger.log(`Client-side filtered to ${properties.length} properties within extended budget (${extendedMaxPrice} EUR)`);
          }
          
          logger.log(`Fetched ${properties.length} matching properties`);
          setMatchingProperties(properties);
        } else {
          // If the response is already property objects
          setMatchingProperties(Array.isArray(propertyIds) ? propertyIds : []);
        }

        // Restore original max price after fetching
        if (originalMaxPrice !== null && bonusBudget > 0) {
          try {
            await fetch(`${REBS_API_BASE}/requests/${reqId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${REBS_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                price_filter_lte: originalMaxPrice, // Restore original
              }),
            });
            logger.log(`Restored original price_filter_lte to ${originalMaxPrice} EUR`);
          } catch (restoreError) {
            logger.error('Error restoring original price filter:', restoreError);
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Restore original max price on error
        if (originalMaxPrice !== null && bonusBudget > 0) {
          try {
            await fetch(`${REBS_API_BASE}/requests/${reqId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${REBS_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                price_filter_lte: originalMaxPrice,
              }),
            });
          } catch (restoreError) {
            logger.error('Error restoring original price filter on error:', restoreError);
          }
        }
        
        if (fetchError.name === 'AbortError') {
          logger.error('Request timed out while fetching matching properties');
        } else {
          logger.error('Error fetching matching properties:', fetchError);
        }
        setMatchingProperties([]);
      }
    } catch (err) {
      logger.error('Error in fetchMatchingProperties:', err);
      setMatchingProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  // Step 1: Submit name, phone, email to OLD API and create cerere
  const submitStep1 = async () => {
    const startTime = Date.now();
    logger.log('=== Starting Step 1: Create cerere with name/phone/email ===');

    try {
      // OLD CRM REBS API configuration
      const REBS_OLD_API_BASE = 'https://towerimob.crmrebs.com';
      const REBS_OLD_API_TOKEN = '303ea2a1928b789d9f4b011aecfe12199098b2fd';

      logger.log('OLD REBS API Base:', REBS_OLD_API_BASE);

      // Split name into prenume and nume
      const nameParts = formData.name.trim().split(/\s+/);
      const prenume = nameParts[0] || formData.name.trim();
      const nume = nameParts.slice(1).join(' ') || formData.name.trim();

      // Build payload for OLD API - per documentation: /api/public/addrequest/
      const cererePayload: Record<string, any> = {
        name: formData.name.trim(), // Full name as per OLD API docs
        phone: formData.phone.trim(),
      };

      if (formData.email.trim()) {
        cererePayload.email = formData.email.trim();
      }

      // lead_source is required - use a default or agent-based source
      cererePayload.lead_source = 'Dashboard Agent';

      // Try to associate agent - OLD API might accept agent_id or agent field
      // If not supported, we'll update via PATCH after creation
      if (agentData?.id) {
        // Try agent_id first (common pattern)
        cererePayload.agent_id = agentData.id;
        logger.log('Including agent_id in payload:', agentData.id, agentData.name);
      }

      logger.log('Cerere payload (Step 1):', JSON.stringify(cererePayload, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // POST to OLD API - per documentation: /api/public/addrequest/
        const cerereUrl = `${REBS_OLD_API_BASE}/api/public/addrequest/`;
        logger.log('Sending POST to OLD API:', cerereUrl);

        // OLD API auth: via api_key query param OR Authorization header (NO "Token " prefix)
        const response = await fetch(`${cerereUrl}?api_key=${REBS_OLD_API_TOKEN}`, {
          method: 'POST',
          headers: {
            'Authorization': REBS_OLD_API_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cererePayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        logger.log(`Response received in ${elapsed}ms`);

        if (!response.ok) {
          let errorMessage = 'Nu am putut crea cererea';
          try {
            const responseText = await response.text();
            logger.log('Error response text:', responseText);
            const errorData = JSON.parse(responseText);
            errorMessage = errorData?.detail || errorData?.message || errorMessage;
          } catch (e) {
            logger.error('Could not parse error response');
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        logger.log('Cerere created successfully:', result);

        // OLD API returns: { "success": true, "contact": 123, "request": 1234 }
        if (!result.success) {
          throw new Error(result.error || 'Nu am putut crea cererea');
        }

        // Store the cerere ID from response
        const cerereId = result.request;
        if (!cerereId) {
          throw new Error('Nu am primit ID-ul cererii din răspuns');
        }

        setRequestId(cerereId);
        logger.log(`=== Step 1 completed successfully. Cerere ID: ${cerereId} ===`);

        // Associate agent via NEW API PATCH (OLD API might not support agent field)
        if (agentData?.id) {
          try {
            logger.log(`Associating agent ${agentData.id} (${agentData.name}) with cerere ${cerereId}...`);
            const REBS_NEW_API_BASE = 'https://towerimob.crmrebs.com/api';
            const REBS_NEW_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';
            
            const patchController = new AbortController();
            const patchTimeout = setTimeout(() => patchController.abort(), 10000);
            
            const patchResponse = await fetch(`${REBS_NEW_API_BASE}/requests/${cerereId}/`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                agent: agentData.id,
              }),
              signal: patchController.signal,
            });

            clearTimeout(patchTimeout);

            if (patchResponse.ok) {
              const patchResult = await patchResponse.json();
              logger.log('Agent successfully associated with cerere:', patchResult);
            } else {
              const errorText = await patchResponse.text();
              logger.warn('Could not associate agent via PATCH, but cerere was created. Response:', errorText);
            }
          } catch (patchError: any) {
            logger.warn('Error associating agent (non-critical), but cerere was created:', patchError);
            // Don't throw - the cerere was created successfully, agent association is secondary
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          logger.error('Request timed out');
          throw new Error('Cererea a expirat. Verifică conexiunea la internet și încearcă din nou.');
        }
        throw fetchError;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger.error(`=== Step 1 failed after ${elapsed}ms ===`);
      logger.error('Error details:', err);
      throw err;
    }
  };

  // Step 4: PATCH cerere with budget, rooms, area
  const patchStep4 = async () => {
    if (!requestId) {
      throw new Error('ID-ul cererii lipsește');
    }

    const startTime = Date.now();
    logger.log(`=== Starting Step 4: PATCH cerere ${requestId} with budget/rooms/area ===`);

    try {
      // Use NEW API for PATCH (OLD API only has POST for addrequest)
      const REBS_NEW_API_BASE = 'https://towerimob.crmrebs.com/api';
      const REBS_NEW_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

      // Parse values
      const parseInteger = (value?: string | null) => {
        if (!value) return null;
        const numeric = Number(value.toString().replace(/[^\d-]/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
      };

      const minPrice = parseInteger(formData.budgetMin.trim());
      const maxPrice = parseInteger(formData.budgetMax.trim());
      const bonusBudget = parseInteger(formData.budgetBonus.trim());
      const minRooms = parseInteger(formData.roomsMin.trim());
      const maxRooms = parseInteger(formData.roomsMax.trim());

      const propertyTypeMap: Record<string, number> = {
        'Apartament': 1,
        'Casă': 3,
      };
      const propertyTypeId = propertyType ? propertyTypeMap[propertyType === 'house' ? 'Casă' : 'Apartament'] : undefined;

      const patchPayload: Record<string, any> = {};

      if (minPrice !== null) patchPayload.price_filter_gte = minPrice;
      if (maxPrice !== null) patchPayload.price_filter_lte = maxPrice;
      if (minRooms !== null) patchPayload.rooms_filter_gte = minRooms;
      if (maxRooms !== null) patchPayload.rooms_filter_lte = maxRooms;
      if (propertyTypeId) patchPayload.property_type = propertyTypeId;
      if (clientType) patchPayload.transaction_type = clientType === 'buyer' ? 2 : 1;
      if (formData.preferredArea.trim()) {
        patchPayload.preferred_area = formData.preferredArea.trim();
      }

      // Store bonus budget in comments (Option B)
      if (bonusBudget !== null && bonusBudget > 0) {
        const bonusComment = `Buget Bonus: ${bonusBudget} EUR`;
        // Store in comments_general (will be appended to in Step 5 if user adds more info)
        patchPayload.comments_general = bonusComment;
      }

      logger.log('PATCH payload (Step 4):', JSON.stringify(patchPayload, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const patchUrl = `${REBS_NEW_API_BASE}/requests/${requestId}/`;
        logger.log('Sending PATCH to NEW API (Step 4):', patchUrl);

        const response = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patchPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        logger.log(`PATCH response received in ${elapsed}ms, status: ${response.status}`);

        if (!response.ok) {
          const responseText = await response.text();
          logger.log('Error response text (first 500 chars):', responseText.substring(0, 500));
          
          // Check if response is HTML (server error page) - might indicate success despite 500
          const isHtmlResponse = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');
          
          if (isHtmlResponse && response.status === 500) {
            // Server returned HTML error page, but operation might have succeeded
            // Verify by fetching the request to check if it was actually updated
            logger.warn('Received HTML error page (500), verifying if request was actually updated...');
            
            try {
              const verifyUrl = `${REBS_NEW_API_BASE}/requests/${requestId}/`;
              const verifyResponse = await fetch(verifyUrl, {
                headers: {
                  'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                logger.log('Verification: Request data after PATCH:', verifyData);
                
                // Check if the key fields we tried to update are actually set
                let wasUpdated = true;
                if (patchPayload.price_filter_lte !== undefined && verifyData.price_filter_lte !== patchPayload.price_filter_lte) {
                  logger.warn(`price_filter_lte mismatch: expected ${patchPayload.price_filter_lte}, got ${verifyData.price_filter_lte}`);
                  wasUpdated = false;
                }
                if (patchPayload.price_filter_gte !== undefined && verifyData.price_filter_gte !== patchPayload.price_filter_gte) {
                  logger.warn(`price_filter_gte mismatch: expected ${patchPayload.price_filter_gte}, got ${verifyData.price_filter_gte}`);
                  wasUpdated = false;
                }
                if (patchPayload.rooms_filter_lte !== undefined && verifyData.rooms_filter_lte !== patchPayload.rooms_filter_lte) {
                  logger.warn(`rooms_filter_lte mismatch: expected ${patchPayload.rooms_filter_lte}, got ${verifyData.rooms_filter_lte}`);
                  wasUpdated = false;
                }
                if (patchPayload.rooms_filter_gte !== undefined && verifyData.rooms_filter_gte !== patchPayload.rooms_filter_gte) {
                  logger.warn(`rooms_filter_gte mismatch: expected ${patchPayload.rooms_filter_gte}, got ${verifyData.rooms_filter_gte}`);
                  wasUpdated = false;
                }
                
                if (wasUpdated) {
                  logger.log('✅ Request was successfully updated despite 500 error response. Continuing...');
                  // Continue without throwing error - the operation succeeded
                  logger.log(`=== Step 4 completed successfully (verified after 500 error) ===`);
                  return; // Exit early, operation succeeded
                } else {
                  logger.warn('Request verification: Some fields were not updated as expected');
                  throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
                }
              } else {
                logger.warn('Could not verify request update status');
                throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
              }
            } catch (verifyError: any) {
              logger.error('Error verifying request update:', verifyError);
              throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
            }
          } else {
            // Real error - try to parse JSON error message
            let errorMessage = 'Nu am putut actualiza cererea';
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData?.detail || errorData?.message || errorMessage;
            } catch (e) {
              logger.error('Could not parse error response');
            }
            throw new Error(errorMessage);
          }
        }

        // Response is OK - parse JSON normally
        const result = await response.json();
        logger.log('Cerere updated successfully (Step 4):', result);
        logger.log(`=== Step 4 completed successfully ===`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          logger.error('Request timed out');
          throw new Error('Actualizarea cererii a expirat. Verifică conexiunea la internet și încearcă din nou.');
        }
        throw fetchError;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger.error(`=== Step 4 failed after ${elapsed}ms ===`);
      logger.error('Error details:', err);
      throw err;
    }
  };

  // Step 5: PATCH cerere with additional info (comentarii_generale)
  const patchStep5 = async () => {
    if (!requestId) {
      throw new Error('ID-ul cererii lipsește');
    }

    const startTime = Date.now();
    logger.log(`=== Starting Step 5: PATCH cerere ${requestId} with additional info ===`);

    try {
      // Use NEW API for PATCH (OLD API only has POST for addrequest)
      const REBS_NEW_API_BASE = 'https://towerimob.crmrebs.com/api';
      const REBS_NEW_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

      const patchPayload: Record<string, any> = {
        comments_general: formData.additionalInfo.trim() || null, // Only additional info, no auto-generated summary
      };

      logger.log('PATCH payload (Step 5):', JSON.stringify(patchPayload, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const patchUrl = `${REBS_NEW_API_BASE}/requests/${requestId}/`;
        logger.log('Sending PATCH to NEW API (Step 5):', patchUrl);

        const response = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patchPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        logger.log(`PATCH response received in ${elapsed}ms, status: ${response.status}`);

        if (!response.ok) {
          const responseText = await response.text();
          logger.log('Error response text (first 500 chars):', responseText.substring(0, 500));
          
          // Check if response is HTML (server error page) - might indicate success despite 500
          const isHtmlResponse = responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html');
          
          if (isHtmlResponse && response.status === 500) {
            // Server returned HTML error page, but operation might have succeeded
            // Verify by fetching the request to check if it was actually updated
            logger.warn('Received HTML error page (500), verifying if request was actually updated...');
            
            try {
              const verifyUrl = `${REBS_NEW_API_BASE}/requests/${requestId}/`;
              const verifyResponse = await fetch(verifyUrl, {
                headers: {
                  'Authorization': `Token ${REBS_NEW_API_TOKEN}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                logger.log('Verification: Request data after PATCH (Step 5):', verifyData);
                
                // Check if comments_general was updated (check if it contains our text or the additional info)
                const hasComments = verifyData.comments_general && 
                  (verifyData.comments_general.includes(formData.additionalInfo.trim()) || 
                   verifyData.comments_general.includes('Buget Bonus'));
                
                if (hasComments || formData.additionalInfo.trim() === '') {
                  logger.log('✅ Request was successfully updated despite 500 error response. Continuing...');
                  // Continue without throwing error - the operation succeeded
                  logger.log(`=== Step 5 completed successfully (verified after 500 error) ===`);
                  return; // Exit early, operation succeeded
                } else {
                  logger.warn('Request verification: comments_general was not updated as expected');
                  throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
                }
              } else {
                logger.warn('Could not verify request update status');
                throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
              }
            } catch (verifyError: any) {
              logger.error('Error verifying request update:', verifyError);
              throw new Error('Nu am putut actualiza cererea. Verifică conexiunea și încearcă din nou.');
            }
          } else {
            // Real error - try to parse JSON error message
            let errorMessage = 'Nu am putut actualiza cererea';
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData?.detail || errorData?.message || errorMessage;
            } catch (e) {
              logger.error('Could not parse error response');
            }
            throw new Error(errorMessage);
          }
        }

        // Response is OK - parse JSON normally
        const result = await response.json();
        logger.log('Cerere updated successfully (Step 5):', result);
        logger.log(`=== Step 5 completed successfully ===`);

        // After step 5, fetch matching properties for step 6
        await fetchMatchingProperties(requestId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          logger.error('Request timed out');
          throw new Error('Actualizarea cererii a expirat. Verifică conexiunea la internet și încearcă din nou.');
        }
        throw fetchError;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger.error(`=== Step 5 failed after ${elapsed}ms ===`);
      logger.error('Error details:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Completează toate câmpurile obligatorii');
      return;
    }

    if (!agentData?.name) {
      setError('Trebuie să fiți autentificat pentru a adăuga un client');
      return;
    }

    setLoading(true);
    setError(null);

    const startTime = Date.now();
    logger.log('=== Starting client submission ===');
    logger.log('Form data:', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      budgetMin: formData.budgetMin,
      budgetMax: formData.budgetMax,
      clientType,
      propertyType,
    });

    try {
      // REBS API configuration
      const REBS_API_BASE = 'https://towerimob.crmrebs.com/api';
      const REBS_API_TOKEN = '22a329334f5a2cfae340a427eff3d7d07847d5a7';

      logger.log('REBS API Base:', REBS_API_BASE);

      // Split name into prenume and nume (first word is prenume, rest is nume)
      const nameParts = formData.name.trim().split(/\s+/);
      const prenume = nameParts[0] || formData.name.trim();
      const nume = nameParts.slice(1).join(' ') || formData.name.trim();

      // Build comentarii_generale from form data
      const comentariiParts: string[] = [];
      if (clientType) {
        comentariiParts.push(`Tip client: ${clientType === 'buyer' ? 'Cumpărător' : 'Chiriaș'}`);
      }
      if (propertyType) {
        comentariiParts.push(`Tip proprietate: ${propertyType === 'house' ? 'Casă' : 'Apartament'}`);
      }
      if (formData.budgetMin.trim()) {
        comentariiParts.push(`Buget minim: ${formData.budgetMin.trim()} EUR`);
      }
      if (formData.budgetMax.trim()) {
        comentariiParts.push(`Buget maxim: ${formData.budgetMax.trim()} EUR`);
      }
      if (formData.roomsMin.trim() || formData.roomsMax.trim()) {
        comentariiParts.push(`Camere: ${formData.roomsMin.trim() || '?'} - ${formData.roomsMax.trim() || '?'}`);
      }
      if (formData.preferredArea.trim()) {
        comentariiParts.push(`Zonă preferată: ${formData.preferredArea.trim()}`);
      }
      const comentarii_generale = comentariiParts.join('\n');

      // Parse budget values
      const parseInteger = (value?: string | null) => {
        if (!value) return null;
        const numeric = Number(value.toString().replace(/[^\d-]/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
      };

      const minPrice = parseInteger(formData.budgetMin.trim());
      const maxPrice = parseInteger(formData.budgetMax.trim());
      const minRooms = parseInteger(formData.roomsMin.trim());
      const maxRooms = parseInteger(formData.roomsMax.trim());
      const propertyTypeMap: Record<string, number> = {
        'Apartament': 1,
        'Casă': 3,
      };
      const propertyTypeId = propertyType ? propertyTypeMap[propertyType === 'house' ? 'Casă' : 'Apartament'] : undefined;

      // Step 1: Find or create contact
      logger.log('Step 1: Finding/creating contact...');
      const searchValue = formData.phone.trim() || formData.email.trim();
      let contactId: number | null = null;

      if (searchValue) {
        // Try to find existing contact
        const searchUrl = `${REBS_API_BASE}/contacts/?search=${encodeURIComponent(searchValue)}`;
        logger.log('Searching for contact:', searchUrl);

        const searchController = new AbortController();
        const searchTimeout = setTimeout(() => searchController.abort(), 30000);

        try {
          const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Token ${REBS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            signal: searchController.signal,
          });

          clearTimeout(searchTimeout);

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const contacts: any[] = Array.isArray(searchData) ? searchData : searchData?.results || searchData?.objects || [];
            if (contacts.length > 0) {
              contactId = contacts[0].id;
              logger.log('Found existing contact:', contactId);
            }
          }
        } catch (searchError) {
          clearTimeout(searchTimeout);
          logger.error('Error searching for contact:', searchError);
        }
      }

      // Create contact if not found
      if (!contactId) {
        logger.log('Creating new contact...');
        const contactPayload: Record<string, any> = {
          first_name: prenume,
          last_name: nume,
        };

        if (formData.phone.trim()) {
          contactPayload.phone = formData.phone.trim();
        }
        if (formData.email.trim()) {
          contactPayload.email = formData.email.trim();
        }
        if (agentData.id) {
          contactPayload.agents = [agentData.id];
        }

        logger.log('Contact payload:', JSON.stringify(contactPayload, null, 2));

        const createContactUrl = `${REBS_API_BASE}/contacts/`;
        const createController = new AbortController();
        const createTimeout = setTimeout(() => createController.abort(), 30000);

        try {
          const createResponse = await fetch(createContactUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Token ${REBS_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactPayload),
            signal: createController.signal,
          });

          clearTimeout(createTimeout);

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            throw new Error(errorData?.detail || 'Nu am putut crea contactul în CRM.');
          }

          const contactData = await createResponse.json();
          contactId = contactData.id;
          logger.log('Created contact:', contactId);
        } catch (createError) {
          clearTimeout(createTimeout);
          logger.error('Error creating contact:', createError);
          throw createError;
        }
      }

      if (!contactId) {
        throw new Error('Nu am putut obține ID-ul contactului din CRM.');
      }

      // Step 2: Create request
      logger.log('Step 2: Creating request...');
      const requestPayload: Record<string, any> = {
        title: `${propertyType === 'house' ? 'Casă' : propertyType === 'apartment' ? 'Apartament' : 'Cerere imobiliară'} - ${prenume} ${nume}`.trim(),
        agent: agentData.id ?? null,
        details: `Agent: ${agentData.name}\nCanal contact: Telefon\nTip proprietate: ${propertyType === 'house' ? 'Casă' : propertyType === 'apartment' ? 'Apartament' : ''}\n${comentarii_generale}`.trim(),
        comments_general: comentarii_generale || null,
        contact_ids: [contactId],
        lead_source_name: 'Dashboard Agent',
        property_type: propertyTypeId ?? null,
        transaction_type: 2, // Cumpărare
        rooms_filter_gte: minRooms,
        rooms_filter_lte: maxRooms,
        price_filter_gte: minPrice,
        price_filter_lte: maxPrice,
        currency: 1, // EUR
        include_neighbouring_cities: true,
      };

      logger.log('Request payload:', JSON.stringify(requestPayload, null, 2));

      // Create AbortController for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logger.error('Request timeout after 30 seconds');
      }, 30000);

      try {
        const requestsUrl = `${REBS_API_BASE}/requests/`;
        logger.log('Sending POST request to:', requestsUrl);
        
        const response = await fetch(requestsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${REBS_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        logger.log(`Response received in ${elapsed}ms`);
        logger.log('Response status:', response.status, response.statusText);
        logger.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = 'Nu am putut adăuga clientul';
          let errorData: any = {};
          
          try {
            const responseText = await response.text();
            logger.log('Error response text:', responseText);
            
            if (responseText) {
              errorData = JSON.parse(responseText);
              logger.error('Error response JSON:', JSON.stringify(errorData, null, 2));
              errorMessage = errorData?.error || errorData?.message || errorMessage;
            }
          } catch (parseError) {
            logger.error('Failed to parse error response:', parseError);
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        logger.log('Success response:', JSON.stringify(result, null, 2));

        // REBS API returns the request object directly, not wrapped in success/error
        if (!result || !result.id) {
          throw new Error('Nu am putut adăuga clientul - răspuns invalid de la server');
        }

        const totalElapsed = Date.now() - startTime;
        logger.log(`=== Client submission successful in ${totalElapsed}ms ===`);

        // Store request ID and move to step 4 to show matching properties
        setRequestId(result.id);
        setStep(4);
        setLoading(false);
        
        // Fetch matching properties
        await fetchMatchingProperties(result.id);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          logger.error('Request timed out');
          throw new Error('Cererea a expirat. Verifică conexiunea la internet și încearcă din nou.');
        }
        
        throw fetchError;
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger.error(`=== Client submission failed after ${elapsed}ms ===`);
      logger.error('Error details:', err);
      
      if (err instanceof Error) {
        logger.error('Error message:', err.message);
        logger.error('Error stack:', err.stack);
        setError(err.message);
      } else {
        logger.error('Unknown error type:', typeof err, err);
        setError('A apărut o eroare neașteptată');
      }
    } finally {
      setLoading(false);
      logger.log('=== Submission process completed ===');
    }
  };

  // Step 1: Name and Phone are mandatory, Email is optional
  const canProceedStep1 = formData.name.trim() && formData.phone.trim();
  // Step 2: Client Type selection
  const canProceedStep2 = clientType !== null;
  // Step 3: Property Type selection
  const canProceedStep3 = propertyType !== null;
  // Step 4: Budget/Rooms/Area (optional fields, can proceed with any)
  const canProceedStep4 = true;
  // Step 5: Additional Info (optional, can proceed)
  const canProceedStep5 = true;
  // Step 6: Matching Properties (viewing results)
  const canProceedStep6 = true;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Adaugă Client Nou</Text>
            <Text style={styles.headerSubtitle}>Pasul {step} din {totalSteps}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Name, Phone, Email */}
        {step === 1 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Informații de contact</Text>
              <Text style={styles.stepDescription}>Introdu numele și numărul de telefon</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nume complet *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => setFormData({ ...formData, name: value })}
                    placeholder="Ion Popescu"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefon *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(value) => setFormData({ ...formData, phone: value })}
                    placeholder="0721234567"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => setFormData({ ...formData, email: value })}
                    placeholder="ion@example.com"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 2: Client Type */}
        {step === 2 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Ce tip de client?</Text>
              <Text style={styles.stepDescription}>Selectează intenția clientului</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  clientType === 'buyer' && styles.optionCardActive,
                ]}
                onPress={() => setClientType('buyer')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  clientType === 'buyer' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="cash"
                    size={24}
                    color={clientType === 'buyer' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Cumpărător</Text>
                  <Text style={styles.optionSubtitle}>Caută să cumpere proprietate</Text>
                </View>
                {clientType === 'buyer' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  clientType === 'renter' && styles.optionCardActive,
                ]}
                onPress={() => setClientType('renter')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  clientType === 'renter' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="person"
                    size={24}
                    color={clientType === 'renter' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Chiriaș</Text>
                  <Text style={styles.optionSubtitle}>Caută să închirieze proprietate</Text>
                </View>
                {clientType === 'renter' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Step 3: Property Type */}
        {step === 3 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Preferință proprietate?</Text>
              <Text style={styles.stepDescription}>Ce caută clientul?</Text>
            </View>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  propertyType === 'house' && styles.optionCardActive,
                ]}
                onPress={() => setPropertyType('house')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  propertyType === 'house' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="home"
                    size={24}
                    color={propertyType === 'house' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Casă</Text>
                  <Text style={styles.optionSubtitle}>Casă unifamilială, vilă, duplex</Text>
                </View>
                {propertyType === 'house' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  propertyType === 'apartment' && styles.optionCardActive,
                ]}
                onPress={() => setPropertyType('apartment')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionIconContainer,
                  propertyType === 'apartment' && styles.optionIconContainerActive,
                ]}>
                  <Ionicons
                    name="business"
                    size={24}
                    color={propertyType === 'apartment' ? '#FFFFFF' : colors.text.muted}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Apartament</Text>
                  <Text style={styles.optionSubtitle}>Apartament, garsonieră, studio</Text>
                </View>
                {propertyType === 'apartment' && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Step 4: Budget, Rooms, Area */}
        {step === 4 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Preferințe proprietate</Text>
              <Text style={styles.stepDescription}>Buget, camere și zonă preferată</Text>
            </View>

            <View style={styles.formContainer}>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Buget *</Text>
                <View style={styles.budgetRow}>
                  <View style={[styles.inputContainer, styles.budgetInput]}>
                    <Ionicons name="cash" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.budgetMin}
                      onChangeText={(value) => setFormData({ ...formData, budgetMin: value })}
                      placeholder="Min"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.budgetInput]}>
                    <Ionicons name="cash" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.budgetMax}
                      onChangeText={(value) => setFormData({ ...formData, budgetMax: value })}
                      placeholder="Max"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                {/* Buget Bonus Input */}
                <View style={[styles.inputContainer, styles.budgetBonusInput]}>
                  <Ionicons name="add-circle-outline" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.budgetBonus}
                    onChangeText={(value) => setFormData({ ...formData, budgetBonus: value })}
                    placeholder="Buget Bonus (opțional)"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputSuffix}>EUR</Text>
                </View>
                <Text style={styles.helperText}>
                  Suma suplimentară pe care sunteți dispus să o plătiți pentru proprietatea ideală
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Număr Camere</Text>
                <View style={styles.budgetRow}>
                  <View style={[styles.inputContainer, styles.budgetInput]}>
                    <Ionicons name="bed" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.roomsMin}
                      onChangeText={(value) => setFormData({ ...formData, roomsMin: value })}
                      placeholder="Min"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.budgetInput]}>
                    <Ionicons name="bed" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={formData.roomsMax}
                      onChangeText={(value) => setFormData({ ...formData, roomsMax: value })}
                      placeholder="Max"
                      placeholderTextColor={colors.text.muted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zonă preferată</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={20} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.preferredArea}
                    onChangeText={(value) => setFormData({ ...formData, preferredArea: value })}
                    placeholder="Centru, Zona Nord, etc."
                    placeholderTextColor={colors.text.muted}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 5: Additional Info */}
        {step === 5 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Informații utile</Text>
              <Text style={styles.stepDescription}>Adaugă informații suplimentare despre client (opțional)</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Informații suplimentare</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.additionalInfo}
                    onChangeText={(value) => setFormData({ ...formData, additionalInfo: value })}
                    placeholder="Adaugă orice informație utilă despre client..."
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 6: Matching Properties */}
        {step === 6 && (
          <Animated.View 
            style={[
              styles.stepContent,
              {
                opacity: stepOpacity,
                transform: [{ translateX: stepTranslateX }],
              },
            ]}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Proprietăți Potrivite</Text>
              <Text style={styles.stepDescription}>
                {loadingProperties 
                  ? 'Se caută proprietăți...' 
                  : `${matchingProperties.length} proprietăți găsite`}
              </Text>
            </View>

            {loadingProperties ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Se încarcă proprietățile potrivite...</Text>
              </View>
            ) : matchingProperties.length > 0 ? (
              <View style={styles.propertiesList}>
                {matchingProperties.map((property: any) => {
                  const transactionMode = property.transaction_mode || property.transactionMode;
                  const isRent = transactionMode === 'rent' || transactionMode === 1;
                  const isSale = transactionMode === 'sale' || transactionMode === 2;
                  
                  const price = isRent 
                    ? `${property.pricing?.rent_price || property.rent_price || 'N/A'}/lună`
                    : `${property.pricing?.sale_price || property.sale_price || 'N/A'}`;
                  
                  const type = isRent ? 'De închiriat' : isSale ? 'De vânzare' : 'Nespecificat';
                  const typeColor = 'blue';
                  const typeStyle = { bg: colors.accent, text: colors.primary, border: colors.primaryLight };

                  return (
                    <View key={property.id || property.display_id} style={styles.propertyCard}>
                      {/* Property Image */}
                      <View style={styles.imageContainer}>
                        {property.media?.photos?.[0] || property.image_url || property.image ? (
                          <Image
                            source={{ uri: property.media?.photos?.[0] || property.image_url || property.image }}
                            style={styles.propertyImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Ionicons name="home" size={48} color={colors.text.muted} />
                          </View>
                        )}
                        
                        {/* Badges */}
                        <View style={styles.imageBadges}>
                          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
                            <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>{type}</Text>
                          </View>
                        </View>

                        {/* Price Badge */}
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceText}>{price}</Text>
                        </View>
                      </View>

                      {/* Property Info */}
                      <View style={styles.propertyInfo}>
                        <Text style={styles.propertyName}>
                          {property.title || property.name || 'Proprietate fără nume'}
                        </Text>
                        <View style={styles.addressRow}>
                          <Ionicons name="location" size={16} color={colors.text.muted} />
                          <Text style={styles.address}>
                            {property.address || property.location?.street || 'Adresă nespecificată'}
                          </Text>
                        </View>

                        {/* Property Features */}
                        <View style={styles.featuresRow}>
                          {(property.characteristics?.bedrooms || property.bedrooms) && (
                            <View style={styles.feature}>
                              <Ionicons name="bed" size={16} color={colors.text.muted} />
                              <Text style={styles.featureText}>
                                {property.characteristics?.bedrooms || property.bedrooms} camere
                              </Text>
                            </View>
                          )}
                          {(property.characteristics?.bathrooms || property.bathrooms) && (
                            <View style={styles.feature}>
                              <Ionicons name="water" size={16} color={colors.text.muted} />
                              <Text style={styles.featureText}>
                                {property.characteristics?.bathrooms || property.bathrooms} băi
                              </Text>
                            </View>
                          )}
                          {(property.characteristics?.surface_useable || property.surface_useable) && (
                            <View style={styles.feature}>
                              <Ionicons name="square" size={16} color={colors.text.muted} />
                              <Text style={styles.featureText}>
                                {property.characteristics?.surface_useable || property.surface_useable} mp
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="home-outline" size={64} color={colors.text.muted} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Nu s-au găsit proprietăți potrivite</Text>
                <Text style={styles.emptySubtext}>
                  Proprietățile potrivite vor apărea aici când vor fi disponibile
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[
        styles.footer, 
        { 
          paddingBottom: Math.max(insets.bottom, 16) + 80, // Add 80px for navbar height
          zIndex: 10010, // Above navbar (which is typically 10000-10002)
        }
      ]}>
        {step === 6 ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonActive]}
            onPress={() => {
              if (onComplete) {
                onComplete();
              } else {
                router.back();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Finalizat</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              ((step === 1 && canProceedStep1) ||
              (step === 2 && canProceedStep2) ||
              (step === 3 && canProceedStep3) ||
              (step === 4 && canProceedStep4) ||
              (step === 5 && canProceedStep5))
                ? styles.actionButtonActive
                : styles.actionButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={
              loading ||
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !canProceedStep2) ||
              (step === 3 && !canProceedStep3) ||
              (step === 4 && !canProceedStep4) ||
              (step === 5 && !canProceedStep5)
            }
            activeOpacity={0.7}
          >
            {loading ? (
              <Text style={styles.actionButtonText}>Se procesează...</Text>
            ) : (
              <Text style={styles.actionButtonText}>Continuă</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.text.muted,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconContainerActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetInput: {
    flex: 1,
  },
  budgetBonusInput: {
    marginTop: 12,
  },
  inputSuffix: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 8,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: colors.gold, // Gold for important actions (submit/finalize)
  },
  actionButtonDisabled: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.muted,
    marginTop: 12,
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
    marginBottom: 16,
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
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
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
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
  },
  textAreaContainer: {
    minHeight: 120,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

