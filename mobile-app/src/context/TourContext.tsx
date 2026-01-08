/**
 * Tour Context
 * 
 * Manages the in-app guided tour state.
 * - Auto-runs on first app launch
 * - Can be replayed via (?) help button
 * - Persists "hasSeenTour" flag to AsyncStorage
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { LayoutRectangle, findNodeHandle, UIManager, Platform } from 'react-native';
import { getHasSeenTour, setHasSeenTour } from '@/services/storage/tourStorage';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('TourContext');

/**
 * Tour step definition
 */
export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetRef?: React.RefObject<any>;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
}

/**
 * Target measurement for spotlight
 */
export interface TargetMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tour context state
 */
interface TourContextType {
  // State
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  steps: TourStep[];
  targetMeasurement: TargetMeasurement | null;
  hasSeenTour: boolean;
  isReady: boolean;
  
  // Global refs registry (for elements in different components)
  globalRefs: Record<string, React.RefObject<any>>;
  
  // Actions
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  registerSteps: (steps: TourStep[]) => void;
  registerGlobalRef: (id: string, ref: React.RefObject<any>) => void;
  getGlobalRef: (id: string) => React.RefObject<any> | undefined;
  registerScrollRef: (ref: React.RefObject<any>) => void;
  measureTarget: (ref: React.RefObject<any>) => Promise<TargetMeasurement | null>;
  triggerFabOpen: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [targetMeasurement, setTargetMeasurement] = useState<TargetMeasurement | null>(null);
  const [hasSeenTour, setHasSeenTourState] = useState(true); // Default true to prevent auto-start
  const [isReady, setIsReady] = useState(false);
  
  // Global refs registry for elements in different components (e.g., FAB in MobileBottomNav)
  const [globalRefs, setGlobalRefs] = useState<Record<string, React.RefObject<any>>>({});
  
  // ScrollView ref for auto-scrolling to targets
  const [scrollRef, setScrollRef] = useState<React.RefObject<any> | null>(null);

  // Load tour status on mount
  useEffect(() => {
    const loadTourStatus = async () => {
      const seen = await getHasSeenTour();
      setHasSeenTourState(seen);
      setIsReady(true);
      logger.log('Tour ready, hasSeenTour:', seen);
    };
    loadTourStatus();
  }, []);
  
  // Register a global ref (called from components like MobileBottomNav)
  const registerGlobalRef = useCallback((id: string, ref: React.RefObject<any>) => {
    setGlobalRefs((prev) => ({ ...prev, [id]: ref }));
    logger.log('Registered global ref:', id);
  }, []);
  
  // Get a global ref by ID
  const getGlobalRef = useCallback((id: string): React.RefObject<any> | undefined => {
    return globalRefs[id];
  }, [globalRefs]);
  
  // Register the main ScrollView ref for auto-scrolling
  const registerScrollRef = useCallback((ref: React.RefObject<any>) => {
    setScrollRef(ref);
    logger.log('Registered scroll ref');
  }, []);

