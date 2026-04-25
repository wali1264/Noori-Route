import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db, initializeDb } from './db';
import Shell from './components/layout/Shell';
import { RefreshCw } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Receipts from './pages/Receipts';
import Accounting from './pages/Accounting';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  useEffect(() => {
    async function setup() {
      await initializeDb();
      const auth = localStorage.getItem('noori_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }

      // Check for updates
      const checkUpdate = async () => {
        try {
          const res = await fetch('/version.json?' + new Date().getTime());
          const data = await res.json();
          if (data.version !== '1.1.0') {
            setShowUpdateToast(true);
          }
        } catch (e) {
          console.log('Update check failed');
        }
      };
      checkUpdate();
      const upInterval = setInterval(checkUpdate, 1000 * 60 * 15);

      // Check for auto-backup
      const autoBackup = localStorage.getItem('noori_auto_backup') === 'true';
      const lastBackup = localStorage.getItem('noori_last_backup');
      const now = new Date().getTime();
      
      if (autoBackup) {
        if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
          // Perform silent auto-backup (trigger export and save meta)
          try {
            const { exportDB } = await import("dexie-export-import");
            const blob = await exportDB(db);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `auto-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            localStorage.setItem('noori_last_backup', now.toString());
            console.log('Auto-backup performed');
          } catch (e) {
            console.error('Auto-backup failed', e);
          }
        }
      }

      setLoading(false);
      return () => clearInterval(upInterval);
    }
    setup();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">در حال بارگذاری...</div>;

  return (
    <BrowserRouter>
      {showUpdateToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <div className="text-[10px] font-bold">نسخه جدید برنامه در دسترس است!</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-blue-600 px-3 py-1 rounded-xl text-[9px] font-black hover:bg-blue-50 transition-all active:scale-95"
          >
            بروزرسانی
          </button>
        </div>
      )}
      {isAuthenticated ? (
        <Shell onLogout={() => setIsAuthenticated(false)}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Shell>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
