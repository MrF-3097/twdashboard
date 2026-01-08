/**
 * Login Screen
 * Simple authentication screen for agents
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { createScopedLogger } from '@/lib/logger';

const logger = createScopedLogger('LoginScreen');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Animation for welcome screen
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation for logo position when keyboard appears
  const logoTranslateY = useRef(new Animated.Value(0)).current;

  // Handle keyboard show/hide to move logo up
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Move logo up by 95px when keyboard appears
        Animated.timing(logoTranslateY, {
          toValue: -95,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Move logo back to original position
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eroare', 'Te rugăm să completezi toate câmpurile');
      return;
    }

    setIsLoading(true);
    try {
      logger.log('Attempting login with email:', email.trim());
      await login(email.trim(), password);
      logger.log('Login successful, showing welcome screen');
      
      // Show welcome screen
      setShowWelcome(true);
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Navigate to home after 2 seconds
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch (error: any) {
      logger.error('Login error:', error);
      Alert.alert('Eroare la autentificare', error.message || 'Email sau parolă incorectă');
      setIsLoading(false);
    }
  };


  // Show welcome screen
  if (showWelcome) {
    return (
      <View style={styles.welcomeScreen}>
        <Animated.View style={[styles.welcomeContainer, { opacity: welcomeOpacity }]}>
          <Text style={styles.welcomeText}>Bine ai venit</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* White Background */}
        <View style={styles.background} />

        {/* Logo - Blue Path 1.png */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/path-1.png')}
            style={[styles.logoImage, { tintColor: '#4A90E2' }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Autentifică-te</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="exemplu@gmail.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              accessibilityLabel="Email"
              accessibilityHint="Introdu adresa ta de email pentru autentificare"
              accessibilityRole="textbox"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Adaugă parola"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              accessibilityLabel="Parolă"
              accessibilityHint="Introdu parola ta pentru autentificare"
              accessibilityRole="textbox"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="INTRĂ"
            accessibilityHint="Apasă pentru a te autentifica în aplicație"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>INTRĂ</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: '100%',
    height: 120,
  },
  logoImage: {
    width: 200,
    height: 120,
  },
  formContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    padding: 24,
    zIndex: 15,
    transform: [{ translateY: -150 }],
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Inner shadow effect using elevation and shadowColor
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    paddingVertical: 16,
    color: '#1E293B',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    // Drop shadow
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});
