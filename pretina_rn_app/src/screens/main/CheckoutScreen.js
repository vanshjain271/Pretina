import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator, Modal, Switch } from 'react-native';
import { colors } from '../../theme/colors';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartTotalPrice, selectCartItems, clearCart } from '../../store/cartSlice';
import { 
  useGetSettingsQuery, 
  useGetMyProfileQuery,
  useSyncCartMutation, 
  useCreateOrderMutation, 
  useCreateRazorpayOrderMutation, 
  useVerifyRazorpayPaymentMutation,
  useClearCartAPIMutation,
  useAddToCartAPIMutation,
  useValidateCouponMutation
} from '../../store/apiSlice';
import RazorpayCheckout from 'react-native-razorpay';

export default function CheckoutScreen({ navigation }) {
  const dispatch = useDispatch();
  const [selectedPayment, setSelectedPayment] = useState('razorpay'); // razorpay, qr, cod, partial
  const [transactionId, setTransactionId] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  const totalAmount = useSelector(selectCartTotalPrice);
  const cartItems = useSelector(selectCartItems);

  const { data: settingsData } = useGetSettingsQuery();
  const [syncCart] = useSyncCartMutation();
  const [createOrder] = useCreateOrderMutation();
  const [createRazorpayOrder] = useCreateRazorpayOrderMutation();
  const [verifyRazorpayPayment] = useVerifyRazorpayPaymentMutation();
  const [clearCartAPI] = useClearCartAPIMutation();
  const [addToCartAPI] = useAddToCartAPIMutation();
  const [validateCoupon, { isLoading: isCouponLoading }] = useValidateCouponMutation();

  const { data: profileData } = useGetMyProfileQuery();

  useEffect(() => {
    if (!selectedAddress && profileData?.data?.addresses?.length > 0) {
      const addresses = profileData.data.addresses;
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [profileData]);

  const settings = settingsData?.data || {};
  const checkoutMessage = settings.orderNotes || "";
  const qrImageUrl = settings.qrImageUrl || 'https://dummyimage.com/200x200/000/fff&text=UPI+QR';

  const deliveryFee = (settings.freeDeliveryAbove > 0 && totalAmount >= settings.freeDeliveryAbove)
    ? 0
    : (settings.deliveryFee || 0);

  const grandTotal = totalAmount - (appliedCoupon?.discount || 0) + deliveryFee;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const res = await validateCoupon({ code: couponInput, cartTotal: totalAmount }).unwrap();
      if (res.success) {
        setAppliedCoupon({
          code: res.coupon.code,
          discount: res.discount
        });
      }
    } catch (err) {
      Alert.alert('Error', err?.data?.message || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const [isQrModalVisible, setIsQrModalVisible] = useState(false);

  const handleSelectAddress = () => {
    navigation.navigate('AddressSelection', {
      onSelect: (address) => setSelectedAddress(address)
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address first.');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }
    if (totalAmount < (settings.minOrderValue || 0)) {
      Alert.alert('Error', `Minimum order value is ₹${settings.minOrderValue}. Please add more items to your cart.`);
      return;
    }

    // if (selectedPayment === 'partial' && !isQrModalVisible) {
    //   setIsQrModalVisible(true);
    //   return;
    // }

    setIsProcessing(true);
    try {
      // 1. Sync cart using individual endpoint calls
      try {
        await clearCartAPI().unwrap();
        for (const item of cartItems) {
          await addToCartAPI({
            productId: item.product._id,
            variantId: item.variant ? item.variant._id : null,
            variantName: item.variant ? item.variant.name : '',
            quantity: item.quantity,
          }).unwrap();
        }
      } catch (err) {
        console.warn('Cart sync failed, proceeding anyway:', err);
      }

      // 2. Create Order
      const orderPayload = {
        shippingAddressId: selectedAddress._id,
        paymentMethod: selectedPayment === 'razorpay' ? 'razorpay' : (selectedPayment === 'partial' ? 'partial_razorpay' : 'cod'),
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      };

      const orderRes = await createOrder(orderPayload).unwrap();
      if (!orderRes.success) throw new Error(orderRes.message || 'Order creation failed');

      const orderData = orderRes.data;

      // 3. Process Razorpay if selected (Full or Partial)
      if (selectedPayment === 'razorpay' || selectedPayment === 'partial') {
        const rpOrderRes = await createRazorpayOrder({ orderId: orderData._id, isPartial: selectedPayment === 'partial' }).unwrap();
        if (!rpOrderRes.success) throw new Error('Could not initialize Razorpay');

        const options = {
          description: 'Payment for your order',
          currency: rpOrderRes.currency || 'INR',
          key: rpOrderRes.keyId,
          amount: rpOrderRes.amount,
          name: 'Pretina',
          order_id: rpOrderRes.razorpayOrderId,
          prefill: {
            contact: profileData?.data?.phone || '',
            name: profileData?.data?.name || '',
          },
          theme: { color: colors.primary }
        };

        try {
          const data = await RazorpayCheckout.open(options);
          
          // Verify — MUST pass orderId so backend can find the order
          const verifyRes = await verifyRazorpayPayment({
            orderId: orderData._id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
          }).unwrap();

          if (verifyRes.success) {
            dispatch(clearCart());
            Alert.alert('Success', 'Order placed successfully!');
            navigation.replace('Orders');
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          // error.code / error.description come from Razorpay SDK on user-cancel
          // error.data?.message comes from our backend on verify failure
          const errMsg = error?.data?.message || error?.description || error?.message || 'Please try again or contact support.';
          Alert.alert('Payment Failed', errMsg);
          // Order is created but unpaid — user can retry from Orders screen
          navigation.navigate('Orders');
        }
      } else {
        // COD
        dispatch(clearCart());
        Alert.alert('Success', 'Order placed successfully!');
        navigation.replace('Orders');
      }

    } catch (error) {
      console.log('Order error:', error);
      Alert.alert('Error', error?.data?.message || error.message || 'Something went wrong while placing order');
    } finally {
      setIsProcessing(false);
      setIsQrModalVisible(false);
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

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TouchableOpacity style={styles.addressBox} onPress={handleSelectAddress}>
          {selectedAddress ? (
            <View>
              <Text style={styles.addressName}>{selectedAddress.name}</Text>
              {!!selectedAddress.companyName && <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 }}>{selectedAddress.companyName}</Text>}
              <Text style={styles.addressText}>{selectedAddress.line1}</Text>
              <Text style={styles.addressText}>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</Text>
              <Text style={styles.addressPhone}>Phone: {selectedAddress.phone}</Text>
              <Text style={styles.changeAddressText}>Change Address</Text>
            </View>
          ) : (
            <Text style={styles.selectAddressText}>+ Select Delivery Address</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Items in Cart</Text>
        <View style={styles.itemsBox}>
          {cartItems.map((item, index) => {
            const itemKey = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
            const itemPrice = item.variant ? (item.variant.salePrice || item.variant.price || item.product.salePrice) : item.product.salePrice;
            
            return (
              <View key={itemKey} style={styles.cartItemRow}>
                <Image 
                  source={{ uri: item.product.images?.[0] }} 
                  style={styles.cartItemImage} 
                />
                <View style={styles.cartItemDetails}>
                  <Text style={styles.cartItemName} numberOfLines={2}>{item.product.name}</Text>
                  {item.variant && (
                    <Text style={styles.cartItemVariant}>Variant: {item.variant.name}</Text>
                  )}
                  <Text style={styles.cartItemQty}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.cartItemPrice}>₹{itemPrice * item.quantity}</Text>
              </View>
            );
          })}
        </View>


        <View style={styles.couponContainer}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponBox}>
              <View>
                <Text style={styles.appliedCouponText}>'{appliedCoupon.code}' applied!</Text>
                <Text style={styles.discountText}>You saved ₹{appliedCoupon.discount}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter Coupon Code"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={handleApplyCoupon}
                disabled={isCouponLoading || !couponInput.trim()}
              >
                {isCouponLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelSmall}>Subtotal:</Text>
            <Text style={styles.summaryValueSmall}>₹{totalAmount}</Text>
          </View>
          {appliedCoupon && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelSmall}>Discount ({appliedCoupon.code}):</Text>
              <Text style={[styles.summaryValueSmall, { color: colors.success }]}>- ₹{appliedCoupon.discount}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelSmall}>Delivery Fee:</Text>
            <Text style={styles.summaryValueSmall}>{deliveryFee > 0 ? `+ ₹${deliveryFee}` : 'Free'}</Text>
          </View>

          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, marginTop: 4 }]}>
            <Text style={styles.boldText}>To Pay:</Text>
            <Text style={styles.boldText}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Admin Checkout Message */}
        {checkoutMessage ? (
          <View style={styles.messageBanner}>
            <Text style={styles.messageText}>{checkoutMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {settings.paymentRazorpayEnabled && (
          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'razorpay' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('razorpay')}
          >
            <Text style={styles.paymentText}>Prepaid (Full Payment)</Text>
            <Text style={styles.paymentSubtext}>Instant confirmation via Razorpay</Text>
          </TouchableOpacity>
        )}

        {settings.advancePartialPayment && (
          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'partial' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('partial')}
          >
            <Text style={styles.paymentText}>COD (with Partial Payment)</Text>
            <Text style={styles.paymentSubtext}>Pay a small booking amount now, rest on delivery</Text>
          </TouchableOpacity>
        )}

        {settings.paymentCodEnabled && (
          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'cod' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('cod')}
          >
            <Text style={styles.paymentText}>Cash on Delivery (COD)</Text>
            <Text style={styles.paymentSubtext}>Pay in full when your order arrives</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, (isProcessing || totalAmount < (settings.minOrderValue || 0)) && { opacity: 0.7 }]} 
          onPress={handlePlaceOrder} 
          disabled={isProcessing || totalAmount < (settings.minOrderValue || 0)}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.placeOrderText}>
              Place Order
            </Text>
          )}
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
  itemsBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: colors.gray200,
  },
  cartItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimaryLight,
  },
  cartItemVariant: {
    fontSize: 12,
    color: colors.textSecondaryLight,
    marginTop: 2,
  },
  cartItemQty: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  addressBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
    marginTop: 4,
  },
  changeAddressText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'right',
  },
  selectAddressText: {
    color: colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabelSmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValueSmall: {
    fontSize: 14,
    color: colors.textPrimary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.textPrimaryLight,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondaryLight,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  qrImageLarge: {
    width: 250,
    height: 250,
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalCancelBtn: {
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.gray600,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
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
  },
  couponContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  appliedCouponBox: {
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedCouponText: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  discountText: {
    color: colors.gray600,
    fontSize: 12,
    marginTop: 4,
  },
  removeCouponText: {
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 14,
  }
});
