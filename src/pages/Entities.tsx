import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, Search, X, Phone, MapPin, MessageCircle, ChevronLeft } from 'lucide-react';
import { Entity } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { parseNumberInput } from '../utils/numbers';
import { useAndroidBack } from '../hooks/useAndroidBack';

export const Entities: React.FC = () => {
  const { entities, addEntity, updateEntity, deleteEntity } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as 'customer' | 'supplier',
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
      });
    } else {
      setEditingEntity(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: activeTab,
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
    };

    if (editingEntity) {
      await updateEntity(editingEntity.id, entityData);
    } else {
      await addEntity(entityData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (entityToDelete) {
      await deleteEntity(entityToDelete);
      setEntityToDelete(null);
    }
  };

  useAndroidBack(() => {
    setIsModalOpen(false);
    return true;
  }, isModalOpen);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel text-slate-100 p-4 pt-6 rounded-b-[2.5rem] z-10 shrink-0 border-t-0 border-x-0 relative">
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-3xl font-black tracking-tight text-white">الجهات</h1>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-sky-600 hover:bg-indigo-500 text-white p-3 rounded-2xl transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-black/20 p-1.5 rounded-2xl mb-4 border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'customer' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            العملاء
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'supplier' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            الموردين
          </button>
        </div>

        <div className="relative px-2 mb-2">
          <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder={`ابحث عن ${activeTab === 'customer' ? 'عميل' : 'مورد'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-4 pr-12 py-3.5 border border-white/10 rounded-2xl leading-5 bg-black/20 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all backdrop-blur-md shadow-inner"
          />
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Users className="w-16 h-16 mb-4 text-slate-700" />
            <p>لا توجد جهات مطابقة للبحث</p>
          </div>
        ) : (
          filteredEntities.map(entity => (
            <div key={entity.id} className="glass-card rounded-3xl p-5 relative overflow-hidden group hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link to={`/entities/${entity.id}`} className="group flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{entity.name}</h3>
                    <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                  <div className="flex items-center text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    <Phone className="w-3 h-3 ml-1.5" />
                    <span>{entity.phone || 'لا يوجد رقم'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenModal(entity)} className="p-2 text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition-colors border border-indigo-500/20">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEntityToDelete(entity.id)} className="p-2 text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {entity.address && (
                <div className="flex items-center text-xs text-slate-300 mb-4 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <MapPin className="w-4 h-4 ml-2 text-slate-400" />
                  <span>{entity.address}</span>
                </div>
              )}
              
              {entity.phone && (
                <div className="flex gap-3">
                  <a href={`tel:${entity.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 py-3 rounded-2xl transition-colors border border-white/10">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-bold">اتصال</span>
                  </a>
                  <a href={`https://wa.me/${entity.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-3 rounded-2xl transition-colors border border-emerald-500/20">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">واتساب</span>
                  </a>
                </div>
              )}
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
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">رقم الهاتف</label>
                    <input type="text" inputMode="decimal" value={formData.phone} onChange={e => setFormData({...formData, phone: parseNumberInput(e.target.value)})} className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-right bg-slate-800 text-slate-100" />
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

      <ConfirmModal
        isOpen={!!entityToDelete}
        title="حذف الجهة"
        message="هل أنت متأكد من رغبتك في حذف هذه الجهة؟ سيؤدي ذلك إلى إزالتها من النظام نهائياً."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setEntityToDelete(null)}
      />
    </div>
  );
};
