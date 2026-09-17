import { StockTransaction, ProductCatalogItem } from '../types';

export const STORAGE_KEY = 'STOCK_IN_OUT_INVENTORY_V1';
export const CATALOG_STORAGE_KEY = 'STOCK_PRODUCT_CATALOG_V1';

export const DEFAULT_CATEGORIES = [
  'กระจูดรายา',
  'กระจูด Change',
  'น้ำผึ้งชันโรงบ้านไพรวัน',
  'ผ้าทอตอหลัง',
  'เรือกอและจำลอง',
];

export const DEFAULT_UNITS = ['ชิ้น', 'กล่อง', 'ถุง', 'ขวด', 'แพ็ค', 'กระปุก', 'กิโลกรัม', 'ผืน', 'ลำ', 'ก้อน'];

export const INITIAL_PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: 'PROD-001',
    code: 'KJD-01',
    name: 'กระเป๋ากระจูดทรงโท้ท ลายริ้ว',
    category: 'กระจูดรายา',
    unit: 'ชิ้น',
    sellingPrice: 350,
    costPrice: 220,
    initialStock: 0,
  },
  {
    id: 'PROD-002',
    code: 'KJD-02',
    name: 'ซองใส่เอกสารกระจูด A4',
    category: 'กระจูดรายา',
    unit: 'ชิ้น',
    sellingPrice: 190,
    costPrice: 120,
    initialStock: 0,
  },
  {
    id: 'PROD-003',
    code: 'CHG-01',
    name: 'หมวกกระจูดปีกกว้าง Change',
    category: 'กระจูด Change',
    unit: 'ชิ้น',
    sellingPrice: 280,
    costPrice: 180,
    initialStock: 0,
  },
  {
    id: 'PROD-004',
    code: 'CHG-02',
    name: 'กระเป๋าสะพายกระจูดร่วมสมัย',
    category: 'กระจูด Change',
    unit: 'ชิ้น',
    sellingPrice: 450,
    costPrice: 290,
    initialStock: 0,
  },
  {
    id: 'PROD-005',
    code: 'HNY-01',
    name: 'น้ำผึ้งชันโรงแท้ 100% (250 มล.)',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    unit: 'ขวด',
    sellingPrice: 390,
    costPrice: 260,
    initialStock: 0,
  },
  {
    id: 'PROD-006',
    code: 'HNY-02',
    name: 'สบู่น้ำผึ้งชันโรงสกัดเย็น',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    unit: 'ก้อน',
    sellingPrice: 85,
    costPrice: 45,
    initialStock: 0,
  },
  {
    id: 'PROD-007',
    code: 'WVN-01',
    name: 'ผ้าพันคอทอตอหลังลายยกดอก',
    category: 'ผ้าทอตอหลัง',
    unit: 'ผืน',
    sellingPrice: 550,
    costPrice: 350,
    initialStock: 0,
  },
  {
    id: 'PROD-008',
    code: 'WVN-02',
    name: 'ผ้าคลุมไหล่ทอตอหลังเส้นใยธรรมชาติ',
    category: 'ผ้าทอตอหลัง',
    unit: 'ผืน',
    sellingPrice: 690,
    costPrice: 450,
    initialStock: 0,
  },
  {
    id: 'PROD-009',
    code: 'KOR-01',
    name: 'เรือกอและจำลอง ขนาด 10 นิ้ว (ไม้สัก)',
    category: 'เรือกอและจำลอง',
    unit: 'ลำ',
    sellingPrice: 1200,
    costPrice: 750,
    initialStock: 0,
  },
  {
    id: 'PROD-010',
    code: 'KOR-02',
    name: 'เรือกอและจำลองพร้อมฐานกระจก 15 นิ้ว',
    category: 'เรือกอและจำลอง',
    unit: 'ลำ',
    sellingPrice: 2500,
    costPrice: 1600,
    initialStock: 0,
  },
];

