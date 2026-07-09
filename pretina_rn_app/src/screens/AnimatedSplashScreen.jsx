import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

export default function AnimatedSplashScreen({ children, isAppReady }) {
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const backgroundColorInterpolation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAppReady) {
      // Hide the native splash screen immediately, now that our React Native view is rendered
      SplashScreen.hideAsync().catch(() => {});
      
      // Start the transition animation
      Animated.sequence([
        // 1. Keep the screen orange and full logo for a tiny bit (smooth handoff)
        Animated.delay(500),
        
        // 2. Fade out the logo and transition background to dark
        Animated.parallel([
          Animated.timing(imageOpacity, {
            toValue: 0,
            duration: 800, // fade out logo
            useNativeDriver: true,
          }),
          Animated.timing(backgroundColorInterpolation, {
            toValue: 1,
            duration: 1000, // transition to dark
            useNativeDriver: false, // Colors don't support native driver
          })
        ]),
        
        // 3. Fade out the entire container to reveal the app underneath
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setAnimationComplete(true);
      });
    }
  }, [isAppReady]);

  if (isSplashAnimationComplete) {
    return children;
  }

  // Interpolate the background color from Pretina Orange to Dark Mode background
  const backgroundColor = backgroundColorInterpolation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF6600', '#111111'], // From Pretina Orange to Dark
  });

  return (
    <View style={styles.container}>
      {/* The main app content rendered underneath */}
      {children}
      
      {/* The Animated Splash Screen overlay */}
      <Animated.View 
        style={[
          styles.splashOverlay,
          { opacity: containerOpacity, backgroundColor }
        ]}
      >
        <Animated.Image
          source={require('../../assets/splash-logo.png')}
          style={[styles.image, { opacity: imageOpacity }]}
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
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  image: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});
