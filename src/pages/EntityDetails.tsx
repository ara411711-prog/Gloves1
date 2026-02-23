import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { ArrowRight, Phone, MapPin, MessageCircle, ArrowDownRight, ArrowUpRight, Share2, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const EntityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entities, transactions, products } = useInventory();

  const [isExporting, setIsExporting] = useState(false);

  const entity = entities.find(e => e.id === id);

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-100">
        <p>الجهة غير موجودة</p>
        <button onClick={() => navigate('/entities')} className="mt-4 text-indigo-400 hover:text-indigo-300">
          العودة للجهات
        </button>
      </div>
    );
  }

  const entityTransactions = transactions
    .filter(t => t.entityId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const shareFile = async (file: File) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'تقرير العمليات',
          text: `تقرير عمليات ${entity.name}`,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      // Fallback to download
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportExcel = () => {
    const data = entityTransactions.map(t => {
      const product = products.find(p => p.id === t.productId);
      return {
        'التاريخ': format(new Date(t.date), 'yyyy/MM/dd hh:mm a', { locale: ar }),
        'العملية': t.type === 'out' ? 'بيع' : 'شراء',
        'المنتج': product?.name || 'منتج محذوف',
        'الكمية': t.quantity,
        'السعر': Math.round(t.price),
        'الإجمالي': Math.round(t.total),
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العمليات");
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([excelBuffer], `عمليات_${entity.name}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    shareFile(file);
  };

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const tableElement = document.getElementById('transactions-table-container');
      if (!tableElement) return;

      const canvas = await html2canvas(tableElement, { scale: 2, backgroundColor: '#0f172a' }); // slate-950
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `عمليات_${entity.name}.pdf`, { type: 'application/pdf' });
      shareFile(file);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/entities')} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">{entity.name}</h1>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3">
          {entity.phone && (
            <div className="flex items-center text-sm text-slate-300">
              <Phone className="w-4 h-4 ml-2 text-slate-400" />
              <span dir="ltr">{entity.phone}</span>
            </div>
          )}
          {entity.address && (
            <div className="flex items-center text-sm text-slate-300">
              <MapPin className="w-4 h-4 ml-2 text-slate-400" />
              <span>{entity.address}</span>
            </div>
          )}
          
          {entity.phone && (
            <div className="flex gap-2 pt-2">
              <a href={`tel:${entity.phone}`} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-xl transition-colors border border-slate-600">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-medium">اتصال</span>
              </a>
              <a href={`https://wa.me/${entity.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 py-2 rounded-xl transition-colors border border-emerald-900/50">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">واتساب</span>
              </a>
            </div>
          )}

          <div className="bg-slate-900 p-3 rounded-xl flex justify-between items-center mt-2 border border-slate-800">
            <span className="text-sm text-slate-400">الرصيد الحالي</span>
            <span className={`font-bold text-lg ${entity.balance > 0 ? 'text-emerald-400' : entity.balance < 0 ? 'text-red-400' : 'text-slate-100'}`} dir="ltr">
              {Math.round(Math.abs(entity.balance))} ج.م
              <span className="text-xs mr-1 text-slate-500 font-normal">
                {entity.balance > 0 ? '(لنا)' : entity.balance < 0 ? '(علينا)' : ''}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-100">سجل العمليات</h2>
          <div className="flex gap-2">
            <button 
              onClick={exportExcel}
              className="flex items-center gap-1 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-400 p-2 rounded-xl transition-colors text-xs font-medium border border-emerald-900/50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>إكسل</span>
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-1 bg-red-950/50 hover:bg-red-900 text-red-400 p-2 rounded-xl transition-colors text-xs font-medium border border-red-900/50 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isExporting ? 'جاري...' : 'PDF'}</span>
            </button>
          </div>
        </div>
        
        {entityTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p>لا توجد عمليات مسجلة لهذه الجهة</p>
          </div>
        ) : (
          <div id="transactions-table-container" className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                    <th className="px-4 py-3 font-medium">العملية</th>
                    <th className="px-4 py-3 font-medium">المنتج</th>
                    <th className="px-4 py-3 font-medium">الكمية</th>
                    <th className="px-4 py-3 font-medium">السعر</th>
                    <th className="px-4 py-3 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {entityTransactions.map(transaction => {
                    const product = products.find(p => p.id === transaction.productId);
                    const isOut = transaction.type === 'out';
                    
                    return (
                      <tr key={transaction.id} className="text-slate-300 hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}
                          <br/>
                          <span className="text-slate-500">{format(new Date(transaction.date), 'hh:mm a', { locale: ar })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${isOut ? 'bg-orange-950/50 text-orange-400' : 'bg-emerald-950/50 text-emerald-400'}`}>
                            {isOut ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isOut ? 'بيع' : 'شراء'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {product?.name || 'منتج محذوف'}
                          {product?.size && <span className="text-slate-500 text-xs mr-1">({product.size})</span>}
                        </td>
                        <td className="px-4 py-3 font-medium" dir="ltr">
                          {transaction.quantity}
                        </td>
                        <td className="px-4 py-3" dir="ltr">
                          {Math.round(transaction.price)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-100" dir="ltr">
                          {Math.round(transaction.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
