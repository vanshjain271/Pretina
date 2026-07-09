import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../theme/colors';

export default function OrdersScreen({ navigation }) {
  const dummyOrders = [
    {
      id: 'ORD-12345',
      date: '10 Oct 2026',
      status: 'Processing',
      total: 6000,
      paymentMethod: 'UPI QR (Advance)',
      items: [
        { name: 'Premium Lipstick', variant: 'Ruby Red', qty: 10 },
      ]
    },
    {
      id: 'ORD-12346',
      date: '05 Oct 2026',
      status: 'Delivered',
      total: 1200,
      paymentMethod: 'Razorpay',
      items: [
        { name: 'Foundation Cream', variant: 'Beige', qty: 5 },
      ]
    }
  ];

  const handleDownloadInvoice = (orderId) => {
    Alert.alert('Download', `Downloading Invoice for ${orderId}...`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {dummyOrders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>{order.id}</Text>
              <Text style={styles.orderDate}>{order.date}</Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusBadge}>{order.status}</Text>
              <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
            </View>

            <View style={styles.divider} />

            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemVariant}>Variant: {item.variant}</Text>
                <Text style={styles.itemQty}>Qty: {item.qty}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>Total: ₹{order.total}</Text>
              <TouchableOpacity 
                style={styles.invoiceButton}
                onPress={() => handleDownloadInvoice(order.id)}
              >
                <Text style={styles.invoiceText}>Download Invoice 📥</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: colors.white,
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
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderDate: {
    color: colors.gray600,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    color: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
    overflow: 'hidden',
  },
  paymentMethod: {
    color: colors.gray600,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 12,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  itemVariant: {
    color: colors.gray600,
    fontSize: 13,
  },
  itemQty: {
    color: colors.gray800,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primary,
  },
  invoiceButton: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  invoiceText: {
    color: colors.primary,
    fontWeight: '600',
  }
});
