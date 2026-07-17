import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessProfile, Quotation, Transaction, Order } from '../types';

const PROFILE_KEY = '@profile_settings';
const QUOTATIONS_KEY = '@quotations_list';
const TRANSACTIONS_KEY = '@transactions_list';
const ORDERS_KEY = '@orders_list';

export const saveBusinessProfile = async (profile: BusinessProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving business profile:', error);
  }
};

export const getBusinessProfile = async (): Promise<BusinessProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading business profile:', error);
    return null;
  }
};

export const saveQuotations = async (quotations: Quotation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUOTATIONS_KEY, JSON.stringify(quotations));
  } catch (error) {
    console.error('Error saving quotations:', error);
  }
};

export const getQuotations = async (): Promise<Quotation[]> => {
  try {
    const data = await AsyncStorage.getItem(QUOTATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading quotations:', error);
    return [];
  }
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving orders:', error);
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const data = await AsyncStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
};

