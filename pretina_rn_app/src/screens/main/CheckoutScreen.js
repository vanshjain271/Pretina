import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { colors } from '../../theme/colors';

export default function CheckoutScreen({ navigation }) {
  const [selectedPayment, setSelectedPayment] = useState('razorpay'); // razorpay, qr, cod
  const [transactionId, setTransactionId] = useState('');
  
  // Dummy values for now
  const checkoutMessage = "Notice: Advance payment of ₹1000 is required for COD orders outside Delhi.";
  const totalAmount = 6000;
  const qrImageUrl = 'https://dummyimage.com/200x200/000/fff&text=UPI+QR';

  const handlePlaceOrder = () => {
    if (selectedPayment === 'qr') {
      if (!transactionId) {
        Alert.alert('Error', 'Please enter your UPI Transaction ID');
        return;
      }
      // Submit order with QR details
      Alert.alert('Success', 'Order placed! Waiting for admin payment confirmation.');
      navigation.navigate('Main');
    } else if (selectedPayment === 'razorpay') {
      // Trigger Razorpay SDK
      Alert.alert('Info', 'Launching Razorpay...');
      // razorpay logic here
    } else {
      // COD
      Alert.alert('Success', 'Order placed successfully with COD!');
      navigation.navigate('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Admin Checkout Message */}
        {checkoutMessage ? (
          <View style={styles.messageBanner}>
            <Text style={styles.messageText}>{checkoutMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text>Items Total:</Text>
            <Text>₹{totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.boldText}>To Pay:</Text>
            <Text style={styles.boldText}>₹{totalAmount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity 
          style={[styles.paymentOption, selectedPayment === 'razorpay' && styles.paymentOptionSelected]}
          onPress={() => setSelectedPayment('razorpay')}
        >
          <Text style={styles.paymentText}>Pay Online (Razorpay)</Text>
          <Text style={styles.paymentSubtext}>Instant confirmation</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.paymentOption, selectedPayment === 'qr' && styles.paymentOptionSelected]}
          onPress={() => setSelectedPayment('qr')}
        >
          <Text style={styles.paymentText}>Pay via UPI QR (Manual)</Text>
          <Text style={styles.paymentSubtext}>Upload screenshot</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.paymentOption, selectedPayment === 'cod' && styles.paymentOptionSelected]}
          onPress={() => setSelectedPayment('cod')}
        >
          <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
        </TouchableOpacity>

        {selectedPayment === 'qr' && (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Scan to Pay</Text>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
            <Text style={styles.qrSubtitle}>Pay ₹{totalAmount} via any UPI app</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter UPI Transaction ID (12 digits)"
              value={transactionId}
              onChangeText={setTransactionId}
              keyboardType="number-pad"
            />
            
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadText}>Upload Payment Screenshot</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
          <Text style={styles.placeOrderText}>
            {selectedPayment === 'qr' ? 'Submit Payment Details' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  scrollContent: {
    padding: 16,
  },
  messageBanner: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  messageText: {
    color: '#1565C0',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 12,
  },
  summaryBox: {
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentOption: {
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3E0',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  paymentSubtext: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 4,
  },
  qrSection: {
    marginTop: 16,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  qrSubtitle: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  uploadButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: colors.primary,
    fontWeight: '600',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOrderText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
