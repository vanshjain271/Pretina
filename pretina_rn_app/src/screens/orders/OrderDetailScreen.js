import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '../../store/apiSlice';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { data, isLoading, error, refetch, isFetching } = useGetOrderByIdQuery(orderId);
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data?.data) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ color: colors.error }}>Failed to load order details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const order = data.data;

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await cancelOrder(order._id).unwrap();
              if (res.success) {
                Alert.alert('Success', 'Order cancelled successfully.');
                refetch();
              }
            } catch (err) {
              Alert.alert('Error', err?.data?.message || 'Could not cancel order');
            }
          }
        }
      ]
    );
  };

  const handleOpenTracking = () => {
    if (order.trackingUrl) {
      Linking.openURL(order.trackingUrl).catch(err => console.error("Couldn't open URL", err));
    }
  };

  const isCancellable = order.status === 'pending' || order.status === 'confirmed';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: colors.primary, fontWeight: 'bold', textTransform: 'capitalize' }]}>{order.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Tracking Card */}
        {(order.courierName || order.trackingNumber) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tracking Info</Text>
            {order.courierName && (
              <View style={styles.row}>
                <Text style={styles.label}>Courier:</Text>
                <Text style={styles.value}>{order.courierName}</Text>
              </View>
            )}
            {order.trackingNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>AWB / Tracking #:</Text>
                <Text style={styles.value}>{order.trackingNumber}</Text>
              </View>
            )}
            {order.trackingUrl && (
              <TouchableOpacity style={styles.trackButton} onPress={handleOpenTracking}>
                <Text style={styles.trackButtonText}>Track Package</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {order.shippingAddress ? (
            <View>
              <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
              <Text style={styles.addressText}>{order.shippingAddress.line1}</Text>
              {order.shippingAddress.line2 ? <Text style={styles.addressText}>{order.shippingAddress.line2}</Text> : null}
              <Text style={styles.addressText}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</Text>
              <Text style={styles.addressText}>Phone: {order.shippingAddress.phone}</Text>
            </View>
          ) : (
            <Text style={styles.addressText}>No address provided.</Text>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.product?.name || item.name || 'Unknown Product'}</Text>
                {item.variantName ? <Text style={styles.itemVariant}>Variant: {item.variantName}</Text> : null}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{item.total}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>₹{order.subtotal}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee:</Text>
            <Text style={styles.value}>₹{order.deliveryFee}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Discount:</Text>
              <Text style={styles.value}>- ₹{order.discount}</Text>
            </View>
          )}
          {order.tokenReceived > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Advance Paid:</Text>
              <Text style={styles.value}>- ₹{order.tokenReceived}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Grand Total (To Pay):</Text>
            <Text style={styles.totalValue}>₹{order.total - (order.tokenReceived || 0)}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={[styles.value, { textTransform: 'uppercase' }]}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={[styles.value, { textTransform: 'capitalize' }]}>{order.paymentStatus}</Text>
          </View>
        </View>

        {/* Cancel Button */}
        {isCancellable && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  backButton: { fontSize: 16, color: colors.primary },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimaryLight },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { fontSize: 14, color: colors.gray600 },
  value: { fontSize: 14, color: colors.textPrimaryLight },
  addressName: { fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  addressText: { color: colors.gray600, fontSize: 14, marginBottom: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '500' },
  itemVariant: { color: colors.gray600, fontSize: 13 },
  itemQty: { color: colors.gray800, fontSize: 13, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: colors.gray200, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  trackButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  trackButtonText: { color: colors.white, fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: colors.error,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
