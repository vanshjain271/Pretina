import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../../theme/colors';

export default function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await auth().signOut();
      // Auth state listener in AppNavigator will handle redirect
    } catch (e) {
      Alert.alert('Error', 'Could not logout');
    }
  };

  const menuItems = [
    { title: 'My Orders', action: () => navigation.navigate('Orders') },
    { title: 'Manage Addresses', action: () => Alert.alert('Nav', 'Addresses') },
    { title: 'Notifications', action: () => Alert.alert('Nav', 'Notifications') },
    { title: 'Help & Support', action: () => Alert.alert('Nav', 'Support') },
    { title: 'Dark Mode', action: () => Alert.alert('Info', 'Toggle Theme') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Hello, User</Text>
            <Text style={styles.userPhone}>+91 9999999999</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  avatar: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  userPhone: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 4,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimaryLight,
  },
  chevron: {
    color: colors.gray400,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
