/**
 * Tour Confetti Component
 * 
 * React Native confetti animation for tour completion celebration
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '@/lib/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TourConfettiProps {
  visible: boolean;
  onComplete: () => void;
}

const PARTICLE_COUNT = 50;
const COLORS = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B731', '#A55EEA', '#26DE81'];

export const TourConfetti: React.FC<TourConfettiProps> = ({ visible, onComplete }) => {
  const particles = useRef<Array<{
    x: Animated.Value;
    y: Animated.Value;
    rotation: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
    color: string;
  }>>([]);

  const emojiScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Initialize particles with random starting positions at top of screen
      particles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const startX = Math.random() * SCREEN_WIDTH;
        return {
          x: new Animated.Value(startX),
          y: new Animated.Value(-20 - Math.random() * 50), // Start slightly above screen
          rotation: new Animated.Value(0),
          scale: new Animated.Value(0.5 + Math.random() * 0.5), // Random size between 0.5 and 1
          opacity: new Animated.Value(1),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });

      // Animate particles falling
      const animations = particles.current.map((particle, index) => {
        const duration = 2000 + Math.random() * 1000;
        const delay = index * 20;
        const startX = particle.x._value;
        const endX = startX + (Math.random() - 0.5) * 200;
        
        return Animated.parallel([
          Animated.timing(particle.y, {
            toValue: SCREEN_HEIGHT + 100,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: endX,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 720,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              delay: duration - 500,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      // Animate emoji - pop in animation (no rotation)
      Animated.sequence([
        Animated.spring(emojiScale, {
          toValue: 1.2, // Slightly overshoot for pop effect
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(emojiScale, {
          toValue: 1, // Settle to normal size
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate message text
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Start all particle animations
      Animated.parallel(animations).start();

      // Call onComplete after animation finishes
      setTimeout(() => {
        onComplete();
      }, 4000);
    } else {
      // Reset animations
      particles.current.forEach(particle => {
        particle.y.setValue(-20 - Math.random() * 50);
        particle.x.setValue(Math.random() * SCREEN_WIDTH);
        particle.rotation.setValue(0);
        particle.opacity.setValue(0);
      });
      emojiScale.setValue(0);
      messageOpacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti Particles */}
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      {/* Celebration Message */}
      <View style={styles.messageContainer}>
        <Animated.View
          style={[
            styles.emojiContainer,
            {
              transform: [{ scale: emojiScale }],
            },
          ]}
        >
          <Text style={styles.emoji}>🎉</Text>
        </Animated.View>
        <Animated.View style={{ opacity: messageOpacity }}>
          <Text style={styles.message}>Bravo! Acum stăpânești aplicația!</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10008,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    marginBottom: 20,
  },
  emoji: {
    fontSize: 80,
  },
  message: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF', // White text
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

