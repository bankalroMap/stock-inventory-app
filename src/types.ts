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

export type ProductStockStatus = 'NORMAL' | 'LOW_STOCK' | 'DEAD_STOCK' | 'OUT_OF_STOCK';

export interface ProductInventorySummary {
  id: string;
  code: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  totalIn: number;
  totalOut: number;
  currentStock: number; // จำนวนคงเหลือในคลัง
  totalStockValue: number; // มูลค่าสต๊อกคงเหลือ (บาท)
  status: ProductStockStatus;
  statusLabel: string; // 'สินค้าปกติ' | 'สต๊อกต่ำ' | 'DeadStock' | 'สินค้าหมด'
  firstInDate?: string;
  lastInDate?: string;
  lastOutDate?: string;
  daysWithoutSale?: number; // จำนวนวันที่ขายไม่ออก
  note?: string;
}
