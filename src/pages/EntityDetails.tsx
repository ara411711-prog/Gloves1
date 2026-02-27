import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { ArrowRight, Phone, MapPin, MessageCircle, ArrowDownRight, ArrowUpRight, Share2, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { handleShare } from '../utils/androidBridge';

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
        <button onClick={() => navigate('/entities')} className="mt-4 text-sky-400 hover:text-indigo-300">
          العودة للجهات
        </button>
      </div>
    );
  }

  const entityTransactions = transactions
    .filter(t => t.entityId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const excelData = [
      ['نظام إدارة المخزون'],
      [`تقرير عمليات: ${entity.name}`],
      ['تاريخ التقرير:', format(new Date(), 'yyyy/MM/dd hh:mm a', { locale: ar })],
      [],
      ['التاريخ', 'العملية', 'المنتج', 'الكمية', 'السعر', 'الإجمالي']
    ];

    entityTransactions.forEach(t => {
      const product = products.find(p => p.id === t.productId);
      excelData.push([
        format(new Date(t.date), 'yyyy/MM/dd hh:mm a', { locale: ar }),
        t.type === 'out' ? 'بيع' : 'شراء',
        product?.name || 'منتج محذوف',
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
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, "العمليات");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([excelBuffer], `عمليات_${entity.name}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    handleShare(file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const CHUNK_SIZE = 20;
  const chunks = [];
  for (let i = 0; i < entityTransactions.length; i += CHUNK_SIZE) {
    chunks.push(entityTransactions.slice(i, i + CHUNK_SIZE));
  }
  if (chunks.length === 0) chunks.push([]);

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      for (let i = 0; i < chunks.length; i++) {
        const pageElement = document.getElementById(`pdf-page-entity-${i}`);
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
      const file = new File([pdfBlob], `عمليات_${entity.name}.pdf`, { type: 'application/pdf' });
      handleShare(file, 'application/pdf');
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="glass-panel text-slate-100 p-4 pt-6 rounded-b-[2.5rem] z-10 shrink-0 border-t-0 border-x-0 relative">
        <div className="flex items-center gap-3 mb-6 px-2">
          <button onClick={() => navigate('/entities', { replace: true })} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black tracking-tight text-white">{entity.name}</h1>
        </div>

        <div className="bg-black/20 p-5 rounded-3xl border border-white/5 space-y-4 backdrop-blur-md mx-2 mb-2">
          <div className="grid grid-cols-1 gap-3">
            {entity.phone && (
              <div className="flex items-center text-sm text-slate-300 bg-white/5 p-3 rounded-2xl">
                <Phone className="w-4 h-4 ml-3 text-indigo-400" />
                <span className="font-medium">{entity.phone}</span>
              </div>
            )}
            {entity.address && (
              <div className="flex items-center text-sm text-slate-300 bg-white/5 p-3 rounded-2xl">
                <MapPin className="w-4 h-4 ml-3 text-indigo-400" />
                <span className="font-medium">{entity.address}</span>
              </div>
            )}
          </div>
          
          {entity.phone && (
            <div className="flex gap-3 pt-2">
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
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-bold text-white">سجل العمليات</h2>
          <div className="flex gap-2">
            <button 
              onClick={exportExcel}
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-2xl transition-colors text-sm font-bold border border-emerald-500/20 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>إكسل</span>
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-2xl transition-colors text-sm font-bold border border-red-500/20 disabled:opacity-50 active:scale-95"
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
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-black/20 text-slate-300 border-b border-white/5">
                  <tr>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px]">التاريخ</th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px]">العملية</th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px]">المنتج</th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px]">الكمية</th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px]">السعر</th>
                    <th className="px-4 py-4 font-bold whitespace-nowrap uppercase tracking-wider text-[10px] text-indigo-400">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entityTransactions.map(transaction => {
                    const product = products.find(p => p.id === transaction.productId);
                    const isOut = transaction.type === 'out';
                    
                    return (
                      <tr key={transaction.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-200">{format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}</div>
                          <div className="text-[10px] font-medium text-slate-500 mt-0.5">{format(new Date(transaction.date), 'hh:mm a', { locale: ar })}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border ${isOut ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {isOut ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isOut ? 'بيع' : 'شراء'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-white">
                          {product?.name || 'منتج محذوف'}
                          {product?.size && <span className="text-indigo-400 text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded-md mr-2 border border-indigo-500/20">{product.size}</span>}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-200">
                          {transaction.quantity}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-300">
                          {Math.round(transaction.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-black text-indigo-400 bg-indigo-500/5">
                          {Math.round(transaction.total).toLocaleString()}
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
            id={`pdf-page-entity-${pageIndex}`} 
            style={{ 
              width: '800px', 
              minHeight: '1131px',
              padding: '40px', 
              backgroundColor: '#ffffff', 
              color: '#000000', 
              direction: 'rtl',
              fontFamily: 'sans-serif',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>نظام إدارة المخزون</h1>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>تقرير عمليات: {entity.name}</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>تاريخ التقرير:</p>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0 0 0' }}>{format(new Date(), 'yyyy/MM/dd', { locale: ar })}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>صفحة {pageIndex + 1} من {chunks.length}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>الجهة</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0 0 0' }}>{entity.name}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>التاريخ</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>العملية</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>المنتج</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>الكمية</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>السعر</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((t, i) => {
                  const product = products.find(p => p.id === t.productId);
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
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{entityTransactions.length}</span>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>تم إنشاء هذا التقرير بواسطة تطبيق نظام إدارة المخزون</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
