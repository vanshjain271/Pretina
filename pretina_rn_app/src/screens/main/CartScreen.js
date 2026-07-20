import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems, selectCartTotalPrice, updateQuantity as updateCartQuantity } from '../../store/cartSlice';
import { colors } from '../../theme/colors';

export default function CartScreen({ navigation }) {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totalAmount = useSelector(selectCartTotalPrice);

  const minOrderValue = 5000;
  
  const canCheckout = totalAmount >= minOrderValue;

const CartItemRow = ({ item }) => {
  const [inputValue, setInputValue] = React.useState(String(item.quantity));
  
  // Sync if redux state changes externally
  React.useEffect(() => {
    setInputValue(String(item.quantity));
  }, [item.quantity]);

  const handleUpdateQuantity = () => {
    const newQty = parseInt(inputValue, 10);
    if (isNaN(newQty) || newQty <= 0) {
      // Revert to min order qty or previous valid quantity
      const minQty = item.product.minOrderQty || 1;
      setInputValue(String(minQty));
      dispatch(updateCartQuantity({ productId: item.product._id, variantId: item.variant?._id, quantity: minQty }));
    } else {
      dispatch(updateCartQuantity({ productId: item.product._id, variantId: item.variant?._id, quantity: newQty }));
    }
  };

  const key = item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id;
  const imageUrl = item.product?.images?.[0] || item.product?.image || null;
  const name = item.product?.name || 'Unknown Product';
  const price = item.variant ? (item.variant.salePrice || item.variant.price || item.product.salePrice) : item.product.salePrice;

  return (
    <View key={key} style={styles.cartItem}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImage} />
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{name}</Text>
        {item.variant ? <Text style={{ fontSize: 12, color: colors.textSecondaryLight }}>Variant: {item.variant.name}</Text> : null}
        <Text style={styles.itemPrice}>₹{price}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <Text style={styles.qtyLabel}>Qty:</Text>
        <TextInput
          style={styles.quantityInput}
          keyboardType="number-pad"
          value={inputValue}
          onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
          onBlur={handleUpdateQuantity}
          onSubmitEditing={handleUpdateQuantity}
          maxLength={4} // Max 9999 items
        />
      </View>
    </View>
  );
};

return (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Your Cart</Text>
      <View style={{ width: 50 }} />
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent}>
      {!canCheckout && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>Minimum order value is ₹{minOrderValue}. Add more items!</Text>
        </View>
      )}

      {cartItems.map((item) => (
        <CartItemRow key={item.variant ? `${item.product._id}_${item.variant._id}` : item.product._id} item={item} />
      ))}

    </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, !canCheckout && styles.checkoutButtonDisabled]}
          disabled={!canCheckout}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
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
  warningBanner: {
    backgroundColor: '#FFF4E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  warningText: {
    color: colors.warning,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    backgroundColor: colors.gray200,
    borderRadius: 4,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimaryLight,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyLabel: {
    marginRight: 8,
    color: colors.gray600,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 4,
    width: 60,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: colors.gray50,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.gray600,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  checkoutText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  }
});
