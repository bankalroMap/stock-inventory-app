import { StockTransaction } from '../types';

export const STOCK_SHEET_TITLE = 'สต๊อกสินค้า';
export const SPREADSHEET_NAME = 'ระบบบันทึกสต๊อกสินค้า เข้า-ออก (Stock Inventory)';
export const SAVED_SPREADSHEET_ID_KEY = 'GOOGLE_SHEETS_STOCK_ID';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  sheetId: number;
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

/**
 * Searches Google Drive for an existing spreadsheet created by the app or creates a new one.
 */
export async function findOrCreateStockSpreadsheet(accessToken: string): Promise<SpreadsheetInfo> {
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

        // Ensure headers exist
        await ensureHeaders(accessToken, savedId, sheetTitle);

        return {
          id: savedId,
          name: meta.properties?.title || SPREADSHEET_NAME,
          url: `https://docs.google.com/spreadsheets/d/${savedId}/edit`,
          sheetId,
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

        // Fetch sheet id
        const metaRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets.properties(sheetId,title)`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        let sheetId = 0;
        let sheetTitle = STOCK_SHEET_TITLE;
        if (metaRes.ok) {
          const meta = await metaRes.json();
          const target =
            meta.sheets?.find((s: any) => s.properties?.title === STOCK_SHEET_TITLE) ||
            meta.sheets?.[0];
          sheetId = target?.properties?.sheetId ?? 0;
          sheetTitle = target?.properties?.title ?? STOCK_SHEET_TITLE;
        }

        await ensureHeaders(accessToken, file.id, sheetTitle);

        return {
          id: file.id,
          name: file.name,
          url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
          sheetId,
        };
      }
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create new sheet', err);
  }

  // Create a brand new Google Spreadsheet
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

  localStorage.setItem(SAVED_SPREADSHEET_ID_KEY, newId);

  // Set Headers with styling
  await ensureHeaders(accessToken, newId, STOCK_SHEET_TITLE);

  return {
    id: newId,
    name: SPREADSHEET_NAME,
    url: `https://docs.google.com/spreadsheets/d/${newId}/edit`,
    sheetId: newSheetId,
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
