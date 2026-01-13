'use client';
import type { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'fiado';
export type TransactionStatus = 'paid' | 'pending';

export interface SelectedOptional extends Optional {
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

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
  selectedOptionals?: SelectedOptional[];
  cartItems?: CartItem[];
  downPayment?: number;
  paymentMethod?: PaymentMethod | null;
  status: TransactionStatus;
  customerId?: string;
  timestamp: Timestamp;
  dateMs: number;
  receiptUrl?: string;
  fromStorefront?: boolean;
  scheduledAt?: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isPromotion?: boolean;
  salesCount?: number;
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

export interface Optional {
  id: string;
  name: string;
  price: number;
}

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface OpeningHours {
  enabled: boolean;
  open: string;
  close: string;
}

export interface AppSettings {
  pixKey?: string;
  address?: string;
  phone?: string;
  openingHours?: Record<DayOfWeek, OpeningHours>;
}

    