import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, Edit2, Trash2, Package, Search, X, Copy, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { parseNumberInput } from '../utils/numbers';
import { useAndroidBack } from '../hooks/useAndroidBack';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSizeSelectOpen, setIsSizeSelectOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '',
    size: '' as 'S' | 'M' | 'L' | 'XL' | '',
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        category: product.category || '',
        size: product.size || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '5',
        category: '',
        size: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    setEditingProduct(null);
    setFormData({
      name: `${product.name} (نسخة)`,
      description: product.description || '',
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      category: product.category || '',
      size: product.size || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      description: formData.description,
      price: Math.round(parseFloat(formData.price) || 0),
      cost: Math.round(parseFloat(formData.cost) || 0),
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      category: formData.category,
      size: formData.size,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  const sizeOptions: SelectOption[] = [
    { id: '', label: 'بدون حجم' },
    { id: 'S', label: 'S (صغير)' },
    { id: 'M', label: 'M (متوسط)' },
    { id: 'L', label: 'L (كبير)' },
    { id: 'XL', label: 'XL (كبير جداً)' },
    { id: 'XXL', label: 'XXL' },
  ];

  useAndroidBack(() => {
    setIsModalOpen(false);
    return true;
  }, isModalOpen);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel text-slate-100 p-4 pt-6 rounded-b-[2.5rem] z-10 shrink-0 border-t-0 border-x-0 relative">
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-3xl font-black tracking-tight text-white">المنتجات</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative px-2 mb-2">
          <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-4 pr-12 py-3.5 border border-white/10 rounded-2xl leading-5 bg-black/20 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all backdrop-blur-md shadow-inner"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Package className="w-16 h-16 mb-4 text-slate-700" />
            <p>لا توجد منتجات مطابقة للبحث</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const isLowStock = product.stock <= product.minStock;
            return (
              <div key={product.id} className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:bg-white/5 transition-colors">
                {isLowStock && (
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-red-500 to-red-600"></div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-1">
                      {product.name}
                      {product.size && (
                        <span className="text-[10px] font-medium bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          {product.size}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{product.category || 'بدون تصنيف'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDuplicate(product)} className="p-2 text-emerald-400 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20" title="تكرار المنتج">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenModal(product)} className="p-2 text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition-colors border border-indigo-500/20" title="تعديل">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setProductToDelete(product.id)} className="p-2 text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/20 p-3 rounded-2xl text-center border border-white/5">
                    <p className="text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">المخزون</p>
                    <p className={`font-black text-lg ${isLowStock ? 'text-red-400' : 'text-white'}`}>{product.stock}</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl text-center border border-white/5">
                    <p className="text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">سعر الشراء</p>
                    <p className="font-bold text-slate-300">{Math.round(product.cost)}</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-2xl text-center border border-white/5">
                    <p className="text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">سعر البيع</p>
                    <p className="font-black text-indigo-400">{Math.round(product.price)}</p>
                  </div>
                </div>
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
              <h2 className="text-lg font-bold text-slate-100">{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">اسم المنتج *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">التصنيف</label>
                    <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الحجم</label>
                    <button
                      type="button"
                      onClick={() => setIsSizeSelectOpen(true)}
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 flex justify-between items-center"
                    >
                      <span className={formData.size ? 'text-slate-100' : 'text-slate-400'}>
                        {formData.size 
                          ? sizeOptions.find(o => o.id === formData.size)?.label || formData.size
                          : 'بدون حجم'}
                      </span>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الحد الأدنى للمخزون</label>
                  <input required type="text" inputMode="decimal" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseNumberInput(e.target.value)})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">سعر الشراء (التكلفة) *</label>
                    <input required type="text" inputMode="decimal" value={formData.cost} onChange={e => setFormData({...formData, cost: parseNumberInput(e.target.value)})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">سعر البيع *</label>
                    <input required type="text" inputMode="decimal" value={formData.price} onChange={e => setFormData({...formData, price: parseNumberInput(e.target.value)})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الكمية الحالية في المخزون *</label>
                  <input required type="text" inputMode="decimal" value={formData.stock} onChange={e => setFormData({...formData, stock: parseNumberInput(e.target.value)})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">وصف المنتج (اختياري)</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-800 text-slate-100"></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe shrink-0">
              <button type="submit" form="product-form" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98]">
                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!productToDelete}
        title="حذف المنتج"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setProductToDelete(null)}
      />

      <SelectModal
        isOpen={isSizeSelectOpen}
        title="اختر الحجم"
        options={sizeOptions}
        value={formData.size}
        onChange={(val) => setFormData({ ...formData, size: val as any })}
        onClose={() => setIsSizeSelectOpen(false)}
        searchable={false}
      />
    </div>
  );
};

