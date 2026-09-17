import { StockTransaction, ProductCatalogItem } from '../types';
import { calculateProductInventory, parseFlexibleDate } from '../utils/inventory';

export const STOCK_SHEET_TITLE = 'สต๊อกสินค้า';
export const CATALOG_SHEET_TITLE = 'คลังสินค้า';
export const SPREADSHEET_NAME = 'ระบบบันทึกสต๊อกสินค้า เข้า-ออก (Stock Inventory)';
export const SAVED_SPREADSHEET_ID_KEY = 'GOOGLE_SHEETS_STOCK_ID';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheetId: number;
  stockSheetTitle: string;
  catalogSheetId?: number;
  catalogSheetTitle: string;
}

function identifySheets(sheets: any[]) {
  const catalogSheet = sheets?.find((s: any) => {
    const t = (s.properties?.title || '').toLowerCase();
    return t === CATALOG_SHEET_TITLE.toLowerCase() || t.includes('คลัง') || t.includes('catalog');
  });

  const stockSheet =
    sheets?.find((s: any) => {
      if (catalogSheet && s.properties?.sheetId === catalogSheet.properties?.sheetId) return false;
      const t = (s.properties?.title || '').toLowerCase();
      return (
        t === STOCK_SHEET_TITLE.toLowerCase() ||
        t.includes('สต๊อก') ||
        t.includes('stock') ||
        t.includes('รายการ') ||
        t.includes('ประวัติ')
      );
    }) ||
    sheets?.find((s: any) => !catalogSheet || s.properties?.sheetId !== catalogSheet.properties?.sheetId) ||
    sheets?.[0];

  return {
    stockSheetId: stockSheet?.properties?.sheetId ?? 0,
    stockSheetTitle: stockSheet?.properties?.title ?? STOCK_SHEET_TITLE,
    catalogSheetId: catalogSheet?.properties?.sheetId,
    catalogSheetTitle: catalogSheet?.properties?.title ?? CATALOG_SHEET_TITLE,
  };
}

const TABLE_HEADERS = [
  'รหัสรายการ',
  'วันที่',
  'ประเภท',
  'กลุ่มที่ผลิตสินค้า',
  'รายการสินค้า',
  'ราคาขาย/หน่วย',
  'จำนวน',
  'หน่วยนับ',
  'ราคารวม (บาท)',
  'ผู้แจ้ง',
  'หมายเหตุ',
  'เวลาบันทึก (Timestamp)',
];

export const CATALOG_TABLE_HEADERS = [
  'รหัสสินค้า (SKU)',
  'ชื่อรายการสินค้า',
  'กลุ่มที่ผลิตสินค้า',
  'จำนวนคงเหลือในคลัง',
  'หน่วยนับ',
  'สถานะสินค้า',
  'ราคาทุน/รับเข้า (บาท)',
  'ราคาขาย (บาท)',
  'มูลค่าสต๊อกคงเหลือ (บาท)',
  'หมายเหตุ',
];

/**
 * Searches Google Drive for an existing spreadsheet created by the app or creates a new one.
 */
