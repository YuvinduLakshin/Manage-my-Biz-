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

interface OnboardingScreenProps {
  onComplete: (profile: BusinessProfile) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  // Form fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  const [currency, setCurrency] = useState('$');
  const [logo, setLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Logo Selector
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
          setLogo(`data:${mimeType};base64,${asset.base64}`);
        } else {
          setLogo(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking logo:', error);
      Alert.alert('Error', 'Failed to pick logo image.');
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
  };

  // Submit Handler
  const handleGetStarted = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your Business Name to get started.');
      return;
    }

    setIsSaving(true);
    const profileData: BusinessProfile = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      taxRate: parseFloat(taxRate) || 0,
      currency: currency.trim() || '$',
      logo,
    };

    try {
      await saveBusinessProfile(profileData);
      onComplete(profileData);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flexContainer}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Visual Welcome Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.appIconBg}>
            <Ionicons name="clipboard" size={28} color="#FFF" />
          </View>
          <Text style={styles.heroTitle}>Manage my BiZ</Text>
          <Text style={styles.heroSubtitle}>
            Create professional quotations, track ongoing order states, and log business ledger cashflow.
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Set Up Your Business</Text>
          <Text style={styles.cardSubtitle}>
            These details are saved locally and used as templates for your invoices.
          </Text>

          {/* Logo Box */}
          <View style={styles.logoContainer}>
            {logo ? (
              <View style={styles.logoPreviewBox}>
                <Image source={{ uri: logo }} style={styles.logoImage} />
                <TouchableOpacity style={styles.removeLogoBtn} onPress={handleRemoveLogo}>
                  <Ionicons name="trash-outline" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.logoPlaceholder} onPress={handlePickLogo}>
                <Ionicons name="image-outline" size={28} color="#4F46E5" />
                <Text style={styles.logoPlaceholderText}>Upload Business Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Corp or John Designs"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 123 Business Rd, New York"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
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
              placeholder="e.g. hello@mybusiness.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Currency Symbol</Text>
              <TextInput
                style={styles.input}
                placeholder="$"
                placeholderTextColor="#94A3B8"
                value={currency}
                onChangeText={setCurrency}
                maxLength={3}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Default Tax (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor="#94A3B8"
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSaving && styles.disabledBtn]}
          onPress={handleGetStarted}
          disabled={isSaving}
        >
          <Text style={styles.submitBtnText}>{isSaving ? 'Saving...' : 'Get Started'}</Text>
          <Ionicons name="arrow-forward-outline" size={18} color="#FFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  appIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 1.5,
    paddingHorizontal: 10,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoPlaceholderText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  logoPreviewBox: {
    position: 'relative',
    width: '100%',
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  removeLogoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    padding: 5,
    borderRadius: 15,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
