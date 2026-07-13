import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { colors } from '../../theme/colors';
import { useGetSettingsQuery } from '../../store/apiSlice';

export default function PolicyScreen({ navigation, route }) {
  const { title, type } = route.params; // type = 'shippingPolicy', 'privacyPolicy', etc.
  const { data, isLoading } = useGetSettingsQuery();
  const { width } = useWindowDimensions();

  const settings = data?.data || {};
  const htmlContent = settings[type] || '<p>No content available.</p>';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : (
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: htmlContent }}
            tagsStyles={{
              p: { color: colors.textPrimaryLight, fontSize: 16, lineHeight: 24 },
              h1: { color: colors.textPrimaryLight },
              h2: { color: colors.textPrimaryLight },
              li: { color: colors.textPrimaryLight, fontSize: 16 }
            }}
          />
        )}
      </ScrollView>
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
  content: { padding: 16 }
});
