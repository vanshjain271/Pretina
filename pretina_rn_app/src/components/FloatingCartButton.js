import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartTotalItems, setCartVisible } from '../store/cartSlice';
import { colors } from '../theme/colors';

export default function FloatingCartButton() {
  const dispatch = useDispatch();
  const totalItems = useSelector(selectCartTotalItems);

  if (totalItems === 0) return null;

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      activeOpacity={0.8}
      onPress={() => dispatch(setCartVisible(true))}
    >
      <View style={styles.fab}>
        <Ionicons name="bag-handle-outline" size={24} color={colors.white} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 999,
  },
  fab: {
    backgroundColor: '#FF6B00',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
