import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import jalaali from 'jalaali-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fa-AF-u-nu-latn', {
    style: 'currency',
    currency: 'AFN',
  }).format(amount);
}

export const AFGHAN_MONTHS = [
  'حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله',
  'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'
];

export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const j = jalaali.toJalaali(date);
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
}

export function formatFullDate(timestamp: number) {
  const date = new Date(timestamp);
  const j = jalaali.toJalaali(date);
  return `${j.jd} ${AFGHAN_MONTHS[j.jm - 1]} ${j.jy}`;
}

export function toEnglishDigits(str: string): string {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  
  if (typeof str === 'string') {
    for (let i = 0; i < 10; i++) {
      str = str.replace(persianDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
  }
  return str;
}
