import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  // Logo Animations (Phase 1)
  const logoOpacityAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.90)).current;
  const logoTranslateYAnim = useRef(new Animated.Value(10)).current;
  
  // Auth UI Animations (Phase 2)
  const authUiOpacityAnim = useRef(new Animated.Value(0)).current;
  const authUiTranslateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Logo animation (fade in, scale up, slide up)
      Animated.parallel([
        Animated.timing(logoOpacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateYAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Hold for 300ms
      Animated.delay(300),
      // Phase 2: Auth UI fades and slides in smoothly
      Animated.parallel([
        Animated.timing(authUiOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(authUiTranslateYAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { 
          opacity: logoOpacityAnim,
          transform: [
            { scale: logoScaleAnim },
            { translateY: logoTranslateYAnim }
          ]
        }]}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { 
          opacity: authUiOpacityAnim,
          transform: [{ translateY: authUiTranslateYAnim }]
        }]}>
          <Text style={styles.title}>PRETINA</Text>
          <Text style={styles.subtitle}>Premium shopping for businesses.{'\n'}Fast delivery. Trusted suppliers.</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { 
        opacity: authUiOpacityAnim,
        transform: [{ translateY: authUiTranslateYAnim }]
      }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('PhoneLogin', { mode: 'signin' })}
        >
          <Text style={styles.primaryButtonText}>Already a Customer? Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('PhoneLogin', { mode: 'signup' })}
        >
          <Text style={styles.secondaryButtonText}>Create New Account</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F2', // Premium cream color
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280, 
    height: 280,
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 46,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1.5, // Added letter spacing for a more premium look on the brand name
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
});
