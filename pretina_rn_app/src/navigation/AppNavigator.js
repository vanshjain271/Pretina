import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';

import BottomTabs from './BottomTabs';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import CartScreen from '../screens/main/CartScreen';
import CheckoutScreen from '../screens/main/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';

const Stack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="BottomTabs" component={BottomTabs} />
      <MainStack.Screen name="Cart" component={CartScreen} />
      <MainStack.Screen name="Checkout" component={CheckoutScreen} />
      <MainStack.Screen name="Orders" component={OrdersScreen} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null; // Or a splash screen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
          <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </>
      ) : (
        // Main Stack
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
}
