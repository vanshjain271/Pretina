import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Linking, Platform, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useGetMyOrdersQuery } from '../../store/apiSlice';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config';

export default function OrdersScreen({ navigation }) {
  const { data, isLoading, error, refetch, isFetching } = useGetMyOrdersQuery();
  const orders = data?.data || [];

  const [activeTab, setActiveTab] = useState('ALL');
  const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED'];

  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

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

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ALL') return true;
    const status = (order.status || order.orderStatus || 'pending').toUpperCase();
    return status === activeTab;
  });

  const renderOrderImages = (items) => {
    // Take up to 3 unique product images
    const images = [];
    items.forEach(item => {
      const img = item.product?.images?.[0] || item.product?.image || null;
      if (img && !images.includes(img) && images.length < 3) {
        images.push(img);
      }
    });

    if (images.length === 0) {
      return (
        <View style={styles.placeholderImage}>
          <Ionicons name="cube-outline" size={24} color={colors.gray400} />
        </View>
      );
    }

    return (
      <View style={styles.imageStack}>
        {images.map((img, index) => (
          <Image 
            key={index}
            source={{ uri: img }}
            style={[styles.stackedImage, { left: index * 20, zIndex: 3 - index }]}
            contentFit="cover"
          />
        ))}
        {items.length > 3 && (
          <View style={[styles.moreImagesBadge, { left: 3 * 20, zIndex: 0 }]}>
            <Text style={styles.moreImagesText}>+{items.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonWrap}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{color: colors.error}}>Failed to load orders.</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders found in {activeTab}.</Text>
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
          {filteredOrders.map(order => {
            const status = (order.status || order.orderStatus || 'pending').toUpperCase();
            const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const isDelivered = status === 'DELIVERED';
            const isShipped = status === 'SHIPPED';
            const isConfirmed = status === 'CONFIRMED';
            
            let badgeBg = '#E1F5FE';
            let badgeColor = colors.primary;
            if (isDelivered) { badgeBg = '#E8F5E9'; badgeColor = colors.success; }
            else if (isShipped) { badgeBg = '#E3F2FD'; badgeColor = '#1976D2'; }
            else if (status === 'PENDING') { badgeBg = '#FFF3E0'; badgeColor = '#F57C00'; }

            return (
              <TouchableOpacity 
                key={order._id} 
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusText, { color: badgeColor }]}>{status}</Text>
                  </View>
                </View>
                <Text style={styles.orderDate}>{date}</Text>
              
                <View style={styles.orderMiddle}>
                  {renderOrderImages(order.items)}
                  <View style={styles.orderSummary}>
                    <Text style={styles.itemsText}>{totalItems} Items • {(order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid')}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.orderTotal}>₹{(order.total || order.totalAmount || 0).toFixed(2)}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.invoiceButton} 
                  onPress={() => handleDownloadInvoice(order._id)}
                  disabled={downloadingInvoice === order._id}
                >
                  {downloadingInvoice === order._id ? (
                     <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={styles.invoiceText}>Download Invoice (PDF)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA', // Slight off-white background
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
  backButtonWrap: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  tabsWrapper: {
    backgroundColor: '#F7F8FA',
    paddingVertical: 12,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EBEBEB',
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: colors.white,
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
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.textPrimaryLight,
  },
  orderDate: {
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  orderMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageStack: {
    flexDirection: 'row',
    width: 80, // rough width for up to 3 stacked images
    height: 48,
    alignItems: 'center',
  },
  stackedImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moreImagesBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  orderSummary: {
    flex: 1,
    marginLeft: 16,
  },
  itemsText: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimaryLight,
  },
  orderTotal: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.primary, // Using primary blue for the amount
  },
  invoiceButton: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#D4E8FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  }
});
