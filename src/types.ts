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
