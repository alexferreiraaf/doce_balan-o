import type { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'fiado';
export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  discount?: number;
  deliveryFee?: number;
  additionalDescription?: string;
  additionalValue?: number;
  paymentMethod?: PaymentMethod;
  status: TransactionStatus;
  customerId?: string;
  timestamp: Timestamp;
  dateMs: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}
