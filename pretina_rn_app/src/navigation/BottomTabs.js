import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Placeholder Screens
const CategoryScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Categories</Text></View>;
const SearchScreen = () => <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Search</Text></View>;

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Category" component={CategoryScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
