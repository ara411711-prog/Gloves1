export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category?: string;
  size?: 'S' | 'M' | 'L' | 'XL' | '';
  createdAt: number;
  updatedAt: number;
};

export type TransactionType = 'in' | 'out';

export type Transaction = {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  price: number; // Price at the time of transaction
  total: number;
  entityId?: string; // Supplier or Customer ID
  entityType?: 'supplier' | 'customer';
  date: number;
  notes?: string;
};

export type Entity = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: 'supplier' | 'customer';
  balance: number; // Positive means they owe us (customer), negative means we owe them (supplier)
  createdAt: number;
  updatedAt: number;
};
