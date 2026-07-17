import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProfile } from '../types';
import { saveBusinessProfile } from '../utils/storage';

interface SettingsScreenProps {
  profile: BusinessProfile;
  onProfileUpdate: (updatedProfile: BusinessProfile) => void;
}

export default function SettingsScreen({ profile, onProfileUpdate }: SettingsScreenProps) {
  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [taxRate, setTaxRate] = useState(profile.taxRate.toString());
  const [currency, setCurrency] = useState(profile.currency || '$');
  const [logo, setLogo] = useState<string | null>(profile.logo);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your gallery to upload a logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/png';
          const base64Uri = `data:${mimeType};base64,${asset.base64}`;
          setLogo(base64Uri);
        } else {
          setLogo(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Business Name is required.');
      return;
    }

    setIsSaving(true);
    const updatedProfile: BusinessProfile = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      taxRate: parseFloat(taxRate) || 0,
      currency: currency.trim() || '$',
      logo,
    };

    await saveBusinessProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
    setIsSaving(false);
    Alert.alert('Success', 'Business settings saved successfully!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Profile & Logo</Text>
          <Text style={styles.cardSubtitle}>
            These details will appear at the top of your generated quotations.
          </Text>

          {/* Logo Picker Section */}
          <View style={styles.logoSection}>
            {logo ? (
              <View style={styles.logoPreviewContainer}>
                <Image source={{ uri: logo }} style={styles.logoPreview} />
                <TouchableOpacity style={styles.removeLogoBtn} onPress={handleRemoveLogo}>
                  <Ionicons name="trash-outline" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.logoPlaceholder} onPress={handlePickLogo}>
                <Ionicons name="image-outline" size={32} color="#818CF8" />
                <Text style={styles.logoPlaceholderText}>Upload Business Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Input Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Corporation"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 123 Main St, New York, NY"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +1 (555) 123-4567"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. contact@acme.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences & Defaults</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Currency Symbol</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. $"
                placeholderTextColor="#94A3B8"
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Default Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15"
                placeholderTextColor="#94A3B8"
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isSaving}
        >
          <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoPlaceholderText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  logoPreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPreview: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  removeLogoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    padding: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
