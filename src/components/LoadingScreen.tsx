import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-indigo-500 text-white p-3 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Gloves</h2>
        <p className="text-sm text-gray-500">جاري تحميل البيانات...</p>
      </div>
    </div>
  );
};
