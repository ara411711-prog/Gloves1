import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, ArrowUpRight, ArrowDownRight, Search, X, ArrowRightLeft, Trash2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ConfirmModal } from '../components/ConfirmModal';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { parseNumberInput } from '../utils/numbers';
import { useAndroidBack } from '../hooks/useAndroidBack';

export const Transactions: React.FC = () => {
  const { transactions, products, entities, addTransaction, clearTransactions } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [isEntitySelectOpen, setIsEntitySelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('out');

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    price: '',
    entityId: '',
    notes: '',
  });

  const filteredTransactions = transactions.filter(t => {
    const product = products.find(p => p.id === t.productId);
    const entity = entities.find(e => e.id === t.entityId);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      (product && product.name.toLowerCase().includes(searchLower)) ||
      (entity && entity.name.toLowerCase().includes(searchLower)) ||
      (t.notes && t.notes.toLowerCase().includes(searchLower))
    );
  });

  const handleOpenModal = (type: 'in' | 'out') => {
    setTransactionType(type);
    setFormData({
      productId: '',
      quantity: '',
      price: '',
      entityId: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        price: transactionType === 'out' ? product.price.toString() : product.cost.toString()
      }));
    } else {
      setFormData(prev => ({ ...prev, productId, price: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseInt(formData.quantity) || 0;
    const price = Math.round(parseFloat(formData.price) || 0);
    
    const transactionData = {
      productId: formData.productId,
      type: transactionType,
      quantity,
      price,
      total: quantity * price,
      entityId: formData.entityId || undefined,
      entityType: formData.entityId ? entities.find(e => e.id === formData.entityId)?.type : undefined,
      notes: formData.notes,
    };

    await addTransaction(transactionData);
    setIsModalOpen(false);
  };

  const handleClearTransactions = async () => {
    await clearTransactions();
  };

  const productOptions: SelectOption[] = products.map(p => ({
    id: p.id,
    label: `${p.name} ${p.size ? `(${p.size})` : ''}`,
    subLabel: `المتاح: ${p.stock} | السعر: ${transactionType === 'out' ? p.price : p.cost} ج.م`,
    badge: p.stock <= p.minStock ? 'مخزون منخفض' : undefined,
    badgeColor: p.stock <= p.minStock ? 'red' : 'emerald'
  }));

  const entityOptions: SelectOption[] = [
    { id: '', label: 'بدون تحديد' },
    ...entities
      .filter(e => e.type === (transactionType === 'out' ? 'customer' : 'supplier'))
      .map(e => ({
        id: e.id,
        label: e.name,
        subLabel: e.phone || undefined,
      }))
  ];

  useAndroidBack(() => {
    setIsModalOpen(false);
    return true;
  }, isModalOpen);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel text-slate-100 p-4 pt-6 rounded-b-[2.5rem] z-10 shrink-0 border-t-0 border-x-0 relative">
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-3xl font-black tracking-tight text-white">العمليات</h1>
          <div className="flex gap-2">
            {transactions.length > 0 && (
              <button 
                onClick={() => setIsClearModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-2xl transition-colors shadow-sm flex items-center justify-center border border-red-500/20 active:scale-95"
                title="تنظيف العمليات"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => handleOpenModal('out')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 active:scale-95 border border-orange-400/30"
            >
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm font-bold">تسجيل بيع</span>
            </button>
          </div>
        </div>
        
        <div className="relative px-2 mb-2">
          <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث في العمليات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-4 pr-12 py-3.5 border border-white/10 rounded-2xl leading-5 bg-black/20 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all backdrop-blur-md shadow-inner"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ArrowRightLeft className="w-16 h-16 mb-4 text-slate-700" />
            <p>لا توجد عمليات مطابقة للبحث</p>
          </div>
        ) : (
          filteredTransactions.map(transaction => {
            const product = products.find(p => p.id === transaction.productId);
            const entity = entities.find(e => e.id === transaction.entityId);
            const isOut = transaction.type === 'out';
            
            return (
              <div key={transaction.id} className="glass-card rounded-3xl p-4 relative overflow-hidden group hover:bg-white/5 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border ${isOut ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {isOut ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{product?.name || 'منتج محذوف'}</h3>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                        {format(new Date(transaction.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${isOut ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {transaction.quantity} {isOut ? '-' : '+'}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">{Math.round(transaction.total).toLocaleString()} ج.م</p>
                  </div>
                </div>
                
                {(entity || transaction.notes) && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-sm bg-black/10 -mx-4 -mb-4 px-4 pb-4">
                    {entity && (
                      <p className="text-slate-300 flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">{isOut ? 'العميل' : 'المورد'}</span>
                        <span className="font-medium">{entity.name}</span>
                      </p>
                    )}
                    {transaction.notes && (
                      <p className="text-slate-400 text-xs mt-2 italic border-r-2 border-slate-700 pr-2">{transaction.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-slate-100">
                {transactionType === 'out' ? 'تسجيل عملية بيع' : 'تسجيل عملية شراء'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">المنتج *</label>
                  <button
                    type="button"
                    onClick={() => setIsProductSelectOpen(true)}
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 flex justify-between items-center"
                  >
                    <span className={formData.productId ? 'text-slate-100' : 'text-slate-400'}>
                      {formData.productId 
                        ? productOptions.find(o => o.id === formData.productId)?.label || 'منتج غير معروف'
                        : 'اختر المنتج...'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الكمية *</label>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      value={formData.quantity} 
                      onChange={e => {
                        const val = parseNumberInput(e.target.value);
                        const max = transactionType === 'out' ? products.find(p => p.id === formData.productId)?.stock : undefined;
                        if (max !== undefined && parseInt(val) > max) {
                          setFormData({...formData, quantity: max.toString()});
                        } else {
                          setFormData({...formData, quantity: val});
                        }
                      }} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">السعر للوحدة *</label>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseNumberInput(e.target.value)})} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" 
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50">
                  <span className="text-sm font-medium text-slate-300">الإجمالي:</span>
                  <span className="font-bold text-lg text-indigo-400">
                    {Math.round((parseFloat(formData.price) || 0) * (parseInt(formData.quantity) || 0))} ج.م
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {transactionType === 'out' ? 'العميل (اختياري)' : 'المورد (اختياري)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEntitySelectOpen(true)}
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 flex justify-between items-center"
                  >
                    <span className={formData.entityId ? 'text-slate-100' : 'text-slate-400'}>
                      {formData.entityId 
                        ? entityOptions.find(o => o.id === formData.entityId)?.label || 'جهة غير معروفة'
                        : 'بدون تحديد'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ملاحظات</label>
                  <textarea 
                    rows={2} 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-800 text-slate-100"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe shrink-0">
              <button 
                type="submit" 
                form="transaction-form" 
                className={`w-full text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98] ${
                  transactionType === 'out' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="تنظيف سجل العمليات"
        message="هل أنت متأكد من رغبتك في مسح جميع العمليات المسجلة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="مسح الكل"
        onConfirm={handleClearTransactions}
        onCancel={() => setIsClearModalOpen(false)}
      />

      <SelectModal
        isOpen={isProductSelectOpen}
        title="اختر المنتج"
        options={productOptions}
        value={formData.productId}
        onChange={handleProductChange}
        onClose={() => setIsProductSelectOpen(false)}
        searchPlaceholder="ابحث عن منتج..."
      />

      <SelectModal
        isOpen={isEntitySelectOpen}
        title={transactionType === 'out' ? 'اختر العميل' : 'اختر المورد'}
        options={entityOptions}
        value={formData.entityId}
        onChange={(val) => setFormData({ ...formData, entityId: val })}
        onClose={() => setIsEntitySelectOpen(false)}
        searchPlaceholder={transactionType === 'out' ? 'ابحث عن عميل...' : 'ابحث عن مورد...'}
      />
    </div>
  );
};
