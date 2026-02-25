import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { FileSpreadsheet, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export const Reports: React.FC = () => {
  const { transactions, products, entities } = useInventory();
  const [isExporting, setIsExporting] = useState(false);

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const shareFile = async (file: File) => {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'تقرير العمليات الشامل',
          text: 'تقرير بجميع العمليات',
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const excelData = [
      ['نظام إدارة المخزون'],
      ['تقرير العمليات الشامل'],
      ['تاريخ التقرير:', format(new Date(), 'yyyy/MM/dd hh:mm a', { locale: ar })],
      [],
      ['التاريخ', 'العملية', 'المنتج', 'الجهة', 'الكمية', 'السعر', 'الإجمالي']
    ];

    sortedTransactions.forEach(t => {
      const product = products.find(p => p.id === t.productId);
      const entity = entities.find(e => e.id === t.entityId);
      excelData.push([
        format(new Date(t.date), 'yyyy/MM/dd hh:mm a', { locale: ar }),
        t.type === 'out' ? 'بيع' : 'شراء',
        product?.name || 'منتج محذوف',
        entity?.name || 'غير محدد',
        t.quantity,
        Math.round(t.price),
        Math.round(t.total)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    ws['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "العمليات");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([excelBuffer], `تقرير_العمليات_الشامل.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    shareFile(file);
  };

  const CHUNK_SIZE = 20;
  const chunks = [];
  for (let i = 0; i < sortedTransactions.length; i += CHUNK_SIZE) {
    chunks.push(sortedTransactions.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) chunks.push([]);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = 0; i < chunks.length; i++) {
        const pageElement = document.getElementById(`pdf-page-${i}`);
        if (!pageElement) continue;

        const dataUrl = await toPng(pageElement, { 
          quality: 1, 
          pixelRatio: 2,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
      }

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `تقرير_العمليات_الشامل.pdf`, { type: 'application/pdf' });
      shareFile(file);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 pb-20">
      <div className="bg-slate-900 text-slate-100 p-4 pt-6 rounded-b-3xl shadow-md z-10 shrink-0 border-b border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">التقارير الشاملة</h1>
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
        <p className="text-slate-400 text-sm">سجل بجميع العمليات التي تمت في النظام</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sortedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p>لا توجد عمليات مسجلة حتى الآن</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">التاريخ</th>
                    <th className="px-4 py-3 font-medium">العملية</th>
                    <th className="px-4 py-3 font-medium">المنتج</th>
                    <th className="px-4 py-3 font-medium">الجهة</th>
                    <th className="px-4 py-3 font-medium">الكمية</th>
                    <th className="px-4 py-3 font-medium">السعر</th>
                    <th className="px-4 py-3 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedTransactions.map(transaction => {
                    const product = products.find(p => p.id === transaction.productId);
                    const entity = entities.find(e => e.id === transaction.entityId);
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
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entity?.name || '-'}
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

      {/* Hidden PDF Pages */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1000 }}>
        {chunks.map((chunk, pageIndex) => (
          <div 
            key={pageIndex} 
            id={`pdf-page-${pageIndex}`} 
            style={{ 
              width: '800px', 
              minHeight: '1131px',
              padding: '40px', 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              direction: 'rtl',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>نظام إدارة المخزون</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>تقرير العمليات الشامل</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>تاريخ التقرير:</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0 0 0' }}>{format(new Date(), 'yyyy/MM/dd', { locale: ar })}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>صفحة {pageIndex + 1} من {chunks.length}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>التاريخ</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>العملية</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>المنتج</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>الجهة</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>الكمية</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>السعر</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((t, i) => {
                  const product = products.find(p => p.id === t.productId);
                  const entity = entities.find(e => e.id === t.entityId);
                  const isOut = t.type === 'out';
                  return (
                    <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        {format(new Date(t.date), 'yyyy/MM/dd hh:mm a', { locale: ar })}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: isOut ? '#ea580c' : '#16a34a', fontWeight: 'bold' }}>
                        {isOut ? 'بيع' : 'شراء'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 'bold' }}>
                        {product?.name || 'منتج محذوف'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        {entity?.name || '-'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }} dir="ltr">
                        {t.quantity}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }} dir="ltr">
                        {Math.round(t.price)} ج.م
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 'bold' }} dir="ltr">
                        {Math.round(t.total)} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {pageIndex === chunks.length - 1 && (
              <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>إجمالي عدد العمليات:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{sortedTransactions.length}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
