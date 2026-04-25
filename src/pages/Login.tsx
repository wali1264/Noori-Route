import React, { useState } from 'react';
import { db } from '../db';
import { LogIn, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const stored = await db.settings.where({ key: 'password' }).first();
    if (stored && password === stored.value) {
      localStorage.setItem('noori_auth', 'true');
      onLogin();
    } else {
      setError('رمز عبور اشتباه است');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50"
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">نوری روت</h2>
          <p className="mt-2 text-sm text-slate-500">خوش آمدید! برای ورود رمز عبور را وارد کنید.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-bold text-slate-700">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-lg font-bold text-white transition-transform hover:bg-blue-700 active:scale-[0.98]"
          >
            <LogIn className="h-5 w-5" />
            ورود به سیستم
          </button>
        </form>
      </motion.div>
    </div>
  );
}
