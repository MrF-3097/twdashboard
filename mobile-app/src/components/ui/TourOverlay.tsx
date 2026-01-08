/**
 * Tour Overlay Component
 * 
 * Displays a spotlight overlay with dimmed background that highlights
 * target elements. Includes tooltip cards with step information and
 * smooth animations between steps.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '@/context/TourContext';
import { SafeLinearGradient } from '@/components/ui/SafeLinearGradient';
import { colors } from '@/lib/colors';
import { TourConfetti } from './TourConfetti';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spotlight padding around the target
const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_BORDER_RADIUS = 16;

// Animation durations - optimized for smoother transitions
const FADE_DURATION = 200; // Reduced from 300ms for faster transitions
const SCALE_DURATION = 200; // Reduced from 250ms
const PULSE_DURATION = 1500;
const SPOTLIGHT_TRANSITION_DURATION = 300; // New: smooth spotlight position transitions

export const TourOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    steps,
    targetMeasurement,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  } = useTour();

  const insets = useSafeAreaInsets();

  // Animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0.8)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Spotlight position - use state with LayoutAnimation for smooth transitions
  const [spotlightStyle, setSpotlightStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Animate overlay in/out
  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(tooltipScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: FADE_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  // Animate tooltip on step change - optimized for smoother transitions
  useEffect(() => {
    if (!isActive) return;

    // Faster, smoother transition with reduced duration
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: SCALE_DURATION / 3, // Faster fade out
        useNativeDriver: true,
      }),
      Animated.timing(tooltipScale, {
        toValue: 0.85, // Less scale down for smoother feel
        duration: SCALE_DURATION / 3,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Then fade in and scale up with spring animation
      Animated.parallel([
        Animated.spring(tooltipScale, {
          toValue: 1,
          friction: 7, // Slightly less friction for snappier feel
          tension: 50, // Higher tension for faster animation
          useNativeDriver: true,
        }),
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: SCALE_DURATION * 1.2, // Slightly longer fade in for smoothness
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [currentStepIndex]);

  // Update spotlight position when target measurement changes - smooth state updates
  useEffect(() => {
    if (targetMeasurement) {
      const { x, y, width, height } = targetMeasurement;
      const spotlightX = x - SPOTLIGHT_PADDING;
      const spotlightY = y - SPOTLIGHT_PADDING;
      const spotlightW = width + SPOTLIGHT_PADDING * 2;
      const spotlightH = height + SPOTLIGHT_PADDING * 2;

      // Update state directly - React will handle the re-render smoothly
      setSpotlightStyle({
        left: spotlightX,
        top: spotlightY,
        width: spotlightW,
        height: spotlightH,
      });
    } else {
      // Center spotlight for intro/outro steps
      const centerX = SCREEN_WIDTH / 2 - 60;
      const centerY = SCREEN_HEIGHT / 2 - 60;
      
      setSpotlightStyle({
        left: centerX,
        top: centerY,
        width: 120,
        height: 120,
      });
    }
  }, [targetMeasurement]);

  // Show overlay during confetti animation even if tour is ending
  if ((!isActive || !currentStep) && !showConfetti) {
    return null;
  }
  
  // During confetti, show only the overlay and confetti (no tooltip)
  if (showConfetti) {
    return (
      <Modal visible={true} transparent animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.overlay, { opacity: 1 }]}>
          {/* Keep overlay visible during confetti */}
          <View style={styles.darkOverlay} />
          <TourConfetti
            visible={showConfetti}
            onComplete={() => {
              setShowConfetti(false);
              endTour();
            }}
          />
        </Animated.View>
      </Modal>
    );
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Calculate spotlight position - use state for layout properties
  const finalSpotlightStyle = spotlightStyle || (targetMeasurement
    ? {
        left: targetMeasurement.x - SPOTLIGHT_PADDING,
        top: targetMeasurement.y - SPOTLIGHT_PADDING,
        width: targetMeasurement.width + SPOTLIGHT_PADDING * 2,
        height: targetMeasurement.height + SPOTLIGHT_PADDING * 2,
      }
    : {
        // Center spotlight for intro steps
        left: SCREEN_WIDTH / 2 - 60,
        top: SCREEN_HEIGHT / 2 - 60,
        width: 120,
        height: 120,
      });

  // Estimate tooltip height (approximately 220-250px based on content)
  const TOOLTIP_HEIGHT = 250;
  const SAFE_MARGIN = 20;
  
  // Calculate tooltip position - smart positioning to avoid clipping
  const getTooltipStyle = () => {
    const safeTop = insets.top + SAFE_MARGIN;
    const safeBottom = SCREEN_HEIGHT - insets.bottom - SAFE_MARGIN;
    const stepId = currentStep?.id;
    
    // Navbar step - center the tooltip
    if (stepId === 'navbar') {
      const centeredTop = (SCREEN_HEIGHT - TOOLTIP_HEIGHT) / 2;
      return {
        top: Math.max(safeTop, Math.min(centeredTop, safeBottom - TOOLTIP_HEIGHT)),
        left: 24,
        right: 24,
      };
    }
    
    if (!targetMeasurement) {
      // Center the tooltip for intro/outro steps
      const centeredTop = (SCREEN_HEIGHT - TOOLTIP_HEIGHT) / 2;
      return {
        top: Math.max(safeTop, Math.min(centeredTop, safeBottom - TOOLTIP_HEIGHT)),
        left: 24,
        right: 24,
      };
    }

    const targetTop = targetMeasurement.y;
    const targetBottom = targetMeasurement.y + targetMeasurement.height;
    
    // Space available above and below the target
    const spaceAbove = targetTop - safeTop;
    const spaceBelow = safeBottom - targetBottom;
    
    // For "recent-requests" step, always prefer above - force it above even if space is tight
    if (stepId === 'recent-requests') {
      // Always position above, even if it means overlapping a bit with safe area
      const abovePosition = Math.max(safeTop - 20, targetTop - TOOLTIP_HEIGHT - SAFE_MARGIN);
      return {
        top: abovePosition,
        left: 24,
        right: 24,
      };
    }
    
    // Prefer placing below if there's enough space
    if (spaceBelow >= TOOLTIP_HEIGHT + SAFE_MARGIN) {
      return {
        top: targetBottom + SAFE_MARGIN,
        left: 24,
        right: 24,
      };
    }
    
    // Otherwise place above if there's enough space
    if (spaceAbove >= TOOLTIP_HEIGHT + SAFE_MARGIN) {
      return {
        top: targetTop - TOOLTIP_HEIGHT - SAFE_MARGIN,
        left: 24,
        right: 24,
      };
    }
    
    // If neither has enough space, position in the middle of the screen
    // This handles edge cases like very large targets or small screens
    const centeredTop = (SCREEN_HEIGHT - TOOLTIP_HEIGHT) / 2;
    return {
      top: Math.max(safeTop, Math.min(centeredTop, safeBottom - TOOLTIP_HEIGHT)),
      left: 24,
      right: 24,
    };
  };

  const getStepIcon = (): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      welcome: 'sparkles',
      fab: 'add-circle',
      leaderboard: 'trophy',
      stats: 'stats-chart',
      properties: 'home',
      requests: 'clipboard',
      complete: 'checkmark-circle',
    };
    return iconMap[currentStep.id] || 'information-circle';
  };

  // Calculate overlay segments for true cutout effect
  const getOverlaySegments = () => {
    if (!targetMeasurement) {
      // No target - full overlay with centered spotlight
      return null;
    }
    
    // Use current spotlight style or calculate from measurement
    const left = spotlightStyle?.left ?? (targetMeasurement.x - SPOTLIGHT_PADDING);
    const top = spotlightStyle?.top ?? (targetMeasurement.y - SPOTLIGHT_PADDING);
    const width = spotlightStyle?.width ?? (targetMeasurement.width + SPOTLIGHT_PADDING * 2);
    const height = spotlightStyle?.height ?? (targetMeasurement.height + SPOTLIGHT_PADDING * 2);
    const right = left + width;
    const bottom = top + height;
    
    return {
      // Top segment: full width, from top to target top
      top: { top: 0, left: 0, right: 0, height: Math.max(0, top) },
      // Bottom segment: full width, from target bottom to screen bottom
      bottom: { bottom: 0, left: 0, right: 0, top: bottom },
      // Left segment: from target top to target bottom, left side
      left: { top: top, left: 0, width: Math.max(0, left), height: height },
      // Right segment: from target top to target bottom, right side
      right: { top: top, right: 0, left: right, height: height },
    };
  };
  
  const overlaySegments = getOverlaySegments();

  return (
    <Modal visible={isActive || showConfetti} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: showConfetti ? 1 : overlayOpacity }]}>
        {/* Dark overlay segments around the spotlight (creates true cutout) */}
        {overlaySegments ? (
          <>
            {/* Top overlay */}
            <View style={[styles.overlaySegment, overlaySegments.top]} />
            {/* Bottom overlay */}
            <View style={[styles.overlaySegment, overlaySegments.bottom]} />
            {/* Left overlay */}
            <View style={[styles.overlaySegment, overlaySegments.left]} />
            {/* Right overlay */}
            <View style={[styles.overlaySegment, overlaySegments.right]} />
            
            {/* Spotlight border with pulse animation - position uses state, transform uses native driver */}
            {spotlightStyle && (
              <View style={[styles.spotlightBorderContainer, spotlightStyle, styles.spotlightShadow]}>
                <Animated.View
                  style={[
                    styles.spotlightBorder,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                />
              </View>
            )}
          </>
        ) : (
          // No target - full dark overlay for intro/outro steps
          <View style={styles.darkOverlay} />
        )}

        {/* Tooltip Card */}
        <Animated.View
          style={[
            styles.tooltipContainer,
            getTooltipStyle(),
            {
              opacity: tooltipOpacity,
              transform: [{ scale: tooltipScale }],
            },
          ]}
        >
          <View style={styles.tooltip}>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>

            {/* Icon and step indicator */}
            <View style={styles.tooltipHeader}>
              <SafeLinearGradient
                colors={[colors.primary, '#9333EA']}
                style={styles.iconContainer}
              >
                <Ionicons name={getStepIcon()} size={24} color="#FFFFFF" />
              </SafeLinearGradient>
              <Text style={styles.stepIndicator}>
                {currentStepIndex + 1} / {steps.length}
              </Text>
            </View>

            {/* Title and description */}
            <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
            <Text style={styles.tooltipDescription}>{currentStep.description}</Text>

            {/* Navigation buttons */}
            <View style={styles.buttonContainer}>
              {/* Skip button (only on non-last steps) */}
              {!isLastStep && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipTour}
                  accessibilityLabel="Sari peste tur"
                  accessibilityRole="button"
                >
                  <Text style={styles.skipButtonText}>Sari</Text>
                </TouchableOpacity>
              )}

              <View style={styles.navButtons}>
                {/* Previous button */}
                {!isFirstStep && (
                  <TouchableOpacity
                    style={styles.prevButton}
                    onPress={prevStep}
                    accessibilityLabel="Pasul anterior"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}

                {/* Next/Finish button */}
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => {
                    if (isLastStep) {
                      // Show confetti animation before ending tour
                      setShowConfetti(true);
                    } else {
                      nextStep();
                    }
                  }}
                  accessibilityLabel={isLastStep ? 'Finalizează turul' : 'Pasul următor'}
                  accessibilityRole="button"
                >
                  <SafeLinearGradient
                    colors={[colors.primary, '#9333EA']}
                    style={styles.nextButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.nextButtonText}>
                      {isLastStep ? 'Înțeles!' : 'Următorul'}
                    </Text>
                    {!isLastStep && (
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    )}
                  </SafeLinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Close button (top right) */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={skipTour}
          accessibilityLabel="Închide turul"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Darker overlay matching app's slate-900
  },
  overlaySegment: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Darker overlay matching app's slate-900
  },
  spotlightBorderContainer: {
    position: 'absolute',
  },
  spotlightShadow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  spotlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SPOTLIGHT_BORDER_RADIUS,
    borderWidth: 3,
    borderColor: `${colors.primary}E6`, // Primary color with 90% opacity
    backgroundColor: 'transparent', // Completely clear inside!
  },
  tooltipContainer: {
    position: 'absolute',
    zIndex: 10006, // Above FAB menu and tour overlay
  },
  tooltip: {
    backgroundColor: colors.surface, // White background for light theme
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border, // Light border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.muted, // Light theme - muted background
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary, // Primary color for progress
    borderRadius: 2,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    color: colors.text.muted, // Light theme
    fontSize: 14,
    fontWeight: '500',
  },
  tooltipTitle: {
    color: colors.text.primary, // Dark text for light theme
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  tooltipDescription: {
    color: colors.text.secondary, // Light theme
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: colors.text.muted, // Light theme
    fontSize: 14,
    fontWeight: '500',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface, // Light theme
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border, // Light border
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card, // White background for light theme
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default TourOverlay;

