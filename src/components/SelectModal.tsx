import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { useAndroidBack } from '../hooks/useAndroidBack';

export interface SelectOption {
  id: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: 'red' | 'emerald' | 'slate';
}

interface SelectModalProps {
  isOpen: boolean;
  title: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  isOpen,
  title,
  options,
  value,
  onChange,
  onClose,
  searchable = true,
  searchPlaceholder = 'بحث...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter(
      opt => 
        opt.label.toLowerCase().includes(lowerQuery) || 
        (opt.subLabel && opt.subLabel.toLowerCase().includes(lowerQuery))
    );
  }, [options, searchQuery]);

  useAndroidBack(() => {
    onClose();
    return true;
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {searchable && (
          <div className="p-4 border-b border-slate-800 shrink-0">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sky-400" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-3 pr-10 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-2">
          {filteredOptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            <div className="space-y-1">
              {filteredOptions.map((option) => {
                const isSelected = value === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors text-right ${
                      isSelected 
                        ? 'bg-indigo-600/10 border border-indigo-500/30' 
                        : 'hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            option.badgeColor === 'red' ? 'bg-red-950/50 text-red-400' :
                            option.badgeColor === 'emerald' ? 'bg-emerald-950/50 text-emerald-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.subLabel && (
                        <p className="text-xs text-slate-500 mt-1">{option.subLabel}</p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
