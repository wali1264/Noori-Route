import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  ShoppingCart, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  BarChart,
  Truck,
  BookOpen,
  DollarSign,
  Calculator
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ShellProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { to: '/customers', icon: Users, label: 'مشتریان' },
  { to: '/suppliers', icon: Truck, label: 'تامین کنندگان' },
  { to: '/sales', icon: ShoppingBag, label: 'فروشات' },
  { to: '/purchases', icon: ShoppingCart, label: 'خریدات' },
  { to: '/receipts', icon: FileText, label: 'رسیدات' },
  { to: '/expenses', icon: DollarSign, label: 'مصارف متفرقه' },
  { to: '/accounting', icon: Calculator, label: 'حسابداری' },
  { to: '/reports', icon: BarChart, label: 'گزارشات' },
  { to: '/settings', icon: Settings, label: 'تنظیمات' },
];

export default function Shell({ children, onLogout }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('noori_auth');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden flex-col" dir="rtl">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between shadow-md z-30 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Noori Route Logo" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="text-base font-bold leading-none">شرکت خدمات انترنتی نوری روت</h1>
            <span className="text-[10px] text-slate-400">سیستم مدیریت پایگاه داده - نسخه ۱.۱</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 border-r border-slate-700 pr-4">
            <div className="text-left text-right">
              <p className="text-[10px] text-slate-400">کاربر فعلی</p>
              <p className="text-xs font-medium">مدیر سیستم</p>
            </div>
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-xs hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
          >
            خروج
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col bg-white border-l border-slate-200 md:flex">
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-bold" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 bg-blue-600 text-white m-4 rounded-xl shadow-lg shadow-blue-200">
            <p className="text-[10px] opacity-80 mb-1">گزارش وضعیت سیستم</p>
            <p className="text-sm font-bold">حالت آفلاین فعال است</p>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl md:hidden flex flex-col"
              >
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
                  <h1 className="text-lg font-black text-blue-600">نوری روت</h1>
                  <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive 
                            ? "bg-blue-50 text-blue-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
