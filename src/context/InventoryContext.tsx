import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, set, push, update, remove } from 'firebase/database';
import { db } from '../components/lib/firebase';
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
  deleteTransaction: (id: string, revertStock?: boolean) => Promise<void>;
  deleteTransactions: (ids: string[], revertStock?: boolean) => Promise<void>;
  clearTransactions: () => Promise<void>;
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
      
      const newProduct = {
        ...productData,
        createdAt: now,
        updatedAt: now,
      };
      
      // Remove undefined values for Firebase
      Object.keys(newProduct).forEach(key => {
        if ((newProduct as any)[key] === undefined) {
          delete (newProduct as any)[key];
        }
      });
      
      await set(newProductRef, newProduct);

      // Create an initial 'in' transaction if stock > 0
      if (newProduct.stock > 0) {
        const transactionsRef = ref(db, 'transactions');
        const newTransactionRef = push(transactionsRef);
        const transactionData = {
          productId: newProductRef.key,
          type: 'in',
          quantity: newProduct.stock,
          price: newProduct.cost,
          total: newProduct.stock * newProduct.cost,
          date: now,
          entityId: newProduct.supplierId || undefined,
        };
        
        // Remove undefined values
        Object.keys(transactionData).forEach(key => {
          if ((transactionData as any)[key] === undefined) {
            delete (transactionData as any)[key];
          }
        });
        
        await set(newTransactionRef, transactionData);
      }
    } catch (err) {
      console.error(err);
      throw new Error("فشل في إضافة المنتج");
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const productRef = ref(db, `products/${id}`);
      const updateData = {
        ...productData,
        updatedAt: Date.now(),
      };
      
      // Remove undefined values for Firebase
      Object.keys(updateData).forEach(key => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });
      
      await update(productRef, updateData);
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
      
      // Remove undefined values for Firebase
      Object.keys(newTransaction).forEach(key => {
        if ((newTransaction as any)[key] === undefined) {
          delete (newTransaction as any)[key];
        }
      });
      
      await set(newTransactionRef, newTransaction);
      
      // Update product stock
      const product = products.find(p => p.id === transactionData.productId);
      if (product) {
        const stockChange = transactionData.type === 'in' ? transactionData.quantity : -transactionData.quantity;
        await updateProduct(product.id, { stock: product.stock + stockChange });
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
      
      const newEntity = {
        ...entityData,
        createdAt: now,
        updatedAt: now,
      };
      
      // Remove undefined values for Firebase
      Object.keys(newEntity).forEach(key => {
        if ((newEntity as any)[key] === undefined) {
          delete (newEntity as any)[key];
        }
      });
      
      await set(newEntityRef, newEntity);
    } catch (err) {
      console.error(err);
      throw new Error("فشل في إضافة الجهة");
    }
  };

  const updateEntity = async (id: string, entityData: Partial<Entity>) => {
    try {
      const entityRef = ref(db, `entities/${id}`);
      const updateData = {
        ...entityData,
        updatedAt: Date.now(),
      };
      
      // Remove undefined values for Firebase
      Object.keys(updateData).forEach(key => {
        if ((updateData as any)[key] === undefined) {
          delete (updateData as any)[key];
        }
      });
      
      await update(entityRef, updateData);
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

  const deleteTransaction = async (id: string, revertStock: boolean = true) => {
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;

      const transactionRef = ref(db, `transactions/${id}`);
      
      // Revert stock if requested
      if (revertStock) {
        const product = products.find(p => p.id === transaction.productId);
        if (product) {
          const stockRevert = transaction.type === 'in' ? -transaction.quantity : transaction.quantity;
          await updateProduct(product.id, { stock: product.stock + stockRevert });
        }
      }

      await remove(transactionRef);
    } catch (err) {
      console.error(err);
      throw new Error("فشل في حذف العملية");
    }
  };

  const deleteTransactions = async (ids: string[], revertStock: boolean = true) => {
    try {
      for (const id of ids) {
        await deleteTransaction(id, revertStock);
      }
    } catch (err) {
      console.error(err);
      throw new Error("فشل في حذف العمليات");
    }
  };

  const clearTransactions = async () => {
    try {
      const transactionsRef = ref(db, 'transactions');
      await remove(transactionsRef);
    } catch (err) {
      console.error(err);
      throw new Error("فشل في مسح العمليات");
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
        deleteTransaction,
        deleteTransactions,
        clearTransactions,
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
