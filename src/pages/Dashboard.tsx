import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Bell, Package, ArrowUpRight, ArrowDownRight, AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { products, transactions, entities } = useInventory();

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
  
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 relative border-b border-slate-800">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gloves</h1>
            <p className="text-sm text-indigo-400">نظام إدارة المخزون</p>
          </div>
          <button className="relative p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors active:scale-95">
            <Bell className="w-6 h-6 text-indigo-400" />
            {lowStockProducts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
            )}
          </button>
        </header>

        {/* Main Stat */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <p className="text-slate-400 text-sm mb-1">إجمالي قيمة المخزون (بالتكلفة)</p>
          <p className="text-3xl font-bold">{Math.round(totalValue)} <span className="text-lg font-normal text-slate-500">ج.م</span></p>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto -mt-4 pt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-indigo-950/50 rounded-xl mb-2">
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-xl font-bold text-slate-100">{totalProducts}</p>
            <span className="text-xs font-medium text-slate-400">المنتجات</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-emerald-950/50 rounded-xl mb-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-slate-100">{transactions.length}</p>
            <span className="text-xs font-medium text-slate-400">العمليات</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-2 bg-blue-950/50 rounded-xl mb-2">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-slate-100">{entities.length}</p>
            <span className="text-xs font-medium text-slate-400">الجهات</span>
          </div>
        </div>

        {/* Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-950/30 p-4 rounded-2xl border border-red-900/50 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-red-400">تنبيهات المخزون</h2>
            </div>
            <ul className="space-y-2">
              {lowStockProducts.slice(0, 3).map(product => (
                <li key={product.id} className="flex justify-between items-center text-sm">
                  <span className="text-red-300">{product.name}</span>
                  <span className="font-medium text-red-400 bg-red-950/50 px-2 py-0.5 rounded-md">
                    {product.stock} متبقي
                  </span>
                </li>
              ))}
              {lowStockProducts.length > 3 && (
                <li className="text-xs text-red-500 pt-1">
                  + {lowStockProducts.length - 3} منتجات أخرى
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <h2 className="text-lg font-bold text-slate-100 mb-4">أحدث العمليات</h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">لا توجد عمليات مسجلة</p>
            ) : (
              recentTransactions.map(transaction => {
                const product = products.find(p => p.id === transaction.productId);
                const isOut = transaction.type === 'out';
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isOut ? 'bg-orange-950/50 text-orange-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                        {isOut ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">{product?.name || 'منتج غير معروف'}</p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(transaction.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-bold ${isOut ? 'text-orange-400' : 'text-emerald-400'}`} dir="ltr">
                        {isOut ? '-' : '+'}{transaction.quantity}
                      </p>
                      <p className="text-xs text-slate-400">{Math.round(transaction.total)} ج.م</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
