import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { FileSpreadsheet, FileText, ArrowDownRight, ArrowUpRight, Trash2, Calendar, Filter, ChevronDown, Plus, X, Search, ShoppingCart, Truck } from 'lucide-react';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { ConfirmModal } from '../components/ConfirmModal';
import { SelectModal, SelectOption } from '../components/SelectModal';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { EntityPickerModal } from '../components/EntityPickerModal';
import { handleShare } from '../utils/androidBridge';
import { parseNumberInput } from '../utils/numbers';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { getSizeColor } from '../utils/colors';

type FilterType = 'daily' | 'monthly' | 'all' | 'custom';

export const Reports: React.FC = () => {
  const { transactions, products, entities, clearTransactions, addTransaction } = useInventory();
  const location = useLocation();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('out');
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [isEntitySelectOpen, setIsEntitySelectOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    price: '',
    entityId: '',
    notes: '',
  });

  useEffect(() => {
    const state = location.state as { openAdd?: 'in' | 'out', productId?: string };
    if (state?.openAdd) {
      setTransactionType(state.openAdd);
      if (state.productId) {
        const product = products.find(p => p.id === state.productId);
        if (product) {
          setFormData(prev => ({
            ...prev,
            productId: state.productId!,
            price: state.openAdd === 'out' ? product.price.toString() : product.cost.toString()
          }));
        }
      }
      setIsAddModalOpen(true);
    }
  }, [location.state, products]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (filterType === 'daily') {
        return isSameDay(tDate, new Date());
      }
      if (filterType === 'monthly') {
        return isSameMonth(tDate, new Date());
      }
      if (filterType === 'custom') {
        return isSameDay(tDate, selectedDate);
      }
      return true; // 'all'
    }).sort((a, b) => b.date - a.date);
  }, [transactions, filterType, selectedDate]);

  const sortedTransactions = filteredTransactions;

  const stats = useMemo(() => {
    const today = new Date();
    
    const calculateStats = (list: typeof transactions) => {
      const total = list.reduce((acc, t) => acc + t.total, 0);
      const todayTotal = list
        .filter(t => isSameDay(new Date(t.date), today))
        .reduce((acc, t) => acc + t.total, 0);
      const filteredTotal = list.reduce((acc, t) => acc + t.total, 0); // This is already filtered by period
      
      return { total, todayTotal, filteredTotal };
    };

    const sales = transactions.filter(t => t.type === 'out');
    const purchases = transactions.filter(t => t.type === 'in');
    
    const filteredSales = sortedTransactions.filter(t => t.type === 'out');
    const filteredPurchases = sortedTransactions.filter(t => t.type === 'in');

    return {
      sales: {
        allTime: sales.reduce((acc, t) => acc + t.total, 0),
        today: sales.filter(t => isSameDay(new Date(t.date), today)).reduce((acc, t) => acc + t.total, 0),
        period: filteredSales.reduce((acc, t) => acc + t.total, 0),
        list: filteredSales
      },
      purchases: {
        allTime: purchases.reduce((acc, t) => acc + t.total, 0),
        today: purchases.filter(t => isSameDay(new Date(t.date), today)).reduce((acc, t) => acc + t.total, 0),
        period: filteredPurchases.reduce((acc, t) => acc + t.total, 0),
        list: filteredPurchases
      }
    };
  }, [transactions, sortedTransactions]);

  // Add Transaction Handlers
  const handleOpenAddModal = (type: 'in' | 'out') => {
    setTransactionType(type);
    setFormData({
      productId: '',
      quantity: '',
      price: '',
      entityId: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId,
        price: transactionType === 'out' ? product.price.toString() : product.cost.toString()
      }));
    } else {
      setFormData(prev => ({ ...prev, productId, price: '' }));
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(formData.quantity) || 0;
    const price = Math.round(parseFloat(formData.price) || 0);
    
    const transactionData = {
      productId: formData.productId,
      type: transactionType,
      quantity,
      price,
      total: quantity * price,
      entityId: formData.entityId || undefined,
      entityType: formData.entityId ? entities.find(e => e.id === formData.entityId)?.type : undefined,
      notes: formData.notes,
    };

    await addTransaction(transactionData);
    setIsAddModalOpen(false);
  };

  useAndroidBack(() => {
    if (isAddModalOpen) {
      setIsAddModalOpen(false);
      return true;
    }
    return false;
  }, isAddModalOpen);

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
    handleShare(file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel text-slate-100 p-4 pt-6 rounded-b-[2.5rem] z-10 shrink-0 border-t-0 border-x-0 relative">
        <div className="flex justify-between items-center mb-4 px-2">
          <h1 className="text-3xl font-black tracking-tight text-white">العمليات</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => handleOpenAddModal('out')}
              className="bg-sky-500 hover:bg-sky-400 text-white p-3 rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center active:scale-95 border border-sky-400/30"
              title="تسجيل عملية بيع"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={exportExcel}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-3 rounded-2xl transition-colors border border-emerald-500/20 active:scale-95"
              title="تصدير إكسل"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-2xl transition-colors border border-red-500/20 disabled:opacity-50 active:scale-95"
              title="تصدير PDF"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-black/20 p-1 rounded-2xl mb-2 mx-2 border border-white/5">
          <button 
            onClick={() => setFilterType('daily')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${filterType === 'daily' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            اليوم
          </button>
          <button 
            onClick={() => setFilterType('monthly')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${filterType === 'monthly' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            الشهر
          </button>
          <button 
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${filterType === 'all' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => {
              setFilterType('custom');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${filterType === 'custom' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className="w-3 h-3" />
            تاريخ
          </button>
        </div>

        {filterType === 'custom' && (
          <div className="px-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <input 
                type="date" 
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
          </div>
        )}

        <p className="text-sky-400 text-[10px] font-medium px-2 uppercase tracking-wider text-center">
          {filterType === 'daily' && 'عمليات اليوم الحالى'}
          {filterType === 'monthly' && 'عمليات الشهر الحالى'}
          {filterType === 'all' && 'جميع العمليات المسجلة'}
          {filterType === 'custom' && `عمليات يوم ${format(selectedDate, 'dd MMMM yyyy', { locale: ar })}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-28 space-y-8">
        {/* Sales Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
                <ShoppingCart className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-lg font-black text-white">المبيعات (بيع)</h2>
            </div>
            <button 
              onClick={() => handleOpenAddModal('out')}
              className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20 active:scale-95"
            >
              تسجيل بيع جديد
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">اليوم</p>
              <p className="text-xs font-black text-sky-400">{stats.sales.today.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">الفترة</p>
              <p className="text-xs font-black text-white">{stats.sales.period.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">الإجمالي</p>
              <p className="text-xs font-black text-slate-300">{stats.sales.allTime.toLocaleString()}</p>
            </div>
          </div>

          {stats.sales.list.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center text-slate-500 text-xs">
              لا توجد مبيعات في هذه الفترة
            </div>
          ) : (
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-black/20 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-bold">التاريخ</th>
                      <th className="px-4 py-3 font-bold">المنتج</th>
                      <th className="px-4 py-3 font-bold">الكمية</th>
                      <th className="px-4 py-3 font-bold text-sky-400">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.sales.list.map(t => {
                      const product = products.find(p => p.id === t.productId);
                      return (
                        <tr key={t.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold">{format(new Date(t.date), 'MM/dd')}</div>
                            <div className="text-[9px] text-slate-500">{format(new Date(t.date), 'hh:mm a', { locale: ar })}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {product?.name || 'محذوف'}
                            {product?.size && <span className={`text-[9px] px-1 py-0.5 rounded-md mr-1 border ${getSizeColor(product.size)}`}>{product.size}</span>}
                          </td>
                          <td className="px-4 py-3 font-black">{t.quantity}</td>
                          <td className="px-4 py-3 font-black text-sky-400 bg-sky-500/5">{Math.round(t.total).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Purchases Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-black text-white">المشتريات (إضافة منتج)</h2>
            </div>
            <button 
              onClick={() => handleOpenAddModal('in')}
              className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95"
            >
              تسجيل شراء جديد
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">اليوم</p>
              <p className="text-xs font-black text-emerald-400">{stats.purchases.today.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">الفترة</p>
              <p className="text-xs font-black text-white">{stats.purchases.period.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">الإجمالي</p>
              <p className="text-xs font-black text-slate-300">{stats.purchases.allTime.toLocaleString()}</p>
            </div>
          </div>

          {stats.purchases.list.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center text-slate-500 text-xs">
              لا توجد مشتريات في هذه الفترة
            </div>
          ) : (
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-black/20 text-slate-400 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-bold">التاريخ</th>
                      <th className="px-4 py-3 font-bold">المنتج</th>
                      <th className="px-4 py-3 font-bold">الكمية</th>
                      <th className="px-4 py-3 font-bold text-emerald-400">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.purchases.list.map(t => {
                      const product = products.find(p => p.id === t.productId);
                      return (
                        <tr key={t.id} className="text-slate-300 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold">{format(new Date(t.date), 'MM/dd')}</div>
                            <div className="text-[9px] text-slate-500">{format(new Date(t.date), 'hh:mm a', { locale: ar })}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-white">
                            {product?.name || 'محذوف'}
                            {product?.size && <span className={`text-[9px] px-1 py-0.5 rounded-md mr-1 border ${getSizeColor(product.size)}`}>{product.size}</span>}
                          </td>
                          <td className="px-4 py-3 font-black">{t.quantity}</td>
                          <td className="px-4 py-3 font-black text-emerald-400 bg-emerald-500/5">{Math.round(t.total).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
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
              fontFamily: 'sans-serif',
              display: 'flex',
              flexDirection: 'column'
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
            
            <div style={{ marginTop: 'auto', paddingTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>تم إنشاء هذا التقرير بواسطة تطبيق نظام إدارة المخزون</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="تنظيف التقارير"
        message="هل أنت متأكد من رغبتك في مسح جميع التقارير والعمليات المسجلة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="مسح الكل"
        onConfirm={async () => {
          await clearTransactions();
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-slate-100">
                {transactionType === 'out' ? 'تسجيل عملية بيع' : 'تسجيل عملية شراء'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <form id="transaction-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">المنتج *</label>
                  <button
                    type="button"
                    onClick={() => setIsProductSelectOpen(true)}
                    className="w-full p-4 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 flex justify-between items-center text-right group active:scale-[0.99]"
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold ${formData.productId ? 'text-white' : 'text-slate-500'}`}>
                        {formData.productId 
                          ? products.find(p => p.id === formData.productId)?.name || 'منتج غير معروف'
                          : 'اضغط لاختيار المنتج...'}
                      </span>
                      {formData.productId && (
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {products.find(p => p.id === formData.productId)?.category || 'بدون تصنيف'} 
                          {products.find(p => p.id === formData.productId)?.size && ` • الحجم: ${products.find(p => p.id === formData.productId)?.size}`}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">الكمية *</label>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      value={formData.quantity} 
                      onChange={e => {
                        const val = parseNumberInput(e.target.value);
                        const max = transactionType === 'out' ? products.find(p => p.id === formData.productId)?.stock : undefined;
                        if (max !== undefined && parseInt(val) > max) {
                          setFormData({...formData, quantity: max.toString()});
                        } else {
                          setFormData({...formData, quantity: val});
                        }
                      }} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">السعر للوحدة *</label>
                    <input 
                      required 
                      type="text" 
                      inputMode="decimal"
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseNumberInput(e.target.value)})} 
                      className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 text-right" 
                    />
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50">
                  <span className="text-sm font-medium text-slate-300">الإجمالي:</span>
                  <span className="font-bold text-lg text-indigo-400">
                    {Math.round((parseFloat(formData.price) || 0) * (parseInt(formData.quantity) || 0))} ج.م
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {transactionType === 'out' ? 'العميل (اختياري)' : 'المورد (اختياري)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEntitySelectOpen(true)}
                    className="w-full p-4 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-800 text-slate-100 flex justify-between items-center text-right group active:scale-[0.99]"
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold ${formData.entityId ? 'text-white' : 'text-slate-500'}`}>
                        {formData.entityId 
                          ? entities.find(e => e.id === formData.entityId)?.name || 'جهة غير معروفة'
                          : 'بدون تحديد'}
                      </span>
                      {formData.entityId && (
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {entities.find(e => e.id === formData.entityId)?.phone || 'لا يوجد رقم هاتف'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">ملاحظات</label>
                  <textarea 
                    rows={2} 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                    className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none bg-slate-800 text-slate-100"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900 pb-safe shrink-0">
              <button 
                type="submit" 
                form="transaction-form" 
                className={`w-full text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md active:scale-[0.98] ${
                  transactionType === 'out' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductPickerModal
        isOpen={isProductSelectOpen}
        products={products}
        selectedId={formData.productId}
        onSelect={handleProductChange}
        onClose={() => setIsProductSelectOpen(false)}
        transactionType={transactionType}
      />

      <EntityPickerModal
        isOpen={isEntitySelectOpen}
        entities={entities}
        selectedId={formData.entityId}
        onSelect={(val) => setFormData({ ...formData, entityId: val })}
        onClose={() => setIsEntitySelectOpen(false)}
        title={transactionType === 'out' ? 'اختر العميل' : 'اختر المورد'}
        type={transactionType === 'out' ? 'customer' : 'supplier'}
      />
    </div>
  );
};
