import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetHomepageProductsQuery
} from '../../store/apiSlice';


const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { data: bannersRes, isLoading: loadingBanners } = useGetBannersQuery('home');
  const { data: categoriesRes, isLoading: loadingCategories } = useGetCategoriesQuery();
  const { data: brandsRes, isLoading: loadingBrands } = useGetBrandsQuery();
  const { data: productsRes, isLoading: loadingProducts } = useGetHomepageProductsQuery();

  const banners = bannersRes?.data || [];
  const categories = categoriesRes?.data || [];
  const brands = brandsRes?.data || [];
  // For products, we use the first section (e.g., featured or newArrivals)
  const products = productsRes?.data?.newArrivals || productsRes?.data?.featured || [];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.headerTitle}>Pretina</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={26} color={colors.textPrimaryLight} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>8</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Banners Carousel */}
        <View style={styles.bannerContainer}>
          {loadingBanners ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : banners.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {banners.map((banner) => (
                <Image key={banner._id} source={{ uri: banner.image }} style={styles.bannerImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
             <View style={styles.bannerPlaceholder}>
                <Text style={styles.placeholderText}>No Banners Available</Text>
             </View>
          )}
        </View>

        {/* Minimum Order Value Banner */}
        <View style={styles.minOrderBanner}>
          <Ionicons name="megaphone-outline" size={20} color={colors.white} style={styles.minOrderIcon} />
          <View style={styles.minOrderDot} />
          <Text style={styles.minOrderText}>Minimum Order Value 2500₹</Text>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          {loadingCategories ? <ActivityIndicator color={colors.primary} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {categories.map(cat => (
                <TouchableOpacity key={cat._id} style={styles.categoryWrap}>
                  <View style={styles.categoryItem}>
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="contain" />
                    ) : (
                      <Ionicons name="image-outline" size={30} color={colors.gray400} />
                    )}
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Brands */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Brand</Text>
          {loadingBrands ? <ActivityIndicator color={colors.primary} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {brands.map(brand => (
                <TouchableOpacity key={brand._id} style={styles.brandItem}>
                  {brand.logo ? (
                     <Image source={{ uri: brand.logo }} style={styles.brandLogo} resizeMode="contain" />
                  ) : (
                     <Text style={styles.brandNameText}>{brand.name}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* All Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
             <Text style={styles.sectionTitle}>All Products</Text>
             <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          
          {loadingProducts ? <ActivityIndicator color={colors.primary} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {products.map(product => (
                <TouchableOpacity key={product._id} style={styles.productCard}>
                  <Image 
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }} 
                    style={styles.productImage} 
                    resizeMode="cover" 
                  />
                  <TouchableOpacity style={styles.heartButton}>
                    <Ionicons name="heart-outline" size={20} color={colors.gray500} />
                  </TouchableOpacity>
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFA000" />
                      <Text style={styles.ratingText}>4.9 (220)</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>₹{product.salePrice}</Text>
                      <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add" size={20} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF1E6', // Soft orange background for header based on screenshot
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#FFE0C2',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    marginRight: 12,
  },
  logoText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
    transform: [{ rotate: '-45deg' }],
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimaryLight,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: '#2CD986', // Green chat icon background
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#F44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bannerContainer: {
    height: 180,
    width: '100%',
    backgroundColor: colors.gray100,
    marginTop: 10,
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: width,
    height: 180,
  },
  minOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7B3B', // Brighter orange
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  minOrderIcon: {
    marginRight: 12,
  },
  minOrderDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFF',
    borderRadius: 2,
    marginRight: 12,
  },
  minOrderText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  sectionContainer: {
    marginTop: 28,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimaryLight,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  hScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryWrap: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryItem: {
    width: 70,
    height: 70,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textPrimaryLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  brandItem: {
    height: 40,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  brandLogo: {
    width: 80,
    height: 40,
  },
  brandNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    textTransform: 'uppercase',
  },
  productCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: colors.gray100,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimaryLight,
    marginBottom: 6,
    height: 36, // Force two lines height
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: colors.textSecondaryLight,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
