import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { AlertTriangle, Package, ChevronRight, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSizeColor } from '../utils/colors';

export const LowStock: React.FC = () => {
  const { products } = useInventory();
  const navigate = useNavigate();
  
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-red-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white">نواقص المخزن</h1>
          <p className="text-[10px] font-medium text-red-400 tracking-wider uppercase">المنتجات التي وصلت للحد الأدنى</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
              <Package className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-slate-300">المخزن مكتمل!</p>
            <p className="text-sm opacity-60">لا توجد منتجات تحت الحد الأدنى حالياً</p>
          </div>
        ) : (
          lowStockProducts.map(product => (
            <div key={product.id} className="glass-card p-5 rounded-[2.5rem] border-red-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <Box className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {product.category || 'بدون تصنيف'}
                      </span>
                      {product.size && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${getSizeColor(product.size)}`}>
                          {product.size}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">المتاح حالياً</p>
                  <p className="text-2xl font-black text-red-400 leading-none">{product.stock}</p>
                </div>
              </div>

              <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 font-bold">حالة المخزون</span>
                  <span className="text-xs text-red-400 font-black">تحت الحد الأدنى ({product.minStock})</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ width: `${Math.max((product.stock / product.minStock) * 100, 5)}%` }}
                  ></div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/reports', { state: { openAdd: 'in', productId: product.id } })}
                className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-2xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                تسجيل طلب شراء (تزويد المخزن)
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
