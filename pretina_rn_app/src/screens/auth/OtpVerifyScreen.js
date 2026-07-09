import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { colors } from '../../theme/colors';

import { getConfirmation } from '../../utils/firebaseAuthStore';

export default function OtpVerifyScreen({ route, navigation }) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function confirmCode() {
    if (!code || code.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const confirmation = getConfirmation();
      if (!confirmation) throw new Error('Session expired');
      await confirmation.confirm(code);
      setLoading(false);
      // On success, Firebase Auth state listener will catch it
      // But for now, we can manually navigate to a dummy Name screen or Main
      // navigation.navigate('Main'); // Usually handled by an Auth state listener in AppNavigator
    } catch (error) {
      setLoading(false);
      Alert.alert('Invalid OTP', 'The code you entered is incorrect.');
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Code sent to +91 {phoneNumber}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
            maxLength={6}
            placeholderTextColor={colors.gray400}
            textAlign="center"
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={confirmCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Login'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Change Phone Number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondaryLight,
    marginBottom: 32,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 24,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
  },
  input: {
    fontSize: 32,
    color: colors.textPrimaryLight,
    letterSpacing: 10,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.gray600,
    fontSize: 16,
  }
});