export async function findOrCreateStockSpreadsheet(
  accessToken: string,
  initialCatalogItems?: ProductCatalogItem[]
): Promise<SpreadsheetInfo> {
  const savedId = localStorage.getItem(SAVED_SPREADSHEET_ID_KEY);

  if (savedId) {
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${savedId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const meta = await res.json();
        const sheetInfo = identifySheets(meta.sheets || []);

        // Ensure headers exist for transactions
        await ensureHeaders(accessToken, savedId, sheetInfo.stockSheetTitle);

        // Check or create catalog sheet
        let catalogSheetId = sheetInfo.catalogSheetId;
        if (catalogSheetId === undefined) {
          catalogSheetId = await createCatalogSheet(accessToken, savedId);
        }
        await ensureCatalogHeaders(accessToken, savedId, sheetInfo.catalogSheetTitle);

        // If catalog sheet is empty and initialCatalogItems provided, populate it
        if (initialCatalogItems && initialCatalogItems.length > 0) {
          try {
            const existingCatalog = await fetchCatalogFromSheet(accessToken, savedId, sheetInfo.catalogSheetTitle);
            if (existingCatalog.length === 0) {
              await saveCatalogToSheet(accessToken, savedId, initialCatalogItems, [], sheetInfo.catalogSheetTitle);
            }
          } catch (e) {
            console.warn('Could not populate initial catalog:', e);
          }
        }

        return {
          id: savedId,
          name: meta.properties?.title || SPREADSHEET_NAME,
          url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
          sheetId: sheetInfo.stockSheetId,
          stockSheetTitle: sheetInfo.stockSheetTitle,
          catalogSheetId,
          catalogSheetTitle: sheetInfo.catalogSheetTitle,
        };
      }
    } catch (err) {
      console.warn('Could not verify saved spreadsheet, searching Drive...', err);
    }
  }

  // Search Drive for file with SPREADSHEET_NAME
  try {
    const query = encodeURIComponent(
      `mimeType='application/vnd.google-apps.spreadsheet' and name='${SPREADSHEET_NAME}' and trashed=false`
    );
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const file = driveData.files[0];
        localStorage.setItem(SAVED_SPREADSHEET_ID_KEY, file.id);

        // Fetch sheet ids
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets.properties(sheetId,title)`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        let sheetInfo = {
          stockSheetId: 0,
          stockSheetTitle: STOCK_SHEET_TITLE,
          catalogSheetId: undefined as number | undefined,
          catalogSheetTitle: CATALOG_SHEET_TITLE,
        };

        if (metaRes.ok) {
          const meta = await metaRes.json();
          sheetInfo = identifySheets(meta.sheets || []);
        }

        await ensureHeaders(accessToken, file.id, sheetInfo.stockSheetTitle);

        let catalogSheetId = sheetInfo.catalogSheetId;
        if (catalogSheetId === undefined) {
          catalogSheetId = await createCatalogSheet(accessToken, file.id);
        }
        await ensureCatalogHeaders(accessToken, file.id, sheetInfo.catalogSheetTitle);

        if (initialCatalogItems && initialCatalogItems.length > 0) {
          try {
            const existing = await fetchCatalogFromSheet(accessToken, file.id, sheetInfo.catalogSheetTitle);
            if (existing.length === 0) {
              await saveCatalogToSheet(accessToken, file.id, initialCatalogItems, [], sheetInfo.catalogSheetTitle);
            }
          } catch (e) {
            console.warn('Could not populate initial catalog on existing sheet:', e);
          }
        }

        return {
          id: file.id,
          name: file.name,
          url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
          sheetId: sheetInfo.stockSheetId,
          stockSheetTitle: sheetInfo.stockSheetTitle,
          catalogSheetId,
          catalogSheetTitle: sheetInfo.catalogSheetTitle,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create new sheet', err);
  }

  // Create a brand new Google Spreadsheet with BOTH tabs: "สต๊อกสินค้า" and "คลังสินค้า"
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_NAME,
      },
      sheets: [
        {
          properties: {
            title: STOCK_SHEET_TITLE,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: CATALOG_SHEET_TITLE,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`ไม่สามารถสร้าง Google Sheet ได้: ${errText}`);
  }

  const newSheetData = await createRes.json();
  const newId = newSheetData.spreadsheetId;
  const newSheetId = newSheetData.sheets?.[0]?.properties?.sheetId ?? 0;
  const newCatalogSheetId = newSheetData.sheets?.[1]?.properties?.sheetId ?? 1;

  localStorage.setItem(SAVED_SPREADSHEET_ID_KEY, newId);

  // Set Headers for both sheets
  await ensureHeaders(accessToken, newId, STOCK_SHEET_TITLE);
  await ensureCatalogHeaders(accessToken, newId, CATALOG_SHEET_TITLE);

  // If initialCatalogItems provided, populate the catalog sheet
  if (initialCatalogItems && initialCatalogItems.length > 0) {
    try {
      await saveCatalogToSheet(accessToken, newId, initialCatalogItems, [], CATALOG_SHEET_TITLE);
    } catch (e) {
      console.warn('Could not seed catalog into new spreadsheet:', e);
    }
  }

  return {
    id: newId,
    name: SPREADSHEET_NAME,
    url: `https://docs.google.com/spreadsheets/d/${newId}/edit`,
    sheetId: newSheetId,
    stockSheetTitle: STOCK_SHEET_TITLE,
    catalogSheetId: newCatalogSheetId,
    catalogSheetTitle: CATALOG_SHEET_TITLE,
  };
}

/**
 * Ensure header row exists in the spreadsheet
 */
async function ensureHeaders(accessToken: string, spreadsheetId: string, sheetTitle: string) {
  try {
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:L1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0 && data.values[0].length >= 5) {
        return; // Headers already initialized
      }
    }

    // Write header
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:L1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [TABLE_HEADERS],
        }),
      }
    );
  } catch (err) {
    console.error('Failed to initialize headers:', err);
  }
}

