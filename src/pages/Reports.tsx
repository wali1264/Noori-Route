import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency, formatDate, AFGHAN_MONTHS, cn } from '../lib/utils';
import { Download, FileText, Printer, Calendar, Filter, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import jalaali from 'jalaali-js';

type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ExportFormat = 'excel' | 'pdf' | 'txt';

export default function Reports() {
  const [range, setRange] = useState<TimeRange>('month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const rawSales = useLiveQuery(() => db.sales.toArray());
  const rawPurchases = useLiveQuery(() => db.purchases.toArray());
  const rawReceipts = useLiveQuery(() => db.receipts.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const getFilteredData = (data: any[] | undefined) => {
    if (!data) return [];
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0)).getTime();
    
    return data.filter(item => {
      const itemDate = new Date(item.date).getTime();
      
      switch (range) {
        case 'today':
          return itemDate >= startOfToday;
        case 'yesterday': {
          const yesterday = startOfToday - 86400000;
          return itemDate >= yesterday && itemDate < startOfToday;
        }
        case 'week': {
          const weekAgo = startOfToday - 7 * 86400000;
          return itemDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = startOfToday - 30 * 86400000;
          return itemDate >= monthAgo;
        }
        case 'custom': {
          const start = customDates.start ? new Date(customDates.start).getTime() : 0;
          const end = customDates.end ? new Date(customDates.end).getTime() + 86400000 : Infinity;
          return itemDate >= start && itemDate < end;
        }
        default:
          return true;
      }
    });
  };

  const sales = useMemo(() => getFilteredData(rawSales), [rawSales, range, customDates]);
  const purchases = useMemo(() => getFilteredData(rawPurchases), [rawPurchases, range, customDates]);
  const receipts = useMemo(() => getFilteredData(rawReceipts), [rawReceipts, range, customDates]);

  const salesByMonth = useMemo(() => {
    if (!sales) return [];
    const months: Record<string, number> = {};
    sales.forEach(s => {
      const j = jalaali.toJalaali(new Date(s.date));
      const monthName = AFGHAN_MONTHS[j.jm - 1];
      months[monthName] = (months[monthName] || 0) + s.amount;
    });
    return Object.entries(months).map(([name, total]) => ({ name, total }));
  }, [sales]);

  const flowData = useMemo(() => {
    const days: Record<string, { date: string, income: number, expense: number }> = {};
    
    sales.forEach(s => {
      const d = new Date(s.date).toISOString().split('T')[0];
      if (!days[d]) days[d] = { date: d, income: 0, expense: 0 };
      days[d].income += s.amount;
    });
    
    purchases.forEach(p => {
      const d = new Date(p.date).toISOString().split('T')[0];
      if (!days[d]) days[d] = { date: d, income: 0, expense: 0 };
      days[d].expense += p.totalPrice;
    });
    
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, purchases]);

  const handleExport = () => {
    const filename = `report-${range}-${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'excel') {
      const wb = XLSX.utils.book_new();
      
      const salesWS = XLSX.utils.json_to_sheet(sales.map(s => ({
        'مشتری': customers?.find(c => c.id === s.customerId)?.name || 'نامعلوم',
        'شرح': s.description,
        'مبلغ': s.amount,
        'تاریخ': formatDate(s.date)
      })));
      XLSX.utils.book_append_sheet(wb, salesWS, 'Sales');
      
      const purchaseWS = XLSX.utils.json_to_sheet(purchases.map(p => ({
        'آیتم': p.item,
        'مجموع': p.totalPrice,
        'تامین کننده': p.supplier,
        'تاریخ': formatDate(p.date)
      })));
      XLSX.utils.book_append_sheet(wb, purchaseWS, 'Purchases');
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else if (exportFormat === 'pdf') {
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.text("Noori Route ISP - Financial Report", 10, 10);
      doc.text(`Range: ${range}`, 10, 16);
      
      const tableData = sales.map(s => [
        customers?.find(c => c.id === s.customerId)?.name || 'N/A',
        s.description,
        formatDate(s.date),
        s.amount.toString()
      ]);
      
      (doc as any).autoTable({
        head: [['Customer', 'Description', 'Date', 'Amount']],
        body: tableData,
        startY: 25,
      });
      
      doc.save(`${filename}.pdf`);
    } else if (exportFormat === 'txt') {
      const content = sales.map(s => `SALE: ${formatDate(s.date)} | ${s.amount} AFN | ${s.description}`).join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 pb-12 print:p-0">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <h2 className="text-xl font-bold text-slate-800">گزارشات و تحلیل مالی نوری روت</h2>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {(['today', 'yesterday', 'week', 'month', 'custom'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                  range === r ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {r === 'today' ? 'امروز' : r === 'yesterday' ? 'دیروز' : r === 'week' ? '۷ روز اخیر' : r === 'month' ? '۳۰ روز اخیر' : 'سفارشی'}
              </button>
            ))}
          </div>

          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {(['excel', 'pdf', 'txt'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setExportFormat(f)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all",
                  exportFormat === f ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
            <button 
              onClick={handleExport}
              className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {range === 'custom' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 print:hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">از تاریخ</label>
            <input 
              type="date" 
              value={customDates.start}
              onChange={e => setCustomDates({...customDates, start: e.target.value})}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">الی تاریخ</label>
            <input 
              type="date" 
              value={customDates.end}
              onChange={e => setCustomDates({...customDates, end: e.target.value})}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {viewMode === 'summary' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-blue-600" />
                فروشات به تفکیک ماه (افغانی)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-green-600" />
                روند ورودی و خروجی نقدینگی
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} dot={false} name="عاید" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="مصرف" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">خلاصه وضعیت مالی در بازه انتخابی</h3>
              <div className="flex gap-2 print:hidden">
                <button 
                  onClick={() => setViewMode('detailed')}
                  className="px-4 py-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  مشاهده جزئیات بیشتر
                </button>
                <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-blue-600">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">فروشات</span>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(sales?.reduce((a, b) => a + b.amount, 0) || 0).replace('AFN', '')}</p>
                <p className="text-[8px] text-green-500 font-bold">ورودی ناخالص</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">خریدات</span>
                <p className="text-2xl font-black text-red-600">{formatCurrency(purchases?.reduce((a, b) => a + b.totalPrice, 0) || 0).replace('AFN', '')}</p>
                <p className="text-[8px] text-red-400 font-bold">هزینه تجهیزات</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">رسید نقد</span>
                <p className="text-2xl font-black text-green-600">{formatCurrency(receipts?.reduce((a, b) => a + b.amount, 0) || 0).replace('AFN', '')}</p>
                <p className="text-[8px] text-slate-400 font-bold">دریافت شده واقعـی</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تفاضل (مفاد)</span>
                <p className="text-2xl font-black text-blue-600">{formatCurrency((sales?.reduce((a, b) => a + b.amount, 0) || 0) - (purchases?.reduce((a, b) => a + b.totalPrice, 0) || 0)).replace('AFN', '')}</p>
                <p className="text-[8px] text-blue-400 font-bold">برآورد نهایی</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
              <h3 className="text-sm font-black text-slate-800">گزارش تفصیلی تراکنش‌ها</h3>
              <button 
                onClick={() => setViewMode('summary')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                بازگشت به خلاصه
              </button>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 print:bg-white">
                    <tr>
                       <th className="px-6 py-4 font-bold">تاریخ</th>
                       <th className="px-6 py-4 font-bold">نوع</th>
                       <th className="px-6 py-4 font-bold">شرح / آیتم</th>
                       <th className="px-6 py-4 font-bold">مبلغ (AFN)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {sales.map(s => (
                       <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400">{formatDate(s.date)}</td>
                          <td className="px-6 py-4"><span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">فـروش</span></td>
                          <td className="px-6 py-4 text-slate-900 font-medium">{s.description}</td>
                          <td className="px-6 py-4 font-black">{formatCurrency(s.amount).replace('AFN', '')}</td>
                       </tr>
                    ))}
                    {purchases.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400">{formatDate(p.date)}</td>
                          <td className="px-6 py-4"><span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">خـرید</span></td>
                          <td className="px-6 py-4 text-slate-900 font-medium">{p.item}</td>
                          <td className="px-6 py-4 font-black text-red-600">({formatCurrency(p.totalPrice).replace('AFN', '')})</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="p-6 bg-slate-50 flex justify-end print:hidden">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                چاپ گزارش تفصیلی
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
