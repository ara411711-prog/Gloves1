import React, { useState, useMemo } from 'react';
import { Search, X, Check, Package, AlertCircle } from 'lucide-react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { Product } from '../types';
import { getSizeColor } from '../utils/colors';

interface ProductPickerModalProps {
  isOpen: boolean;
  products: Product[];
  selectedId: string;
  onSelect: (productId: string) => void;
  onClose: () => void;
  transactionType: 'in' | 'out';
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  products,
  selectedId,
  onSelect,
  onClose,
  transactionType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(
      p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
        (p.size && p.size.toLowerCase().includes(lowerQuery))
    );
  }, [products, searchQuery]);

  useAndroidBack(() => {
    onClose();
    return true;
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">اختر المنتج</h2>
            <p className="text-xs text-slate-400 mt-0.5">اختر من قائمة المنتجات المتاحة</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 shrink-0 bg-slate-900/30">
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-sky-400 group-focus-within:text-sky-300 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن اسم المنتج أو التصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-4 pr-12 py-4 border border-white/10 rounded-2xl leading-5 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 sm:text-sm transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Package className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">لا توجد منتجات مطابقة</p>
              <p className="text-sm opacity-60">جرب البحث بكلمات أخرى</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedId === product.id;
              const isLowStock = product.stock <= product.minStock;
              const price = transactionType === 'out' ? product.price : product.cost;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-right group relative overflow-hidden ${
                    isSelected 
                      ? 'bg-sky-500/20 border-2 border-sky-500/50' 
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
                  )}

                  {/* Product Icon/Visual */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-90 ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Package className="w-7 h-7" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-black text-base truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {product.name}
                      </h3>
                      <span className="text-sky-400 font-black text-sm whitespace-nowrap">
                        {price.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {product.size && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getSizeColor(product.size)}`}>
                          {product.size}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <span className={`text-xs font-bold ${isLowStock ? 'text-red-400' : 'text-slate-400'}`}>
                          المخزون: {product.stock}
                        </span>
                        {isLowStock && (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>

                      {product.category && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          • {product.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/30">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-black/20 border-t border-white/5 text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            إجمالي المنتجات: {products.length}
          </p>
        </div>
      </div>
    </div>
  );
};
