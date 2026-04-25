import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Hash,
  Trash2,
  Calendar,
  X,
  FileText,
  Download,
  MoreHorizontal,
  Edit2,
  BookOpen,
  Printer
} from 'lucide-react';
import { formatDate, cn, toEnglishDigits, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import type { Customer, Sale, Receipt } from '../types';

export default function Customers() {
  const [limit, setLimit] = useState(10);
  const customers = useLiveQuery(() => db.customers.limit(limit).toArray(), [limit]);
  const totalCount = useLiveQuery(() => db.customers.count());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedLedger, setSelectedLedger] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    accountNumber: ''
  });

  const allSales = useLiveQuery(() => db.sales.toArray());
  const allReceipts = useLiveQuery(() => db.receipts.toArray());

  const filteredCustomers = customers?.filter(c => 
    c.name.includes(search) || c.phone.includes(search) || c.accountNumber.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer?.id) {
      await db.customers.update(editingCustomer.id, formData);
    } else {
      await db.customers.add({
        ...formData,
        createdAt: Date.now()
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', accountNumber: '' });
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      accountNumber: customer.accountNumber
    });
    setIsModalOpen(true);
  };

  const deleteCustomer = async (id: number) => {
    if (confirm('آیا از حذف این مشتری اطمینان دارید؟ با حذف مشتری، تمام سوابق وی نیز ممکن است نامعتبر شوند.')) {
      await db.customers.delete(id);
    }
  };

  const exportToExcel = () => {
    if (!customers) return;
    const worksheet = XLSX.utils.json_to_sheet(customers.map(c => ({
      'نام مشتری': c.name,
      'شماره تماس': c.phone,
      'آدرس': c.address,
      'کد حساب': c.accountNumber,
      'تاریخ عضویت': formatDate(c.createdAt)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">مدیریت مشتریان</h2>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            خروجی اکسل
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            + ثبت مشتری جدید
          </button>
        </div>
      </header>

      {/* Search Bar Refined */}
      <div className="relative group">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="جستجو بر اساس نام، شماره یا آیدی..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm text-slate-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/10"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-medium">نام مشتری</th>
                <th className="px-6 py-3 font-medium">شماره تماس</th>
                <th className="px-6 py-3 font-medium">آدرس</th>
                <th className="px-6 py-3 font-medium">کد حساب</th>
                <th className="px-6 py-3 font-medium">تاریخ عضویت</th>
                <th className="px-6 py-3 font-medium text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers?.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 font-bold text-slate-900">{customer.name}</td>
                  <td className="px-6 py-3 text-slate-600">{customer.phone}</td>
                  <td className="px-6 py-3 text-slate-600">{customer.address}</td>
                  <td className="px-6 py-3 font-mono text-blue-600">{customer.accountNumber}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(customer.createdAt)}</td>
                  <td className="px-6 py-3 text-center flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setSelectedLedger(customer)}
                      className="p-1 text-slate-300 hover:text-green-600 transition-colors"
                      title="مشاهده بیل گراف"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => openEditModal(customer)}
                      className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => customer.id && deleteCustomer(customer.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalCount && totalCount > limit && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
            <button 
              onClick={() => setLimit(prev => prev + 10)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              مشاهده موارد بیشتر
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}

        {!filteredCustomers?.length && (
          <div className="py-12 text-center text-slate-400 text-xs">مشتری مورد نظر یافت نشد.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
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
                <h2 className="text-2xl font-bold text-slate-900">{editingCustomer ? 'ویرایش اطلاعات مشتری' : 'ثبت مشتری جدید'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700">نام کامل</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="مثلاً: احمد نوری"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">شماره تماس</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: toEnglishDigits(e.target.value)})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="07XXXXXXXX"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">کد حساب (آیدی)</label>
                    <input
                      type="text"
                      required
                      value={formData.accountNumber}
                      onChange={e => setFormData({...formData, accountNumber: toEnglishDigits(e.target.value)})}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="NR-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700">آدرس</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                      placeholder="هرات، سرک اول"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  {editingCustomer ? 'ذخیره تغییرات' : 'ثبت مشتری'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ledger Modal */}
      <AnimatePresence>
        {selectedLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLedger(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">بیل گراف مشتری: {selectedLedger.name}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">مشاهده کامل سوابق مالی و تراکنش‌ها</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button onClick={() => setSelectedLedger(null)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-400 uppercase">کل بدهی (خریدات)</p>
                    <p className="text-xl font-black text-blue-700">
                      {formatCurrency(allSales?.filter(s => s.customerId === selectedLedger.id).reduce((a, b) => a + (b.totalAmount || 0), 0) || 0).replace('AFN', '')}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-green-400 uppercase">کل پرداخت (رسیدات)</p>
                    <p className="text-xl font-black text-green-700">
                      {formatCurrency(allReceipts?.filter(r => r.customerId === selectedLedger.id).reduce((a, b) => a + b.amount, 0) || 0).replace('AFN', '')}
                    </p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">باقیمانده فعلی</p>
                    <p className="text-xl font-black text-white">
                      {formatCurrency(
                        (allSales?.filter(s => s.customerId === selectedLedger.id).reduce((a, b) => a + (b.totalAmount || 0), 0) || 0) -
                        (allReceipts?.filter(r => r.customerId === selectedLedger.id).reduce((a, b) => a + b.amount, 0) || 0)
                      ).replace('AFN', '')}
                    </p>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-bold">تاریخ</th>
                        <th className="px-4 py-3 font-bold">شرح تراکنش</th>
                        <th className="px-4 py-3 font-bold">بدهکار (Debit)</th>
                        <th className="px-4 py-3 font-bold">بستانکار (Credit)</th>
                        <th className="px-4 py-3 font-bold">باقیمانده</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const sales = allSales?.filter(s => s.customerId === selectedLedger.id) || [];
                        const receipts = allReceipts?.filter(r => r.customerId === selectedLedger.id) || [];
                        const transactions = [
                          ...sales.map(s => ({ date: s.date, desc: s.description, debit: s.totalAmount || 0, credit: 0 })),
                          ...receipts.map(r => ({ date: r.date, desc: r.note || 'پرداخت نقدی', debit: 0, credit: r.amount }))
                        ].sort((a, b) => a.date - b.date);

                        let balance = 0;
                        return transactions.map((t, i) => {
                          balance += (t.debit - t.credit);
                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-mono text-slate-400">{formatDate(t.date)}</td>
                              <td className="px-4 py-3 font-bold text-slate-700">{t.desc}</td>
                              <td className="px-4 py-3 text-red-600 font-bold">{t.debit > 0 ? formatCurrency(t.debit).replace('AFN', '') : '-'}</td>
                              <td className="px-4 py-3 text-green-600 font-bold">{t.credit > 0 ? formatCurrency(t.credit).replace('AFN', '') : '-'}</td>
                              <td className="px-4 py-3 font-black text-slate-900">{formatCurrency(balance).replace('AFN', '')}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  onClick={() => setSelectedLedger(null)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
