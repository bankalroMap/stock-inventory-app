export type TransactionType = 'IN' | 'OUT';

export interface StockTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType; // เข้าสต๊อก (IN) หรือ ออกสต๊อก (OUT)
  category: string; // กลุ่มที่ผลิตสินค้า
  productName: string; // รายการสินค้า
  quantity: number; // จำนวน
  unit: string; // หน่วยนับ (ชิ้น, กล่อง, ลัง, etc.)
  unitPrice: number; // ราคาขาย (บาท)
  totalPrice: number; // ราคารวม (ราคาขาย x จำนวน)
  reporter: string; // ผู้แจ้ง
  note?: string; // หมายเหตุเพิ่มเติม
  createdAt: string; // ISO string
}

export interface StockStats {
  totalInQuantity: number;
  totalOutQuantity: number;
  remainingStock: number;
  totalValue: number;
  transactionCount: number;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ProductCatalogItem {
  id: string;
  name: string; // ชื่อสินค้า
  category: string; // กลุ่มที่ผลิตสินค้า
  unit: string; // หน่วยนับ (ชิ้น, กล่อง, ถุง ฯลฯ)
  sellingPrice: number; // ราคาขาย / ราคาจ่ายออก (บาท)
  costPrice?: number; // ราคาต้นทุน / ราคารับเข้า (บาท)
  code?: string; // รหัสสินค้า / SKU
  initialStock?: number; // จำนวนสต๊อกยกมา
  note?: string; // รายละเอียดเพิ่มเติม
}
