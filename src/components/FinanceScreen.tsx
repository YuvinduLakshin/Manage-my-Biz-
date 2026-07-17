import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProfile, Transaction } from '../types';
import { saveTransactions } from '../utils/storage';

interface FinanceScreenProps {
  profile: BusinessProfile;
  transactions: Transaction[];
  onTransactionsUpdate: (updatedTransactions: Transaction[]) => void;
}

const INCOME_CATEGORIES = ['Sales', 'Freelance', 'Services', 'Consulting', 'Other'];
const OUTGOING_CATEGORIES = ['Rent', 'Utilities', 'Marketing', 'Equipment', 'Travel', 'Taxes', 'Other'];

export default function FinanceScreen({
  profile,
  transactions,
  onTransactionsUpdate,
}: FinanceScreenProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'outgoing'>('all');
  
  // Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [type, setType] = useState<'income' | 'outgoing'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const currency = profile.currency || '$';

  // Math totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutgoing = transactions
    .filter((t) => t.type === 'outgoing')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalOutgoing;

  // Add Transaction Handler
  const handleAddTransaction = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Description is required.');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: parsedAmount,
      category,
      description: description.trim(),
      date,
    };

    const updatedTransactions = [newTransaction, ...transactions];
    await saveTransactions(updatedTransactions);
    onTransactionsUpdate(updatedTransactions);

    // Reset Form
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalVisible(false);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = transactions.filter((t) => t.id !== id);
            await saveTransactions(updated);
            onTransactionsUpdate(updated);
          },
        },
      ]
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'outgoing') return t.type === 'outgoing';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Financial Overview Cards */}
      <View style={styles.overviewContainer}>
        {/* Main Balance card */}
        <View style={[styles.card, styles.balanceCard]}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={[styles.balanceValue, balance < 0 && { color: '#EF4444' }]}>
            {balance >= 0 ? '' : '-'}
            {currency}
            {Math.abs(balance).toFixed(2)}
          </Text>
        </View>

        {/* Row for Income vs Outgoing summary */}
        <View style={styles.statsRow}>
          <View style={[styles.card, styles.statCard, { marginRight: 12 }]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconDot, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="trending-up-outline" size={14} color="#10B981" />
              </View>
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {currency}
              {totalIncome.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statHeader}>
              <View style={[styles.iconDot, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trending-down-outline" size={14} color="#EF4444" />
              </View>
              <Text style={styles.statLabel}>Outgoings</Text>
            </View>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {currency}
              {totalOutgoing.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Ledger Logs Header */}
      <View style={styles.ledgerHeader}>
        <Text style={styles.sectionTitle}>Transaction Log</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => {
          setType('income');
          setCategory(INCOME_CATEGORIES[0]);
          setIsModalVisible(true);
        }}>
          <Ionicons name="add-outline" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'income' && styles.filterBtnActive]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.filterTextActive]}>Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'outgoing' && styles.filterBtnActive]}
          onPress={() => setFilter('outgoing')}
        >
          <Text style={[styles.filterText, filter === 'outgoing' && styles.filterTextActive]}>Expenses</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions list */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={54} color="#CBD5E1" />
          <Text style={styles.emptyText}>No transactions recorded</Text>
          <Text style={styles.emptySubtext}>Add income or outgoing expenses to track your budget.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View
                  style={[
                    styles.txIconContainer,
                    item.type === 'income'
                      ? { backgroundColor: '#E6F4FE' }
                      : { backgroundColor: '#FEE2E2' },
                  ]}
                >
                  <Ionicons
                    name={item.type === 'income' ? 'arrow-down-outline' : 'arrow-up-outline'}
                    size={18}
                    color={item.type === 'income' ? '#4F46E5' : '#EF4444'}
                  />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.txDesc}>{item.description}</Text>
                  <View style={styles.txSubRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <Text style={styles.txDate}>{item.date}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.txRight}>
                <Text
                  style={[
                    styles.txAmount,
                    item.type === 'income' ? { color: '#10B981' } : { color: '#EF4444' },
                  ]}
                >
                  {item.type === 'income' ? '+' : '-'}
                  {currency}
                  {item.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.txDeleteBtn}
                  onPress={() => handleDeleteTransaction(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Transaction Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Record Transaction</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close-outline" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Type Switcher */}
              <View style={styles.typeSwitcher}>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
                  onPress={() => {
                    setType('income');
                    setCategory(INCOME_CATEGORIES[0]);
                  }}
                >
                  <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, type === 'outgoing' && styles.typeBtnOutgoingActive]}
                  onPress={() => {
                    setType('outgoing');
                    setCategory(OUTGOING_CATEGORIES[0]);
                  }}
                >
                  <Text style={[styles.typeBtnText, type === 'outgoing' && styles.typeBtnTextActive]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Amount ({currency}) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryPickerRow}>
                    {(type === 'income' ? INCOME_CATEGORIES : OUTGOING_CATEGORIES).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categorySelectorBadge,
                          category === cat && styles.categorySelectorBadgeActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categorySelectorText,
                            category === cat && styles.categorySelectorTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description / Reference *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Consultancy Fee payment or Office Stationery"
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
                <Text style={styles.submitBtnText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  balanceCard: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  transactionItem: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  txDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  txDeleteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeBtnIncomeActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnOutgoingActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
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
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  categorySelectorBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categorySelectorBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  categorySelectorText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  categorySelectorTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
