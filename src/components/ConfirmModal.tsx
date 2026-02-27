import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAndroidBack } from '../hooks/useAndroidBack';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  onConfirm,
  onCancel,
  isDanger = true,
}) => {
  useAndroidBack(() => {
    onCancel();
    return true;
  }, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-800 shadow-xl">
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${isDanger ? 'bg-red-950/50 text-red-500' : 'bg-sky-950/50 text-indigo-500'}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>
          <p className="text-sm text-slate-400 mb-6">{message}</p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white transition-colors shadow-md ${
                isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
