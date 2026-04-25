import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { db, initializeDb } from './db';
import Shell from './components/layout/Shell';
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

  useEffect(() => {
    async function setup() {
      await initializeDb();
      const auth = localStorage.getItem('noori_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
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
    }
    setup();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">در حال بارگذاری...</div>;

  return (
    <BrowserRouter>
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
