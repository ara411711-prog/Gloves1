import React, { useRef } from 'react';
import { X, Download, Share2, Printer, FileText, User, Calendar, Hash, ShoppingBag, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Transaction, Product, Entity } from '../types';
import { handleShare } from '../utils/androidBridge';
import { getSizeColor } from '../utils/colors';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  product?: Product;
  entity?: Entity;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  product,
  entity,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isSale = transaction.type === 'out';
  const accentColor = isSale ? 'sky' : 'emerald';
  
  // Define colors for inline styles since Tailwind classes might not all be captured by html-to-image perfectly in some contexts
  const colors = {
    sky: {
      bg: '#f0f9ff',
      primary: '#0ea5e9',
      secondary: '#0369a1',
      light: '#e0f2fe'
    },
    emerald: {
      bg: '#ecfdf5',
      primary: '#10b981',
      secondary: '#047857',
      light: '#d1fae5'
    }
  };

  const theme = isSale ? colors.sky : colors.emerald;

  const getSizeInlineStyle = (size: string) => {
    switch (size) {
      case 'S': return { bg: '#fef2f2', text: '#ef4444', border: '#fecaca' };
      case 'M': return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' };
      case 'L': return { bg: '#f0fdf4', text: '#22c55e', border: '#bbf7d0' };
      case 'XL': return { bg: '#fdf4ff', text: '#d946ef', border: '#fbcfe8' };
      case 'XXL': return { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a' };
      default: return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const exportAsImage = async () => {
    const exportEl = document.getElementById('invoice-export-template');
    if (!exportEl) return;
    try {
      const dataUrl = await toPng(exportEl, { 
        quality: 1, 
        pixelRatio: 2,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Gloves_Invoice_${transaction.id.slice(-6)}.png`, { type: 'image/png' });
      handleShare(file, 'image/png');
    } catch (err) {
      console.error('Error exporting image:', err);
    }
  };

  const exportAsPDF = async () => {
    const exportEl = document.getElementById('invoice-export-template');
    if (!exportEl) return;
    try {
      const dataUrl = await toPng(exportEl, { 
        quality: 1, 
        pixelRatio: 2,
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (exportEl.offsetHeight * width) / exportEl.offsetWidth;
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `Gloves_Invoice_${transaction.id.slice(-6)}.pdf`, { type: 'application/pdf' });
      handleShare(file, 'application/pdf');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  const exportAsExcel = () => {
    const data = [
      ['تطبيق Gloves - فاتورة ' + (isSale ? 'بيع' : 'شراء')],
      ['رقم العملية', transaction.id],
      ['التاريخ', format(new Date(transaction.date), 'yyyy/MM/dd HH:mm')],
      [''],
      ['بيانات ' + (isSale ? 'العميل' : 'المورد')],
      ['الاسم', entity?.name || 'غير محدد'],
      ['الهاتف', entity?.phone || '-'],
      [''],
      ['تفاصيل المنتجات'],
      ['المنتج', 'الحجم', 'الكمية', 'السعر', 'الإجمالي'],
      [product?.name || 'محذوف', product?.size || '-', transaction.quantity, transaction.price, transaction.total],
      [''],
      ['المبلغ الإجمالي', '', '', '', transaction.total]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([wbout], `Gloves_Invoice_${transaction.id.slice(-6)}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    handleShare(file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-300 min-h-full sm:min-h-0">
        {/* Actions Header - Sticky on mobile */}
        <div className="sticky top-0 z-20 flex justify-between items-center bg-slate-900/80 backdrop-blur-xl p-4 rounded-b-3xl sm:rounded-3xl border-b sm:border border-white/10 shadow-2xl shrink-0">
          <div className="flex gap-2">
            <button 
              onClick={exportAsPDF}
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-colors border border-red-500/20 active:scale-90 font-black text-sm"
            >
              <FileText className="w-5 h-5" />
              <span>PDF</span>
            </button>
            <button 
              onClick={exportAsExcel}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 active:scale-90 font-black text-sm"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Excel</span>
            </button>
            <button 
              onClick={exportAsImage}
              className="flex items-center gap-2 px-4 py-3 bg-sky-500/10 text-sky-400 rounded-2xl hover:bg-sky-500/20 transition-colors border border-sky-500/20 active:scale-90 font-black text-sm"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 transition-colors active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex-1" dir="rtl">
          <div 
            ref={invoiceRef} 
            className="p-6 sm:p-12 bg-white text-slate-900 min-h-[700px] flex flex-col relative"
            style={{ backgroundColor: theme.bg }}
          >
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-5 select-none">
              <span className="text-[150px] font-black rotate-[-45deg] uppercase tracking-widest" style={{ color: theme.primary }}>
                GLOVES
              </span>
            </div>

            {/* Business Header */}
            <div className={`flex justify-between items-start border-b-4 pb-8 mb-8 relative z-10`} style={{ borderColor: theme.primary }}>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black mb-2 tracking-tighter" style={{ color: theme.secondary }}>فاتورة {isSale ? 'بيع' : 'شراء'}</h1>
                <div className="flex items-center gap-2 text-slate-500 font-bold bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-200 w-fit">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">رقم العملية: {transaction.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <p className="font-black text-3xl sm:text-5xl tracking-tighter" style={{ color: theme.secondary }}>Gloves</p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-black tracking-[0.3em] uppercase opacity-60 mt-1">Premium Inventory</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-10 relative z-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2">بيانات {isSale ? 'العميل' : 'المورد'}</p>
                <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm">
                  {entity ? (
                    <div>
                      <p className="text-xl font-black text-slate-900 mb-1">{entity.name}</p>
                      {entity.phone && <p className="text-sm text-slate-600 font-bold">{entity.phone}</p>}
                      {entity.address && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{entity.address}</p>}
                    </div>
                  ) : (
                    <p className="text-slate-400 font-bold italic">عميل نقدي / غير محدد</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-200 pb-2">تفاصيل الفاتورة</p>
                <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">التاريخ:</span>
                    <span className="text-slate-900 font-black">{format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-bold">الوقت:</span>
                    <span className="text-slate-900 font-black">{format(new Date(transaction.date), 'hh:mm a', { locale: ar })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table / Item List */}
            <div className="flex-1 relative z-10">
              <div className="hidden sm:block overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: theme.primary }}>
                      <th className="py-5 px-6 text-right font-black">البيان</th>
                      <th className="py-5 px-6 text-center font-black">الحجم</th>
                      <th className="py-5 px-6 text-center font-black">الكمية</th>
                      <th className="py-5 px-6 text-center font-black">السعر</th>
                      <th className="py-5 px-6 text-left font-black">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    <tr>
                      <td className="py-8 px-6">
                        <p className="font-black text-xl text-slate-900">{product?.name || 'منتج محذوف'}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">
                          {product?.category}
                        </p>
                      </td>
                      <td className="py-8 px-6 text-center">
                        {product?.size ? (
                          <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black border ${getSizeColor(product.size)}`}>
                            {product.size}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                      <td className="py-8 px-6 text-center font-black text-xl text-slate-700">{transaction.quantity}</td>
                      <td className="py-8 px-6 text-center font-bold text-slate-700">{Math.round(transaction.price).toLocaleString()}</td>
                      <td className="py-8 px-6 text-left font-black text-2xl text-slate-900">{Math.round(transaction.total).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Item View */}
              <div className="sm:hidden space-y-4">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">المنتج</p>
                      <h3 className="text-2xl font-black text-slate-900 mb-1">{product?.name || 'محذوف'}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 font-bold">{product?.category}</p>
                        {product?.size && (
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black border ${getSizeColor(product.size)}`}>
                            {product.size}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">الكمية</p>
                      <p className="text-2xl font-black" style={{ color: theme.secondary }}>{transaction.quantity}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">سعر الوحدة</p>
                      <p className="text-lg font-bold text-slate-700">{Math.round(transaction.price).toLocaleString()} ج.م</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الإجمالي</p>
                      <p className="text-2xl font-black text-slate-900">{Math.round(transaction.total).toLocaleString()} ج.م</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="pt-8 mt-10 relative z-10">
              <div className="flex justify-between items-center p-8 rounded-[2.5rem] shadow-xl border-2" style={{ backgroundColor: theme.light, borderColor: theme.primary }}>
                <div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] mb-1" style={{ color: theme.secondary }}>المبلغ الإجمالي النهائي</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold">صافي القيمة المستحقة للدفع</p>
                </div>
                <div className="text-left">
                  <p className="text-4xl sm:text-6xl font-black tracking-tighter" style={{ color: theme.secondary }}>
                    {Math.round(transaction.total).toLocaleString()} 
                    <span className="text-lg sm:text-2xl mr-2">ج.م</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center relative z-10">
              <div className="inline-flex items-center gap-3 mb-4 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase">
                Gloves Premium Experience
              </div>
              <p className="text-sm font-black text-slate-900 mb-1">شكراً لثقتكم في Gloves</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">جميع الحقوق محفوظه لدى ادارة ومنظمة Gloves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Export Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1000 }}>
        <div 
          id="invoice-export-template"
          style={{ 
            width: '800px', 
            minHeight: '1131px', // A4 ratio
            padding: '60px', 
            backgroundColor: theme.bg, 
            color: '#000000', 
            direction: 'rtl',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Watermark */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', opacity: 0.05, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '180px', fontWeight: '900', color: theme.primary, letterSpacing: '0.1em' }}>GLOVES</span>
          </div>
          <div style={{ position: 'absolute', top: '20%', left: '20%', transform: 'translate(-50%, -50%) rotate(-45deg)', opacity: 0.05, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '180px', fontWeight: '900', color: theme.primary, letterSpacing: '0.1em' }}>GLOVES</span>
          </div>
          <div style={{ position: 'absolute', top: '80%', left: '80%', transform: 'translate(-50%, -50%) rotate(-45deg)', opacity: 0.05, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '180px', fontWeight: '900', color: theme.primary, letterSpacing: '0.1em' }}>GLOVES</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `4px solid ${theme.primary}`, paddingBottom: '32px', marginBottom: '40px', position: 'relative', zIndex: 10 }}>
            <div>
              <h1 style={{ fontSize: '48px', fontWeight: '900', color: theme.secondary, margin: '0 0 16px 0' }}>فاتورة {isSale ? 'بيع' : 'شراء'}</h1>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '999px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold', fontSize: '16px' }}>
                رقم العملية: {transaction.id.slice(-8).toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'left', direction: 'ltr' }}>
              <p style={{ fontSize: '48px', fontWeight: '900', color: theme.secondary, margin: 0, lineHeight: 1 }}>Gloves</p>
              <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '900', letterSpacing: '0.3em', textTransform: 'uppercase', margin: '8px 0 0 0' }}>Premium Inventory</p>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'flex', gap: '40px', marginBottom: '40px', position: 'relative', zIndex: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px', margin: 0 }}>بيانات {isSale ? 'العميل' : 'المورد'}</p>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '24px', borderRadius: '24px', border: '1px solid #ffffff' }}>
                {entity ? (
                  <>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>{entity.name}</p>
                    {entity.phone && <p style={{ fontSize: '16px', color: '#475569', fontWeight: 'bold', margin: '0 0 4px 0' }}>{entity.phone}</p>}
                    {entity.address && <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{entity.address}</p>}
                  </>
                ) : (
                  <p style={{ fontSize: '18px', color: '#94a3b8', fontWeight: 'bold', fontStyle: 'italic', margin: 0 }}>عميل نقدي / غير محدد</p>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px', margin: 0 }}>تفاصيل الفاتورة</p>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '24px', borderRadius: '24px', border: '1px solid #ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '16px' }}>التاريخ:</span>
                  <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px' }}>{format(new Date(transaction.date), 'yyyy/MM/dd', { locale: ar })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '16px' }}>الوقت:</span>
                  <span style={{ color: '#0f172a', fontWeight: '900', fontSize: '18px' }}>{format(new Date(transaction.date), 'hh:mm a', { locale: ar })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', position: 'relative', zIndex: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: theme.primary, color: '#ffffff' }}>
                  <th style={{ padding: '20px 24px', fontWeight: '900', fontSize: '16px', textAlign: 'right' }}>البيان</th>
                  <th style={{ padding: '20px 24px', fontWeight: '900', fontSize: '16px', textAlign: 'center' }}>الحجم</th>
                  <th style={{ padding: '20px 24px', fontWeight: '900', fontSize: '16px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '20px 24px', fontWeight: '900', fontSize: '16px', textAlign: 'center' }}>السعر</th>
                  <th style={{ padding: '20px 24px', fontWeight: '900', fontSize: '16px', textAlign: 'left' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>{product?.name || 'منتج محذوف'}</p>
                    <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>
                      {product?.category}
                    </p>
                  </td>
                  <td style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    {product?.size ? (
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '8px 16px', 
                        borderRadius: '12px', 
                        fontSize: '16px', 
                        fontWeight: '900', 
                        backgroundColor: getSizeInlineStyle(product.size).bg, 
                        border: `2px solid ${getSizeInlineStyle(product.size).border}`, 
                        color: getSizeInlineStyle(product.size).text 
                      }}>
                        {product.size}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '24px', fontWeight: '900', color: '#334155' }}>
                    {transaction.quantity}
                  </td>
                  <td style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#334155' }}>
                    {Math.round(transaction.price).toLocaleString()}
                  </td>
                  <td style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>
                    {Math.round(transaction.total).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ marginTop: '40px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px', borderRadius: '32px', backgroundColor: theme.light, border: `2px solid ${theme.primary}` }}>
              <div>
                <p style={{ fontSize: '18px', fontWeight: '900', color: theme.secondary, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>المبلغ الإجمالي النهائي</p>
                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', margin: 0 }}>صافي القيمة المستحقة للدفع</p>
              </div>
              <div style={{ textAlign: 'left', direction: 'ltr' }}>
                <p style={{ fontSize: '56px', fontWeight: '900', color: theme.secondary, margin: 0, lineHeight: 1 }}>
                  {Math.round(transaction.total).toLocaleString()} <span style={{ fontSize: '24px' }}>ج.م</span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', paddingTop: '60px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'inline-block', backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 32px', borderRadius: '999px', fontSize: '14px', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Gloves Premium Experience
            </div>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>شكراً لثقتكم في Gloves</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>جميع الحقوق محفوظه لدى ادارة ومنظمة Gloves</p>
          </div>
        </div>
      </div>
    </div>
  );
};

