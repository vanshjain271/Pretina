import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function BrandProductsScreen({ route, navigation }) {
  const { brandId, brandName } = route.params;
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products?brand=${brandId}`)
      .then(res => res.json())
      .then(data => {
        if(data && data.data) {
           setProducts(data.data.products || data.data || []);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [brandId]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{brandName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No products found for this brand.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    flex: 1,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondaryLight,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: cardWidth,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#FFF',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimaryLight,
    marginBottom: 6,
    height: 34,
  },
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
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: '#FF9800',
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
