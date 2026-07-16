import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CategoryScreen from '../screens/main/CategoryScreen';
import SearchScreen from '../screens/main/SearchScreen';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#000',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + (insets?.bottom || 0),
          paddingBottom: 8 + (insets?.bottom || 0),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 11,
          marginBottom: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Category') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
