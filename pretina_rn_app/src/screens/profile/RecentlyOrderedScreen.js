import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetMyOrdersQuery } from '../../store/apiSlice';

export default function RecentlyOrderedScreen({ navigation }) {
  const { data, isLoading } = useGetMyOrdersQuery();
  const orders = data?.data || [];

  // Filter orders from the last 30 days
  const recentOrders = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= thirtyDaysAgo;
    });
  }, [orders]);

  const handleReorder = (order) => {
    // Navigate to OrderDetail to view the order and potentially add items to cart, or we could handle add to cart directly here.
    // For now, easiest is just navigating to the order detail.
    navigation.navigate('OrderDetail', { orderId: order._id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recently Ordered</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={recentOrders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recent orders in the last 30 days.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              
              <View style={styles.itemsContainer}>
                {item.items.slice(0, 2).map((prod, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Image source={{ uri: prod.product?.images?.[0] }} style={styles.itemImage} />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={1}>{prod.product?.name}</Text>
                      <Text style={styles.itemQty}>Qty: {prod.quantity}</Text>
                    </View>
                  </View>
                ))}
                {item.items.length > 2 && (
                  <Text style={styles.moreText}>+ {item.items.length - 2} more items</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.total}>₹{item.total}</Text>
                <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
                  <Text style={styles.reorderBtnText}>View & Reorder</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingBottom: 8,
  },
  orderNumber: { fontWeight: 'bold', color: colors.textPrimaryLight },
  date: { color: colors.gray500, fontSize: 12 },
  itemsContainer: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemImage: { width: 40, height: 40, borderRadius: 4, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, color: colors.textPrimaryLight },
  itemQty: { fontSize: 12, color: colors.gray500 },
  moreText: { fontSize: 12, color: colors.primary, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  total: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimaryLight },
  reorderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  reorderBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.gray500 }
});
