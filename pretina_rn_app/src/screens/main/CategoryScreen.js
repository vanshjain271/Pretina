import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useGetCategoriesQuery } from '../../store/apiSlice';

const { width } = Dimensions.get('window');

// 4 columns, some padding
const numColumns = 4;
const itemWidth = (width - 32 - (16 * (numColumns - 1))) / numColumns;

const CategoryImage = ({ uri }) => {
  const [error, setError] = React.useState(false);
  if (!uri || error) {
    return <Ionicons name="image-outline" size={30} color={colors.gray400} />;
  }
  return (
    <Image 
      source={{ uri }}
      style={styles.categoryImage}
      contentFit="contain"
      onError={() => setError(true)}
    />
  );
};

export default function CategoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { data: categoriesRes, isLoading } = useGetCategoriesQuery();
  const categories = categoriesRes?.data || [];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.headerTitle}>All Categories</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.categoryWrap, { width: itemWidth }]}
      onPress={() => navigation.navigate('CategoryProducts', { categoryId: item._id, categoryName: item.name })}
    >
      <View style={[styles.categoryItem, { width: itemWidth, height: itemWidth }]}>
        <CategoryImage uri={item.image} />
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF1E6',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimaryLight,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  categoryWrap: {
    alignItems: 'center',
  },
  categoryItem: {
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
    overflow: 'hidden',
  },
  categoryImage: {
    width: '80%',
    height: '80%',
    borderRadius: 12,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textPrimaryLight,
    fontWeight: '600',
    textAlign: 'center',
  },
});
