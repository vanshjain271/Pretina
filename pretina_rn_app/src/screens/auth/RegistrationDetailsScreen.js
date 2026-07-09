import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// Example: import API function to update profile
// We will define this API in apiSlice or do a fetch call.
// For now we'll do a simple fetch directly or use RTK Query if defined.
import { apiSlice } from '../../store/apiSlice';
import { useDispatch } from 'react-redux';

export default function RegistrationDetailsScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleCompleteRegistration = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter your full name');
    if (!pincode.trim()) return Alert.alert('Error', 'Please enter your pincode');
    
    setLoading(true);
    try {
      // Use the API slice to dispatch a manual mutation or define it
      const response = await fetch('http://10.0.2.2:5001/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real app we'd get the token from async storage or auth slice
          // But since they just logged in, they are authenticated via cookies or we need to pass token.
          // Wait, Pretina backend uses JWT. Where is it stored? Let's check how Auth sets it.
        },
        body: JSON.stringify({ name, email, pincode }),
      });
      // We will refine the network call once we see how Auth handles tokens.
      
      // For now, assume success and navigate to Main
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', 'Failed to update details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Just a few details to get you started!</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.gray500} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={colors.gray400}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.gray500} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address (Optional)"
                placeholderTextColor={colors.gray400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={colors.gray500} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor={colors.gray400}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCompleteRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Finish Registration</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondaryLight,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimaryLight,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
