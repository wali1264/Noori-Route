import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Truck, 
  Search, 
  Phone, 
  MapPin, 
  Trash2,
  X,
  FileText,
  Download,
  MoreHorizontal,
  Edit2
} from 'lucide-react';
import { formatDate, cn, toEnglishDigits } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import type { Supplier } from '../types';

export default function Suppliers() {
  const [limit, setLimit] = useState(10);
  const suppliers = useLiveQuery(() => db.suppliers.limit(limit).toArray(), [limit]);
  const totalCount = useLiveQuery(() => db.suppliers.count());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.includes(search) || s.phone.includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier?.id) {
      await db.suppliers.update(editingSupplier.id, formData);
    } else {
      await db.suppliers.add({
        ...formData,
        createdAt: Date.now()
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', address: '' });
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address
    });
    setIsModalOpen(true);
  };

  const deleteSupplier = async (id: number) => {
    if (confirm('آیا از حذف این تامین کننده اطمینان دارید؟')) {
      await db.suppliers.delete(id);
    }
  };

  const exportToExcel = () => {
    if (!suppliers) return;
    const worksheet = XLSX.utils.json_to_sheet(suppliers.map(s => ({
      'نام تامین کننده': s.name,
      'شماره تماس': s.phone,
      'آدرس': s.address,
      'تاریخ عضویت': formatDate(s.createdAt)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, `suppliers-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800">مدیریت تامین کنندگان</h2>
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
            + ثبت تامین کننده جدید
          </button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="جستجو بر اساس نام یا شماره..."
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
                <th className="px-6 py-3 font-medium">نام تامین کننده</th>
                <th className="px-6 py-3 font-medium">شماره تماس</th>
                <th className="px-6 py-3 font-medium">آدرس</th>
                <th className="px-6 py-3 font-medium">تاریخ ثبت</th>
                <th className="px-6 py-3 font-medium text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers?.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 font-bold text-slate-900">{supplier.name}</td>
                  <td className="px-6 py-3 text-slate-600">{supplier.phone}</td>
                  <td className="px-6 py-3 text-slate-600">{supplier.address}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(supplier.createdAt)}</td>
                  <td className="px-6 py-3 text-center flex items-center justify-center gap-2">
                    <button 
                      onClick={() => openEditModal(supplier)}
                      className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => supplier.id && deleteSupplier(supplier.id)}
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
              onClick={() => setLimit(prev => prev + 10)}
              className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
            >
              مشاهده موارد بیشتر
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}

        {!filteredSuppliers?.length && (
          <div className="py-12 text-center text-slate-400 text-xs">تامین کننده‌ای یافت نشد.</div>
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
                <h2 className="text-2xl font-bold text-slate-900">{editingSupplier ? 'ویرایش تامین کننده' : 'ثبت تامین کننده جدید'}</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700">نام تامین کننده</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="مثلاً: شرکت تجهیزات نوری"
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
                <div>
                  <label className="block text-sm font-bold text-slate-700">آدرس</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:outline-none"
                    placeholder="کابل، دهمزنگ"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  {editingSupplier ? 'ذخیره تغییرات' : 'ثبت تامین کننده'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
