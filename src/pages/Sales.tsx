import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Plus, 
  ShoppingBag, 
  Calendar, 
  User, 
  DollarSign, 
  X,
  Trash2,
  Filter,
  Download,
  FileText,
  Printer,
  MoreHorizontal,
  Edit2
} from 'lucide-react';
import { formatCurrency, formatDate, cn, toEnglishDigits } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Sale } from '../types';

export default function Sales() {
  const [limit, setLimit] = useState(10);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  const sales = useLiveQuery(async () => {
    let collection = db.sales.orderBy('date').reverse();
    const all = await collection.toArray();
    
    return all.filter(s => {
      const date = new Date(s.date).toISOString().split('T')[0];
      const startMatch = dateFilter.start ? date >= dateFilter.start : true;
      const endMatch = dateFilter.end ? date <= dateFilter.end : true;
      return startMatch && endMatch;
    }).slice(0, limit);
  }, [limit, dateFilter]);

  const totalCount = useLiveQuery(() => db.sales.count());
  const customers = useLiveQuery(() => db.customers.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  
  const [formData, setFormData] = useState({
    customerId: 0,
    description: '',
    totalAmount: 0,
    paidAmount: 0,
    status: 'paid' as 'paid' | 'unpaid' | 'partial'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.customerId === 0) return alert('لطفاً مشتری را انتخاب کنید');
    
    // Determine status
    let status: 'paid' | 'unpaid' | 'partial' = 'paid';
    if (formData.paidAmount === 0) status = 'unpaid';
    else if (formData.paidAmount < formData.totalAmount) status = 'partial';
    else status = 'paid';

    const data = { ...formData, status };

    if (editingSale?.id) {
      await db.sales.update(editingSale.id, data);
    } else {
      await db.sales.add({
        ...data,
        date: Date.now()
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
    setFormData({ customerId: 0, description: '', totalAmount: 0, paidAmount: 0, status: 'paid' });
  };

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      customerId: sale.customerId,
      description: sale.description,
      totalAmount: sale.totalAmount || 0,
      paidAmount: sale.paidAmount || 0,
      status: sale.status
    });
    setIsModalOpen(true);
  };

  const deleteSale = async (id: number) => {
    if (confirm('آیا از حذف این رکورد اطمینان دارید؟')) {
      await db.sales.delete(id);
    }
  };

  const exportToExcel = () => {
    if (!sales) return;
    const data = sales.map(s => ({
      'مشتری': customers?.find(c => c.id === s.customerId)?.name || 'نامعلوم',
      'شرح': s.description,
      'تاریخ': formatDate(s.date),
      'مبلغ کل': s.totalAmount,
      'پرداخت شده': s.paidAmount,
      'باقیمانده': (s.totalAmount || 0) - (s.paidAmount || 0),
      'وضعیت': s.status === 'paid' ? 'تادیه کامل' : s.status === 'partial' ? 'پرداخت قسمی' : 'باقیمانده'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
    XLSX.writeFile(workbook, `sales-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h2 className="text-xl font-bold text-slate-800">مدیریت فروشات</h2>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setShowFilters(!showFilters)} className={cn("p-2 rounded-lg transition-colors", showFilters ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50")}>
              <Filter className="h-4 w-4" />
            </button>
            <button onClick={exportToExcel} className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={() => window.print()} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Printer className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all cursor-pointer active:scale-95"
          >
            + ثبت فروش جدید
          </button>
        </div>
      </header>

      {/* Date Filters omitted for brevity in diff... same as before */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden print:hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">از تاریخ</label>
                <input 
                  type="date" 
                  value={dateFilter.start}
                  onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">الی تاریخ</label>
                <input 
                  type="date" 
                  value={dateFilter.end}
                  onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 print:bg-white">
              <tr>
                <th className="px-6 py-4 font-bold">نام مشتری</th>
                <th className="px-6 py-4 font-bold">شرح / پکیج</th>
                <th className="px-6 py-4 font-bold">تاریخ</th>
                <th className="px-6 py-4 font-bold">مبلغ کل (AFN)</th>
                <th className="px-6 py-4 font-bold">پرداخت شده</th>
                <th className="px-6 py-4 font-bold">باقیمانده</th>
                <th className="px-6 py-4 font-bold">وضعیت</th>
                <th className="px-6 py-4 font-bold text-center print:hidden">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sales?.map((sale) => {
                const customer = customers?.find(c => c.id === sale.customerId);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{customer?.name || 'نامعلوم'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{sale.description}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{formatDate(sale.date)}</td>
                    <td className="px-6 py-4 font-black">{formatCurrency(sale.totalAmount || 0).replace('AFN', '')}</td>
                    <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(sale.paidAmount || 0).replace('AFN', '')}</td>
                    <td className="px-6 py-4 font-bold text-red-600">{formatCurrency((sale.totalAmount || 0) - (sale.paidAmount || 0)).replace('AFN', '')}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider",
                        sale.status === 'paid' ? "bg-green-50 text-green-700" : sale.status === 'partial' ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                      )}>
                        {sale.status === 'paid' ? 'تادیه کامل' : sale.status === 'partial' ? 'قسمی' : 'باقیمانده'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center print:hidden">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => window.print()}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg"
                          title="چاپ فاکتور"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => openEditModal(sale)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg"
                          title="ویرایش"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => sale.id && deleteSale(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {totalCount && totalCount > limit && !dateFilter.start && !dateFilter.end && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center print:hidden">
            <button 
              onClick={() => setLimit(prev => prev + 10)}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
            >
              مشاهده فروشات بیشتر
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}

        {!sales?.length && (
          <div className="py-20 text-center text-slate-400 text-xs font-bold italic">
            هیچ رکوردی برای این بازه زمانی یافت نشد.
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">{editingSale ? 'ویرایش فروش' : 'ثبت فروش جدید'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700">انتخاب مشتری</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={e => setFormData({...formData, customerId: Number(e.target.value)})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none appearance-none"
                  >
                    <option value="0">انتخاب کنید...</option>
                    {customers?.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.accountNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">شرح فروش (پکیج / جنس)</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="مثلاً: انترنت 10 جی‌بی"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">مجموع مبلغ (AFN)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.totalAmount || ''}
                      onChange={e => {
                        const val = toEnglishDigits(e.target.value);
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData({...formData, totalAmount: Number(val)});
                        }
                      }}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700">مبلغ پرداخت شده (AFN)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.paidAmount || ''}
                      onChange={e => {
                        const val = toEnglishDigits(e.target.value);
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData({...formData, paidAmount: Number(val)});
                        }
                      }}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  {editingSale ? 'بروزرسانی فروش' : 'ثبت قطعی فروش'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
