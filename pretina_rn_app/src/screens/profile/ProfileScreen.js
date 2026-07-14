import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Linking } from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../../theme/colors';
import { useGetMyProfileQuery, useUpdateProfileMutation, useGetSettingsQuery } from '../../store/apiSlice';
import { API_BASE_URL } from '../../config';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { data: profileData, isLoading: profileLoading } = useGetMyProfileQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  
  const userProfile = profileData?.data || {};
  const settings = settingsData?.data || {};

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || '');
      setEditPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (e) {
      Alert.alert('Error', 'Could not logout');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth().currentUser;
              if (user) {
                const token = await user.getIdToken();
                const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                  await auth().signOut();
                } else {
                  Alert.alert("Error", data.message || "Failed to delete account from server.");
                }
              }
            } catch (e) {
              Alert.alert('Error', 'Could not delete account.');
            }
          }
        }
      ]
    );
  };

  const handleSupportLink = (type) => {
    if (type === 'call') {
      Linking.openURL(`tel:${settings.supportPhone || '+918169902291'}`);
    } else if (type === 'whatsapp') {
      Linking.openURL(`whatsapp://send?phone=${settings.whatsappNumber || '+918169902291'}&text=Hi Support`);
    } else if (type === 'email') {
      Linking.openURL(`mailto:${settings.supportEmail || 'parinenterprise456@gmail.com'}`);
    } else if (type === 'website') {
      Linking.openURL(settings.websiteUrl || 'https://www.pretina.in');
    }
  };

  const renderSectionHeader = (title) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderMenuItem = (icon, title, action, color = colors.primary) => (
    <TouchableOpacity style={styles.menuItem} onPress={action}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userProfile.name ? userProfile.name[0].toUpperCase() : 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile.name || 'Hello, User'}</Text>
            <Text style={styles.userPhone}>{userProfile.phone || userProfile.email || 'No contact info'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        {renderSectionHeader('Account Settings')}
        <View style={styles.menuGroup}>
          {renderMenuItem('cube-outline', 'My Orders', () => navigation.navigate('Orders'), '#4CAF50')}
          {renderMenuItem('time-outline', 'Recently Ordered', () => navigation.navigate('RecentlyOrdered'), '#FF9800')}
          {renderMenuItem('location-outline', 'Manage Addresses', () => navigation.navigate('AddressSelection'), '#2196F3')}
          {renderMenuItem('card-outline', 'Payment Bank Details', () => navigation.navigate('BankDetails'), '#9C27B0')}
          {renderMenuItem('notifications-outline', 'Notifications', () => navigation.navigate('Notifications'), '#F44336')}
        </View>

        {/* Help & Support */}
        {renderSectionHeader('Help & Support')}
        <View style={styles.menuGroup}>
          {renderMenuItem('call-outline', 'Call Us', () => handleSupportLink('call'), '#009688')}
          {renderMenuItem('logo-whatsapp', 'WhatsApp Support', () => handleSupportLink('whatsapp'), '#25D366')}
          {renderMenuItem('mail-outline', 'Email Support', () => handleSupportLink('email'), '#EA4335')}
          {renderMenuItem('globe-outline', 'Visit Website', () => handleSupportLink('website'), '#3F51B5')}
        </View>

        {/* Legal & Policies */}
        {renderSectionHeader('Legal & Policies')}
        <View style={styles.menuGroup}>
          {renderMenuItem('document-text-outline', 'Shipping Policy', () => navigation.navigate('Policy', { title: 'Shipping Policy', type: 'shippingPolicy' }), '#607D8B')}
          {renderMenuItem('shield-checkmark-outline', 'Privacy Policy', () => navigation.navigate('Policy', { title: 'Privacy Policy', type: 'privacyPolicy' }), '#607D8B')}
          {renderMenuItem('cash-outline', 'Refund Policy', () => navigation.navigate('Policy', { title: 'Refund Policy', type: 'refundPolicy' }), '#607D8B')}
          {renderMenuItem('information-circle-outline', 'Terms & Conditions', () => navigation.navigate('Policy', { title: 'Terms & Conditions', type: 'termsAndConditions' }), '#607D8B')}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
            />
            
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={async () => {
                  try {
                    await updateProfile({ name: editName, phone: editPhone }).unwrap();
                    Alert.alert("Success", "Profile updated successfully!");
                    setIsEditModalVisible(false);
                  } catch (err) {
                    Alert.alert("Error", err.message || "Failed to update profile");
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Premium light grey bg
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#Eef0f2',
  },
  headerTitle: {
    fontSize: 20,
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  userPhone: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  menuGroup: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimaryLight,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.gray500,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.textPrimaryLight,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondaryLight,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#Eef0f2',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalCancelBtn: {
    padding: 12,
    marginRight: 12,
  },
  modalCancelText: {
    color: colors.gray600,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
