import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function AnimatedSplashScreen({ children, isAppReady }) {
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.92)).current;
  const imageTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isAppReady) {
      // Hide the native splash screen immediately, since we have our custom overlay
      SplashScreen.hideAsync().catch(() => {});
      
      // 1. Logo fades in, scales slightly, and translates up
      Animated.parallel([
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(imageTranslateY, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Hold for 300ms, then fade out the whole overlay
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start(() => {
          setAnimationComplete(true);
        });
      });
    }
  }, [isAppReady]);

  if (isSplashAnimationComplete) {
    return children;
  }

  return (
    <View style={styles.container}>
      {/* The main app content rendered underneath */}
      {children}
      
      {/* The Animated Splash Screen overlay */}
      <Animated.View 
        style={[
          styles.splashOverlay,
          { opacity: containerOpacity }
        ]}
      >
        <Animated.Image
          source={require('../../assets/P.png')} // Original Pretina Logo without backgrounds
          style={[styles.image, { 
            opacity: imageOpacity,
            transform: [
              { scale: imageScale },
              { translateY: imageTranslateY }
            ]
          }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF8F2', // Premium cream color
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
});
