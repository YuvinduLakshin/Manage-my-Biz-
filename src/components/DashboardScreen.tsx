import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
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

  // Math calculations for Cash Flow Bar Chart
  const maxVal = Math.max(totalIncome, totalOutgoing) || 1;
  const incomePercent = totalIncome > 0 ? (totalIncome / maxVal) * 100 : 0;
  const outgoingPercent = totalOutgoing > 0 ? (totalOutgoing / maxVal) * 100 : 0;

  // Group transactions by category for breakdown
  const categorySummary = transactions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categorySummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Decorative Blur Blobs in Backdrop */}
      <View style={styles.bgBlobLeft} />
      <View style={styles.bgBlobRight} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Business Welcome Glass Card */}
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
              <Ionicons name="business-outline" size={24} color="#6366F1" />
            </View>
          )}
        </View>

        {/* Premium Liquid Glass Balance Card */}
        <View style={styles.balanceCard}>
          {/* Glass glare highlight overlays */}
          <View style={styles.glassHighlight} />
          <View style={styles.glassHighlightCircle} />
          
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

        {/* Workflow Summary Glass Board */}
        <View style={styles.glassCard}>
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

        {/* Financial Analytics Bar Chart & Categories */}
        <Text style={styles.sectionTitle}>Analytics & Cash Flow</Text>
        <View style={styles.glassCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Monthly Ledger Comparison</Text>
              <Text style={styles.chartSubtitle}>Relative inflow vs. outflow ratio</Text>
            </View>
            <Ionicons name="stats-chart" size={18} color="#6366F1" />
          </View>

          {/* Vertical Bar Chart */}
          <View style={styles.chartBarsContainer}>
            <View style={styles.chartBarCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${incomePercent}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.barLabel}>Inflow</Text>
              <Text style={styles.barAmt}>{currency}{totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>

            <View style={styles.chartBarCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${outgoingPercent}%`, backgroundColor: '#EF4444' }]} />
              </View>
              <Text style={styles.barLabel}>Outflow</Text>
              <Text style={styles.barAmt}>{currency}{totalOutgoing.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>

          {/* Category Breakdown Progress */}
          {sortedCategories.length > 0 ? (
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownHeading}>Top Transaction Categories</Text>
              {sortedCategories.map(([catName, catAmt]) => {
                const totalCash = totalIncome + totalOutgoing || 1;
                const sharePercent = Math.min(100, Math.round((catAmt / totalCash) * 100));
                
                // Inspect if it belongs to income categories to color badge
                const sampleTx = transactions.find(t => t.category === catName);
                const isIncome = sampleTx ? sampleTx.type === 'income' : true;
                
                return (
                  <View key={catName} style={styles.breakdownItem}>
                    <View style={styles.breakdownTextRow}>
                      <Text style={styles.breakdownName}>{catName}</Text>
                      <Text style={styles.breakdownAmt}>
                        {currency}{catAmt.toLocaleString()} ({sharePercent}%)
                      </Text>
                    </View>
                    <View style={styles.breakdownProgressTrack}>
                      <View 
                        style={[
                          styles.breakdownProgressBar, 
                          { width: `${sharePercent}%`, backgroundColor: isIncome ? '#10B981' : '#EF4444' }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#94A3B8' }}>No categories data to analyze</Text>
            </View>
          )}
        </View>

        {/* Quick Action Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('quotation')}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="document-text" size={22} color="#6366F1" />
            </View>
            <Text style={styles.actionTitle}>Create Quote</Text>
            <Text style={styles.actionSubtitle}>{quotations.length} Quotes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('orders')}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <Ionicons name="clipboard" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.actionTitle}>Track Orders</Text>
            <Text style={styles.actionSubtitle}>{orders.filter(o => o.status !== 'closed').length} Active</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('finance')}>
            <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
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
                    item.type === 'income' ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' } : { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
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

        {/* Footer Watermark */}
        <View style={styles.footerWatermark}>
          <Ionicons name="shield-checkmark" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
          <Text style={styles.footerWatermarkText}>Protected and Powered By Pexa Core</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  bgBlobLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.12)', // Subtle Indigo Glow
  },
  bgBlobRight: {
    position: 'absolute',
    top: 320,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(236, 72, 153, 0.08)', // Subtle Pink Glow
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  welcomeBusinessName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  businessLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    resizeMode: 'contain',
    backgroundColor: '#FFF',
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  balanceCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Curved visual glare top
    transform: [{ skewY: '-8deg' }],
  },
  glassHighlightCircle: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLabel: {
    color: '#C7D2FE',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  balanceStatsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 14,
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
    color: '#34D399',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  balanceStatValOutgoing: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  boardTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '900',
  },
  boardLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 150,
    alignItems: 'flex-end',
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: 16,
  },
  chartBarCol: {
    alignItems: 'center',
    width: '40%',
  },
  barTrack: {
    height: 100,
    width: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  barAmt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  breakdownContainer: {
    marginTop: 4,
  },
  breakdownHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  breakdownItem: {
    marginBottom: 10,
  },
  breakdownTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownName: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  breakdownAmt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  breakdownProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  breakdownProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 18,
    padding: 12,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  dualSectionsContainer: {
    marginBottom: 20,
  },
  recentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  miniOrderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  miniOrderNum: {
    fontSize: 13,
    fontWeight: '800',
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
    fontWeight: '500',
  },
  miniOrderAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  miniQuoteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  miniQuoteNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  miniQuoteClient: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  miniQuoteTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  miniTxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
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
    fontWeight: '700',
    color: '#0F172A',
  },
  miniTxCat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  miniTxAmount: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  footerWatermark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 8,
    opacity: 0.8,
  },
  footerWatermarkText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
