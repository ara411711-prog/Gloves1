import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { Bell, Package, ArrowUpRight, ArrowDownRight, AlertTriangle, Users, TrendingUp, ChevronLeft, Box, Boxes, LayoutGrid, Wallet, Layers, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getSizeColor } from '../utils/colors';

export const Dashboard: React.FC = () => {
  const { products, transactions, entities } = useInventory();
  const navigate = useNavigate();

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  
  const sortedProducts = [...products].sort((a, b) => b.stock - a.stock);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-sky-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">Gloves</h1>
          <p className="text-[10px] font-medium text-sky-400 tracking-wider uppercase">نظام إدارة المخزون الاحترافي</p>
        </div>
        <div className="flex gap-2">
          <button className="relative p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors active:scale-95 border border-white/10">
            <Bell className="w-5 h-5 text-slate-300" />
            {lowStockProducts.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Stats Summary Panel */}
        <div className="glass-panel text-slate-100 p-6 rounded-b-[2.5rem] relative border-t-0 border-x-0 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl group">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all"></div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                  <Layers className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-sky-100/60 text-[10px] font-bold uppercase tracking-widest">إجمالي القطع</p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-white tracking-tight">{totalItems.toLocaleString()}</p>
                <span className="text-sky-400 text-[10px] font-bold">قطعة</span>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl group">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest">قيمة المخزن</p>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-white tracking-tight">{Math.round(totalValue).toLocaleString()}</p>
                <span className="text-emerald-400 text-[10px] font-bold">ج.م</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 space-y-6">
          {/* New Transaction Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/reports', { state: { openAdd: 'out' } })}
              className="flex-1 text-xs font-bold text-sky-400 bg-sky-500/10 px-4 py-3 rounded-xl border border-sky-500/20 active:scale-95 transition-all"
            >
              تسجيل بيع جديد
            </button>

            <button 
              onClick={() => navigate('/products', { state: { openAdd: true } })}
              className="flex-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 active:scale-95 transition-all"
            >
              تسجيل شراء جديد
            </button>
          </div>

        {/* Quick Actions / Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => navigate('/products')}
            className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group active:scale-95 transition-all"
          >
            <div className="p-3 bg-sky-500/10 rounded-2xl mb-2 border border-sky-500/20 text-sky-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <p className="text-xl font-black text-white">{totalProducts}</p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">نوع منتج</span>
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group active:scale-95 transition-all"
          >
            <div className="p-3 bg-emerald-500/10 rounded-2xl mb-2 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xl font-black text-white">{transactions.length}</p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">عملية</span>
          </button>

          <button 
            onClick={() => navigate('/low-stock')}
            className="glass-card p-4 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden group active:scale-95 transition-all"
          >
            <div className="p-3 bg-amber-500/10 rounded-2xl mb-2 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xl font-black text-white">{lowStockProducts.length}</p>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">نواقص</span>
          </button>
        </div>

        {/* Inventory Status Section */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              توزيع المخزون
            </h2>
            <button 
              onClick={() => navigate('/products')}
              className="text-[10px] font-bold text-sky-400 flex items-center gap-1 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 active:scale-95"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {sortedProducts.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl text-center">
                <Boxes className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                <p className="text-sm text-slate-500">لا توجد منتجات مسجلة</p>
              </div>
            ) : (
              sortedProducts.slice(0, 8).map(product => (
                <div key={product.id} className="glass-card p-4 rounded-3xl flex justify-between items-center group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-sky-500/30 transition-colors">
                        <Box className="w-5 h-5 text-sky-300" />
                      </div>
                      {product.stock <= product.minStock && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-sm">
                        {product.name}
                        {product.size && (
                          <span className={`mr-2 text-[9px] font-black px-2 py-0.5 rounded-lg border ${getSizeColor(product.size)}`}>
                            {product.size}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
                        {product.category || 'عام'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-baseline gap-1 justify-end">
                      <p className={`text-xl font-black ${product.stock <= product.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                        {product.stock}
                      </p>
                      <span className="text-[9px] font-bold text-slate-500">قطعة</span>
                    </div>
                    <div className="w-20 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${product.stock <= product.minStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((product.stock / (product.minStock * 3)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {sortedProducts.length > 8 && (
              <button 
                onClick={() => navigate('/products')}
                className="w-full py-4 text-xs font-bold text-slate-400 hover:text-sky-400 transition-colors"
              >
                + {sortedProducts.length - 8} منتجات أخرى...
              </button>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-red-950/20 p-5 rounded-3xl border border-red-900/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-red-400">تنبيهات النواقص</h2>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex justify-between items-center text-xs bg-black/20 p-3 rounded-2xl border border-white/5">
                  <span className="text-red-200 font-bold">{product.name}</span>
                  <span className="font-black text-red-400">
                    {product.stock} متبقي
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
