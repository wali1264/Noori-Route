import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Plus, 
  ShoppingCart, 
  X,
  Trash2,
  Package,
  User,
  Hash,
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
import type { Purchase } from '../types';

export default function Purchases() {
  const [limit, setLimit] = useState(10);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const purchases = useLiveQuery(async () => {
    let collection = db.purchases.orderBy('date').reverse();
    const all = await collection.toArray();
    
    return all.filter(p => {
      const date = new Date(p.date).toISOString().split('T')[0];
      const startMatch = dateFilter.start ? date >= dateFilter.start : true;
      const endMatch = dateFilter.end ? date <= dateFilter.end : true;
      return startMatch && endMatch;
    }).slice(0, limit);
  }, [limit, dateFilter]);

  const totalCount = useLiveQuery(() => db.purchases.count());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  const [formData, setFormData] = useState({
    item: '',
    quantity: 1,
    unitPrice: 0,
    supplierId: 0,
    paidAmount: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supplierId === 0) return alert('لطفاً تامین کننده را انتخاب کنید');
    
    const data = {
      ...formData,
      totalPrice: formData.quantity * formData.unitPrice
    };

    if (editingPurchase?.id) {
      await db.purchases.update(editingPurchase.id, data);
    } else {
      await db.purchases.add({
        ...data,
        date: Date.now()
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPurchase(null);
    setFormData({ item: '', quantity: 1, unitPrice: 0, supplierId: 0, paidAmount: 0 });
  };

  const openEditModal = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      item: purchase.item,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      supplierId: purchase.supplierId || 0,
      paidAmount: purchase.paidAmount || 0
    });
    setIsModalOpen(true);
  };

  const deletePurchase = async (id: number) => {
    if (confirm('آیا از حذف این خرید اطمینان دارید؟')) {
      await db.purchases.delete(id);
    }
  };

  const exportToExcel = () => {
    if (!purchases) return;
    const data = purchases.map(p => ({
      'نام جنس': p.item,
      'تعداد': p.quantity,
      'قیمت واحد': p.unitPrice,
      'مجموع کل': p.totalPrice,
      'پرداخت شده': p.paidAmount || 0,
      'باقیمانده': (p.totalPrice || 0) - (p.paidAmount || 0),
      'تامین کننده': suppliers?.find(s => s.id === p.supplierId)?.name || 'نامعلوم',
      'تاریخ': formatDate(p.date)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');
    XLSX.writeFile(workbook, `purchases-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <h2 className="text-xl font-bold text-slate-800">مدیریت خریدات</h2>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setShowFilters(!showFilters)} className={cn("p-2 rounded-lg transition-colors", showFilters ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50")}>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
          >
            + ثبت خرید جدید
          </button>
        </div>
      </header>

      {/* Date Filters omitted for brevity */}
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">الی تاریخ</label>
                <input 
                  type="date" 
                  value={dateFilter.end}
                  onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-orange-500" 
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
                <th className="px-6 py-4 font-bold">نام جنس / خدمات</th>
                <th className="px-6 py-4 font-bold">تعداد</th>
                <th className="px-6 py-4 font-bold">قیمت واحد</th>
                <th className="px-6 py-4 font-bold">مجموع کل</th>
                <th className="px-6 py-4 font-bold">پرداخت شده</th>
                <th className="px-6 py-4 font-bold">تاریخ</th>
                <th className="px-6 py-4 font-bold">تأمین کننده</th>
                <th className="px-6 py-4 font-bold text-center print:hidden">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {purchases?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{p.item}</td>
                  <td className="px-6 py-4">{p.quantity}</td>
                  <td className="px-6 py-4">{formatCurrency(p.unitPrice).replace('AFN', '')}</td>
                  <td className="px-6 py-4 font-black">{formatCurrency(p.totalPrice).replace('AFN', '')}</td>
                  <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(p.paidAmount || 0).replace('AFN', '')}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{formatDate(p.date)}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{suppliers?.find(s => s.id === p.supplierId)?.name || 'نامعلوم'}</td>
                  <td className="px-6 py-4 text-center print:hidden">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                        title="ویرایش"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => p.id && deletePurchase(p.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount && totalCount > limit && !dateFilter.start && !dateFilter.end && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center print:hidden">
            <button 
              onClick={() => setLimit(prev => prev + 10)}
              className="flex items-center gap-2 px-8 py-2.5 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-100 shadow-sm transition-all active:scale-95"
            >
              مشاهده خریدات بیشتر
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}

        {!purchases?.length && (
          <div className="py-20 text-center text-slate-400 text-xs font-bold italic">
            هیچ رکوردی ثبت نشده است.
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
                <h2 className="text-2xl font-bold text-slate-900">{editingPurchase ? 'ویرایش خرید' : 'ثبت خرید جدید'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700">نام جنس یا خدمات</label>
                  <input
                    type="text"
                    required
                    value={formData.item}
                    onChange={e => setFormData({...formData, item: e.target.value})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="مثلاً: پهنای باند انترنت"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">تعداد</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.quantity}
                      onChange={e => {
                        const val = toEnglishDigits(e.target.value);
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData({...formData, quantity: Number(val)});
                        }
                      }}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700">قیمت واحد (AFN)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.unitPrice || ''}
                      onChange={e => {
                        const val = toEnglishDigits(e.target.value);
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setFormData({...formData, unitPrice: Number(val)});
                        }
                      }}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">تأمین کننده</label>
                    <select
                      required
                      value={formData.supplierId}
                      onChange={e => setFormData({...formData, supplierId: Number(e.target.value)})}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none appearance-none font-bold"
                    >
                      <option value="0">انتخاب کنید...</option>
                      {suppliers?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700">پرداخت نقدی (AFN)</label>
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
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">مجموع کل خرید:</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(formData.quantity * formData.unitPrice).replace('AFN', '')}</span>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  {editingPurchase ? 'بروزرسانی خرید' : 'ثبت نهایی خرید'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
