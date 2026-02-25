import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Search, X, Phone, MapPin, MessageCircle, ChevronLeft } from 'lucide-react';
import { Entity } from '../types';

export const Entities: React.FC = () => {
  const { entities, addEntity, updateEntity, deleteEntity } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as 'customer' | 'supplier',
    balance: '0',
  });

  const filteredEntities = entities.filter(e => 
    e.type === activeTab &&
    (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.phone && e.phone.includes(searchQuery)))
  );

  const handleOpenModal = (entity?: Entity) => {
    if (entity) {
      setEditingEntity(entity);
      setFormData({
        name: entity.name,
        phone: entity.phone || '',
        email: entity.email || '',
        address: entity.address || '',
        type: entity.type,
        balance: entity.balance.toString(),
      });
    } else {
      setEditingEntity(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: activeTab,
        balance: '0',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entityData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      type: formData.type,
      balance: Math.round(parseFloat(formData.balance) || 0),
    };

    if (editingEntity) {
      await updateEntity(editingEntity.id, entityData);
    } else {
      await addEntity(entityData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الجهة؟')) {
      await deleteEntity(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">الجهات</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-4 border border-slate-700">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'customer' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            العملاء
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'supplier' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            الموردين
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder={`ابحث عن ${activeTab === 'customer' ? 'عميل' : 'مورد'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-3 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Users className="w-16 h-16 mb-4 text-slate-700" />
            <p>لا توجد جهات مطابقة للبحث</p>
          </div>
        ) : (
          filteredEntities.map(entity => (
            <div key={entity.id} className="bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Link to={`/entities/${entity.id}`} className="group flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-lg group-hover:text-indigo-400 transition-colors">{entity.name}</h3>
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                  <div className="flex items-center text-xs text-slate-400 mt-1">
                    <Phone className="w-3 h-3 ml-1" />
                    <span dir="ltr">{entity.phone || 'لا يوجد رقم'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(entity)} className="p-1.5 text-indigo-400 bg-indigo-950/50 rounded-lg hover:bg-indigo-900 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(entity.id)} className="p-1.5 text-red-400 bg-red-950/50 rounded-lg hover:bg-red-900 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {entity.address && (
                <div className="flex items-center text-xs text-slate-400 mb-3">
                  <MapPin className="w-3 h-3 ml-1" />
                  <span>{entity.address}</span>
                </div>
              )}
              
              {entity.phone && (
                <div className="flex gap-2 mb-3">
                  <a href={`tel:${entity.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl transition-colors border border-slate-700">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">اتصال</span>
                  </a>
                  <a href={`https://wa.me/${entity.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 py-2 rounded-xl transition-colors border border-emerald-900/50">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">واتساب</span>
                  </a>
                </div>
              )}
              
              <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center mt-3 border border-slate-700/50">
                <span className="text-sm text-slate-400">الرصيد</span>
                <span className={`font-bold ${entity.balance > 0 ? 'text-emerald-400' : entity.balance < 0 ? 'text-red-400' : 'text-slate-100'}`} dir="ltr">
                  {Math.round(Math.abs(entity.balance))} ج.م
                  <span className="text-xs mr-1 text-slate-500 font-normal">
                    {entity.balance > 0 ? '(لنا)' : entity.balance < 0 ? '(علينا)' : ''}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-slate-100">
                {editingEntity ? 'تعديل بيانات' : `إضافة ${activeTab === 'customer' ? 'عميل' : 'مورد'} جديد`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form id="entity-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">الاسم *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">رقم الهاتف</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left bg-slate-800 text-slate-100" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الرصيد الافتتاحي</label>
                    <input type="number" step="1" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                    <p className="text-[10px] text-slate-500 mt-1">موجب = لنا، سالب = علينا</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">العنوان</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100" />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe shrink-0">
              <button type="submit" form="entity-form" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98]">
                {editingEntity ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
