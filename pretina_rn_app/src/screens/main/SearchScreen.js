import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config';
import AddToCartButton from '../../components/AddToCartButton';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const ProductImage = ({ uri }) => {
  const [error, setError] = useState(false);
  return (
    <Image 
      source={error || !uri ? require('../../../assets/logo.png') : { uri }} 
      style={styles.productImage} 
      contentFit="contain" 
      onError={() => setError(true)}
    />
  );
};

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = (query = '') => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products?search=${query}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.data) {
           setProducts(data.data.products || data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => {
    fetchProducts(searchQuery);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray400} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search products..."
            style={styles.searchInput}
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No products found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultText}>
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Products'}
          </Text>
          <View style={styles.grid}>
            {products.map(product => (
              <TouchableOpacity 
                key={product._id} 
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
              >
                <ProductImage uri={product.images?.[0]} />
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.priceText}>₹{product.salePrice}</Text>
                  <View style={styles.moqPill}>
                    <Ionicons name="cube-outline" size={10} color="#888" />
                    <Text style={styles.moqText}>Minimum Order Quantity is {product.minOrderQty || 1} pcs</Text>
                  </View>
                  <View style={{ marginTop: 8 }}>
                    <AddToCartButton product={product} fullWidth={true} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: { 
    paddingHorizontal: 16, 
    paddingBottom: 12, 
    backgroundColor: '#fff',
    borderBottomWidth: 1, 
    borderBottomColor: colors.gray200, 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimaryLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: colors.textSecondaryLight },
  resultText: { fontSize: 16, fontWeight: '700', color: colors.textPrimaryLight, marginBottom: 12 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { width: cardWidth, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, overflow: 'hidden' },
  productImage: { width: '100%', height: 140, backgroundColor: '#FFF' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '600', color: colors.textPrimaryLight, marginBottom: 6, height: 34 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  moqText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
    fontWeight: '500',
  },
  priceText: { fontSize: 15, fontWeight: 'bold', color: colors.primary },
  addButton: { backgroundColor: '#FF9800', width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
});
