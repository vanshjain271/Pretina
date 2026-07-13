import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectCartTotalPrice, selectCartTotalItems, selectIsCartVisible, toggleCart, removeFromCart } from '../store/cartSlice';
import { useNavigation } from '@react-navigation/native';
import AddToCartButton from './AddToCartButton';
import { colors } from '../theme/colors';

const { height, width } = Dimensions.get('window');

export default function GlobalCart() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isCartVisible = useSelector(selectIsCartVisible);
  const cartItems = useSelector(selectCartItems);
  const totalPrice = useSelector(selectCartTotalPrice);
  const totalItems = useSelector(selectCartTotalItems);

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
                {cartItems.map((item, index) => {
                  const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
                  const itemPrice = item.variant ? (item.variant.salePrice || item.variant.price || item.product.salePrice) : item.product.salePrice;
                  
                  return (
                    <View key={itemKey} style={styles.cartItem}>
                      <Image 
                        source={{ uri: item.product.images?.[0] }} 
                        style={styles.itemImage} 
                        contentFit="cover" 
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                        {item.variant && (
                          <Text style={styles.itemVariant}>Variant: {item.variant.name}</Text>
                        )}
                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemPrice}>₹{itemPrice}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.itemActions}>
                        <AddToCartButton product={item.product} variant={item.variant} />
                        <View style={styles.subtotalRow}>
                          <TouchableOpacity 
                            onPress={() => dispatch(removeFromCart({ productId: item.product._id, variantId: item.variant?._id }))}
                            style={styles.removeBtn}
                          >
                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                          <Text style={styles.itemSubtotal}>₹{itemPrice * item.quantity}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <SafeAreaView style={styles.footer} edges={['bottom']}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>₹{totalPrice}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.checkoutBtn} 
                  activeOpacity={0.8}
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
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimaryLight,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: colors.textSecondaryLight,
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    width: 90,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  removeBtn: {
    padding: 4,
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimaryLight,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
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
  }
});
