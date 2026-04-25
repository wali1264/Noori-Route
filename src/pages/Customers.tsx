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
  MoreHorizontal
} from 'lucide-react';
import { formatDate, cn, toEnglishDigits } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

export default function Customers() {
  const [limit, setLimit] = useState(5);
  const customers = useLiveQuery(() => db.customers.limit(limit).toArray(), [limit]);
  const totalCount = useLiveQuery(() => db.customers.count());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    accountNumber: ''
  });

  const filteredCustomers = customers?.filter(c => 
    c.name.includes(search) || c.phone.includes(search) || c.accountNumber.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.customers.add({
      ...formData,
      createdAt: Date.now()
    });
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', address: '', accountNumber: '' });
  };

  const deleteCustomer = async (id: number) => {
    if (confirm('آیا از حذف این مشتری اطمینان دارید؟')) {
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

  const exportToTxt = () => {
    if (!customers) return;
    const content = customers.map(c => 
      `نام: ${c.name} | شماره: ${c.phone} | آدرس: ${c.address} | کد: ${c.accountNumber} | تاریخ: ${formatDate(c.createdAt)}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">مدیریت مشتریان</h2>
        <div className="flex gap-2">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <button 
              onClick={exportToExcel}
              className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="خروجی اکسل"
            >
              <Download className="h-4 w-4" />
            </button>
            <button 
              onClick={exportToTxt}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="خروجی متن"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
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
                  <td className="px-6 py-3 text-center">
                    <button 
                      onClick={() => customer.id && deleteCustomer(customer.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
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
              onClick={() => setLimit(prev => prev + 5)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
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

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">ثبت مشتری جدید</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  ثبت مشتری
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
