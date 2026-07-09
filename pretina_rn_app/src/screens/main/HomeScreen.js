import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';

export default function HomeScreen({ navigation }) {
  // Temporary placeholders for structure
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.headerTitle}>Pretina</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton}>
          <Text>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Cart')}>
          <Text>🛒</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Marquee / Ticker */}
        <View style={styles.tickerContainer}>
          <Text style={styles.tickerText}>📣 Welcome to Pretina! Buy more, save more.</Text>
        </View>

        {/* Banners Placeholder */}
        <View style={styles.bannerContainer}>
          <Text style={styles.placeholderText}>Banners Carousel</Text>
        </View>

        {/* Categories Placeholder */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <View style={styles.categoryItem}><Text>Cat 1</Text></View>
             <View style={styles.categoryItem}><Text>Cat 2</Text></View>
             <View style={styles.categoryItem}><Text>Cat 3</Text></View>
          </ScrollView>
        </View>

        {/* Brands Placeholder */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Brand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <View style={styles.brandItem}><Text>Brand 1</Text></View>
             <View style={styles.brandItem}><Text>Brand 2</Text></View>
          </ScrollView>
        </View>

        {/* Products Placeholder */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>All Products</Text>
          <View style={styles.productGrid}>
             <View style={styles.productCard}><Text>Prod 1</Text></View>
             <View style={styles.productCard}><Text>Prod 2</Text></View>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: colors.textPrimaryLight,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tickerContainer: {
    backgroundColor: colors.surfaceLight,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tickerText: {
    color: colors.primary,
    fontWeight: '500',
  },
  bannerContainer: {
    height: 180,
    backgroundColor: colors.gray200,
    margin: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 12,
  },
  categoryItem: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray100,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandItem: {
    width: 120,
    height: 60,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    height: 200,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.gray500,
  }
});
