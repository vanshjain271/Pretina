import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { addToCart, updateQuantity, selectItemQuantity, setCartVisible } from '../store/cartSlice';
import { colors } from '../theme/colors';

export default function AddToCartButton({ product, variant, fullWidth = false }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const quantity = useSelector((state) => selectItemQuantity(state, product._id, variant?._id));
  const minQty = product.minOrderQty || 1;
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = () => {
    if (product.variants && product.variants.length > 0 && !variant) {
      navigation.navigate('ProductDetail', { productId: product._id });
      return;
    }
    dispatch(addToCart({ product, variant }));
  };

  const handleIncrement = () => {
    dispatch(updateQuantity({ productId: product._id, variantId: variant?._id, quantity: quantity + minQty }));
  };

  const handleDecrement = () => {
    if (quantity - minQty <= 0) {
      dispatch(updateQuantity({ productId: product._id, variantId: variant?._id, quantity: 0 })); // Will remove item
    } else {
      dispatch(updateQuantity({ productId: product._id, variantId: variant?._id, quantity: quantity - minQty }));
    }
  };

  const handleInputSubmit = () => {
    let newQty = parseInt(inputValue, 10);
    setIsEditing(false);
    
    if (isNaN(newQty) || newQty <= 0) {
      dispatch(updateQuantity({ productId: product._id, variantId: variant?._id, quantity: 0 }));
    } else {
      dispatch(updateQuantity({ productId: product._id, variantId: variant?._id, quantity: newQty }));
    }
  };

  if (quantity === 0) {
    return (
      <TouchableOpacity 
        style={[styles.addButton, fullWidth && styles.addButtonFull]} 
        onPress={handleAdd} 
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={fullWidth ? 18 : 20} color={colors.white} />
        {fullWidth && <Text style={styles.addTextFull}>ADD</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.controlContainer, fullWidth && styles.controlContainerFull]}>
      <TouchableOpacity style={[styles.controlBtn, fullWidth && styles.controlBtnFullLeft]} onPress={handleDecrement}>
        <Ionicons name="remove" size={16} color={colors.white} />
      </TouchableOpacity>
      
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            autoFocus
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={handleInputSubmit}
            onSubmitEditing={handleInputSubmit}
          />
        ) : (
          <TouchableOpacity onPress={() => { setInputValue(quantity.toString()); setIsEditing(true); }}>
            <Text style={styles.qtyText}>{quantity}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={[styles.controlBtn, fullWidth && styles.controlBtnFullRight]} onPress={handleIncrement}>
        <Ionicons name="add" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonFull: {
    width: '100%',
    height: 36,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  addTextFull: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    height: 28,
    minWidth: 90,
  },
  controlBtn: {
    backgroundColor: colors.primary,
    width: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  controlContainerFull: {
    width: '100%',
    height: 36,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  controlBtnFullLeft: {
    backgroundColor: colors.primary,
    width: 36,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  controlBtnFullRight: {
    backgroundColor: colors.primary,
    width: 36,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  qtyText: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    minWidth: 24,
    textAlign: 'center',
  },
  input: {
    paddingHorizontal: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    minWidth: 32,
    textAlign: 'center',
    padding: 0,
    margin: 0,
  }
});
