import Dexie, { type Table } from 'dexie';
import type { Customer, Purchase, Sale, Receipt, Expense, Setting } from './types';

export class AppDatabase extends Dexie {
  settings!: Table<Setting>;
  customers!: Table<Customer>;
  purchases!: Table<Purchase>;
  sales!: Table<Sale>;
  receipts!: Table<Receipt>;
  expenses!: Table<Expense>;

  constructor() {
    super('NooriRouteDB');
    this.version(1).stores({
      settings: '++id, key',
      customers: '++id, name, accountNumber',
      purchases: '++id, date, item',
      sales: '++id, date, customerId',
      receipts: '++id, date, customerId',
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
