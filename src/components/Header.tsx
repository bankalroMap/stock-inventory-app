import { Boxes, Code2, FileSpreadsheet, Trash2, PackagePlus } from 'lucide-react';

interface HeaderProps {
  onClearData: () => void;
  onOpenHtmlModal: () => void;
  onOpenCatalogModal: () => void;
  recordCount: number;
  catalogCount: number;
  isGoogleConnected?: boolean;
}

export function Header({
  onClearData,
  onOpenHtmlModal,
  onOpenCatalogModal,
  recordCount,
  catalogCount,
  isGoogleConnected = false,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                ระบบบันทึกสต๊อกสินค้า เข้า-ออก
              </h1>
              {isGoogleConnected ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Google Sheets Backend
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <FileSpreadsheet className="w-3 h-3" /> พร้อมเชื่อมต่อ Google Sheets
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              บันทึกสินค้า รับเข้า-จ่ายออก คำนวณราคาขาย พร้อมระบบบันทึกข้อมูลหลังบ้าน Google Sheets
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Manage Product Catalog / Import */}
          <button
            type="button"
            onClick={onOpenCatalogModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
            title="จัดการคลังสินค้าหลัก นำเข้าสินค้าเดิมจาก Excel เพื่อเลือกผ่าน Dropdown"
            id="open-catalog-btn"
          >
            <PackagePlus className="w-4 h-4" />
            <span>คลังสินค้าหลัก</span>
            <span className="bg-indigo-700/80 px-1.5 py-0.2 rounded-full text-[10px]">
              {catalogCount}
            </span>
          </button>

          {/* View Single-File HTML Code */}
          <button
            type="button"
            onClick={onOpenHtmlModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition"
            title="ดูโค้ด HTML + Tailwind CSS (CDN) + JavaScript แบบไฟล์เดี่ยว"
            id="view-standalone-html-btn"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden md:inline">ดูโค้ดไฟล์เดี่ยว</span>
            <span>HTML (CDN)</span>
          </button>

          {/* Clear Data (if records exist) */}
          {recordCount > 0 && (
            <button
              type="button"
              onClick={onClearData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 transition"
              title="ล้างข้อมูลรายการในแอป"
              id="clear-records-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ล้างข้อมูล ({recordCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

