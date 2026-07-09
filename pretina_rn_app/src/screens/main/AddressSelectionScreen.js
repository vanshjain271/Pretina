import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/v1' : 'http://localhost:5001/api/v1';

export default function AddressSelectionScreen({ navigation, route }) {
  // We expect a JWT token to be passed, or we assume cookie-based auth. Pretina backend uses JWT cookies or headers.
  // We'll just fetch `/users/me` assuming cookies/headers are sent, or mock it if needed.
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      // In a real app we pass the auth token.
      const res = await fetch(`${BASE_URL}/users/me`);
      const data = await res.json();
      if (data.success && data.data) {
        setAddresses(data.data.addresses || []);
      }
    } catch (e) {
      console.log('Error fetching addresses', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return Alert.alert('Error', 'Please fill in all required fields.');
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/users/me/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, line1, city, state, pincode, isDefault: true })
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
        setShowAddForm(false);
        // Clear form
        setName(''); setPhone(''); setLine1(''); setCity(''); setState(''); setPincode('');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address) => {
    if (route.params?.onSelect) {
      route.params.onSelect(address);
    }
    navigation.goBack();
  };

  if (showAddForm) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Address</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView contentContainerStyle={styles.formContent}>
            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Address Line 1" value={line1} onChangeText={setLine1} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="City" value={city} onChangeText={setCity} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="State" value={state} onChangeText={setState} />
            </View>
            <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress} disabled={loading}>
              <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Address'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Address</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.addressCard} onPress={() => handleSelectAddress(item)}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressName}>{item.name}</Text>
                {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
              </View>
              <Text style={styles.addressText}>{item.line1}</Text>
              <Text style={styles.addressText}>{item.city}, {item.state} - {item.pincode}</Text>
              <Text style={styles.addressPhone}>Phone: {item.phone}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimaryLight,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray500,
    marginTop: 40,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  addButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  formContent: {
    padding: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
