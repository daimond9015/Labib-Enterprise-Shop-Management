export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  dateAdded: string;
}

export interface CartItem {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  dateAdded: string;
  cartQuantity: number;
  cost: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  discount: number;
  finalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Due';
  customerName?: string;
  customerId?: string;
  date: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dueAmount: number;
  payments?: Payment[];
}

export type Theme = 'light' | 'dark' | 'system';