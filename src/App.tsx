import { useState, useEffect, useCallback } from 'react';
import { Boxes, History } from 'lucide-react';
import { StockTransaction, AuthUser, ProductCatalogItem } from './types';
import {
  getStoredTransactions,
  saveTransactionsToStorage,
  resetStoredTransactions,
  getStoredProductCatalog,
  saveProductCatalogToStorage,
  resetProductCatalogToDefault,
} from './utils/storage';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  findOrCreateStockSpreadsheet,
  fetchTransactionsFromSheet,
  appendTransactionToSheet,
  updateTransactionInSheet,
  deleteTransactionFromSheet,
  fetchCatalogFromSheet,
  saveCatalogToSheet,
  SpreadsheetInfo,
} from './services/googleSheets';
import { Header } from './components/Header';
import { GoogleSheetsBar } from './components/GoogleSheetsBar';
import { StatsCards } from './components/StatsCards';
import { StockForm } from './components/StockForm';
import { StockTable } from './components/StockTable';
import { WarehouseInventoryTable } from './components/WarehouseInventoryTable';
import { HtmlCodeModal } from './components/HtmlCodeModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';

export default function App() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);

  // Active view tab: Inventory with stock status or Transaction history
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'TRANSACTIONS'>('INVENTORY');

  // Quick prefill trigger from inventory table to form
  const [prefillProduct, setPrefillProduct] = useState<{
    name: string;
    type: 'IN' | 'OUT';
    timestamp: number;
  } | null>(null);

  // Product Catalog State
  const [catalog, setCatalog] = useState<ProductCatalogItem[]>([]);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Google Auth & Sheets Backend State
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [isConnectingSheet, setIsConnectingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Confirmation modal state for clearing all
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Load initial local data (transactions and product catalog)
  useEffect(() => {
    const local = getStoredTransactions();
    setTransactions(local);

    const storedCatalog = getStoredProductCatalog();
    setCatalog(storedCatalog);
  }, []);

  // Save updated catalog to storage & state (and sync to Google Sheets if connected)
  const handleSaveCatalog = async (updatedCatalog: ProductCatalogItem[]) => {
    setCatalog(updatedCatalog);
    saveProductCatalogToStorage(updatedCatalog);

    const activeToken = token || (await getAccessToken());
    if (activeToken && spreadsheetInfo) {
      try {
        await saveCatalogToSheet(activeToken, spreadsheetInfo.id, updatedCatalog, transactions);
      } catch (err) {
        console.error('Failed to sync catalog to Google Sheets:', err);
      }
    }
  };

  // Reset catalog to default sample list (and sync to Google Sheets if connected)
  const handleResetCatalog = async () => {
    const reset = resetProductCatalogToDefault();
    setCatalog(reset);
    saveProductCatalogToStorage(reset);

    const activeToken = token || (await getAccessToken());
    if (activeToken && spreadsheetInfo) {
      try {
        await saveCatalogToSheet(activeToken, spreadsheetInfo.id, reset, transactions);
      } catch (err) {
        console.error('Failed to reset catalog in Google Sheets:', err);
      }
    }
  };

  // Connect to Google Spreadsheet with an active token
  const connectToSpreadsheet = useCallback(async (authToken: string) => {
    setIsConnectingSheet(true);
    setSheetError(null);
    try {
      const currentCatalog = getStoredProductCatalog();
      const sheet = await findOrCreateStockSpreadsheet(authToken, currentCatalog);
      setSpreadsheetInfo(sheet);

      // Fetch live data from sheet (both transactions and catalog)
      setIsSyncing(true);
      try {
        const [remoteData, remoteCatalog] = await Promise.all([
          fetchTransactionsFromSheet(authToken, sheet.id),
          fetchCatalogFromSheet(authToken, sheet.id),
        ]);
        setTransactions(remoteData);
        saveTransactionsToStorage(remoteData);

        if (remoteCatalog && remoteCatalog.length > 0) {
          setCatalog(remoteCatalog);
          saveProductCatalogToStorage(remoteCatalog);
          // Update remaining stock in backend sheet
          await saveCatalogToSheet(authToken, sheet.id, remoteCatalog, remoteData);
        } else if (currentCatalog && currentCatalog.length > 0) {
          await saveCatalogToSheet(authToken, sheet.id, currentCatalog, remoteData);
        }
      } catch (fetchErr: any) {
        console.warn('Initial sheet fetch:', fetchErr);
      } finally {
        setIsSyncing(false);
      }
    } catch (err: any) {
      console.error('Failed to initialize Google Sheet:', err);
      setSheetError(err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
    } finally {
      setIsConnectingSheet(false);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
        connectToSpreadsheet(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setSpreadsheetInfo(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [connectToSpreadsheet]);

  // Handle Google Sign-In
  const handleGoogleSignIn = async (forceGsi = false) => {
    setIsConnectingSheet(true);
    setSheetError(null);
    try {
      const res = await googleSignIn(forceGsi);
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        await connectToSpreadsheet(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In Failed:', err);
      setSheetError(err?.message || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setIsConnectingSheet(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSpreadsheetInfo(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Sync / Refresh data from Google Sheets (both transactions and catalog)
  const handleSyncData = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheetInfo) {
      setSheetError('กรุณาลงชื่อเข้าใช้ Google เพื่อซิงค์ข้อมูล');
      return;
    }

    setIsSyncing(true);
    setSheetError(null);
    try {
      const [remoteTransactions, remoteCatalog] = await Promise.all([
        fetchTransactionsFromSheet(activeToken, spreadsheetInfo.id),
        fetchCatalogFromSheet(activeToken, spreadsheetInfo.id),
      ]);
      setTransactions(remoteTransactions);
      saveTransactionsToStorage(remoteTransactions);

      const resolvedCatalog = remoteCatalog && remoteCatalog.length > 0 ? remoteCatalog : catalog;
      if (remoteCatalog && remoteCatalog.length > 0) {
        setCatalog(remoteCatalog);
        saveProductCatalogToStorage(remoteCatalog);
      }

      // Automatically refresh backend "จำนวนคงเหลือในคลัง" column with current stock counts
      await saveCatalogToSheet(activeToken, spreadsheetInfo.id, resolvedCatalog, remoteTransactions);
    } catch (err: any) {
      console.error('Sync error:', err);
      setSheetError(err?.message || 'ซิงค์ข้อมูลจาก Google Sheets ไม่สำเร็จ');
    } finally {
      setIsSyncing(false);
    }
  };

  // Dedicated catalog sync from sheet (for modal button)
  const handleSyncCatalogFromSheet = async () => {
    const activeToken = token || (await getAccessToken());
    if (!activeToken || !spreadsheetInfo) {
      setSheetError('กรุณาลงชื่อเข้าใช้ Google เพื่อซิงค์ข้อมูล');
      return;
    }

    setIsSyncingCatalog(true);
    try {
      const remoteCatalog = await fetchCatalogFromSheet(activeToken, spreadsheetInfo.id);
      if (remoteCatalog && remoteCatalog.length > 0) {
        setCatalog(remoteCatalog);
        saveProductCatalogToStorage(remoteCatalog);
        // Sync remaining stock
        await saveCatalogToSheet(activeToken, spreadsheetInfo.id, remoteCatalog, transactions);
      }
    } catch (err: any) {
      console.error('Catalog sync error:', err);
      setSheetError(err?.message || 'ซิงค์แคตตาล็อกสินค้าจาก Google Sheets ไม่สำเร็จ');
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Save transaction (Create or Update)
  const handleSaveTransaction = async (
    data: Omit<StockTransaction, 'id' | 'createdAt'>,
    idToUpdate?: string
  ): Promise<boolean> => {
    setIsSaving(true);
    setSheetError(null);

    const activeToken = token || (await getAccessToken());

    try {
      let updated: StockTransaction[] = [];

      if (idToUpdate) {
        // Update existing item
        const existing = transactions.find((t) => t.id === idToUpdate);
        const updatedItem: StockTransaction = {
          ...data,
          id: idToUpdate,
          createdAt: existing?.createdAt || new Date().toISOString(),
        };

        // If connected to Google Sheets, update remote row
        if (activeToken && spreadsheetInfo) {
          await updateTransactionInSheet(activeToken, spreadsheetInfo.id, updatedItem);
        }

        updated = transactions.map((t) => (t.id === idToUpdate ? updatedItem : t));
        setTransactions(updated);
        saveTransactionsToStorage(updated);
        setEditingTransaction(null);
      } else {
        // Create new item
        const newTransaction: StockTransaction = {
          ...data,
          id: `TX-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
        };

        // If connected to Google Sheets, append to remote sheet
        if (activeToken && spreadsheetInfo) {
          await appendTransactionToSheet(activeToken, spreadsheetInfo.id, newTransaction);
        }

        updated = [newTransaction, ...transactions];
        setTransactions(updated);
        saveTransactionsToStorage(updated);
      }

      // Automatically sync remaining stock column to Google Sheets backend in the background!
      if (activeToken && spreadsheetInfo) {
        saveCatalogToSheet(activeToken, spreadsheetInfo.id, catalog, updated).catch((err) =>
          console.warn('Background sync of remaining stock to catalog sheet:', err)
        );
      }

      return true;
    } catch (err: any) {
      console.error('Save transaction error:', err);
      setSheetError(err?.message || 'ไม่สามารถบันทึกข้อมูลได้');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete transaction with confirmation
  const handleDeleteTransaction = async (id: string) => {
    setIsDeleting(true);
    setSheetError(null);

    const activeToken = token || (await getAccessToken());

    try {
      if (activeToken && spreadsheetInfo) {
        await deleteTransactionFromSheet(
          activeToken,
          spreadsheetInfo.id,
          id,
          spreadsheetInfo.sheetId
        );
      }

      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      saveTransactionsToStorage(updated);

      if (editingTransaction?.id === id) {
        setEditingTransaction(null);
      }

      // Sync updated remaining stock to Google Sheets backend in background
      if (activeToken && spreadsheetInfo) {
        saveCatalogToSheet(activeToken, spreadsheetInfo.id, catalog, updated).catch((err) =>
          console.warn('Background sync of remaining stock after delete:', err)
        );
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setSheetError(err?.message || 'ไม่สามารถลบรายการได้');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear all data
  const handleConfirmClearAll = () => {
    resetStoredTransactions();
    setTransactions([]);
    setEditingTransaction(null);
    setIsClearAllModalOpen(false);
  };

  // Quick prefill from inventory table to form
  const handleSelectProductFromInventory = (productName: string, type: 'IN' | 'OUT') => {
    setPrefillProduct({ name: productName, type, timestamp: Date.now() });
    const formEl = document.getElementById('stock-form-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onClearData={() => setIsClearAllModalOpen(true)}
        onOpenHtmlModal={() => setIsHtmlModalOpen(true)}
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
        recordCount={transactions.length}
        catalogCount={catalog.length}
        isGoogleConnected={Boolean(user && spreadsheetInfo)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Google Sheets Backend Connection Bar */}
        <GoogleSheetsBar
          user={user}
          spreadsheetInfo={spreadsheetInfo}
          isConnecting={isConnectingSheet}
          isSyncing={isSyncing}
          error={sheetError}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          onSync={handleSyncData}
        />

        {/* สรุปตัวชี้วัดสถิติ & การแจ้งเตือนสถานะสต๊อก */}
        <StatsCards
          transactions={transactions}
          catalog={catalog}
          onSelectStatusFilter={() => setActiveTab('INVENTORY')}
        />

        {/* ตาราง & ฟอร์มบันทึกข้อมูล */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ซ้าย: ฟอร์มกรอกข้อมูล (4 คอลัมน์) */}
          <div id="stock-form-section" className="lg:col-span-4 lg:sticky lg:top-20">
            <StockForm
              onSave={handleSaveTransaction}
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
              isSaving={isSaving}
              isGoogleConnected={Boolean(user && spreadsheetInfo)}
              catalog={catalog}
              onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
              prefillProduct={prefillProduct}
            />
          </div>

          {/* ขวา: แท็บสลับระหว่าง "สินค้าในคลัง & สถานะ" กับ "ประวัติรับเข้า-จ่ายออก" (8 คอลัมน์) */}
          <div className="lg:col-span-8 space-y-4">
            {/* View Selector Tabs */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('INVENTORY')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'INVENTORY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>สินค้าในคลังทั้งหมด &amp; สถานะ</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
                    activeTab === 'INVENTORY'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {catalog.length} รายการ
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TRANSACTIONS')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'TRANSACTIONS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>ประวัติ รับเข้า-จ่ายออก</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
                    activeTab === 'TRANSACTIONS'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {transactions.length} รายการ
                </span>
              </button>
            </div>

            {/* Active View Content */}
            {activeTab === 'INVENTORY' ? (
              <WarehouseInventoryTable
                catalog={catalog}
                transactions={transactions}
                onSelectProductForTransaction={handleSelectProductFromInventory}
                onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
                isGoogleConnected={Boolean(user && spreadsheetInfo)}
              />
            ) : (
              <StockTable
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onEdit={(item) => {
                  setEditingTransaction(item);
                  const el = document.getElementById('stock-form-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isGoogleConnected={Boolean(user && spreadsheetInfo)}
                isDeleting={isDeleting}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">
            ระบบบันทึกสต๊อกสินค้า เข้า-ออก (Stock In-Out Management)
          </span>
          <span className="text-slate-500 flex items-center gap-1.5 justify-center">
            {user && spreadsheetInfo ? (
              <span className="text-emerald-600 font-medium">
                ● บันทึกข้อมูลและจัดเก็บลง Google Sheets หลังบ้านอัตโนมัติ (พร้อมคอลัมน์จำนวนคงเหลือ &amp; สถานะสินค้า)
              </span>
            ) : (
              <span>พร้อมเชื่อมต่อ Google Sheets เป็นระบบหลังบ้านของคุณ</span>
            )}
          </span>
        </div>
      </footer>

      {/* Product Catalog Modal (Import & Manage Master Product List) */}
      <ProductCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        catalog={catalog}
        onSaveCatalog={handleSaveCatalog}
        onResetCatalog={handleResetCatalog}
        spreadsheetInfo={spreadsheetInfo}
        isGoogleConnected={Boolean(user && spreadsheetInfo)}
        onSyncFromGoogleSheets={handleSyncCatalogFromSheet}
        isSyncingCatalog={isSyncingCatalog}
      />

      {/* Standalone Single File HTML Code Modal */}
      <HtmlCodeModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
      />

      {/* Confirm Clear All Data Modal */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="ยืนยันการล้างข้อมูลสต๊อกทั้งหมด?"
        message="คุณต้องการล้างข้อมูลรายการสต๊อกสินค้าทั้งหมดออกจากแอปพลิเคชันหรือไม่? ระบบจะกลับสู่สถานะโล่งเริ่มต้น"
        confirmLabel="ยืนยันล้างข้อมูล"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllModalOpen(false)}
      />
    </div>
  );
}
