import { StockTransaction, ProductCatalogItem, ProductStockStatus, ProductInventorySummary } from '../types';

/**
 * Calculates days difference between two dates (date string or Date object).
 * Returns non-negative integer.
 */
export function getDaysDifference(pastDateStr: string, referenceDate: Date = new Date()): number {
  try {
    const past = new Date(pastDateStr).getTime();
    const ref = referenceDate.getTime();
    if (isNaN(past)) return 0;
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
 * 2. DeadStock (สีเทา): currentStock > 0 AND สินค้าจมทุนยังขายไม่ออกมาแล้ว 30 วัน (daysWithoutSale >= 30)
 * 3. สต๊อกต่ำ (สีเหลือง): currentStock > 0 AND currentStock < 5 ชิ้น
 * 4. สินค้าปกติ (สีเขียว): currentStock >= 5 ชิ้น และมีการเคลื่อนไหวขายออกภายใน 30 วัน
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
  } else if (baseStock > 0) {
    // Has initial stock but no transaction record, assume stalled if no sale
    daysWithoutSale = 35; // default to deadstock if initial stock has 0 movement
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

  const cost = item.costPrice ?? 0;
  const sell = item.sellingPrice ?? 0;
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
