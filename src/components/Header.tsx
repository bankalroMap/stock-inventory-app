import { Boxes, Code2, FileSpreadsheet, Trash2, PackagePlus, BarChart3, LogOut, UserCheck, ShieldCheck } from 'lucide-react';
import { AppUser } from '../utils/auth';

interface HeaderProps {
  onClearData: () => void;
  onOpenHtmlModal: () => void;
  onOpenCatalogModal: () => void;
  onOpenUserManagement?: () => void;
  recordCount: number;
  catalogCount: number;
  isGoogleConnected?: boolean;
  activeTab?: 'INVENTORY' | 'TRANSACTIONS' | 'DASHBOARD';
  onSelectTab?: (tab: 'INVENTORY' | 'TRANSACTIONS' | 'DASHBOARD') => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export function Header({
  onClearData,
  onOpenHtmlModal,
  onOpenCatalogModal,
  onOpenUserManagement,
  recordCount,
  catalogCount,
  isGoogleConnected = false,
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Monitor Dashboard Quick Toggle */}
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'DASHBOARD' ? 'INVENTORY' : 'DASHBOARD')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'DASHBOARD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
              title="ดูกราฟและรายงานภาพรวมคลังสินค้า"
              id="toggle-dashboard-btn"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Monitor</span>
              <span>Dashboard</span>
            </button>
          )}

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

          {/* Super Admin User & Role Management Button */}
          {currentUser?.role === 'superadmin' && onOpenUserManagement && (
            <button
              type="button"
              onClick={onOpenUserManagement}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition"
              title="จัดการบัญชีผู้ใช้งาน และสิทธิ์การเข้าถึง (Super Admin)"
              id="manage-users-header-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>จัดการสิทธิ์ผู้ใช้</span>
            </button>
          )}

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
          {recordCount > 0 && currentUser?.role !== 'viewer' && (
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

          {/* Logged in User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80"
                title={`ผู้ใช้งานปัจจุบัน: ${currentUser.name} (ID: ${currentUser.id} - บทบาท: ${currentUser.role})`}
              >
                <div
                  className={`w-6 h-6 rounded-lg ${currentUser.avatarBg} font-bold text-[11px] flex items-center justify-center shrink-0 uppercase shadow-xs`}
                >
                  {currentUser.id.slice(0, 2)}
                </div>
                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>{currentUser.id}</span>
                    {currentUser.role === 'superadmin' ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">SuperAdmin</span>
                    ) : currentUser.role === 'admin' ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded border border-rose-200">Admin</span>
                    ) : currentUser.role === 'viewer' ? (
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-300">Viewer</span>
                    ) : (
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{currentUser.name.split(' ')[0]}</span>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition shadow-xs"
                  title="ออกจากระบบ เพื่อความปลอดภัย"
                  id="header-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


