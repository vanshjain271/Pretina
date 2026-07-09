import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors } from '../../theme/colors';

export default function PhoneLoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithPhoneNumber() {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      const formattedNumber = `+91${phoneNumber}`; // Assuming India for Pretina based on Razorpay/UPI
      const confirmation = await auth().signInWithPhoneNumber(formattedNumber);
      setLoading(false);
      navigation.navigate('OtpVerify', { confirmation, phoneNumber });
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Pretina</Text>
        <Text style={styles.subtitle}>Enter your phone number to login or register</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            maxLength={10}
            placeholderTextColor={colors.gray400}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={signInWithPhoneNumber}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
    backgroundColor: colors.gray50,
  },
  prefix: {
    fontSize: 18,
    color: colors.textPrimaryLight,
    marginRight: 12,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.textPrimaryLight,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  }
});
