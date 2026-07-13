import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetSettingsQuery } from '../../store/apiSlice';

export default function BankDetailsScreen({ navigation }) {
  const { data, isLoading } = useGetSettingsQuery();
  const settings = data?.data || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Details</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          
          {settings.paymentQrEnabled && settings.qrImageUrl ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pay via UPI QR Code</Text>
              <Image 
                source={{ uri: settings.qrImageUrl }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.helperText}>Scan the QR code to make a payment.</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank Account Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Bank Name:</Text>
              <Text style={styles.value}>{settings.bankName || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Account No:</Text>
              <Text style={styles.value}>{settings.bankAccountNo || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>IFSC Code:</Text>
              <Text style={styles.value}>{settings.bankIfsc || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Branch:</Text>
              <Text style={styles.value}>{settings.bankBranch || 'N/A'}</Text>
            </View>
          </View>
          
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimaryLight },
  backButton: { fontSize: 16, color: colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrImage: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginBottom: 16,
  },
  helperText: {
    textAlign: 'center',
    color: colors.textSecondaryLight,
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingBottom: 8,
  },
  label: {
    fontSize: 15,
    color: colors.textSecondaryLight,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    color: colors.textPrimaryLight,
    fontWeight: 'bold',
  }
});
