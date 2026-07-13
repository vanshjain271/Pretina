import React, { useState, useEffect } from 'react';
import { View, Platform, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import * as SplashScreen from 'expo-splash-screen';

import BottomTabs from './BottomTabs';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import RegistrationDetailsScreen from '../screens/auth/RegistrationDetailsScreen';

import { usePushNotifications } from '../hooks/usePushNotifications';

import CartScreen from '../screens/main/CartScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

import { API_BASE_URL } from '../config';
const BASE_URL = API_BASE_URL;

import AddressSelectionScreen from '../screens/main/AddressSelectionScreen';
import ProductDetailScreen from '../screens/main/ProductDetailScreen';
import CategoryProductsScreen from '../screens/main/CategoryProductsScreen';
import BrandProductsScreen from '../screens/main/BrandProductsScreen';
import SearchProductsScreen from '../screens/main/SearchProductsScreen';

import NotificationsScreen from '../screens/profile/NotificationsScreen';
import RecentlyOrderedScreen from '../screens/profile/RecentlyOrderedScreen';
import PolicyScreen from '../screens/profile/PolicyScreen';
import BankDetailsScreen from '../screens/profile/BankDetailsScreen';

function MainNavigator() {
  usePushNotifications();
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="BottomTabs" component={BottomTabs} />
      <MainStack.Screen name="Cart" component={CartScreen} />
      <MainStack.Screen name="Checkout" component={CheckoutScreen} />
      <MainStack.Screen name="AddressSelection" component={AddressSelectionScreen} />
      <MainStack.Screen name="Orders" component={OrdersScreen} />
      <MainStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <MainStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <MainStack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <MainStack.Screen name="BrandProducts" component={BrandProductsScreen} />
      <MainStack.Screen name="SearchProducts" component={SearchProductsScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="RecentlyOrdered" component={RecentlyOrderedScreen} />
      <MainStack.Screen name="Policy" component={PolicyScreen} />
      <MainStack.Screen name="BankDetails" component={BankDetailsScreen} />
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
          Alert.alert('Login Failed', data.message || 'The server rejected the login attempt.');
          setAuthState('unauthenticated');
          // If the backend rejects the user, we should sign them out of Firebase too so they aren't stuck
          auth().signOut().catch(() => {});
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

  // Hide splash only when auth state is resolved
  useEffect(() => {
    if (authState !== 'loading') {
      // Small delay before transition starts
      setTimeout(() => {
        setShowSplash(false);
        SplashScreen.hideAsync().catch(() => {});
      }, 500);
    }
  }, [authState]);

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
    </View>
  );
}
