import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectCartTotalPrice, selectCartTotalItems, selectIsCartVisible, toggleCart, removeFromCart, updateQuantity } from '../store/cartSlice';
import { useGetSettingsQuery, useSyncCartMutation } from '../store/apiSlice';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const { height } = Dimensions.get('window');

export default function GlobalCart() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isCartVisible = useSelector(selectIsCartVisible);
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const totalItems = useSelector(selectCartTotalItems);

  const { data: settingsData } = useGetSettingsQuery();
  const settings = settingsData?.data || {};
  const minOrderValue = settings.minOrderValue || 0;

  const deliveryFee = (settings.freeDeliveryAbove > 0 && totalPrice >= settings.freeDeliveryAbove)
    ? 0
    : (settings.deliveryFee || 0);

  const grandTotal = totalPrice + deliveryFee;
  const canCheckout = totalPrice >= minOrderValue;

  const [syncCart] = useSyncCartMutation();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const mappedItems = cartItems.map(item => ({
        product: item.product._id,
        variant: item.variant ? item.variant._id : undefined,
        variantName: item.variant ? item.variant.name : '',
        quantity: item.quantity
      }));
      syncCart(mappedItems).catch(err => console.warn('Cart sync error:', err));
    }, 2000);
  }, [cartItems, syncCart]);

  if (!isCartVisible) return null;

  return (
    <Modal
      visible={isCartVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => dispatch(toggleCart())}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={() => dispatch(toggleCart())} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.bottomSheet}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Cart ({totalItems})</Text>
            <TouchableOpacity onPress={() => dispatch(toggleCart())} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimaryLight} />
            </TouchableOpacity>
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={80} color={colors.gray400} />
              <Text style={styles.emptyText}>Your cart is empty!</Text>
              <TouchableOpacity style={styles.continueBtn} onPress={() => dispatch(toggleCart())}>
                <Text style={styles.continueBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                {cartItems.map((item) => {
                  const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
                  const itemPrice = item.variant
                    ? (item.variant.salePrice || item.variant.price || item.product.salePrice)
                    : item.product.salePrice;
                  const minQty = item.product.minOrderQty || 1;
                  const qty = item.quantity;

                  const handleDecrement = () => {
                    if (qty - minQty <= 0) {
                      dispatch(removeFromCart({ productId: item.product._id, variantId: item.variant?._id }));
                    } else {
                      dispatch(updateQuantity({ productId: item.product._id, variantId: item.variant?._id, quantity: qty - minQty }));
                    }
                  };

                  const handleIncrement = () => {
                    dispatch(updateQuantity({ productId: item.product._id, variantId: item.variant?._id, quantity: qty + minQty }));
                  };

                  return (
                    <View key={itemKey} style={styles.cartItem}>
                      {/* Product Image */}
                      <Image
                        source={{ uri: item.product.images?.[0] }}
                        style={styles.itemImage}
                        contentFit="cover"
                      />

                      {/* Product Info */}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                        {item.variant && (
                          <Text style={styles.itemVariant} numberOfLines={1}>Variant: {item.variant.name}</Text>
                        )}
                        <Text style={styles.itemPrice}>₹{itemPrice} × {qty} = <Text style={styles.itemSubtotal}>₹{itemPrice * qty}</Text></Text>

                        {/* Quantity Controls + Delete in one row */}
                        <View style={styles.qtyRow}>
                          <View style={styles.qtyControl}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                              <Ionicons name="remove" size={16} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{qty}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement}>
                              <Ionicons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={() => dispatch(removeFromCart({ productId: item.product._id, variantId: item.variant?._id }))}
                            style={styles.removeBtn}
                          >
                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <SafeAreaView style={styles.footer} edges={['bottom']}>
                {minOrderValue > 0 && !canCheckout && (
                  <View style={styles.warningBanner}>
                    <Ionicons name="warning-outline" size={16} color="#B45309" />
                    <Text style={styles.warningText}>
                      Minimum order value is ₹{minOrderValue}. Add ₹{minOrderValue - totalPrice} more to checkout.
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Subtotal</Text>
                  <Text style={styles.summaryValueSmall}>₹{totalPrice}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Delivery Fee {deliveryFee === 0 && totalPrice > 0 && '(Free)'}</Text>
                  <Text style={styles.summaryValueSmall}>+ ₹{deliveryFee}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 4 }]}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>₹{grandTotal}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.checkoutBtn, !canCheckout && styles.checkoutBtnDisabled]}
                  activeOpacity={0.8}
                  disabled={!canCheckout}
                  onPress={() => {
                    dispatch(toggleCart());
                    navigation.navigate('Checkout');
                  }}
                >
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </SafeAreaView>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  cartList: {
    flex: 1,
  },
  // Each cart row: image on left, all info on right
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimaryLight,
    marginBottom: 2,
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textSecondaryLight,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textSecondaryLight,
    marginBottom: 8,
  },
  itemSubtotal: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 14,
  },
  // Qty row: [- qty +] on left, trash on right
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
    height: 32,
  },
  qtyBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    minWidth: 36,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabelSmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondaryLight,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  checkoutBtnDisabled: {
    backgroundColor: colors.gray400,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondaryLight,
    marginTop: 16,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
