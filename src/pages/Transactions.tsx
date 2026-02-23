import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, ArrowUpRight, ArrowDownRight, Search, X, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Transactions: React.FC = () => {
  const { transactions, products, entities, addTransaction } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="flex flex-col h-full bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">العمليات</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => handleOpenModal('out')}
              className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-xl transition-colors shadow-sm flex items-center gap-1"
            >
              <ArrowDownRight className="w-5 h-5" />
              <span className="text-sm font-bold">بيع</span>
            </button>
            <button 
              onClick={() => handleOpenModal('in')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors shadow-sm flex items-center gap-1"
            >
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-sm font-bold">شراء</span>
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث في العمليات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-3 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              <div key={transaction.id} className="bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isOut ? 'bg-orange-950/50 text-orange-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                      {isOut ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100">{product?.name || 'منتج محذوف'}</h3>
                      <p className="text-xs text-slate-400">
                        {format(new Date(transaction.date), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${isOut ? 'text-orange-400' : 'text-emerald-400'}`} dir="ltr">
                      {isOut ? '-' : '+'}{transaction.quantity}
                    </p>
                    <p className="text-xs font-bold text-slate-100">{Math.round(transaction.total)} ج.م</p>
                  </div>
                </div>
                
                {(entity || transaction.notes) && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-sm">
                    {entity && (
                      <p className="text-slate-300">
                        <span className="text-slate-500 mr-1">{isOut ? 'العميل:' : 'المورد:'}</span>
                        {entity.name}
                      </p>
                    )}
                    {transaction.notes && (
                      <p className="text-slate-400 text-xs mt-1">{transaction.notes}</p>
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
                  <select 
                    required 
                    value={formData.productId} 
                    onChange={e => handleProductChange(e.target.value)} 
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100"
                  >
                    <option value="">اختر المنتج...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.size ? `(${p.size})` : ''} (المتاح: {p.stock})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الكمية *</label>
                    <input 
                      required 
                      type="number" 
                      min="1" 
                      max={transactionType === 'out' ? products.find(p => p.id === formData.productId)?.stock : undefined}
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">السعر للوحدة *</label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" 
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
                  <select 
                    value={formData.entityId} 
                    onChange={e => setFormData({...formData, entityId: e.target.value})} 
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100"
                  >
                    <option value="">بدون تحديد</option>
                    {entities
                      .filter(e => e.type === (transactionType === 'out' ? 'customer' : 'supplier'))
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))
                    }
                  </select>
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
    </div>
  );
};
