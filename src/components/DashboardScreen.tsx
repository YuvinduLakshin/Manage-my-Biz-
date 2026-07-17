import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProfile, Quotation, Transaction, Order, AppTab } from '../types';

interface DashboardScreenProps {
  profile: BusinessProfile;
  quotations: Quotation[];
  transactions: Transaction[];
  orders: Order[];
  setActiveTab: (tab: AppTab) => void;
}

export default function DashboardScreen({
  profile,
  quotations,
  transactions,
  orders = [],
  setActiveTab,
}: DashboardScreenProps) {
  const currency = profile.currency || '$';

  // Financial Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutgoing = transactions
    .filter((t) => t.type === 'outgoing')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalOutgoing;

  // Order Counts
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const ongoingOrders = orders.filter((o) => o.status === 'ongoing').length;
  const handoverOrders = orders.filter((o) => o.status === 'pending_handover').length;
  const closedOrders = orders.filter((o) => o.status === 'closed').length;

  // Recents
  const recentQuotes = quotations.slice(0, 2);
  const recentOrders = orders.slice(0, 2);
  const recentTransactions = transactions.slice(0, 3);

  // Status Colors for Mini Order Cards
  const getMiniBadgeColor = (statusVal: string) => {
    switch (statusVal) {
      case 'pending':
        return '#D97706';
      case 'ongoing':
        return '#2563EB';
      case 'pending_handover':
        return '#7C3AED';
      case 'closed':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Business Welcome Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeGreeting}>Welcome Back,</Text>
          <Text style={styles.welcomeBusinessName} numberOfLines={1}>
            {profile.name || 'Your Business Name'}
          </Text>
        </View>
        {profile.logo ? (
          <Image source={{ uri: profile.logo }} style={styles.businessLogo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business-outline" size={24} color="#4F46E5" />
          </View>
        )}
      </View>

      {/* Financial Overview Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Net Balance</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: '#FECACA' }]}>
          {balance >= 0 ? '' : '-'}
          {currency}
          {Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        
        <View style={styles.balanceStatsDivider} />
        
        <View style={styles.balanceStatsRow}>
          <View style={styles.balanceStatCol}>
            <Text style={styles.balanceStatLabel}>Total Income</Text>
            <Text style={styles.balanceStatValIncome}>
              {currency}
              {totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={styles.balanceStatCol}>
            <Text style={styles.balanceStatLabel}>Total Outgoings</Text>
            <Text style={styles.balanceStatValOutgoing}>
              {currency}
              {totalOutgoing.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Orders Summary Board */}
      <View style={styles.summaryBoardCard}>
        <Text style={styles.boardTitle}>Order Status Workflow</Text>
        <View style={styles.boardRow}>
          <View style={styles.boardCol}>
            <Text style={[styles.boardCount, { color: '#D97706' }]}>{pendingOrders}</Text>
            <Text style={styles.boardLabel}>Pending</Text>
          </View>
          <View style={styles.boardCol}>
            <Text style={[styles.boardCount, { color: '#2563EB' }]}>{ongoingOrders}</Text>
            <Text style={styles.boardLabel}>Ongoing</Text>
          </View>
          <View style={styles.boardCol}>
            <Text style={[styles.boardCount, { color: '#7C3AED' }]}>{handoverOrders}</Text>
            <Text style={styles.boardLabel}>Handover</Text>
          </View>
          <View style={styles.boardCol}>
            <Text style={[styles.boardCount, { color: '#059669' }]}>{closedOrders}</Text>
            <Text style={styles.boardLabel}>Closed</Text>
          </View>
        </View>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('quotation')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="document-text" size={22} color="#4F46E5" />
          </View>
          <Text style={styles.actionTitle}>Create Quote</Text>
          <Text style={styles.actionSubtitle}>{quotations.length} Quotes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('orders')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="clipboard" size={22} color="#7C3AED" />
          </View>
          <Text style={styles.actionTitle}>Track Orders</Text>
          <Text style={styles.actionSubtitle}>{orders.filter(o => o.status !== 'closed').length} Active</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('finance')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="card" size={22} color="#10B981" />
          </View>
          <Text style={styles.actionTitle}>Finance</Text>
          <Text style={styles.actionSubtitle}>Ledger</Text>
        </TouchableOpacity>
      </View>

      {/* Lists of Recent Activity */}
      <View style={styles.dualSectionsContainer}>
        {/* Recent Orders Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => setActiveTab('orders')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          ) : (
            recentOrders.map((item) => (
              <View key={item.id} style={styles.miniOrderCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.miniOrderNum}>{item.orderNumber}</Text>
                    <View style={[styles.dot, { backgroundColor: getMiniBadgeColor(item.status) }]} />
                  </View>
                  <Text style={styles.miniOrderClient} numberOfLines={1}>{item.clientName}</Text>
                </View>
                <Text style={styles.miniOrderAmount}>
                  {currency}
                  {item.amount.toFixed(0)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Quotes Section */}
        <View style={[styles.recentSection, { marginTop: 16 }]}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Quotations</Text>
            <TouchableOpacity onPress={() => setActiveTab('quotation')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentQuotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No quotations issued</Text>
            </View>
          ) : (
            recentQuotes.map((item) => (
              <View key={item.id} style={styles.miniQuoteCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniQuoteNum}>{item.quoteNumber}</Text>
                  <Text style={styles.miniQuoteClient} numberOfLines={1}>{item.clientName}</Text>
                </View>
                <Text style={styles.miniQuoteTotal}>
                  {currency}
                  {item.grandTotal.toFixed(0)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Transactions Section */}
        <View style={[styles.recentSection, { marginTop: 16 }]}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Ledger</Text>
            <TouchableOpacity onPress={() => setActiveTab('finance')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No financial records</Text>
            </View>
          ) : (
            recentTransactions.map((item) => (
              <View key={item.id} style={styles.miniTxCard}>
                <View style={[
                  styles.miniTxIcon,
                  item.type === 'income' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEE2E2' }
                ]}>
                  <Ionicons 
                    name={item.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                    size={12} 
                    color={item.type === 'income' ? '#10B981' : '#EF4444'} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.miniTxDesc} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.miniTxCat}>{item.category}</Text>
                </View>
                <Text style={[
                  styles.miniTxAmount,
                  item.type === 'income' ? { color: '#10B981' } : { color: '#EF4444' }
                ]}>
                  {item.type === 'income' ? '+' : '-'}
                  {currency}
                  {item.amount.toFixed(0)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  welcomeBusinessName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  businessLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    resizeMode: 'contain',
    backgroundColor: '#FFF',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 6,
  },
  balanceStatsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 16,
  },
  balanceStatsRow: {
    flexDirection: 'row',
  },
  balanceStatCol: {
    flex: 1,
  },
  balanceStatLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '500',
  },
  balanceStatValIncome: {
    color: '#A7F3D0',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  balanceStatValOutgoing: {
    color: '#FECACA',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryBoardCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  boardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  boardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  boardCol: {
    flex: 1,
    alignItems: 'center',
  },
  boardCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  boardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  dualSectionsContainer: {
    marginBottom: 20,
  },
  recentSection: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  miniOrderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniOrderNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  miniOrderClient: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  miniOrderAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniQuoteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniQuoteNum: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  miniQuoteClient: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  miniQuoteTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  miniTxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  miniTxIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniTxDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  miniTxCat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  miniTxAmount: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});
