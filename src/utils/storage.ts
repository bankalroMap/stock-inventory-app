import { StockTransaction } from '../types';

export const STORAGE_KEY = 'STOCK_IN_OUT_INVENTORY_V1';

export const DEFAULT_CATEGORIES = [
  'กระจูดรายา',
  'กระจูด Change',
  'น้ำผึ้งชันโรงบ้านไพรวัน',
  'ผ้าทอตอหลัง',
  'เรือกอและจำลอง',
];

export const DEFAULT_UNITS = ['ชิ้น', 'กล่อง', 'ถุง', 'ขวด', 'แพ็ค', 'กระปุก', 'กิโลกรัม'];

export const INITIAL_MOCK_TRANSACTIONS: StockTransaction[] = [];

export function getStoredTransactions(): StockTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return [];
  }
}

export function saveTransactionsToStorage(transactions: StockTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function resetStoredTransactions(): StockTransaction[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (err) {
    console.error('Failed to reset localStorage:', err);
    return [];
  }
}
