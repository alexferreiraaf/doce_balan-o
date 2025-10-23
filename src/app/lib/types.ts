import type { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  discount?: number;
  deliveryFee?: number;
  timestamp: Timestamp;
  dateMs: number;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
}
