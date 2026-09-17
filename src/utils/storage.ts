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
    initialStock: 25,
  },
  {
    id: 'PROD-002',
    code: 'KJD-02',
    name: 'ซองใส่เอกสารกระจูด A4',
    category: 'กระจูดรายา',
    unit: 'ชิ้น',
    sellingPrice: 190,
    costPrice: 120,
    initialStock: 40,
  },
  {
    id: 'PROD-003',
    code: 'CHG-01',
    name: 'หมวกกระจูดปีกกว้าง Change',
    category: 'กระจูด Change',
    unit: 'ชิ้น',
    sellingPrice: 280,
    costPrice: 180,
    initialStock: 30,
  },
  {
    id: 'PROD-004',
    code: 'CHG-02',
    name: 'กระเป๋าสะพายกระจูดร่วมสมัย',
    category: 'กระจูด Change',
    unit: 'ชิ้น',
    sellingPrice: 450,
    costPrice: 290,
    initialStock: 15,
  },
  {
    id: 'PROD-005',
    code: 'HNY-01',
    name: 'น้ำผึ้งชันโรงแท้ 100% (250 มล.)',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    unit: 'ขวด',
    sellingPrice: 390,
    costPrice: 260,
    initialStock: 50,
  },
  {
    id: 'PROD-006',
    code: 'HNY-02',
    name: 'สบู่น้ำผึ้งชันโรงสกัดเย็น',
    category: 'น้ำผึ้งชันโรงบ้านไพรวัน',
    unit: 'ก้อน',
    sellingPrice: 85,
    costPrice: 45,
    initialStock: 80,
  },
  {
    id: 'PROD-007',
    code: 'WVN-01',
    name: 'ผ้าพันคอทอตอหลังลายยกดอก',
    category: 'ผ้าทอตอหลัง',
    unit: 'ผืน',
    sellingPrice: 550,
    costPrice: 350,
    initialStock: 20,
  },
  {
    id: 'PROD-008',
    code: 'WVN-02',
    name: 'ผ้าคลุมไหล่ทอตอหลังเส้นใยธรรมชาติ',
    category: 'ผ้าทอตอหลัง',
    unit: 'ผืน',
    sellingPrice: 690,
    costPrice: 450,
    initialStock: 12,
  },
  {
    id: 'PROD-009',
    code: 'KOR-01',
    name: 'เรือกอและจำลอง ขนาด 10 นิ้ว (ไม้สัก)',
    category: 'เรือกอและจำลอง',
    unit: 'ลำ',
    sellingPrice: 1200,
    costPrice: 750,
    initialStock: 10,
  },
  {
    id: 'PROD-010',
    code: 'KOR-02',
    name: 'เรือกอและจำลองพร้อมฐานกระจก 15 นิ้ว',
    category: 'เรือกอและจำลอง',
    unit: 'ลำ',
    sellingPrice: 2500,
    costPrice: 1600,
    initialStock: 5,
  },
];

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
