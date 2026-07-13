import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetMyOrdersQuery } from '../../store/apiSlice';
import auth from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../../config';

export default function OrdersScreen({ navigation }) {
  const { data, isLoading, error, refetch, isFetching } = useGetMyOrdersQuery();
  const orders = data?.data || [];

  const [downloadingInvoice, setDownloadingInvoice] = React.useState(null);

  const handleDownloadInvoice = async (orderId) => {
    setDownloadingInvoice(orderId);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }
      const token = await user.getIdToken();
      
      const uri = `${API_BASE_URL}/orders/public-pdf/${orderId}`;
      const supported = await Linking.canOpenURL(uri);
      
      if (supported) {
        await Linking.openURL(uri);
      } else {
        Alert.alert("Error", "Don't know how to open URI: " + uri);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const onRefresh = () => {
    refetch();
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

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{color: colors.error}}>Failed to load orders.</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You have no past orders.</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {orders.map(order => (
            <TouchableOpacity 
              key={order._id} 
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              </View>
            
              <View style={styles.statusRow}>
                <Text style={styles.statusBadge}>{order.status || order.orderStatus || 'pending'}</Text>
                <Text style={styles.paymentMethod}>{order.paymentMethod.toUpperCase()}</Text>
              </View>

              <View style={styles.divider} />

              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.product?.name || item.name || 'Unknown Product'}</Text>
                  {item.variantName ? <Text style={styles.itemVariant}>Variant: {item.variantName}</Text> : null}
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ₹{order.total || order.totalAmount}</Text>
                <TouchableOpacity 
                  style={styles.invoiceButton} 
                  onPress={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingInvoice === order._id}
                >
                  {downloadingInvoice === order._id ? (
                     <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                     <Text style={styles.invoiceText}>Download Invoice 📥</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray500,
    fontSize: 16,
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
