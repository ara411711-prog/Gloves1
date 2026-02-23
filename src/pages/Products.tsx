import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, Edit2, Trash2, Package, Search, X } from 'lucide-react';
import { Product } from '../types';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">المنتجات</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-3 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Package className="w-16 h-16 mb-4 text-slate-700" />
            <p>لا توجد منتجات مطابقة للبحث</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const isLowStock = product.stock <= product.minStock;
            return (
              <div key={product.id} className="bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-800 relative overflow-hidden">
                {isLowStock && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                      {product.name}
                      {product.size && (
                        <span className="text-xs bg-slate-800 text-indigo-400 px-2 py-1 rounded-md border border-slate-700">
                          {product.size}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">{product.category || 'بدون تصنيف'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(product)} className="p-1.5 text-indigo-400 bg-indigo-950/50 rounded-lg hover:bg-indigo-900 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-400 bg-red-950/50 rounded-lg hover:bg-red-900 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-slate-800/50 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">المخزون</p>
                    <p className={`font-bold ${isLowStock ? 'text-red-400' : 'text-slate-100'}`}>{product.stock}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">سعر الشراء</p>
                    <p className="font-bold text-slate-100">{Math.round(product.cost)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 mb-1">سعر البيع</p>
                    <p className="font-bold text-indigo-400">{Math.round(product.price)}</p>
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
                    <select value={formData.size} onChange={e => setFormData({...formData, size: e.target.value as any})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100">
                      <option value="">بدون حجم</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الحد الأدنى للمخزون</label>
                  <input required type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">سعر الشراء (التكلفة) *</label>
                    <input required type="number" min="0" step="1" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">سعر البيع *</label>
                    <input required type="number" min="0" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الكمية الحالية في المخزون *</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
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
    </div>
  );
};