  // Measure target element position - optimized with requestAnimationFrame
  const measureTarget = useCallback(async (ref: React.RefObject<any>): Promise<TargetMeasurement | null> => {
    return new Promise((resolve) => {
      if (!ref.current) {
        logger.warn('No ref to measure');
        resolve(null);
        return;
      }

      // Use requestAnimationFrame for smoother measurement timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Double RAF ensures layout is complete
          ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
            if (width > 0 && height > 0) {
              const measurement = { x, y, width, height };
              logger.log('Measured target:', measurement);
              resolve(measurement);
            } else {
              logger.warn('Invalid measurement:', { x, y, width, height });
              resolve(null);
            }
          });
        });
      });
    });
  }, []);

  // Scroll to target element to ensure it's visible - optimized with faster timing
  const scrollToTarget = useCallback(async (ref: React.RefObject<any>, stepId?: string) => {
    if (!scrollRef?.current || !ref?.current) return;
    
    // Don't scroll for navbar - it's fixed position
    if (stepId === 'navbar') {
      logger.log('Skipping scroll for fixed element:', stepId);
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve) => {
      // Use requestAnimationFrame for smoother measurement
      requestAnimationFrame(() => {
        ref.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          logger.log('Element measurement:', { x, y, width, height, pageX, pageY, stepId });
          
          // For YTD card and other content, scroll down to show it properly
          // We want the element to be in the upper third of the screen
          let scrollY = 0;
          
          if (stepId === 'stats') {
            // Stats bar - scroll a bit to show it below the header
            scrollY = 280;
          } else if (stepId === 'ytd') {
            // YTD card - scroll more to show it fully
            scrollY = 450;
          } else if (stepId === 'recent-requests') {
            // Recent requests - scroll to show it with space above for tooltip
            // Position element lower so tooltip can be above it
            scrollY = Math.max(0, pageY - 300); // More space above
          } else {
            // Default: use pageY to calculate scroll position
            scrollY = Math.max(0, pageY - 200);
          }
          
          logger.log('Scrolling to:', { stepId, scrollY });
          
          scrollRef.current.scrollTo({
            y: scrollY,
            animated: true,
          });
          
          // Reduced wait time for faster transitions (300ms instead of 500ms)
          setTimeout(resolve, 300);
        });
      });
    });
  }, [scrollRef]);

  // Update measurement when step changes - optimized for smoother transitions
  useEffect(() => {
    let isCancelled = false;
    
    const updateMeasurement = async () => {
      if (!isActive || steps.length === 0) {
        setTargetMeasurement(null);
        return;
      }

      const currentStep = steps[currentStepIndex];
      
      // Use requestAnimationFrame to batch updates and reduce lag
      requestAnimationFrame(async () => {
        if (isCancelled) return;
        
        let targetRef = currentStep?.targetRef;
        
        if (targetRef) {
          // First scroll to make target visible (pass step ID for special handling)
          await scrollToTarget(targetRef, currentStep.id);
          
          if (isCancelled) return;
          
          // Then measure the target position (after scroll completes)
          const measurement = await measureTarget(targetRef);
          
          if (!isCancelled) {
            setTargetMeasurement(measurement);
          }
        } else {
          // Center spotlight for steps without target
          if (scrollRef?.current) {
            // Scroll to top for welcome/complete steps
            if (currentStep?.id === 'welcome' || currentStep?.id === 'complete') {
              scrollRef.current.scrollTo({ y: 0, animated: true });
              await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 300ms
            }
          }
          
          if (!isCancelled) {
            setTargetMeasurement(null);
          }
        }
      });
    };

    updateMeasurement();
    
    // Cleanup function to cancel pending operations
    return () => {
      isCancelled = true;
    };
  }, [isActive, currentStepIndex, steps, measureTarget, scrollToTarget, scrollRef]);

  const startTour = useCallback(() => {
    if (steps.length === 0) {
      logger.warn('No tour steps registered');
      return;
    }
    logger.log('🎬 Starting tour with', steps.length, 'steps');
    setCurrentStepIndex(0);
    setIsActive(true);
  }, [steps]);

  const endTour = useCallback(async () => {
    logger.log('✅ Tour ended');
    setIsActive(false);
    setCurrentStepIndex(0);
    setTargetMeasurement(null);
    
    // Mark tour as seen
    await setHasSeenTour(true);
    setHasSeenTourState(true);
  }, []);

  const skipTour = useCallback(async () => {
    logger.log('⏭️ Tour skipped');
    await endTour();
  }, [endTour]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      logger.log('➡️ Next step:', currentStepIndex + 1);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStepIndex, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      logger.log('⬅️ Previous step:', currentStepIndex - 1);
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const registerSteps = useCallback((newSteps: TourStep[]) => {
    logger.log('📝 Registering', newSteps.length, 'tour steps');
    setSteps(newSteps);
  }, []);

  const currentStep = isActive && steps.length > 0 ? steps[currentStepIndex] : null;

  const value: TourContextType = {
    isActive,
    currentStepIndex,
    currentStep,
    steps,
    targetMeasurement,
    hasSeenTour,
    isReady,
    globalRefs,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    registerSteps,
    registerGlobalRef,
    getGlobalRef,
    registerScrollRef,
    measureTarget,
    triggerFabOpen: () => {
      // This is a no-op - FAB opening is handled by tourOpenFab prop
      logger.log('triggerFabOpen called (handled by tourOpenFab prop)');
    },
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

/**
 * Hook to access tour context
 */
export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

