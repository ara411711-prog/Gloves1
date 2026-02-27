import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { Bell, Package, ArrowUpRight, ArrowDownRight, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { products, transactions, entities } = useInventory();

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
  
  const recentTransactions = transactions.slice(0, 5);
  const sortedProducts = [...products].sort((a, b) => b.stock - a.stock);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-sky-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel text-slate-100 p-6 pt-8 rounded-b-[2.5rem] z-10 shrink-0 relative border-t-0 border-x-0">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Gloves</h1>
            <p className="text-xs font-medium text-sky-400 tracking-wider uppercase">نظام إدارة المخزون</p>
          </div>
          <button className="relative p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors active:scale-95 border border-white/10 shadow-lg">
            <Bell className="w-5 h-5 text-slate-300" />
            {lowStockProducts.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            )}
          </button>
        </header>

        {/* Main Stat */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-800 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-xl -ml-8 -mb-8"></div>
          
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-indigo-100 text-sm font-medium mb-2 opacity-90">إجمالي قيمة المخزون</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-white tracking-tight">{Math.round(totalValue).toLocaleString()}</p>
                <span className="text-indigo-200 font-medium">ج.م</span>
              </div>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1 overflow-y-auto pb-28">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl mb-3 border border-indigo-500/20 text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{totalProducts}</p>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">المنتجات</span>
          </div>
          <div className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl mb-3 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{transactions.length}</p>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">العمليات</span>
          </div>
          <div className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="p-3 bg-blue-500/10 rounded-2xl mb-3 border border-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{entities.length}</p>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">الجهات</span>
          </div>
        </div>

        {/* Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-950/20 p-5 rounded-3xl border border-red-900/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-red-400">تنبيهات المخزون</h2>
            </div>
            <ul className="space-y-3">
              {lowStockProducts.slice(0, 3).map(product => (
                <li key={product.id} className="flex justify-between items-center text-sm bg-black/20 p-3 rounded-2xl border border-white/5">
                  <span className="text-red-200 font-medium">{product.name}</span>
                  <span className="font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-xl border border-red-500/20">
                    {product.stock} متبقي
                  </span>
                </li>
              ))}
              {lowStockProducts.length > 3 && (
                <li className="text-xs font-medium text-red-500/70 pt-2 text-center">
                  + {lowStockProducts.length - 3} منتجات أخرى
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Inventory Status */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
            حالة المخزون
          </h2>
          <div className="glass-card rounded-3xl overflow-hidden mb-6">
            <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto">
              {sortedProducts.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">لا توجد منتجات مسجلة</p>
              ) : (
                sortedProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                        <Package className="w-5 h-5 text-indigo-300" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">
                          {product.name} {product.size && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md ml-1">{product.size}</span>}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">{product.category || 'بدون تصنيف'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-black text-lg ${product.stock <= product.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                        {product.stock}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">متبقي</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            أحدث العمليات
          </h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">لا توجد عمليات مسجلة</p>
            ) : (
              recentTransactions.map(transaction => {
                const product = products.find(p => p.id === transaction.productId);
                const isOut = transaction.type === 'out';
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 glass-card rounded-3xl group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl border ${isOut ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {isOut ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 text-sm">{product?.name || 'منتج غير معروف'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {format(new Date(transaction.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-black text-lg ${isOut ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {transaction.quantity} {isOut ? '-' : '+'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{Math.round(transaction.total).toLocaleString()} ج.م</p>
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
