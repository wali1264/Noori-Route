export interface Setting {
  id?: number;
  key: string;
  value: any;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  accountNumber: string;
  createdAt: number;
}

export interface Purchase {
  id?: number;
  date: number;
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
}

export interface Sale {
  id?: number;
  date: number;
  customerId: number;
  description: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'partial';
}

export interface Receipt {
  id?: number;
  date: number;
  customerId: number;
  amount: number;
  note: string;
}

export interface Expense {
  id?: number;
  date: number;
  category: string;
  amount: number;
  note: string;
}
