import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Easing, Linking, TextInput, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import {
  useGetBannersQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetHomepageProductsQuery,
  useGetSettingsQuery
} from '../../store/apiSlice';
import AddToCartButton from '../../components/AddToCartButton';

const { width } = Dimensions.get('window');

const MarqueeText = ({ children }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [width, -width * 4] // Extended scroll distance to ensure no cut off
  });

  return (
    <View style={{ overflow: 'hidden', flex: 1 }}>
      <Animated.Text style={[styles.minOrderText, { transform: [{ translateX }], width: 9999 }]}>
        {children}
      </Animated.Text>
    </View>
  );
};

const AutoCarousel = ({ banners, navigation }) => {
  const scrollRef = React.useRef(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!banners || banners.length <= 1) return;
    
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= banners.length) nextIndex = 0;
      
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currentIndex, banners]);

  if (!banners || banners.length === 0) return null;

  const handleBannerPress = (banner) => {
    if (!navigation) return;
    if (banner.linkType && banner.linkType.toLowerCase() === 'product' && banner.linkTarget) {
      navigation.navigate('ProductDetail', { productId: banner.linkTarget });
    } else if (banner.linkType && banner.linkType.toLowerCase() === 'category' && banner.linkTarget) {
      navigation.navigate('CategoryProducts', { categoryId: banner.linkTarget, categoryName: 'Category' });
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <ScrollView 
        ref={scrollRef}
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity 
            key={banner._id || index} 
            style={{ width, height: 180, backgroundColor: '#fff' }}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner)}
          >
            <Image source={{ uri: banner.image }} style={styles.bannerImage} contentFit="fill" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const ProductImage = ({ uri }) => {
  const [error, setError] = React.useState(false);
  return (
    <Image 
      source={error || !uri ? require('../../../assets/logo.png') : { uri }}
      style={styles.productImage}
      contentFit="contain"
      onError={() => setError(true)}
    />
  );
};

