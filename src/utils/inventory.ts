import { StockTransaction, ProductCatalogItem, ProductStockStatus, ProductInventorySummary } from '../types';
import { INITIAL_PRODUCT_CATALOG } from './storage';

/**
 * Parses multiple date formats safely (ISO, DD/MM/YYYY, DD/MM/BBBB Thai Buddhist era, Excel serial)
 */
export function parseFlexibleDate(dateInput?: string | number | Date | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  const str = String(dateInput).trim();
  if (!str) return null;

  // Handle Excel serial date numbers e.g. 45552
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const d = new Date((serial - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year > 2400) year -= 543; // Thai Buddhist era (พ.ศ. -> ค.ศ.)
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    let year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    if (year > 2400) year -= 543;
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const standard = new Date(str);
  return isNaN(standard.getTime()) ? null : standard;
}

/**
 * Calculates days difference between two dates (date string or Date object).
 * Returns non-negative integer.
 */
export function getDaysDifference(pastDateStr: string, referenceDate: Date = new Date()): number {
  try {
    const parsed = parseFlexibleDate(pastDateStr);
    if (!parsed) return 0;
    const past = parsed.getTime();
    const ref = referenceDate.getTime();
    const diffMs = ref - past;
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Calculates stock balance, movement history, days without sale, and status for a single product.
 *
 * Status criteria:
 * 1. สินค้าหมด (สีแดง): currentStock <= 0
 * 2. DeadStock (สีเทา): currentStock > 0 AND มีประวัติรับเข้าหรือขายและค้างนิ่งเกิน 30 วัน
 * 3. สต๊อกต่ำ (สีเหลือง): currentStock > 0 AND currentStock < 5 ชิ้น
 * 4. สินค้าปกติ (สีเขียว): currentStock >= 5 ชิ้น
 */
export function calculateProductInventory(
  item: ProductCatalogItem,
  transactions: StockTransaction[],
  referenceDate: Date = new Date()
): ProductInventorySummary {
  const normName = item.name.trim().toLowerCase();
  const normCode = (item.code || '').trim().toLowerCase();

  // Find all transactions matching this item by name or code
  const productTx = transactions.filter((t) => {
    const tName = t.productName.trim().toLowerCase();
    if (tName === normName) return true;
    if (normCode && t.note && t.note.toLowerCase().includes(normCode)) return true;
    return false;
  });

  const inTx = productTx.filter((t) => t.type === 'IN');
  const outTx = productTx.filter((t) => t.type === 'OUT');

  const totalIn = inTx.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalOut = outTx.reduce((sum, t) => sum + (t.quantity || 0), 0);

  // If initialStock is provided, factor it in; otherwise totalIn - totalOut
  const baseStock = typeof item.initialStock === 'number' ? item.initialStock : 0;
  const currentStock = inTx.length > 0 || outTx.length > 0 ? baseStock + totalIn - totalOut : baseStock;

  // Find transaction dates
  const sortedInDates = inTx
    .map((t) => t.date)
    .filter(Boolean)
    .sort();
  const sortedOutDates = outTx
    .map((t) => t.date)
    .filter(Boolean)
    .sort();

  const firstInDate = sortedInDates[0];
  const lastInDate = sortedInDates[sortedInDates.length - 1];
  const lastOutDate = sortedOutDates[sortedOutDates.length - 1];

  // Calculate days without sale
  let daysWithoutSale: number | undefined = undefined;
  if (lastOutDate) {
    // Has had sales: days since last sale
    daysWithoutSale = getDaysDifference(lastOutDate, referenceDate);
  } else if (firstInDate) {
    // Has never been sold, but was received into stock: days since first receipt
    daysWithoutSale = getDaysDifference(firstInDate, referenceDate);
  } else if (baseStock > 0 && transactions.length > 0) {
    // There are active transactions in warehouse but this item was never moved
    daysWithoutSale = 35;
  }

  // Determine status
  let status: ProductStockStatus = 'NORMAL';
  let statusLabel = 'สินค้าปกติ';

  if (currentStock <= 0) {
    status = 'OUT_OF_STOCK';
    statusLabel = 'สินค้าหมด';
  } else if (daysWithoutSale !== undefined && daysWithoutSale >= 30) {
    status = 'DEAD_STOCK';
    statusLabel = 'DeadStock';
  } else if (currentStock < 5) {
    status = 'LOW_STOCK';
    statusLabel = 'สต๊อกต่ำ';
  } else {
    status = 'NORMAL';
    statusLabel = 'สินค้าปกติ';
  }

  let cost = item.costPrice ?? 0;
  let sell = item.sellingPrice ?? 0;

  // If cost and sell price are 0, check if transactions have price
  if (cost === 0 && sell === 0 && productTx.length > 0) {
    const txWithPrice = productTx.find((t) => (t.unitPrice || 0) > 0);
    if (txWithPrice) {
      cost = txWithPrice.unitPrice;
      sell = txWithPrice.unitPrice;
    }
  }

  // If still 0, check INITIAL_PRODUCT_CATALOG by name
  if (cost === 0 && sell === 0) {
    const matchInit = INITIAL_PRODUCT_CATALOG.find((p) => p.name.trim().toLowerCase() === normName);
    if (matchInit) {
      cost = matchInit.costPrice || 0;
      sell = matchInit.sellingPrice || 0;
    }
  }

  const totalStockValue = Math.max(0, currentStock) * (cost > 0 ? cost : sell);

  return {
    id: item.id,
    code: item.code || item.id,
    name: item.name,
    category: item.category || 'ทั่วไป',
    costPrice: cost,
    sellingPrice: sell,
    unit: item.unit || 'ชิ้น',
    totalIn,
    totalOut,
    currentStock,
    totalStockValue,
    status,
    statusLabel,
    firstInDate,
    lastInDate,
    lastOutDate,
    daysWithoutSale,
    note: item.note,
  };
}

/**
 * Generates the full inventory summary list for all catalog items plus any
 * uncatalogued products found in the transactions history.
 */
export function getFullInventoryList(
  catalog: ProductCatalogItem[],
  transactions: StockTransaction[],
  referenceDate: Date = new Date()
): ProductInventorySummary[] {
  const items: ProductInventorySummary[] = [];
  const handledNames = new Set<string>();

  // 1. Process catalog items
  for (const catItem of catalog) {
    const summary = calculateProductInventory(catItem, transactions, referenceDate);
    items.push(summary);
    handledNames.add(catItem.name.trim().toLowerCase());
  }

  // 2. Discover any extra items in transactions not present in catalog
  for (const t of transactions) {
    const norm = t.productName.trim().toLowerCase();
    if (!handledNames.has(norm)) {
      handledNames.add(norm);
      const syntheticItem: ProductCatalogItem = {
        id: `TX-ITEM-${items.length + 1}`,
        code: `SKU-${items.length + 1}`,
        name: t.productName.trim(),
        category: t.category || 'ทั่วไป',
        unit: t.unit || 'ชิ้น',
        sellingPrice: t.unitPrice || 0,
        costPrice: t.unitPrice || 0,
      };
      items.push(calculateProductInventory(syntheticItem, transactions, referenceDate));
    }
  }

  return items;
}
