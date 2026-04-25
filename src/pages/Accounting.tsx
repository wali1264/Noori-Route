import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Users, 
  Truck, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Calculator
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Accounting() {
  const customers = useLiveQuery(() => db.customers.toArray());
  const sales = useLiveQuery(() => db.sales.toArray());
  const receipts = useLiveQuery(() => db.receipts.toArray());
  
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const purchases = useLiveQuery(() => db.purchases.toArray());
  const vendorPayments = useLiveQuery(() => db.vendorPayments?.toArray() || Promise.resolve([]));
  const expenses = useLiveQuery(() => db.expenses.toArray());

  // Calculations for Customers
  const customerBalances = customers?.map(customer => {
    const customerSales = sales?.filter(s => s.customerId === customer.id) || [];
    const customerReceipts = receipts?.filter(r => r.customerId === customer.id) || [];
    
    const totalSales = customerSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalReceipts = customerReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    return {
      ...customer,
      balance: totalSales - totalReceipts
    };
  }) || [];

  const totalReceivable = customerBalances.reduce((sum, c) => sum + c.balance, 0);

  // Calculations for Suppliers
  const supplierBalances = suppliers?.map(supplier => {
    const supplierPurchases = purchases?.filter(p => p.supplierId === supplier.id) || [];
    const supplierPayments = vendorPayments?.filter(v => v.supplierId === supplier.id) || [];
    
    const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const totalPayments = supplierPayments.reduce((sum, v) => sum + (v.amount || 0), 0);
    const upfrontPaid = supplierPurchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    return {
      ...supplier,
      balance: totalPurchases - totalPayments - upfrontPaid
    };
  }) || [];

  const totalPayable = supplierBalances.reduce((sum, s) => sum + s.balance, 0);
  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

  const stats = [
    { 
      title: 'مجموع طلبات (مشتریان)', 
      value: totalReceivable, 
      icon: ArrowUpRight, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      description: 'مبلغی که مشتریان باید پرداخت کنند'
    },
    { 
      title: 'مجموع بدهی‌ها (تامین‌کنندگان)', 
      value: totalPayable, 
      icon: ArrowDownRight, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      description: 'مبلغی که به تامین‌کنندگان بدهکار هستید'
    },
    { 
      title: 'مجموع مصارف متفرقه', 
      value: totalExpenses, 
      icon: TrendingDown, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      description: 'مجموع هزینه‌های متفرقه ثبت شده'
    },
    { 
      title: 'تراز نهایی شرکت', 
      value: totalReceivable - totalPayable - totalExpenses, 
      icon: Wallet, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      description: 'طلبات منهای (بدهی‌ها + مصارف)'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-blue-600" />
          وضعیت کل حسابداری
        </h2>
        <p className="text-slate-500 text-sm mt-1">خلاصه‌ای از معامله‌های مالی، طلبات و بدهی‌ها</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110", stat.bg)} />
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-bold">{stat.title}</h3>
            <div className={cn("text-2xl font-black mt-1", stat.color)}>
              {formatCurrency(stat.value).replace('AFN', '')}
              <span className="text-xs mr-1">AFN</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Customer Receivables */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">لیست طلبات از مشتریان</h3>
            </div>
            <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-full font-bold">
              {customerBalances.filter(c => c.balance > 0).length} مورد
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-bold">نام مشتری</th>
                  <th className="px-6 py-4 font-bold">باقیمانده حساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerBalances.filter(c => c.balance > 0).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{c.name}</td>
                    <td className="px-6 py-4 font-black text-green-600">{formatCurrency(c.balance).replace('AFN', '')}</td>
                  </tr>
                ))}
                {!customerBalances.some(c => c.balance > 0) && (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-slate-400 italic">هیچ طلبی ثبت نشده است.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Supplier Payables */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">لیست بدهی‌ها به شرکت‌ها</h3>
            </div>
            <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-full font-bold">
              {supplierBalances.filter(s => s.balance > 0).length} مورد
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-bold">نام تامین‌کننده</th>
                  <th className="px-6 py-4 font-bold">مبلغ بدهی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierBalances.filter(s => s.balance > 0).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{s.name}</td>
                    <td className="px-6 py-4 font-black text-red-600">{formatCurrency(s.balance).replace('AFN', '')}</td>
                  </tr>
                ))}
                {!supplierBalances.some(s => s.balance > 0) && (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-slate-400 italic">هیچ بدهی ثبت نشده است.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
