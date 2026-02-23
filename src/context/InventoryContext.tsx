import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, set, push, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { Product, Transaction, Entity } from '../types';

type InventoryContextType = {
  products: Product[];
  transactions: Transaction[];
  entities: Entity[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => Promise<void>;
  addEntity: (entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntity: (id: string, entity: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const transactionsRef = ref(db, 'transactions');
    const entitiesRef = ref(db, 'entities');

    let isMounted = true;

    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (!isMounted) return;
      const data = snapshot.val();
      if (data) {
        const productList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setProducts(productList);
      } else {
        setProducts([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("فشل في جلب المنتجات");
      setLoading(false);
    });

    const unsubscribeTransactions = onValue(transactionsRef, (snapshot) => {
      if (!isMounted) return;
      const data = snapshot.val();
      if (data) {
        const transactionList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by date descending
        transactionList.sort((a, b) => b.date - a.date);
        setTransactions(transactionList);
      } else {
        setTransactions([]);
      }
    });

    const unsubscribeEntities = onValue(entitiesRef, (snapshot) => {
      if (!isMounted) return;
      const data = snapshot.val();
      if (data) {
        const entityList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setEntities(entityList);
      } else {
        setEntities([]);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeProducts();
      unsubscribeTransactions();
      unsubscribeEntities();
    };
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const productsRef = ref(db, 'products');
      const newProductRef = push(productsRef);
      const now = Date.now();
      await set(newProductRef, {
        ...productData,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.error(err);
      throw new Error("فشل في إضافة المنتج");
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const productRef = ref(db, `products/${id}`);
      await update(productRef, {
        ...productData,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
      throw new Error("فشل في تحديث المنتج");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const productRef = ref(db, `products/${id}`);
      await remove(productRef);
    } catch (err) {
      console.error(err);
      throw new Error("فشل في حذف المنتج");
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    try {
      const transactionsRef = ref(db, 'transactions');
      const newTransactionRef = push(transactionsRef);
      const now = Date.now();
      
      const newTransaction = {
        ...transactionData,
        date: now,
      };
      
      await set(newTransactionRef, newTransaction);
      
      // Update product stock
      const product = products.find(p => p.id === transactionData.productId);
      if (product) {
        const stockChange = transactionData.type === 'in' ? transactionData.quantity : -transactionData.quantity;
        await updateProduct(product.id, { stock: product.stock + stockChange });
      }

      // Update entity balance if applicable
      if (transactionData.entityId) {
        const entity = entities.find(e => e.id === transactionData.entityId);
        if (entity) {
          // If we sell to customer (type 'out'), they owe us money (balance increases)
          // If we buy from supplier (type 'in'), we owe them money (balance decreases)
          const balanceChange = transactionData.type === 'out' ? transactionData.total : -transactionData.total;
          await updateEntity(entity.id, { balance: entity.balance + balanceChange });
        }
      }

    } catch (err) {
      console.error(err);
      throw new Error("فشل في تسجيل العملية");
    }
  };

  const addEntity = async (entityData: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const entitiesRef = ref(db, 'entities');
      const newEntityRef = push(entitiesRef);
      const now = Date.now();
      await set(newEntityRef, {
        ...entityData,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      console.error(err);
      throw new Error("فشل في إضافة الجهة");
    }
  };

  const updateEntity = async (id: string, entityData: Partial<Entity>) => {
    try {
      const entityRef = ref(db, `entities/${id}`);
      await update(entityRef, {
        ...entityData,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error(err);
      throw new Error("فشل في تحديث الجهة");
    }
  };

  const deleteEntity = async (id: string) => {
    try {
      const entityRef = ref(db, `entities/${id}`);
      await remove(entityRef);
    } catch (err) {
      console.error(err);
      throw new Error("فشل في حذف الجهة");
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        transactions,
        entities,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        addTransaction,
        addEntity,
        updateEntity,
        deleteEntity,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
