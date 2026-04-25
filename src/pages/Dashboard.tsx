import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  History,
  MoreHorizontal,
  ChevronRight,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  BarChart as BarChartIcon
} from 'lucide-react';
import jalaali from 'jalaali-js';
import { formatCurrency, formatDate, AFGHAN_MONTHS, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Dashboard() {
  const [activityLimit, setActivityLimit] = useState(5);
  
  const sales = useLiveQuery(() => db.sales.toArray());
  const purchases = useLiveQuery(() => db.purchases.toArray());
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const receipts = useLiveQuery(() => db.receipts.toArray());
  const customersCount = useLiveQuery(() => db.customers.count());
  const customers = useLiveQuery(() => db.customers.toArray());

  const totalSales = sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
  const totalPurchases = purchases?.reduce((sum, p) => sum + p.totalPrice, 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalReceipts = receipts?.reduce((sum, r) => sum + r.amount, 0) || 0;
  
  const profit = totalSales - (totalPurchases + totalExpenses);

  // Chart Data preparation
  const chartData = React.useMemo(() => {
    if (!sales) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dObj = new Date(date);
      const j = jalaali.toJalaali(dObj);
      const daySales = sales
        .filter(s => new Date(s.date).toISOString().split('T')[0] === date)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      return {
        name: `${j.jd} ${AFGHAN_MONTHS[j.jm - 1]}`,
        فروش: daySales
      };
    });
  }, [sales]);

  // Combine activities
  const activities = React.useMemo(() => {
    const raw: any[] = [];
    if (sales) sales.forEach(s => raw.push({ ...s, type: 'sale', date: s.date }));
    if (purchases) purchases.forEach(p => raw.push({ ...p, type: 'purchase', date: p.date }));
    if (receipts) receipts.forEach(r => raw.push({ ...r, type: 'receipt', date: r.date }));
    
    return raw.sort((a, b) => b.date - a.date).slice(0, activityLimit);
  }, [sales, purchases, receipts, activityLimit]);

  const stats = [
    { 
      label: 'مجموع فروشات', 
      value: formatCurrency(totalSales), 
      trend: 'فروش مستقیم به مشتریان',
      color: 'text-slate-900',
      icon: <ShoppingBag className="w-4 h-4 text-blue-600" />
    },
    { 
      label: 'کل خریدات', 
      value: formatCurrency(totalPurchases), 
      trend: 'هزینه تجهیزات و پهنای باند',
      color: 'text-slate-900',
      icon: <ShoppingCart className="w-4 h-4 text-orange-600" />
    },
    { 
      label: 'رسیدات نقد', 
      value: formatCurrency(totalReceipts), 
      trend: 'مبالغ دریافت شده نقد',
      color: 'text-green-600',
      icon: <CreditCard className="w-4 h-4 text-green-600" />
    },
    { 
      label: 'مشتریان فعال', 
      value: customersCount?.toString() || '0', 
      trend: 'تعداد کل مشترکین ثبت شده',
      color: 'text-slate-900',
      icon: <Users className="w-4 h-4 text-purple-600" />
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Page Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">داشبورد اصلی</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 p-3 opacity-10">
              {stat.icon}
            </div>
            <span className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">{stat.label}</span>
            <h3 className={cn("text-2xl font-black", stat.color)}>{stat.value.replace('AFN', '')}</h3>
            <p className="text-[9px] mt-2 font-medium text-slate-400">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Profits Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-950 rounded-2xl p-6 text-white flex justify-between items-center shadow-xl border border-slate-800"
        >
          <div>
             <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase">موجودی صندوق (تخمینی)</h4>
             <p className="text-3xl font-black">{formatCurrency(totalReceipts - totalExpenses).replace('AFN', '')} <span className="text-xs font-medium text-slate-500">AFN</span></p>
          </div>
          <div className="h-full w-px bg-slate-800 rounded mx-4 hidden md:block"></div>
          <div className="text-left md:text-right">
             <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase">مفاد خالص</h4>
             <p className={cn(
               "text-3xl font-black",
               profit >= 0 ? "text-blue-500" : "text-red-500"
             )}>{formatCurrency(profit).replace('AFN', '')}</p>
          </div>
        </motion.div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[200px]">
          <div className="flex items-center justify-between mb-4">
             <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
               <BarChartIcon className="w-4 h-4 text-blue-600" />
               روند فروش ۷ روز اخیر
             </h4>
             <Link to="/reports" className="text-[9px] font-bold text-blue-600">مشاهده جزئیات</Link>
          </div>
          <div className="flex-1 w-full text-[8px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={8} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="فروش" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
       </div>

       {/* Recent Activity (Combined Feed) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            آخرین فعالیت‌های مالی سیستم
          </h2>
          <Link to="/sales" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
            مشاهده همه
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="divide-y divide-slate-50">
          {activities.length > 0 ? activities.map((activity, idx) => {
            const customer = activity.customerId ? customers?.find(c => c.id === activity.customerId) : null;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    activity.type === 'sale' ? "bg-blue-50 border-blue-100 text-blue-600" :
                    activity.type === 'purchase' ? "bg-orange-50 border-orange-100 text-orange-600" :
                    "bg-green-50 border-green-100 text-green-600"
                  )}>
                    {activity.type === 'sale' ? <ShoppingBag className="w-4 h-4" /> :
                     activity.type === 'purchase' ? <ShoppingCart className="w-4 h-4" /> :
                     <CreditCard className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900">
                      {activity.type === 'sale' ? `فروش: ${activity.description}` :
                       activity.type === 'purchase' ? `خرید: ${activity.item}` :
                       `رسید پول: ${customer?.name || 'نامعلوم'}`}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {customer ? `${customer.name} | ` : ''}
                      {formatDate(activity.date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-black",
                    activity.type === 'sale' || activity.type === 'receipt' ? "text-slate-900" : "text-red-600"
                  )}>
                    {activity.type === 'purchase' ? '-' : '+'}{formatCurrency(
                      activity.type === 'purchase' ? activity.totalPrice : 
                      activity.type === 'sale' ? activity.totalAmount : 
                      activity.amount
                    ).replace('AFN', '')}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">AFN</div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="p-12 text-center text-slate-400 text-xs font-bold italic">
              هیچ فعالیتی برای نمایش یافت نشد.
            </div>
          )}
        </div>

        {activities.length >= activityLimit && (
          <div className="p-6 border-t border-slate-50 flex justify-center bg-slate-50/30">
            <button 
              onClick={() => setActivityLimit(prev => prev + 5)}
              className="flex items-center gap-2 px-8 py-2 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-100 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
            >
              نمایش موارد بیشتر
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