export const INITIAL_MOCK_TRANSACTIONS: StockTransaction[] = [
  // 1. DeadStock sample: เรือกอและจำลอง (IN 46 days ago, sold 39 days ago, 8 left stalled)
  {
    id: 'TX-1001',
    date: '2026-08-01',
    type: 'IN',
    category: 'เรือกอและจำลอง',
    productName: 'เรือกอและจำลอง ขนาด 10 นิ้ว (ไม้สัก)',
    quantity: 10,
    unit: 'ลำ',
    unitPrice: 750,
    totalPrice: 7500,
    reporter: 'มานะ ช่างไม้',
    note: 'รับเข้าสต๊อกต้นเดือน สภาพสมบูรณ์',
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'TX-1002',
    date: '2026-08-08',
    type: 'OUT',
    category: 'เรือกอและจำลอง',
    productName: 'เรือกอและจำลอง ขนาด 10 นิ้ว (ไม้สัก)',
    quantity: 2,
    unit: 'ลำ',
    unitPrice: 1200,
    totalPrice: 2400,
    reporter: 'สมศรี จัดส่ง',
    note: 'จำหน่ายให้ศูนย์วัฒนธรรม',
    createdAt: '2026-08-08T14:30:00.000Z',
  },
  // 2. DeadStock sample: ซองใส่เอกสารกระจูด A4 (IN 50 days ago, 0 sold)
  {
    id: 'TX-1003',
    date: '2026-07-28',
    type: 'IN',
    category: 'กระจูดรายา',
    productName: 'ซองใส่เอกสารกระจูด A4',
    quantity: 15,
    unit: 'ชิ้น',
    unitPrice: 120,
    totalPrice: 1800,
    reporter: 'สมศักดิ์ คลัง',
    note: 'รับเข้าจากกลุ่มสานกระจูดรายา',
    createdAt: '2026-07-28T10:00:00.000Z',
  },
  // 3. สต๊อกต่ำ sample: หมวกกระจูดปีกกว้าง Change (IN 8, OUT 5 -> เหลือ 3 ชิ้น < 5)
  {
    id: 'TX-1004',
    date: '2026-09-08',
    type: 'IN',
    category: 'กระจูด Change',
    productName: 'หมวกกระจูดปีกกว้าง Change',
    quantity: 8,
    unit: 'ชิ้น',
    unitPrice: 180,
    totalPrice: 1440,
    reporter: 'อรทัย ฝ่ายผลิต',
    note: 'รับเข้าชุดใหม่',
    createdAt: '2026-09-08T09:15:00.000Z',
  },
  {
    id: 'TX-1005',
    date: '2026-09-14',
    type: 'OUT',
    category: 'กระจูด Change',
    productName: 'หมวกกระจูดปีกกว้าง Change',
    quantity: 5,
    unit: 'ชิ้น',
    unitPrice: 280,
    totalPrice: 1400,
    reporter: 'สมศรี จัดส่ง',
    note: 'ลูกค้าหน้าร้านซื้อเหมา',
    createdAt: '2026-09-14T11:00:00.000Z',
  },
  // 4. สินค้าปกติ sample: น้ำผึ้งชันโรงแท้ 100% (IN 50, OUT 10 -> เหลือ 40 ขวด >= 5)
  {
    id: 'TX-1006',
    date: '2026-09-02',
    type: 'IN',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    productName: 'น้ำผึ้งชันโรงแท้ 100% (250 มล.)',
    quantity: 50,
    unit: 'ขวด',
    unitPrice: 260,
    totalPrice: 13000,
    reporter: 'เกษม ไพรวัน',
    note: 'รอบเก็บเกี่ยวน้ำผึ้งเดือน 8',
    createdAt: '2026-09-02T08:30:00.000Z',
  },
  {
    id: 'TX-1007',
    date: '2026-09-15',
    type: 'OUT',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    productName: 'น้ำผึ้งชันโรงแท้ 100% (250 มล.)',
    quantity: 10,
    unit: 'ขวด',
    unitPrice: 390,
    totalPrice: 3900,
    reporter: 'วิชัย ตัวแทน',
    note: 'ส่งสาขาตัวแทนจำหน่าย',
    createdAt: '2026-09-15T15:00:00.000Z',
  },
  // 5. สินค้าปกติ sample: กระเป๋ากระจูดทรงโท้ท ลายริ้ว (IN 30, OUT 6 -> เหลือ 24 ชิ้น >= 5)
  {
    id: 'TX-1008',
    date: '2026-09-07',
    type: 'IN',
    category: 'กระจูดรายา',
    productName: 'กระเป๋ากระจูดทรงโท้ท ลายริ้ว',
    quantity: 30,
    unit: 'ชิ้น',
    unitPrice: 220,
    totalPrice: 6600,
    reporter: 'สมศักดิ์ คลัง',
    note: 'รับเข้ากระจูดลายริ้วล็อตล่าสุด',
    createdAt: '2026-09-07T10:20:00.000Z',
  },
  {
    id: 'TX-1009',
    date: '2026-09-14',
    type: 'OUT',
    category: 'กระจูดรายา',
    productName: 'กระเป๋ากระจูดทรงโท้ท ลายริ้ว',
    quantity: 6,
    unit: 'ชิ้น',
    unitPrice: 350,
    totalPrice: 2100,
    reporter: 'สมศรี จัดส่ง',
    note: 'ออเดอร์ออนไลน์ Shopee/TikTok',
    createdAt: '2026-09-14T16:45:00.000Z',
  },
  // 6. สินค้าหมด sample: กระเป๋าสะพายกระจูดร่วมสมัย (IN 10, OUT 10 -> เหลือ 0 ชิ้น)
  {
    id: 'TX-1010',
    date: '2026-09-03',
    type: 'IN',
    category: 'กระจูด Change',
    productName: 'กระเป๋าสะพายกระจูดร่วมสมัย',
    quantity: 10,
    unit: 'ชิ้น',
    unitPrice: 290,
    totalPrice: 2900,
    reporter: 'อรทัย ฝ่ายผลิต',
    note: 'รุ่นลิมิเต็ด ผลิต 10 ใบ',
    createdAt: '2026-09-03T11:00:00.000Z',
  },
  {
    id: 'TX-1011',
    date: '2026-09-12',
    type: 'OUT',
    category: 'กระจูด Change',
    productName: 'กระเป๋าสะพายกระจูดร่วมสมัย',
    quantity: 10,
    unit: 'ชิ้น',
    unitPrice: 450,
    totalPrice: 4500,
    reporter: 'สมศรี จัดส่ง',
    note: 'ลูกค้าเหมาหมดล็อตไปจัดนิทรรศการ',
    createdAt: '2026-09-12T13:20:00.000Z',
  },
];

