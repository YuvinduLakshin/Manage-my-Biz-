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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessProfile, Quotation, QuotationItem } from '../types';
import { saveQuotations } from '../utils/storage';
import { generateQuotationPDF, shareQuotationPDF } from '../utils/pdfGenerator';

interface QuotationScreenProps {
  profile: BusinessProfile;
  quotations: Quotation[];
  onQuotationsUpdate: (updatedQuotations: Quotation[]) => void;
}

export default function QuotationScreen({
  profile,
  quotations,
  onQuotationsUpdate,
}: QuotationScreenProps) {
  // Navigation inside the tab: 'list' or 'create'
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Quotation Form State
  const [quoteNumber, setQuoteNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [date, setDate] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [taxRate, setTaxRate] = useState('');

  // New Item Modal State
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  // Load defaults when opening create form
  useEffect(() => {
    if (mode === 'create') {
      const nextQuoteNum = `QT-${1000 + quotations.length + 1}`;
      setQuoteNumber(nextQuoteNum);
      
      const today = new Date();
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      setDate(formatDate(today));
      
      const validDate = new Date(today);
      validDate.setDate(today.getDate() + 30); // Valid for 30 days
      setValidUntil(formatDate(validDate));
      
      setTaxRate(profile.taxRate.toString());
      setItems([]);
      setClientName('');
      setClientAddress('');
      setClientEmail('');
      setDiscount('0');
    }
  }, [mode, profile, quotations.length]);

  const currency = profile.currency || '$';

  // Math helper functions
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTax = (subtotal: number) => {
    const rate = parseFloat(taxRate) || 0;
    return (subtotal * rate) / 100;
  };

  const calculateGrandTotal = () => {
    const sub = calculateSubtotal();
    const tax = calculateTax(sub);
    const disc = parseFloat(discount) || 0;
    return Math.max(0, sub + tax - disc);
  };

  // Add Item handler
  const handleAddItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Validation Error', 'Item name is required.');
      return;
    }
    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than 0.');
      return;
    }
    const quantity = parseInt(itemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity of 1 or more.');
      return;
    }

    const newItem: QuotationItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      description: itemDescription.trim(),
      price,
      quantity,
    };

    setItems([...items, newItem]);
    
    // Reset modal
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemQuantity('1');
    setIsItemModalVisible(false);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Save Quotation Handler
  const handleSaveQuotation = async () => {
    if (!clientName.trim()) {
      Alert.alert('Validation Error', 'Client name is required.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item to the quotation.');
      return;
    }

    const subtotal = calculateSubtotal();
    const taxTotal = calculateTax(subtotal);
    const grandTotal = calculateGrandTotal();

    const newQuotation: Quotation = {
      id: Date.now().toString(),
      quoteNumber: quoteNumber.trim() || `QT-${Date.now()}`,
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim(),
      clientEmail: clientEmail.trim(),
      date,
      validUntil,
      items,
      discount: parseFloat(discount) || 0,
      taxRate: parseFloat(taxRate) || 0,
      subtotal,
      taxTotal,
      grandTotal,
    };

    const updatedQuotations = [newQuotation, ...quotations];
    await saveQuotations(updatedQuotations);
    onQuotationsUpdate(updatedQuotations);
    
    Alert.alert(
      'Success',
      'Quotation saved! Would you like to share the PDF now?',
      [
        {
          text: 'No, Back to List',
          onPress: () => setMode('list'),
          style: 'cancel',
        },
        {
          text: 'Yes, Share PDF',
          onPress: async () => {
            const pdfUri = await generateQuotationPDF(profile, newQuotation);
            if (pdfUri) {
              await shareQuotationPDF(pdfUri, newQuotation.quoteNumber);
            }
            setMode('list');
          },
        },
      ]
    );
  };

  const handleShareExisting = async (quote: Quotation) => {
    const pdfUri = await generateQuotationPDF(profile, quote);
    if (pdfUri) {
      await shareQuotationPDF(pdfUri, quote.quoteNumber);
    }
  };

  const handleDeleteQuotation = (id: string) => {
    Alert.alert(
      'Delete Quotation',
      'Are you sure you want to delete this quotation permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = quotations.filter((q) => q.id !== id);
            await saveQuotations(updated);
            onQuotationsUpdate(updated);
          },
        },
      ]
    );
  };

  const filteredQuotes = quotations.filter(
    (q) =>
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {mode === 'list' ? (
        <View style={{ flex: 1 }}>
          {/* Header Actions */}
          <View style={styles.listHeader}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search quotes or clients..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={() => setMode('create')}>
              <Ionicons name="add-outline" size={20} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.createBtnText}>New Quote</Text>
            </TouchableOpacity>
          </View>

          {/* Quotes List */}
          {filteredQuotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No quotations found</Text>
              <Text style={styles.emptySubtext}>Create a new quotation to get started</Text>
            </View>
          ) : (
            <FlatList
              data={filteredQuotes}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.quoteCard}>
                  <View style={styles.quoteCardTop}>
                    <View>
                      <Text style={styles.quoteCardNum}>{item.quoteNumber}</Text>
                      <Text style={styles.quoteCardClient}>{item.clientName}</Text>
                    </View>
                    <Text style={styles.quoteCardTotal}>
                      {currency}
                      {item.grandTotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.quoteCardDivider} />
                  <View style={styles.quoteCardBottom}>
                    <View style={styles.quoteCardDates}>
                      <Text style={styles.quoteCardDate}>Issued: {item.date}</Text>
                      <Text style={styles.quoteCardDate}>Expires: {item.validUntil}</Text>
                    </View>
                    <View style={styles.quoteCardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.shareBtn]}
                        onPress={() => handleShareExisting(item)}
                      >
                        <Ionicons name="share-outline" size={16} color="#4F46E5" />
                        <Text style={styles.shareBtnText}>PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteQuotation(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
            {/* Back Button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => setMode('list')}>
              <Ionicons name="arrow-back-outline" size={20} color="#4F46E5" />
              <Text style={styles.backBtnText}>Back to Quotations</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quote Details</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Quotation #</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. QT-1001"
                    placeholderTextColor="#94A3B8"
                    value={quoteNumber}
                    onChangeText={setQuoteNumber}
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valid Until Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={validUntil}
                  onChangeText={setValidUntil}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Client Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#94A3B8"
                  value={clientName}
                  onChangeText={setClientName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. client@example.com"
                  placeholderTextColor="#94A3B8"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g. 456 Client Rd, Chicago, IL"
                  placeholderTextColor="#94A3B8"
                  value={clientAddress}
                  onChangeText={setClientAddress}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Itemized Table Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderWithBtn}>
                <Text style={styles.cardTitle}>Quotation Items</Text>
                <TouchableOpacity
                  style={styles.addTableItemBtn}
                  onPress={() => setIsItemModalVisible(true)}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
                  <Text style={styles.addTableItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>No items added yet.</Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNameText}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.itemDescText}>{item.description}</Text>
                        ) : null}
                        <Text style={styles.itemPriceText}>
                          {item.quantity} x {currency}
                          {item.price.toFixed(2)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.itemSubtotalText}>
                          {currency}
                          {(item.price * item.quantity).toFixed(2)}
                        </Text>
                        <TouchableOpacity
                          style={styles.itemDeleteBtn}
                          onPress={() => handleDeleteItem(item.id)}
                        >
                          <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Calculations Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Summary & Taxes</Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Tax Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 15"
                    placeholderTextColor="#94A3B8"
                    value={taxRate}
                    onChangeText={setTaxRate}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Discount ({currency})</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    placeholderTextColor="#94A3B8"
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.summaryBreakdown}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    {currency}
                    {calculateSubtotal().toFixed(2)}
                  </Text>
                </View>
                
                {calculateTax(calculateSubtotal()) > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
                    <Text style={styles.summaryValue}>
                      {currency}
                      {calculateTax(calculateSubtotal()).toFixed(2)}
                    </Text>
                  </View>
                ) : null}

                {parseFloat(discount) > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                      -{currency}
                      {(parseFloat(discount) || 0).toFixed(2)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.summaryDivider} />

                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalValue}>
                    {currency}
                    {calculateGrandTotal().toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.saveQuoteBtn} onPress={handleSaveQuotation}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveQuoteText}>Save & Generate Quotation</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Add Item Modal */}
      <Modal
        visible={isItemModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Quotation Item</Text>
                <TouchableOpacity onPress={() => setIsItemModalVisible(false)}>
                  <Ionicons name="close-outline" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Item Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Website Design Service"
                    placeholderTextColor="#94A3B8"
                    value={itemName}
                    onChangeText={setItemName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    placeholder="e.g. Custom landing page & responsiveness"
                    placeholderTextColor="#94A3B8"
                    value={itemDescription}
                    onChangeText={setItemDescription}
                    multiline
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Unit Price ({currency}) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 450"
                      placeholderTextColor="#94A3B8"
                      value={itemPrice}
                      onChangeText={setItemPrice}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1"
                      placeholderTextColor="#94A3B8"
                      value={itemQuantity}
                      onChangeText={setItemQuantity}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.addItemSubmitBtn} onPress={handleAddItem}>
                <Text style={styles.addItemSubmitText}>Add to Quote</Text>
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
  listContainer: {
    padding: 16,
  },
  quoteCard: {
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
  quoteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteCardNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  quoteCardClient: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    marginTop: 2,
  },
  quoteCardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  quoteCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  quoteCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteCardDates: {
    flex: 1,
  },
  quoteCardDate: {
    fontSize: 11,
    color: '#64748B',
  },
  quoteCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareBtn: {
    backgroundColor: '#EEF2FF',
    marginRight: 8,
  },
  shareBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderWithBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  addTableItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addTableItemText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  noItemsContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noItemsText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemDescText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  itemPriceText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemSubtotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 8,
  },
  itemDeleteBtn: {
    padding: 2,
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
    marginBottom: 4,
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
  summaryBreakdown: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5',
  },
  saveQuoteBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveQuoteText: {
    color: '#FFF',
    fontSize: 15,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  addItemSubmitBtn: {
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  addItemSubmitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
