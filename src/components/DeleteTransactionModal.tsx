import React from 'react';
import { Trash2, Check, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (revertStock: boolean) => void;
  title?: string;
  message?: string;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد الحذف',
  message = 'هل أنت متأكد من حذف هذه العملية؟ يمكنك اختيار ما إذا كنت تريد إعادة الكمية للمخزون أم لا.',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 w-full max-w-md rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden relative"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -ml-16 -mb-16"></div>

          <div className="p-8 sm:p-10 text-center relative z-10">
            <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-inner">
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center border border-red-500/30">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10 px-4">
              {message}
            </p>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => onConfirm(true)}
                className="group relative w-full flex items-center justify-center gap-4 bg-red-500 text-white py-5 rounded-[1.5rem] font-black hover:bg-red-600 transition-all active:scale-[0.98] shadow-xl shadow-red-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Check className="w-6 h-6" />
                <span className="text-lg">حذف مع عودة المخزون</span>
              </button>

              <button 
                onClick={() => onConfirm(false)}
                className="w-full flex items-center justify-center gap-4 bg-white/5 text-red-400 py-5 rounded-[1.5rem] font-black hover:bg-white/10 transition-all border border-red-500/20 active:scale-[0.98]"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-lg">حذف فقط (بدون عودة)</span>
              </button>

              <button 
                onClick={onClose}
                className="w-full py-4 text-slate-500 font-black hover:text-white transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <X className="w-4 h-4" />
                <span>إلغاء العملية</span>
              </button>
            </div>
          </div>
          
          {/* Bottom indicator */}
          <div className="h-1.5 w-24 bg-white/10 rounded-full mx-auto mb-4"></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