export function getStoredTransactions(): StockTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTransactionsToStorage(INITIAL_MOCK_TRANSACTIONS);
      return INITIAL_MOCK_TRANSACTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        saveTransactionsToStorage(INITIAL_MOCK_TRANSACTIONS);
        return INITIAL_MOCK_TRANSACTIONS;
      }
      return parsed;
    }
    return INITIAL_MOCK_TRANSACTIONS;
  } catch (err) {
    console.error('Failed to parse localStorage data:', err);
    return INITIAL_MOCK_TRANSACTIONS;
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
    saveTransactionsToStorage(INITIAL_MOCK_TRANSACTIONS);
    return INITIAL_MOCK_TRANSACTIONS;
  } catch (err) {
    console.error('Failed to reset localStorage:', err);
    return INITIAL_MOCK_TRANSACTIONS;
  }
}

// ================= Product Catalog Storage =================

export function getStoredProductCatalog(): ProductCatalogItem[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      // First time: initialize with default items
      saveProductCatalogToStorage(INITIAL_PRODUCT_CATALOG);
      return INITIAL_PRODUCT_CATALOG;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_PRODUCT_CATALOG;
  } catch (err) {
    console.error('Failed to load product catalog:', err);
    return INITIAL_PRODUCT_CATALOG;
  }
}

export function saveProductCatalogToStorage(catalog: ProductCatalogItem[]): void {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.error('Failed to save product catalog to storage:', err);
  }
}

export function resetProductCatalogToDefault(): ProductCatalogItem[] {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCT_CATALOG));
    return INITIAL_PRODUCT_CATALOG;
  } catch (err) {
    console.error('Failed to reset product catalog:', err);
    return INITIAL_PRODUCT_CATALOG;
  }
}

/**
 * Parses CSV or Tab-separated text (such as copied from Excel) into ProductCatalogItem[]
 */
export function parseCatalogFromText(text: string): ProductCatalogItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const items: ProductCatalogItem[] = [];

  // Check if first row is header
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (
    firstLine.includes('ชื่อ') ||
    firstLine.includes('name') ||
    firstLine.includes('product') ||
    firstLine.includes('หมวด') ||
    firstLine.includes('category') ||
    firstLine.includes('ราคา') ||
    firstLine.includes('price')
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by tab if exists, otherwise comma (handling basic commas)
    let cols: string[] = [];
    if (line.includes('\t')) {
      cols = line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    } else {
      // Standard CSV comma splitting
      cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    }

    if (cols.length === 0 || !cols[0]) continue;

    // Expected format flexible mapping:
    // Format A: ชื่อสินค้า, กลุ่ม/หมวดหมู่, ราคาขาย, ราคาทุน, หน่วยนับ, รหัสสินค้า, สต๊อกยกมา
    // Format B: รหัสสินค้า, ชื่อสินค้า, หมวดหมู่, ราคาขาย, ราคาทุน, หน่วยนับ
    let name = '';
    let category = DEFAULT_CATEGORIES[0];
    let sellingPrice = 0;
    let costPrice: number | undefined = undefined;
    let unit = 'ชิ้น';
    let code: string | undefined = undefined;
    let initialStock: number | undefined = undefined;

    // Detection: is first column a code? (e.g. short alphanumeric)
    const isFirstColCode =
      cols.length >= 3 &&
      cols[0].length <= 10 &&
      /^[a-zA-Z0-9_-]+$/.test(cols[0]) &&
      cols[1] &&
      isNaN(Number(cols[1]));

    if (isFirstColCode) {
      code = cols[0];
      name = cols[1];
      category = cols[2] || DEFAULT_CATEGORIES[0];
      sellingPrice = parseFloat(cols[3]) || 0;
      costPrice = cols[4] ? parseFloat(cols[4]) : undefined;
      unit = cols[5] || 'ชิ้น';
      initialStock = cols[6] ? parseInt(cols[6], 10) : undefined;
    } else {
      name = cols[0];
      category = cols[1] || DEFAULT_CATEGORIES[0];
      sellingPrice = parseFloat(cols[2]) || 0;
      costPrice = cols[3] ? parseFloat(cols[3]) : undefined;
      unit = cols[4] || 'ชิ้น';
      code = cols[5] || undefined;
      initialStock = cols[6] ? parseInt(cols[6], 10) : undefined;
    }

    if (!name) continue;

    items.push({
      id: `PROD-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 5)}`,
      name,
      category,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      costPrice: costPrice !== undefined && !isNaN(costPrice) ? costPrice : undefined,
      unit: unit || 'ชิ้น',
      code: code || undefined,
      initialStock: initialStock !== undefined && !isNaN(initialStock) ? initialStock : undefined,
    });
  }

  return items;
}
