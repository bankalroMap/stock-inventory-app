import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SpreadsheetInfo } from '../services/googleSheets';

interface GoogleSheetsBarProps {
  user: User | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  isConnecting: boolean;
  isSyncing: boolean;
  error: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onSync: () => void;
  onChangeSpreadsheet?: (newId: string) => void;
}

export function GoogleSheetsBar({
  user,
  spreadsheetInfo,
  isConnecting,
  isSyncing,
  error,
  onSignIn,
  onSignOut,
  onSync,
}: GoogleSheetsBarProps) {
  if (!user) {
    return (
      <div
        id="google-sheets-promo-banner"
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  ระบบบันทึกข้อมูลบน Google Sheets เป็นระบบหลังบ้าน
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> แนะนำ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อสร้างและเชื่อมต่อตารางสต๊อกสินค้าบน Google Sheets ของคุณอัตโนมัติ 
                ทุกครั้งที่บันทึกสินค้า รับเข้า-จ่ายออก ข้อมูลจะถูกเขียนลง Google Sheet แบบเรียลไทม์ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
            <GoogleSignInButton
              onClick={onSignIn}
              disabled={isConnecting}
              text={isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อด้วย Google'}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="google-sheets-connected-banner"
      className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Account & Sheet Status */}
        <div className="flex items-center gap-3.5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-slate-200 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                {user.displayName || user.email}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> เชื่อมต่อ Google Sheets แล้ว
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 truncate">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-medium text-slate-700">
                {spreadsheetInfo?.name || 'กำลังเตรียม Google Sheet...'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {spreadsheetInfo?.url && (
            <a
              href={spreadsheetInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition"
              id="open-google-sheet-link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดดู Google Sheet หลังบ้าน</span>
            </a>
          )}

          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition disabled:opacity-50"
            id="sync-google-sheet-btn"
            title="ดึงข้อมูลล่าสุดจาก Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ดึงข้อมูลล่าสุด'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
            id="signout-btn"
            title="ออกจากระบบ Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
