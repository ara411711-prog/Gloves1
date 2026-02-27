import React, { useState, useMemo } from 'react';
import { Search, X, Check, User, Phone, MapPin } from 'lucide-react';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { Entity } from '../types';

interface EntityPickerModalProps {
  isOpen: boolean;
  entities: Entity[];
  selectedId: string;
  onSelect: (entityId: string) => void;
  onClose: () => void;
  title: string;
  type: 'customer' | 'supplier';
}

export const EntityPickerModal: React.FC<EntityPickerModalProps> = ({
  isOpen,
  entities,
  selectedId,
  onSelect,
  onClose,
  title,
  type,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntities = useMemo(() => {
    const baseEntities = entities.filter(e => e.type === type);
    if (!searchQuery) return baseEntities;
    const lowerQuery = searchQuery.toLowerCase();
    return baseEntities.filter(
      e => 
        e.name.toLowerCase().includes(lowerQuery) || 
        (e.phone && e.phone.includes(searchQuery))
    );
  }, [entities, searchQuery, type]);

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
            <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">اختر من قائمة {type === 'customer' ? 'العملاء' : 'الموردين'}</p>
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
              placeholder={`ابحث عن اسم ${type === 'customer' ? 'العميل' : 'المورد'} أو رقم الهاتف...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-4 pr-12 py-4 border border-white/10 rounded-2xl leading-5 bg-black/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 sm:text-sm transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {/* Option for "No Selection" */}
          <button
            onClick={() => {
              onSelect('');
              onClose();
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-right group ${
              selectedId === '' 
                ? 'bg-sky-500/20 border-2 border-sky-500/50' 
                : 'bg-white/5 border border-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              selectedId === '' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              <X className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-base ${selectedId === '' ? 'text-white' : 'text-slate-300'}`}>
                بدون تحديد
              </h3>
              <p className="text-xs text-slate-500">إتمام العملية بدون ربطها بجهة</p>
            </div>
            {selectedId === '' && <Check className="w-5 h-5 text-sky-500" />}
          </button>

          {filteredEntities.length === 0 && searchQuery !== '' ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <p className="text-sm">لا توجد نتائج مطابقة</p>
            </div>
          ) : (
            filteredEntities.map((entity) => {
              const isSelected = selectedId === entity.id;

              return (
                <button
                  key={entity.id}
                  onClick={() => {
                    onSelect(entity.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-right group relative overflow-hidden ${
                    isSelected 
                      ? 'bg-sky-500/20 border-2 border-sky-500/50' 
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {entity.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {entity.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Phone className="w-3 h-3" />
                          {entity.phone}
                        </div>
                      )}
                      {entity.address && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                          <MapPin className="w-3 h-3" />
                          {entity.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className="w-5 h-5 text-sky-500" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 text-center shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            إجمالي المسجلين: {filteredEntities.length}
          </p>
        </div>
      </div>
    </div>
  );
};
