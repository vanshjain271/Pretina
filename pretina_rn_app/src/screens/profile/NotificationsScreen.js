import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetNotificationsQuery } from '../../store/apiSlice';

export default function NotificationsScreen({ navigation }) {
  const { data, isLoading } = useGetNotificationsQuery();
  const notifications = data?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notifications yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.read && styles.unread]}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimaryLight },
  backButton: { fontSize: 16, color: colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: 'hidden',
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  image: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondaryLight,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: colors.gray400,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.gray500,
  }
});
