import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Dimensions, Linking, TextInput, Share 
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors } from '../../theme/colors';
import { useGetProductByIdQuery } from '../../store/apiSlice';
import { selectCartTotalItems, selectCartTotalPrice, toggleCart } from '../../store/cartSlice';
import AddToCartButton from '../../components/AddToCartButton';
import RenderHtml from 'react-native-render-html';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { data: productRes, isLoading, error } = useGetProductByIdQuery(productId);
  
  const totalItems = useSelector(selectCartTotalItems);
  const totalPrice = useSelector(selectCartTotalPrice);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !productRes?.data) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Error loading product details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const product = productRes.data;
  const hasVariants = product.variants && product.variants.length > 0;

  const handleOpenYoutube = () => {
    if (product.youtubeUrl) {
      Linking.openURL(product.youtubeUrl).catch(err => console.error("Couldn't load page", err));
    }
  };

  const handleWhatsApp = () => {
    const text = `Hi, I am interested in your product: ${product.name} (ID: ${product.sku || product._id})`;
    Linking.openURL(`whatsapp://send?phone=+918169902291&text=${encodeURIComponent(text)}`);
  };

  const handleShare = async () => {
    try {
      const url = `https://pretina.in/product/${product._id}`;
      await Share.share({
        message: `Check out this amazing product: ${product.name}\n${url}`,
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.cartButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={colors.textPrimaryLight} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cartButton, { marginLeft: 8 }]} onPress={() => dispatch(toggleCart())}>
            <Ionicons name="cart-outline" size={24} color={colors.textPrimaryLight} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Images */}
        <View style={styles.imageContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {product.images && product.images.length > 0 ? (
              product.images.map((img, index) => (
                <Image key={index} source={{ uri: img }} style={styles.productImage} contentFit="contain" />
              ))
            ) : (
              <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                <Ionicons name="image-outline" size={50} color={colors.gray400} />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>
          {!hasVariants && (
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>₹{product.salePrice}</Text>
              {product.price > product.salePrice && (
                <Text style={styles.mrpPrice}>₹{product.price}</Text>
              )}
              <Text style={styles.unitText}>/ {product.measuringUnit || 'Pcs'}</Text>
            </View>
          )}
          
          {product.brand && (
            <View style={styles.badgeWrapper}>
              <Text style={styles.badgeTextWrapper}>{product.brand.name || 'Brand'}</Text>
            </View>
          )}
        </View>

        {/* Variants Section */}
        {hasVariants && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Variants</Text>
            {product.variants.map((variant) => {
              const vId = variant._id;
              return (
                <View key={vId} style={styles.variantRow}>
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{variant.name}</Text>
                    <Text style={styles.variantPrice}>₹{variant.salePrice || variant.price || product.salePrice}</Text>
                  </View>
                  <View style={styles.variantActions}>
                    <AddToCartButton product={product} variant={variant} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Single Product Quantity (if no variants) */}
        {!hasVariants && (
           <View style={styles.section}>
             <View style={styles.singleQtyContainer}>
                <Text style={styles.singleQtyLabel}>Quantity:</Text>
                <AddToCartButton product={product} />
             </View>
           </View>
        )}

        {/* Bulk Pricing */}
        {!hasVariants && product.bulkPricing && product.bulkPricing.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bulk Pricing Deals</Text>
            <View style={styles.bulkTable}>
              <View style={styles.bulkHeaderRow}>
                <Text style={styles.bulkHeaderText}>Quantity</Text>
                <Text style={styles.bulkHeaderText}>Price / Unit</Text>
              </View>
              {product.bulkPricing.map((tier, index) => (
                <View key={index} style={styles.bulkRow}>
                  <Text style={styles.bulkText}>{tier.minQty}+ {product.measuringUnit || 'Pcs'}</Text>
                  <Text style={[styles.bulkText, { color: colors.primary, fontWeight: '700' }]}>₹{tier.salePrice}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* YouTube Link */}
        {product.youtubeUrl && product.youtubeUrl.trim() !== '' && (
          <TouchableOpacity style={styles.youtubeButton} onPress={handleOpenYoutube}>
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            <Text style={styles.youtubeText}>Watch Product Video</Text>
          </TouchableOpacity>
        )}

        {/* Details & Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          {product.description ? (
            <RenderHtml
              contentWidth={width - 32}
              source={{ html: product.description }}
              baseStyle={styles.description}
            />
          ) : (
            <Text style={styles.description}>No additional details available.</Text>
          )}
        </View>
        
        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* Sticky Bottom Bar (YouthQit Style) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity style={styles.whatsappInquiryButton} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#2CD986" style={{ marginRight: 4 }} />
            <Text style={styles.whatsappInquiryText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addToCartButton, totalItems === 0 && { opacity: 0.6 }]}
            onPress={() => dispatch(toggleCart())}
          >
            <View style={styles.addToCartContent}>
              <Text style={styles.totalItemsText}>{totalItems} Items | ₹{totalPrice}</Text>
              <Text style={styles.addToCartText}>View Cart</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: 12,
  },
  cartButton: {
    padding: 4,
    position: 'relative',
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
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: width,
    height: 300,
    backgroundColor: '#fafafa',
  },
  productImage: {
    width: width,
    height: 300,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f4f4f4',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  mrpPrice: {
    fontSize: 16,
    color: colors.textSecondaryLight,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  unitText: {
    fontSize: 16,
    color: colors.textSecondaryLight,
    marginLeft: 8,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTextWrapper: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f4f4f4',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    marginBottom: 16,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  variantInfo: {
    flex: 1,
    marginRight: 12,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimaryLight,
    marginBottom: 4,
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  variantActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qtyBtn: {
    padding: 8,
    paddingHorizontal: 12,
  },
  variantQtyInput: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimaryLight,
    padding: 0,
  },
  singleQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  singleQtyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimaryLight,
  },
  bulkTable: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bulkHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  bulkHeaderText: {
    flex: 1,
    fontWeight: '700',
    color: colors.textPrimaryLight,
  },
  bulkRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  bulkText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimaryLight,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  youtubeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#D20000',
  },
  description: {
    fontSize: 15,
    color: colors.textSecondaryLight,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  whatsappInquiryButton: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2CD986',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
  },
  whatsappInquiryText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  addToCartButton: {
    flex: 1.2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartContent: {
    alignItems: 'center',
  },
  totalItemsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
  },
  toastText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
