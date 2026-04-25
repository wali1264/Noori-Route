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

export interface Supplier {
  id?: number;
  name: string;
  phone: string;
  address: string;
  createdAt: number;
}

export interface Purchase {
  id?: number;
  date: number;
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplierId: number;
  paidAmount: number;
}

export interface Sale {
  id?: number;
  date: number;
  customerId: number;
  description: string;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
}

export interface Receipt {
  id?: number;
  date: number;
  customerId: number;
  amount: number;
  note: string;
}

export interface VendorPayment {
  id?: number;
  date: number;
  supplierId: number;
  amount: number;
  note: string;
}

export interface Expense {
  id?: number;
  date: number;
  category: string;
  amount: number;
  description: string;
}