/**
 * Fetch all stock transactions from the spreadsheet
 */
export async function fetchTransactionsFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = STOCK_SHEET_TITLE
): Promise<StockTransaction[]> {
  let range = `${encodeURIComponent(sheetTitle)}!A1:L`;
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // If query failed (e.g. sheet was renamed or sheetTitle doesn't exist), try to find the actual stock sheet
  if (!res.ok) {
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const info = identifySheets(meta.sheets || []);
        if (info.stockSheetTitle && info.stockSheetTitle !== sheetTitle) {
          range = `${encodeURIComponent(info.stockSheetTitle)}!A1:L`;
          res = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      }
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('ไม่พบเอกสาร Google Sheet หรือเอกสารถูกลบ');
    }
    const errText = await res.text();
    console.warn(`Could not read transactions from Google Sheet: ${errText}`);
    return [];
  }

  const data = await res.json();
  const allRows: any[][] = data.values || [];
  if (allRows.length === 0) return [];

  const firstRow = allRows[0] || [];
  // Detect if firstRow is header
  const isHeaderRow = firstRow.some((cell: any) => {
    const s = String(cell || '').toLowerCase();
    return (
      s.includes('วัน') ||
      s.includes('ประเภท') ||
      s.includes('รายการ') ||
      s.includes('จำนวน') ||
      s.includes('sku') ||
      s.includes('date') ||
      s.includes('type')
    );
  });

  let colId = -1, colDate = -1, colType = -1, colCat = -1, colProd = -1;
  let colPrice = -1, colQty = -1, colUnit = -1, colTotal = -1, colRep = -1, colNote = -1, colTime = -1;

  if (isHeaderRow) {
    firstRow.forEach((h: any, idx: number) => {
      const s = String(h || '').trim().toLowerCase();
      if (s.includes('รหัส') || s === 'id' || s === 'sku') {
        if (colId === -1) colId = idx;
      } else if (s.includes('วัน') || s.includes('date')) {
        if (colDate === -1) colDate = idx;
      } else if (s.includes('ประเภท') || s.includes('type') || s.includes('เข้า') || s.includes('ออก')) {
        if (colType === -1) colType = idx;
      } else if (s.includes('กลุ่ม') || s.includes('หมวด') || s.includes('category')) {
        if (colCat === -1) colCat = idx;
      } else if (s.includes('ชื่อ') || s.includes('รายการ') || s.includes('สินค้า') || s.includes('product') || s.includes('item')) {
        if (colProd === -1) colProd = idx;
      } else if ((s.includes('ราคา') || s.includes('price')) && !s.includes('รวม') && !s.includes('total')) {
        if (colPrice === -1) colPrice = idx;
      } else if (s.includes('จำนวน') || s.includes('qty') || s.includes('quantity')) {
        if (colQty === -1) colQty = idx;
      } else if (s.includes('หน่วย') || s.includes('unit')) {
        if (colUnit === -1) colUnit = idx;
      } else if (s.includes('รวม') || s.includes('total')) {
        if (colTotal === -1) colTotal = idx;
      } else if (s.includes('ผู้') || s.includes('user') || s.includes('reporter')) {
        if (colRep === -1) colRep = idx;
      } else if (s.includes('หมายเหตุ') || s.includes('note') || s.includes('remark')) {
        if (colNote === -1) colNote = idx;
      } else if (s.includes('เวลา') || s.includes('time') || s.includes('timestamp')) {
        if (colTime === -1) colTime = idx;
      }
    });
  }

  // Fallbacks if columns not identified
  if (colId === -1) colId = 0;
  if (colDate === -1) colDate = 1;
  if (colType === -1) colType = 2;
  if (colCat === -1) colCat = 3;
  if (colProd === -1) colProd = 4;
  if (colPrice === -1) colPrice = 5;
  if (colQty === -1) colQty = 6;
  if (colUnit === -1) colUnit = 7;
  if (colTotal === -1) colTotal = 8;
  if (colRep === -1) colRep = 9;
  if (colNote === -1) colNote = 10;
  if (colTime === -1) colTime = 11;

  const dataRows = isHeaderRow ? allRows.slice(1) : allRows;
  const transactions: StockTransaction[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const rawProd = String(colProd !== -1 ? row[colProd] || '' : '').trim();
    const rawId = String(colId !== -1 ? row[colId] || '' : '').trim();
    if (!rawProd && !rawId) continue;

    const rawDate = String(colDate !== -1 ? row[colDate] || '' : '').trim();
    const parsedDate = parseFlexibleDate(rawDate);
    const date = parsedDate
      ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`
      : rawDate || new Date().toISOString().split('T')[0];

    const rawType = String(colType !== -1 ? row[colType] || '' : '').trim().toUpperCase();
    const type = rawType.includes('OUT') || rawType.includes('ออก') || rawType.includes('ขาย') || rawType.includes('จ่าย') ? 'OUT' : 'IN';
    const category = String(colCat !== -1 ? row[colCat] || '' : 'ทั่วไป').trim();
    const productName = rawProd || rawId;
    const unitPrice = parseFloat(String(colPrice !== -1 ? row[colPrice] || '0' : '0').replace(/[^0-9.-]+/g, '')) || 0;
    const quantity = parseInt(String(colQty !== -1 ? row[colQty] || '0' : '0').replace(/[^0-9.-]+/g, ''), 10) || 0;
    const unit = String(colUnit !== -1 ? row[colUnit] || 'ชิ้น' : 'ชิ้น').trim();
    const totalPrice =
      parseFloat(String(colTotal !== -1 ? row[colTotal] || '0' : '0').replace(/[^0-9.-]+/g, '')) || unitPrice * quantity;
    const reporter = String(colRep !== -1 ? row[colRep] || '' : '').trim();
    const note = String(colNote !== -1 ? row[colNote] || '' : '').trim();
    const createdAt = String(colTime !== -1 ? row[colTime] || '' : '').trim() || new Date().toISOString();

    transactions.push({
      id: rawId || `TX-${1000 + i}`,
      date,
      type,
      category: category || 'ทั่วไป',
      productName,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      reporter,
      note,
      createdAt,
    });
  }

  // Sort descending by date/createdAt
  return transactions.reverse();
}

/**
 * Append a new stock transaction to Google Sheets
 */
export async function appendTransactionToSheet(
  accessToken: string,
  spreadsheetId: string,
  transaction: StockTransaction,
  sheetTitle: string = STOCK_SHEET_TITLE
): Promise<void> {
  const rowData = [
    transaction.id,
    transaction.date,
    transaction.type === 'IN' ? 'รับเข้า (IN)' : 'จ่ายออก (OUT)',
    transaction.category,
    transaction.productName,
    transaction.unitPrice,
    transaction.quantity,
    transaction.unit || 'ชิ้น',
    transaction.totalPrice,
    transaction.reporter,
    transaction.note || '',
    transaction.createdAt,
  ];

  const range = `${encodeURIComponent(sheetTitle)}!A:L:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`บันทึกลง Google Sheet ไม่สำเร็จ: ${errText}`);
  }
}

