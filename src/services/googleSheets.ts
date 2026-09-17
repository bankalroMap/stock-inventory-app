import { StockTransaction, ProductCatalogItem } from '../types';

export const STOCK_SHEET_TITLE = 'สต๊อกสินค้า';
export const CATALOG_SHEET_TITLE = 'คลังสินค้า';
export const SPREADSHEET_NAME = 'ระบบบันทึกสต๊อกสินค้า เข้า-ออก (Stock Inventory)';
export const SAVED_SPREADSHEET_ID_KEY = 'GOOGLE_SHEETS_STOCK_ID';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheetId: number;
  catalogSheetId?: number;
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
  'ราคาทุน/รับเข้า (บาท)',
  'ราคาขาย (บาท)',
  'หน่วยนับ',
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
        const mainSheet =
          meta.sheets?.find((s: any) => s.properties?.title === STOCK_SHEET_TITLE) ||
          meta.sheets?.[0];
        const sheetId = mainSheet?.properties?.sheetId ?? 0;
        const sheetTitle = mainSheet?.properties?.title ?? STOCK_SHEET_TITLE;

        // Ensure headers exist for transactions
        await ensureHeaders(accessToken, savedId, sheetTitle);

        // Check or create catalog sheet
        let catalogSheet = meta.sheets?.find(
          (s: any) => s.properties?.title === CATALOG_SHEET_TITLE
        );
        let catalogSheetId = catalogSheet?.properties?.sheetId;
        if (!catalogSheet) {
          catalogSheetId = await createCatalogSheet(accessToken, savedId);
        }
        await ensureCatalogHeaders(accessToken, savedId);

        // If catalog sheet is empty and initialCatalogItems provided, populate it
        if (initialCatalogItems && initialCatalogItems.length > 0) {
          try {
            const existingCatalog = await fetchCatalogFromSheet(accessToken, savedId);
            if (existingCatalog.length === 0) {
              await saveCatalogToSheet(accessToken, savedId, initialCatalogItems);
            }
          } catch (e) {
            console.warn('Could not populate initial catalog:', e);
          }
        }

        return {
          id: savedId,
          name: meta.properties?.title || SPREADSHEET_NAME,
          url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
          sheetId,
          catalogSheetId,
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
        let sheetId = 0;
        let catalogSheetId: number | undefined;
        let sheetTitle = STOCK_SHEET_TITLE;

        if (metaRes.ok) {
          const meta = await metaRes.json();
          const target =
            meta.sheets?.find((s: any) => s.properties?.title === STOCK_SHEET_TITLE) ||
            meta.sheets?.[0];
          sheetId = target?.properties?.sheetId ?? 0;
          sheetTitle = target?.properties?.title ?? STOCK_SHEET_TITLE;

          const catTarget = meta.sheets?.find(
            (s: any) => s.properties?.title === CATALOG_SHEET_TITLE
          );
          if (catTarget) {
            catalogSheetId = catTarget.properties?.sheetId;
          }
        }

        await ensureHeaders(accessToken, file.id, sheetTitle);

        if (catalogSheetId === undefined) {
          catalogSheetId = await createCatalogSheet(accessToken, file.id);
        }
        await ensureCatalogHeaders(accessToken, file.id);

        if (initialCatalogItems && initialCatalogItems.length > 0) {
          try {
            const existing = await fetchCatalogFromSheet(accessToken, file.id);
            if (existing.length === 0) {
              await saveCatalogToSheet(accessToken, file.id, initialCatalogItems);
            }
          } catch (e) {
            console.warn('Could not populate initial catalog on existing sheet:', e);
          }
        }

        return {
          id: file.id,
          name: file.name,
          url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
          sheetId,
          catalogSheetId,
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
      await saveCatalogToSheet(accessToken, newId, initialCatalogItems);
    } catch (e) {
      console.warn('Could not seed catalog into new spreadsheet:', e);
    }
  }

  return {
    id: newId,
    name: SPREADSHEET_NAME,
    url: `https://docs.google.com/spreadsheets/d/${newId}/edit`,
    sheetId: newSheetId,
    catalogSheetId: newCatalogSheetId,
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
  const range = `${encodeURIComponent(sheetTitle)}!A2:L`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('ไม่พบเอกสาร Google Sheet หรือเอกสารถูกลบ');
    }
    const errText = await res.text();
    throw new Error(`ไม่สามารถอ่านข้อมูลจาก Google Sheet ได้: ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const transactions: StockTransaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    const id = String(row[0] || '').trim();
    const date = String(row[1] || '').trim();
    const rawType = String(row[2] || '').trim();
    const type = rawType.includes('OUT') || rawType.includes('ออก') ? 'OUT' : 'IN';
    const category = String(row[3] || '').trim();
    const productName = String(row[4] || '').trim();
    const unitPrice = parseFloat(String(row[5]).replace(/[^0-9.-]+/g, '')) || 0;
    const quantity = parseInt(String(row[6]).replace(/[^0-9.-]+/g, ''), 10) || 0;
    const unit = String(row[7] || 'ชิ้น').trim();
    const totalPrice =
      parseFloat(String(row[8]).replace(/[^0-9.-]+/g, '')) || unitPrice * quantity;
    const reporter = String(row[9] || '').trim();
    const note = String(row[10] || '').trim();
    const createdAt = String(row[11] || new Date().toISOString()).trim();

    transactions.push({
      id: id || `TX-${1000 + i}`,
      date: date || new Date().toISOString().split('T')[0],
      type,
      category: category || 'ทั่วไป',
      productName: productName || 'ไม่ระบุชื่อ',
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
 * Ensure header row exists in the catalog sheet
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
      )}!A1:G1`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0 && data.values[0].length >= 3) {
        return; // Headers exist
      }
    }

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        sheetTitle
      )}!A1:G1?valueInputOption=USER_ENTERED`,
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
 */
export async function fetchCatalogFromSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<ProductCatalogItem[]> {
  const range = `${encodeURIComponent(sheetTitle)}!A2:G`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    console.warn('Could not fetch catalog from sheet:', await res.text());
    return [];
  }

  const data = await res.json();
  const rows = data.values || [];
  const catalog: ProductCatalogItem[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawCode = String(row[0] || '').trim();
    const rawName = String(row[1] || '').trim();

    // In case the user typed product name in column A or B
    let code = rawCode;
    let name = rawName;
    if (!name && rawCode) {
      name = rawCode;
      code = `PRD-${1000 + i}`;
    }
    if (!name) continue;

    const category = String(row[2] || 'ทั่วไป').trim();
    const costPrice = parseFloat(String(row[3] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const sellingPrice =
      parseFloat(String(row[4] || '0').replace(/[^0-9.-]+/g, '')) || costPrice;
    const unit = String(row[5] || 'ชิ้น').trim();
    const note = String(row[6] || '').trim();

    catalog.push({
      id: code || `PRD-${1000 + i}`,
      code: code || `PRD-${1000 + i}`,
      name,
      category,
      costPrice,
      sellingPrice,
      unit: unit || 'ชิ้น',
      note: note || undefined,
    });
  }

  return catalog;
}

/**
 * Save/replace all product catalog items to the 'คลังสินค้า' sheet on Google Sheets
 */
export async function saveCatalogToSheet(
  accessToken: string,
  spreadsheetId: string,
  catalog: ProductCatalogItem[],
  sheetTitle: string = CATALOG_SHEET_TITLE
): Promise<void> {
  // Ensure catalog headers first
  await ensureCatalogHeaders(accessToken, spreadsheetId, sheetTitle);

  // Clear existing catalog data rows (A2:G)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetTitle
    )}!A2:G:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (catalog.length === 0) return;

  const rows = catalog.map((item, idx) => [
    item.code || item.id || `PRD-${1000 + idx}`,
    item.name,
    item.category || 'ทั่วไป',
    item.costPrice ?? 0,
    item.sellingPrice,
    item.unit || 'ชิ้น',
    item.note || '',
  ]);

  const range = `${encodeURIComponent(sheetTitle)}!A2:G?valueInputOption=USER_ENTERED`;
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

