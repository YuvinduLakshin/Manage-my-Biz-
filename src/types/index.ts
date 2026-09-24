export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  logo: string | null; // Logo URI or Base64
}

export interface QuotationItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  discount: number; // raw value
  taxRate: number; // percentage
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'outgoing';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export type OrderStatus = 'pending' | 'ongoing' | 'pending_handover' | 'closed';

export interface OrderTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  description: string;
  amount: number;
  status: OrderStatus;
  date: string;
  notes: string;
  tasks?: OrderTask[];
}

export type AppTab = 'dashboard' | 'quotation' | 'orders' | 'finance' | 'settings';