/**
 * Batch append multiple transactions to Google Sheets at once
 */
export async function batchAppendTransactionsToSheet(
  accessToken: string,
  spreadsheetId: string,
  transactions: StockTransaction[],
  sheetTitle: string = STOCK_SHEET_TITLE
): Promise<void> {
  if (!transactions || transactions.length === 0) return;
  await ensureHeaders(accessToken, spreadsheetId, sheetTitle);

  // Write in chronological order
  const ordered = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const rows = ordered.map((t) => [
    t.id,
    t.date,
    t.type === 'IN' ? 'รับเข้า (IN)' : 'จ่ายออก (OUT)',
    t.category,
    t.productName,
    t.unitPrice,
    t.quantity,
    t.unit || 'ชิ้น',
    t.totalPrice,
    t.reporter,
    t.note || '',
    t.createdAt,
  ]);

  const range = `${encodeURIComponent(sheetTitle)}!A:L:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`Batch append failed: ${errText}`);
  }
}

/**
 * Delete a transaction row from Google Sheets by finding its ID
 */
export async function deleteTransactionFromSheet(
  accessToken: string,
  spreadsheetId: string,
  transactionId: string,
  sheetId: number = 0,
  sheetTitle: string = STOCK_SHEET_TITLE
): Promise<boolean> {
  // 1. Fetch column A to find the exact row index
  const range = `${encodeURIComponent(sheetTitle)}!A:A`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error('ไม่สามารถตรวจสอบตำแหน่งแถวที่จะลบใน Google Sheet ได้');
  }

  const data = await res.json();
  const rows = data.values || [];

  let rowIndex = -1; // 0-based
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === transactionId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    // If not found in column A, might have already been removed
    return false;
  }

  // 2. Execute deleteDimension batchUpdate
  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      }),
    }
  );

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    throw new Error(`ไม่สามารถลบแถวใน Google Sheet ได้: ${errText}`);
  }

  return true;
}

/**
 * Update an existing transaction in Google Sheets
 */
export async function updateTransactionInSheet(
  accessToken: string,
  spreadsheetId: string,
  transaction: StockTransaction,
  sheetTitle: string = STOCK_SHEET_TITLE
): Promise<boolean> {
  // Find row index
  const range = `${encodeURIComponent(sheetTitle)}!A:A`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) return false;

  const data = await res.json();
  const rows = data.values || [];

  let rowNumber = -1; // 1-based row number
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === transaction.id) {
      rowNumber = i + 1;
      break;
    }
  }

  if (rowNumber === -1) return false;

  const rowData = [
    transaction.id,
    transaction.date,
    transaction.type === 'IN' ? 'รับเข้า (IN)' : 'จ่ายออก (OUT)',
    transaction.category,
    transaction.productName,
    transaction.unitPrice,
    transaction.quantity,
    transaction.unit || 'ชิ้น',
    transaction.totalPrice,
    transaction.reporter,
    transaction.note || '',
    transaction.createdAt,
  ];

  const updateRange = `${encodeURIComponent(sheetTitle)}!A${rowNumber}:L${rowNumber}?valueInputOption=USER_ENTERED`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  return updateRes.ok;
}

/**
 * Create 'คลังสินค้า' sheet tab if it doesn't exist
 */
export async function createCatalogSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<number> {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.replies?.[0]?.addSheet?.properties?.sheetId ?? 1;
    }
  } catch (err) {
    console.warn('Failed to create catalog sheet:', err);
  }
  return 1;
}

/**
 * Ensure header row exists in the catalog sheet with remaining stock and status columns
 */
export async function ensureCatalogHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<void> {
  try {
    const checkRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:J1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (
        data.values &&
        data.values.length > 0 &&
        data.values[0].length >= 8 &&
        String(data.values[0][3] || '').includes('คงเหลือ')
      ) {
        return; // Headers are already up-to-date with remaining stock column
      }
    }

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:J1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [CATALOG_TABLE_HEADERS],
        }),
      }
    );
  } catch (err) {
    console.error('Failed to initialize catalog headers:', err);
  }
}

/**
 * Fetch product catalog items from the 'คลังสินค้า' sheet
 * Supports both new 10-column layout (with stock balance) and legacy 7-column layout,
 * as well as custom user column layouts with dynamic header matching.
 */
export async function fetchCatalogFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<ProductCatalogItem[]> {
  let range = `${encodeURIComponent(sheetTitle)}!A1:J`;
  let res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // If query failed (e.g. sheet was renamed), try to find the actual catalog sheet
  if (!res.ok) {
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const info = identifySheets(meta.sheets || []);
        if (info.catalogSheetTitle && info.catalogSheetTitle !== sheetTitle) {
          range = `${encodeURIComponent(info.catalogSheetTitle)}!A1:J`;
          res = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      }
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    console.warn('Could not fetch catalog from sheet:', await res.text());
    return [];
  }

  const data = await res.json();
  const allRows: any[][] = data.values || [];
  if (allRows.length <= 1) return [];

  const headerRow = allRows[0] || [];
  let colSku = -1, colName = -1, colCat = -1, colStock = -1, colUnit = -1;
  let colCost = -1, colSell = -1, colNote = -1;

  headerRow.forEach((h: any, idx: number) => {
    const s = String(h || '').trim().toLowerCase();
    if (s.includes('รหัส') || s === 'sku' || s === 'code') colSku = idx;
    else if (s.includes('ชื่อ') || s.includes('รายการ') || s.includes('name') || s.includes('สินค้า')) {
      if (colName === -1) colName = idx;
    } else if (s.includes('กลุ่ม') || s.includes('หมวด') || s.includes('ประเภท') || s.includes('category')) {
      if (colCat === -1) colCat = idx;
    } else if (s.includes('คงเหลือ') || s.includes('สต๊อก') || s.includes('balance') || s.includes('stock')) {
      if (colStock === -1) colStock = idx;
    } else if (s.includes('หน่วย') || s.includes('unit')) {
      if (colUnit === -1) colUnit = idx;
    } else if (s.includes('ทุน') || s.includes('รับเข้า') || s.includes('cost')) {
      if (colCost === -1) colCost = idx;
    } else if ((s.includes('ขาย') || s.includes('price') || s.includes('selling')) && !s.includes('ทุน')) {
      if (colSell === -1) colSell = idx;
    } else if (s.includes('หมายเหตุ') || s.includes('note') || s.includes('remark')) {
      if (colNote === -1) colNote = idx;
    }
  });

  const isNewLayout =
    String(headerRow[3] || '').includes('คงเหลือ') || headerRow.length >= 8;

  if (colSku === -1) colSku = 0;
  if (colName === -1) colName = 1;
  if (colCat === -1) colCat = 2;
  if (colStock === -1) colStock = isNewLayout ? 3 : -1;
  if (colUnit === -1) colUnit = isNewLayout ? 4 : 5;
  if (colCost === -1) colCost = isNewLayout ? 6 : 3;
  if (colSell === -1) colSell = isNewLayout ? 7 : 4;
  if (colNote === -1) colNote = isNewLayout ? 9 : 6;

  const dataRows = allRows.slice(1);
  const catalog: ProductCatalogItem[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const rawCode = String(colSku !== -1 ? row[colSku] || '' : '').trim();
    const rawName = String(colName !== -1 ? row[colName] || '' : '').trim();

    // In case the user typed product name in column A or B
    let code = rawCode;
    let name = rawName;
    if (!name && rawCode) {
      name = rawCode;
      code = `PRD-${1000 + i}`;
    }
    if (!name) continue;

    const category = String(colCat !== -1 ? row[colCat] || 'ทั่วไป' : 'ทั่วไป').trim();
    const stockVal = colStock !== -1 ? parseFloat(String(row[colStock] || '0').replace(/[^0-9.-]+/g, '')) || 0 : undefined;
    const unit = String(colUnit !== -1 ? row[colUnit] || 'ชิ้น' : 'ชิ้น').trim();
    let costPrice = colCost !== -1 ? parseFloat(String(row[colCost] || '0').replace(/[^0-9.-]+/g, '')) || 0 : 0;
    let sellingPrice = colSell !== -1 ? parseFloat(String(row[colSell] || '0').replace(/[^0-9.-]+/g, '')) || 0 : 0;

    if (costPrice === 0 && sellingPrice > 0) costPrice = sellingPrice;
    if (sellingPrice === 0 && costPrice > 0) sellingPrice = costPrice;

    const note = colNote !== -1 ? String(row[colNote] || '').trim() : undefined;

    catalog.push({
      id: code || `PRD-${1000 + i}`,
      code: code || `PRD-${1000 + i}`,
      name,
      category,
      costPrice,
      sellingPrice,
      unit: unit || 'ชิ้น',
      initialStock: stockVal,
      note: note || undefined,
    });
  }

  return catalog;
}

/**
 * Save/replace all product catalog items to the 'คลังสินค้า' sheet on Google Sheets,
 * automatically calculating remaining stock and product status.
 */
export async function saveCatalogToSheet(
  accessToken: string,
  spreadsheetId: string,
  catalog: ProductCatalogItem[],
  transactions: StockTransaction[] = [],
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<void> {
  // Ensure catalog headers first
  await ensureCatalogHeaders(accessToken, spreadsheetId, sheetTitle);

  // Clear existing catalog data rows (A2:J)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetTitle
    )}!A2:J:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (catalog.length === 0) return;

  const rows = catalog.map((item, idx) => {
    const inv = calculateProductInventory(item, transactions);
    return [
      item.code || item.id || `PRD-${1000 + idx}`,
      item.name,
      item.category || 'ทั่วไป',
      inv.currentStock, // จำนวนคงเหลือในคลัง
      item.unit || 'ชิ้น',
      inv.statusLabel, // สถานะสินค้า (สินค้าปกติ / สต๊อกต่ำ / DeadStock / สินค้าหมด)
      item.costPrice ?? 0,
      item.sellingPrice,
      inv.totalStockValue, // มูลค่าสต๊อกคงเหลือ (บาท)
      item.note || '',
    ];
  });

  const range = `${encodeURIComponent(sheetTitle)}!A2:J?valueInputOption=USER_ENTERED`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`บันทึกแคตตาล็อกสินค้าลง Google Sheet ไม่สำเร็จ: ${errText}`);
  }
}

