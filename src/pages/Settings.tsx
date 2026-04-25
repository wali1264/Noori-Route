import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Settings as SettingsIcon, Lock, Building, Save, User, Download, Upload, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, toEnglishDigits } from '../lib/utils';
import { exportDB, importDB } from "dexie-export-import";

export default function Settings() {
  const [companyName, setCompanyName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [autoBackup, setAutoBackup] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function load() {
      const name = await db.settings.where({ key: 'companyName' }).first();
      if (name) setCompanyName(name.value);
      
      const backupSetting = localStorage.getItem('noori_auto_backup') === 'true';
      setAutoBackup(backupSetting);
    }
    load();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.settings.where({ key: 'companyName' }).modify({ value: companyName });
      if (newPassword) {
        await db.settings.where({ key: 'password' }).modify({ value: newPassword });
      }
      localStorage.setItem('noori_auto_backup', autoBackup.toString());
      setMessage({ text: 'تنظیمات با موفقیت ذخیره شد.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'خطا در ذخیره سازی.', type: 'error' });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportDB(db, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `isp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ text: 'نسخه پشتیبان با موفقیت دانلود شد.', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'خطا در تهیه نسخه پشتیبان.', type: 'error' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('با بازیابی این فایل، تمامی اطلاعات فعلی حذف و اطلاعات فایل جایگزین می‌شود. آیا اطمینان دارید؟')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      await db.delete();
      await importDB(file);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'خطا در بازیابی اطلاعات. فایل نامعتبر است.', type: 'error' });
    } finally {
      setIsImporting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <header>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-slate-400" />
          تنظیمات سیستم
        </h2>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Building className="h-4 w-4 text-blue-600" />
              اطلاعات عمومی شرکت
            </h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">نام شرکت</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(toEnglishDigits(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Lock className="h-4 w-4 text-blue-600" />
              امنیت و رمز عبور
            </h3>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">تغییر رمز عبور ورود</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(toEnglishDigits(e.target.value))}
                placeholder="رمز عبور جدید را وارد کنید"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <input 
                 type="checkbox" 
                 id="autoBackup"
                 checked={autoBackup}
                 onChange={(e) => setAutoBackup(e.target.checked)}
                 className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
               />
               <label htmlFor="autoBackup" className="text-xs font-bold text-slate-700 cursor-pointer">فعال‌سازی پشتیبان‌گیری خودکار سیستم (هر ۲۴ ساعت)</label>
            </div>
          </div>

          {message.text && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                "text-xs font-bold text-center p-3 rounded-xl",
                message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}
            >
              {message.text}
            </motion.p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 cursor-pointer mt-4"
          >
            <Save className="h-4 w-4" />
            ذخیره تغییرات
          </button>
        </form>
      </motion.div>

      {/* Backup Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200 overflow-hidden relative"
      >
        <div className="space-y-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Download className="h-4 w-4 text-green-600" />
            پشتیبان‌گیری و بازیابی داده‌ها
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all hover:bg-slate-50 hover:border-blue-300 group cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Download className="h-5 w-5" />
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">دانلود نسخه پشتیبان</div>
                <div className="text-[10px] text-slate-500">ذخیره آفلاین داده‌ها</div>
              </div>
            </button>

            <label className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all hover:bg-slate-50 hover:border-orange-300 group cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                <Upload className="h-5 w-5" />
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-800">بازیابی فایل پشتیبان</div>
                <div className="text-[10px] text-slate-500">انتخاب فایل و جایگزینی</div>
              </div>
            </label>
          </div>
        </div>
      </motion.div>

      <section className="rounded-3xl bg-blue-50 p-8 border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Info className="h-24 w-24 text-blue-900" />
        </div>
        <h3 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
          <Info className="h-5 w-5" />
          راهنمای سیستم آفلاین و امنیت
        </h3>
        <ul className="space-y-3 text-sm text-blue-700 leading-relaxed list-disc list-inside">
          <li>این سیستم به صورت کاملاً آفلاین در مرورگر شما (Local Storage) کار می‌کند.</li>
          <li>برای جلوگیری از حذف داده‌ها، کش مرورگر (Browser Cache) را پاک نکنید.</li>
          <li>به شما توصیه می‌شود روزانه یک نسخه پشتیبان از دکمه بالا دانلود کنید.</li>
          <li>اعداد به صورت خودکار به فرمت استاندارد (انگلیسی) ذخیره و نمایش داده می‌شوند.</li>
        </ul>
      </section>
    </div>
  );
}
