import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProfile, Order, OrderStatus } from '../types';
import { saveOrders } from '../utils/storage';

interface OrdersScreenProps {
  profile: BusinessProfile;
  orders: Order[];
  onOrdersUpdate: (updatedOrders: Order[]) => void;
}

const STATUS_FILTERS: { label: string; value: 'all' | OrderStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Handover', value: 'pending_handover' },
  { label: 'Closed', value: 'closed' },
];

export default function OrdersScreen({
  profile,
  orders,
  onOrdersUpdate,
}: OrdersScreenProps) {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Order Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Edit Order Mode (optional override, we will use it for editing orders)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isModalVisible && !editingOrderId) {
      const nextOrderNum = `ORD-${1000 + orders.length + 1}`;
      setOrderNumber(nextOrderNum);
      setDate(new Date().toISOString().split('T')[0]);
      setClientName('');
      setClientPhone('');
      setDescription('');
      setAmount('');
      setStatus('pending');
      setNotes('');
    }
  }, [isModalVisible, orders.length, editingOrderId]);

  const currency = profile.currency || '$';

  // Add / Edit Order Handler
  const handleSaveOrder = async () => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Client name is required.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Description is required.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount (0 or more).');
      return;
    }

    if (editingOrderId) {
      // Edit existing order
      const updated = orders.map((o) => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            orderNumber: orderNumber.trim() || o.orderNumber,
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            description: description.trim(),
            amount: parsedAmount,
            status,
            date,
            notes: notes.trim(),
          };
        }
        return o;
      });
      await saveOrders(updated);
      onOrdersUpdate(updated);
      Alert.alert('Success', 'Order updated successfully!');
    } else {
      // Create new order
      const newOrder: Order = {
        id: Date.now().toString(),
        orderNumber: orderNumber.trim() || `ORD-${Date.now()}`,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        description: description.trim(),
        amount: parsedAmount,
        status,
        date,
        notes: notes.trim(),
      };
      const updated = [newOrder, ...orders];
      await saveOrders(updated);
      onOrdersUpdate(updated);
      Alert.alert('Success', 'New order created!');
    }

    setIsModalVisible(false);
    setEditingOrderId(null);
  };

  // Open Edit Modal
  const startEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setOrderNumber(order.orderNumber);
    setClientName(order.clientName);
    setClientPhone(order.clientPhone);
    setDescription(order.description);
    setAmount(order.amount.toString());
    setStatus(order.status);
    setDate(order.date);
    setNotes(order.notes);
    setIsModalVisible(true);
  };

  // Transition Order Status quickly from cards
  const transitionStatus = async (order: Order, nextStatus: OrderStatus) => {
    const updated = orders.map((o) => {
      if (o.id === order.id) {
        return { ...o, status: nextStatus };
      }
      return o;
    });
    await saveOrders(updated);
    onOrdersUpdate(updated);
  };

  // Delete Order Handler
  const handleDeleteOrder = (id: string) => {
    Alert.alert(
      'Delete Order',
      'Are you sure you want to delete this order permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = orders.filter((o) => o.id !== id);
            await saveOrders(updated);
            onOrdersUpdate(updated);
          },
        },
      ]
    );
  };

  // Client Dial call link
  const callClient = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call on this device.');
    });
  };

  // Badges styling
  const getBadgeStyle = (statusVal: OrderStatus) => {
    switch (statusVal) {
      case 'pending':
        return { bg: '#FFFAF0', text: '#D97706', label: 'Pending' };
      case 'ongoing':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'Ongoing' };
      case 'pending_handover':
        return { bg: '#FAF5FF', text: '#7C3AED', label: 'Handover' };
      case 'closed':
        return { bg: '#ECFDF5', text: '#059669', label: 'Closed' };
    }
  };

  // Filters & Search
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === 'all' ? true : o.status === filter;
    const matchesSearch =
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.listHeader}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, clients, description..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => {
          setEditingOrderId(null);
          setIsModalVisible(true);
        }}>
          <Ionicons name="add-outline" size={20} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.createBtnText}>Add Order</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Status Filter Pills */}
      <View style={styles.filterPillsScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
          {STATUS_FILTERS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterPill,
                filter === item.value && styles.filterPillActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.filterPillText, filter === item.value && styles.filterPillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>Add orders and update their workflow state.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          renderItem={({ item }) => {
            const badge = getBadgeStyle(item.status);
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderCardTop}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.orderCardNum}>{item.orderNumber}</Text>
                      <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderCardClient}>{item.clientName}</Text>
                  </View>
                  <Text style={styles.orderCardTotal}>
                    {currency}
                    {item.amount.toFixed(2)}
                  </Text>
                </View>

                {item.description ? (
                  <Text style={styles.orderCardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {item.clientPhone ? (
                  <TouchableOpacity style={styles.clientPhoneRow} onPress={() => callClient(item.clientPhone)}>
                    <Ionicons name="call-outline" size={14} color="#4F46E5" />
                    <Text style={styles.clientPhoneText}>{item.clientPhone}</Text>
                  </TouchableOpacity>
                ) : null}

                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.orderCardDivider} />

                <View style={styles.orderCardBottom}>
                  <Text style={styles.orderCardDate}>Ordered: {item.date}</Text>
                  
                  <View style={styles.orderCardActions}>
                    {/* Edit Btn */}
                    <TouchableOpacity style={styles.cardEditBtn} onPress={() => startEditOrder(item)}>
                      <Ionicons name="create-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                    
                    {/* Delete Btn */}
                    <TouchableOpacity style={styles.cardDeleteBtn} onPress={() => handleDeleteOrder(item.id)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>

                    {/* Quick Status Advancement buttons */}
                    {item.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.transitionBtn, { backgroundColor: '#EEF2FF' }]}
                        onPress={() => transitionStatus(item, 'ongoing')}
                      >
                        <Text style={[styles.transitionBtnText, { color: '#4F46E5' }]}>Start Order</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'ongoing' && (
                      <TouchableOpacity
                        style={[styles.transitionBtn, { backgroundColor: '#F5F3FF' }]}
                        onPress={() => transitionStatus(item, 'pending_handover')}
                      >
                        <Text style={[styles.transitionBtnText, { color: '#7C3AED' }]}>Ready Handover</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'pending_handover' && (
                      <TouchableOpacity
                        style={[styles.transitionBtn, { backgroundColor: '#ECFDF5' }]}
                        onPress={() => transitionStatus(item, 'closed')}
                      >
                        <Text style={[styles.transitionBtnText, { color: '#059669' }]}>Close Order</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add/Edit Order Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsModalVisible(false);
          setEditingOrderId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingOrderId ? 'Edit Order Details' : 'Create Customer Order'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setIsModalVisible(false);
                  setEditingOrderId(null);
                }}>
                  <Ionicons name="close-outline" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Order Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. ORD-1001"
                      placeholderTextColor="#94A3B8"
                      value={orderNumber}
                      onChangeText={setOrderNumber}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Order Value ({currency}) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Customer Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Richard Hendricks"
                    placeholderTextColor="#94A3B8"
                    value={clientName}
                    onChangeText={setClientName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Customer Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +1 (555) 765-4321"
                    placeholderTextColor="#94A3B8"
                    value={clientPhone}
                    onChangeText={setClientPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description / Scope of Work *</Text>
                  <TextInput
                    style={[styles.input, { height: 50 }]}
                    placeholder="e.g. Custom React Native development phase 1"
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Status Workflow State</Text>
                    <View style={styles.statusRowSelect}>
                      {(['pending', 'ongoing', 'pending_handover', 'closed'] as OrderStatus[]).map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.statusSelectBadge,
                            status === st && styles.statusSelectBadgeActive,
                          ]}
                          onPress={() => setStatus(st)}
                        >
                          <Text style={[styles.statusSelectText, status === st && styles.statusSelectTextActive]}>
                            {st === 'pending_handover' ? 'Handover' : st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date Created</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Internal Notes</Text>
                  <TextInput
                    style={[styles.input, { height: 50 }]}
                    placeholder="e.g. Requires assets from client before start"
                    placeholderTextColor="#94A3B8"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveOrder}>
                <Text style={styles.submitBtnText}>
                  {editingOrderId ? 'Update Order Details' : 'Create Customer Order'}
                </Text>
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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  createBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  filterPillsScrollContainer: {
    marginBottom: 8,
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  listContentContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderCardNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4F46E5',
  },
  badgeContainer: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderCardClient: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    marginTop: 3,
  },
  orderCardTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderCardDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 1.5,
  },
  clientPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clientPhoneText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginLeft: 6,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  orderCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  orderCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEditBtn: {
    padding: 6,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  cardDeleteBtn: {
    padding: 6,
    marginRight: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  transitionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  transitionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  row: {
    flexDirection: 'row',
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
  statusRowSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  statusSelectBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusSelectBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  statusSelectText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusSelectTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
