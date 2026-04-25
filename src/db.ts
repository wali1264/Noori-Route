import Dexie, { type Table } from 'dexie';
import type { Customer, Purchase, Sale, Receipt, Expense, Setting, Supplier, VendorPayment } from './types';

export class AppDatabase extends Dexie {
  settings!: Table<Setting>;
  customers!: Table<Customer>;
  suppliers!: Table<Supplier>;
  purchases!: Table<Purchase>;
  sales!: Table<Sale>;
  receipts!: Table<Receipt>;
  vendorPayments!: Table<VendorPayment>;
  expenses!: Table<Expense>;

  constructor() {
    super('NooriRouteDB');
    this.version(2).stores({
      settings: '++id, key',
      customers: '++id, name, accountNumber',
      suppliers: '++id, name',
      purchases: '++id, date, item, supplierId',
      sales: '++id, date, customerId',
      receipts: '++id, date, customerId',
      vendorPayments: '++id, date, supplierId',
      expenses: '++id, date, category'
    });
  }
}

export const db = new AppDatabase();

// Initial data setup if needed
export async function initializeDb() {
  const password = await db.settings.where({ key: 'password' }).first();
  if (!password) {
    await db.settings.add({ key: 'password', value: '1234' }); // Default password
  }
  
  const companyName = await db.settings.where({ key: 'companyName' }).first();
  if (!companyName) {
    await db.settings.add({ key: 'companyName', value: 'شرکت خدمات انترنتی نوری روت' });
  }
}