const HorizontalProductList = ({ title, products, navigation, onAddToCart }) => {
  if (!products || products.length === 0) return null;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderRow}>
         <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {products.map(product => (
          <TouchableOpacity 
            key={product._id} 
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
          >
            <ProductImage uri={product.images?.[0]} />
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{product.salePrice}</Text>
                <AddToCartButton product={product} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const LiveSearchResults = ({ query, navigation }) => {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.data) {
          setResults(data.data.products || data.data || []);
        }
      } catch (err) {
        console.error('Live search error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch slightly
    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: colors.error }}>Failed to load results</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: colors.gray600 }}>No products found for "{query}"</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f9' }} contentContainerStyle={{ padding: 16 }}>
      {results.map(product => (
        <TouchableOpacity 
          key={product._id} 
          style={styles.liveSearchItem}
          onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
        >
          <View style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff', marginRight: 12 }}>
            <ProductImage uri={product.images?.[0]} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimaryLight }} numberOfLines={2}>{product.name}</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary, marginTop: 4 }}>₹{product.salePrice}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const CartIconHeader = () => {
  const { useSelector, useDispatch } = require('react-redux');
  const { selectCartTotalItems, toggleCart } = require('../../store/cartSlice');
  const dispatch = useDispatch();
  const totalItems = useSelector(selectCartTotalItems);
  
  return (
    <TouchableOpacity style={styles.iconButton} onPress={() => dispatch(toggleCart())}>
      <Ionicons name="cart-outline" size={26} color={colors.textPrimaryLight} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bannersRes, isLoading: loadingBanners, refetch: refetchBanners } = useGetBannersQuery('');
  const { data: categoriesRes, isLoading: loadingCategories, refetch: refetchCategories } = useGetCategoriesQuery();
  const { data: brandsRes, isLoading: loadingBrands, refetch: refetchBrands } = useGetBrandsQuery();
  const { data: productsRes, isLoading: loadingProducts, refetch: refetchProducts } = useGetHomepageProductsQuery();
  const { data: settingsRes, refetch: refetchSettings } = useGetSettingsQuery();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBanners(),
        refetchCategories(),
        refetchBrands(),
        refetchProducts(),
        refetchSettings()
      ]);
    } catch (err) {
      console.warn('Refetch error:', err);
    }
    setRefreshing(false);
  }, [refetchBanners, refetchCategories, refetchBrands, refetchProducts, refetchSettings]);

  const handleAddToCart = (product) => {
    setToastMessage(`Added ${product.name} to cart!`);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const allBanners = bannersRes?.data || [];
  
  const topBanners = allBanners.filter(b => b.placement === 'HOME_TOP');
  const middleBanners = allBanners.filter(b => b.placement === 'HOME_MIDDLE');
  const bottomBanners = allBanners.filter(b => b.placement === 'HOME_BOTTOM');
  
  const fallbackTop = allBanners.slice(0, Math.ceil(allBanners.length / 3));
  const fallbackMiddle = allBanners.slice(Math.ceil(allBanners.length / 3), Math.ceil(allBanners.length / 3) * 2);
  const fallbackBottom = allBanners.slice(Math.ceil(allBanners.length / 3) * 2);

  const displayTopBanners = topBanners.length > 0 ? topBanners : fallbackTop;
  const displayMiddleBanners = middleBanners.length > 0 ? middleBanners : fallbackMiddle;
  const displayBottomBanners = bottomBanners.length > 0 ? bottomBanners : fallbackBottom;

  const categories = categoriesRes?.data || [];
  const brands = brandsRes?.data || [];
  
  const featured = productsRes?.data?.featured || [];
  const trending = productsRes?.data?.trending || [];
  const newArrivals = productsRes?.data?.newArrivals || [];
  const recommended = productsRes?.data?.recommended || [];
  
  const settings = settingsRes?.data;

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.headerLeft}>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} contentFit="contain" />
        <Text style={styles.headerTitle}>PRETINA</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => Linking.openURL(`tel:+918169902291`)}
        >
          <Ionicons name="call-outline" size={24} color={colors.textPrimaryLight} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => Linking.openURL('whatsapp://send?phone=+918169902291&text=Hi%20need%20help%20something')}
        >
          <Ionicons name="logo-whatsapp" size={24} color={'#2CD986'} />
        </TouchableOpacity>
        <CartIconHeader />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {/* Rich Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.gray400} style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for items or products..."
            style={styles.searchInput}
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim().length > 0) {
                navigation.navigate('SearchProducts', { searchQuery: searchQuery.trim() });
                setSearchQuery('');
              }
            }}
          />
        </View>
      </View>

      {searchQuery.trim().length > 0 ? (
        <LiveSearchResults query={searchQuery.trim()} navigation={navigation} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
        
        {/* Minimum Order Value Banner */}
        {settings?.tickerEnabled && settings?.tickerText ? (
          <View style={styles.minOrderBanner}>
            <Ionicons name="megaphone" size={20} color="#fff" style={styles.minOrderIcon} />
            <MarqueeText>{settings.tickerText}</MarqueeText>
          </View>
        ) : null}

        {/* Banner Carousel 1 */}
        {loadingBanners ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <AutoCarousel banners={displayTopBanners} navigation={navigation} />
        )}

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop By Categories</Text>
          {loadingCategories ? <ActivityIndicator color={colors.primary} /> : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {categories.map(cat => (
                <TouchableOpacity key={cat._id} style={styles.categoryWrapHorizontal} onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat._id, categoryName: cat.name })}>
                  <View style={styles.categoryItem}>
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.categoryImage} contentFit="contain" />
                    ) : (
                      <Ionicons name="image-outline" size={30} color={colors.gray400} />
                    )}
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
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
                <TouchableOpacity key={brand._id} style={styles.brandWrapHorizontal} onPress={() => navigation.navigate('BrandProducts', { brandId: brand._id, brandName: brand.name })}>
                  <View style={styles.brandLogoContainer}>
                    {brand.logo ? (
                       <Image source={{ uri: brand.logo }} style={styles.brandLogo} contentFit="contain" />
                    ) : (
                       <Text style={styles.brandNameTextFallback}>{brand.name.substring(0, 2).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text style={styles.brandNameText} numberOfLines={1}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Featured Products */}
        {loadingProducts ? <ActivityIndicator color={colors.primary} /> : (
          <HorizontalProductList title="Featured Products" products={featured} navigation={navigation} onAddToCart={handleAddToCart} />
        )}

        {/* Trending Now */}
        {loadingProducts ? <ActivityIndicator color={colors.primary} /> : (
          <HorizontalProductList title="Trending Now" products={trending} navigation={navigation} onAddToCart={handleAddToCart} />
        )}

        {/* Banner Carousel 2 */}
        {!loadingBanners && <AutoCarousel banners={displayMiddleBanners} navigation={navigation} />}

        {/* New Arrival */}
        {loadingProducts ? <ActivityIndicator color={colors.primary} /> : (
          <HorizontalProductList title="New Arrivals" products={newArrivals} navigation={navigation} onAddToCart={handleAddToCart} />
        )}

        {/* Recommended */}
        {loadingProducts ? <ActivityIndicator color={colors.primary} /> : (
          <HorizontalProductList title="Recommended for You" products={recommended} navigation={navigation} onAddToCart={handleAddToCart} />
        )}

        {/* Banner Carousel 3 */}
        {!loadingBanners && <AutoCarousel banners={displayBottomBanners} navigation={navigation} />}

        {/* Premium Footer */}
        <View style={styles.footerContainer}>
          <Image source={require('../../../assets/logo.png')} style={styles.footerLogo} contentFit="contain" />
          <Text style={styles.footerTitle}>PRETINA</Text>
          <Text style={styles.footerDescription}>
            Elevate your style with Pretina's premium collection. Quality meets elegance.
          </Text>
          
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
              <TouchableOpacity onPress={() => Linking.openURL('tel:+918169902291')}>
                <Text style={styles.footerTextLink}>+91 8169902291</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <TouchableOpacity onPress={() => Linking.openURL('mailto:parinenterprise456@gmail.com')}>
                <Text style={styles.footerTextLink}>parinenterprise456@gmail.com</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footerSocials}>
              <TouchableOpacity 
                style={styles.socialBtn}
                onPress={() => Linking.openURL('https://www.instagram.com/pretina.in?igsh=bHVnbzRieHd4NXNh&utm_source=qr')}
              >
                <Ionicons name="logo-instagram" size={22} color={'#E1306C'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialBtn}
                onPress={() => Linking.openURL('whatsapp://send?phone=+918169902291&text=Hi')}
              >
                <Ionicons name="logo-whatsapp" size={22} color={'#2CD986'} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.footerCopyright}>© {new Date().getFullYear()} Pretina. All rights reserved.</Text>
        </View>

      </ScrollView>
      )}

      {/* Custom Toast */}
      {showToast && (
        <Animated.View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText} numberOfLines={1}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
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
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 65,
    height: 55,
    marginRight: 8,
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
  iconButton: {
    position: 'relative',
    padding: 6,
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B00',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimaryLight,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  minOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7B3B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FF7B3B',
  },
  minOrderIcon: {
    marginRight: 12,
  },
  minOrderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  bannerContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#FFF',
    marginBottom: 5,
  },
  bannerImage: {
    width: width,
    height: 180,
  },
  sectionContainer: {
    marginTop: 5,
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
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  categoryWrapHorizontal: {
    alignItems: 'center',
    width: 80,
    marginRight: 16,
  },
  categoryWrap: {
    alignItems: 'center',
    width: '23%', // Fit 4 in a row perfectly
    marginBottom: 16,
  },
  categoryItem: {
    width: 65,
    height: 65,
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
    width: 45,
    height: 45,
    borderRadius: 12,
  },
  categoryName: {
    fontSize: 11,
    color: colors.textPrimaryLight,
    fontWeight: '500',
    textAlign: 'center',
  },
  hScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brandWrapHorizontal: {
    alignItems: 'center',
    width: 100,
    marginRight: 16,
  },
  brandLogoContainer: {
    width: 90,
    height: 55,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  brandLogo: {
    width: 70,
    height: 40,
  },
  brandNameText: {
    fontSize: 11,
    color: colors.textPrimaryLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  brandNameTextFallback: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  productCard: {
    width: 150,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
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
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    backgroundColor: '#FF9800', // YouthQit yellow/orange style
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
  },
  toastText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footerContainer: {
    backgroundColor: '#fff',
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerLogo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimaryLight,
    marginBottom: 8,
    letterSpacing: 1,
  },
  footerDescription: {
    fontSize: 13,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  footerContactInfo: {
    width: '100%',
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    color: colors.gray600,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  footerTextLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 12,
  },
  footerSocials: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  footerCopyright: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 12,
  },
  liveSearchItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});
