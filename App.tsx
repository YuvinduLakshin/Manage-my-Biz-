import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Types & Storage helpers
import { AppTab, BusinessProfile, Quotation, Transaction, Order } from './src/types';
import {
  getBusinessProfile,
  getQuotations,
  getTransactions,
  getOrders,
  saveBusinessProfile,
} from './src/utils/storage';

// Screens
import DashboardScreen from './src/components/DashboardScreen';
import QuotationScreen from './src/components/QuotationScreen';
import OrdersScreen from './src/components/OrdersScreen';
import FinanceScreen from './src/components/FinanceScreen';
import SettingsScreen from './src/components/SettingsScreen';
import OnboardingScreen from './src/components/OnboardingScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Core App State
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: 0,
    currency: '$',
    logo: null,
  });
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load state on mount
  useEffect(() => {
    async function loadAppData() {
      try {
        const storedProfile = await getBusinessProfile();
        const storedQuotes = await getQuotations();
        const storedTxs = await getTransactions();
        const storedOrders = await getOrders();

        if (storedProfile) {
          setProfile(storedProfile);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }

        setQuotations(storedQuotes);
        setTransactions(storedTxs);
        setOrders(storedOrders);
      } catch (error) {
        console.error('Failed to load initial app data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAppData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Setting up workspace...</Text>
      </View>
    );
  }

  const handleOnboardingComplete = (newProfile: BusinessProfile) => {
    setProfile(newProfile);
    setNeedsOnboarding(false);
  };

  if (needsOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaView>
    );
  }

  // Render Screen Helper
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            profile={profile}
            quotations={quotations}
            transactions={transactions}
            orders={orders}
            setActiveTab={setActiveTab}
          />
        );
      case 'quotation':
        return (
          <QuotationScreen
            profile={profile}
            quotations={quotations}
            onQuotationsUpdate={setQuotations}
          />
        );
      case 'orders':
        return (
          <OrdersScreen
            profile={profile}
            orders={orders}
            onOrdersUpdate={setOrders}
          />
        );
      case 'finance':
        return (
          <FinanceScreen
            profile={profile}
            transactions={transactions}
            onTransactionsUpdate={setTransactions}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            profile={profile}
            onProfileUpdate={setProfile}
          />
        );
      default:
        return <View style={{ flex: 1 }} />;
    }
  };

  // Get screen headers
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'quotation':
        return 'Quotations';
      case 'orders':
        return 'Order Management';
      case 'finance':
        return 'Finance Ledger';
      case 'settings':
        return 'Settings';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Title Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Premium Bottom Nav Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'grid' : 'grid-outline'}
            size={22}
            color={activeTab === 'dashboard' ? '#4F46E5' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'quotation' && styles.tabItemActive]}
          onPress={() => setActiveTab('quotation')}
        >
          <Ionicons
            name={activeTab === 'quotation' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'quotation' ? '#4F46E5' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'quotation' && styles.tabLabelActive]}>
            Quotes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons
            name={activeTab === 'orders' ? 'clipboard' : 'clipboard-outline'}
            size={22}
            color={activeTab === 'orders' ? '#4F46E5' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'finance' && styles.tabItemActive]}
          onPress={() => setActiveTab('finance')}
        >
          <Ionicons
            name={activeTab === 'finance' ? 'wallet' : 'wallet-outline'}
            size={22}
            color={activeTab === 'finance' ? '#4F46E5' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'finance' && styles.tabLabelActive]}>
            Finance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#4F46E5' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  header: {
    height: 56,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    height: 64,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabItemActive: {
    // optional background glow or indicator styling
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
