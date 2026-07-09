import React, { useState, useEffect } from 'react';
import { View, Platform, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';

import BottomTabs from './BottomTabs';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import RegistrationDetailsScreen from '../screens/auth/RegistrationDetailsScreen';
import AnimatedSplashScreen from '../screens/auth/AnimatedSplashScreen';

import CartScreen from '../screens/main/CartScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1';

import AddressSelectionScreen from '../screens/main/AddressSelectionScreen';

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="BottomTabs" component={BottomTabs} />
      <MainStack.Screen name="Cart" component={CartScreen} />
      <MainStack.Screen name="Checkout" component={CheckoutScreen} />
      <MainStack.Screen name="AddressSelection" component={AddressSelectionScreen} />
      <MainStack.Screen name="Orders" component={OrdersScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [authState, setAuthState] = useState('loading'); // 'loading', 'unauthenticated', 'authenticated', 'needsRegistration'
  const [backendUser, setBackendUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState('unauthenticated');
        setBackendUser(null);
        return;
      }
      
      try {
        const idToken = await firebaseUser.getIdToken(true);
        setToken(idToken);
        
        const res = await fetch(`${BASE_URL}/auth/firebase-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });
        const data = await res.json();
        
        if (data.success) {
          setBackendUser(data.user);
          // Check if profile is incomplete
          if (data.isNewUser || !data.user.name || data.user.name === 'Pretina User' || !data.user.pincode) {
             setAuthState('needsRegistration');
          } else {
             setAuthState('authenticated');
          }
        } else {
          setAuthState('unauthenticated');
        }
      } catch (e) {
        console.log("Firebase login error:", e);
        Alert.alert('Server Error', 'Failed to connect to the backend server. ' + e.message);
        setAuthState('unauthenticated');
      }
    });
    return subscriber;
  }, []);

  const handleRegistrationComplete = () => {
    setAuthState('authenticated');
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState === 'unauthenticated' || authState === 'loading' ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
            <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
          </>
        ) : authState === 'needsRegistration' ? (
          <Stack.Screen name="RegistrationDetails">
            {props => (
              <RegistrationDetailsScreen 
                {...props} 
                token={token}
                onComplete={handleRegistrationComplete} 
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
      
      {showSplash && <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />}
    </View>
  );
}
