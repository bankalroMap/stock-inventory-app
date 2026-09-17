import { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  HelpCircle,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SpreadsheetInfo } from '../services/googleSheets';
import { AuthUser } from '../types';
import { UnauthorizedDomainModal } from './UnauthorizedDomainModal';

interface GoogleSheetsBarProps {
  user: AuthUser | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  isConnecting: boolean;
  isSyncing: boolean;
  error: string | null;
  onSignIn: (forceGsi?: boolean) => void;
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const isUnauthorizedDomain =
    Boolean(error) &&
    (error?.includes('unauthorized-domain') ||
      error?.includes('auth/unauthorized-domain'));

  const handleCopyHost = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <>
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
                  ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อเชื่อมต่อระบบหลังบ้านบน Google Sheets อัตโนมัติ: บันทึกสต๊อก เข้า-ออก (แท็บ &ldquo;สต๊อกสินค้า&rdquo;) และจัดการรายการสินค้าพร้อมราคาทุน/ราคาขาย (แท็บ &ldquo;คลังสินค้า&rdquo;)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
              <GoogleSignInButton
                onClick={() => onSignIn(false)}
                disabled={isConnecting}
                text={isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อด้วย Google'}
              />
            </div>
          </div>

          {/* Specific Banner for Unauthorized Domain Error */}
          {isUnauthorizedDomain && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    โดเมนของแอปนี้ ({currentHostname}) ยังไม่ได้เพิ่มใน Authorized Domains ของ Firebase
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyHost}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-700" />
                        <span>คัดลอกโดเมน</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHelpModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-2xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>วิธีแก้ไขใน 1 นาที</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 text-[11px] text-amber-800">
                <span>หรือต้องการทดสอบเชื่อมต่อทันที:</span>
                <button
                  type="button"
                  onClick={() => onSignIn(true)}
                  disabled={isConnecting}
                  className="font-semibold underline hover:text-amber-900 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  ลองเข้าสู่ระบบผ่าน Google Identity Services (GSI)
                </button>
              </div>
            </div>
          )}

          {/* General Error Banner */}
          {error && !isUnauthorizedDomain && (
            <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal for Unauthorized Domain Resolution Guide */}
        <UnauthorizedDomainModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          onRetry={() => {
            setIsHelpModalOpen(false);
            onSignIn(false);
          }}
          onTryGsi={() => {
            setIsHelpModalOpen(false);
            onSignIn(true);
          }}
          isConnecting={isConnecting}
        />
      </>
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

            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-medium text-slate-700">
                  {spreadsheetInfo?.name || 'กำลังเตรียม Google Sheet...'}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  1. สต๊อกสินค้า
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                  2. คลังสินค้า
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Open Google Sheet link */}
          {spreadsheetInfo?.url && (
            <div className="flex items-center gap-1.5">
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                title="เปิด Google Sheets ในแท็บสต๊อกสินค้า"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>เปิดดู Google Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {spreadsheetInfo.catalogSheetId !== undefined && (
                <a
                  href={`${spreadsheetInfo.url}#gid=${spreadsheetInfo.catalogSheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition shadow-2xs"
                  title="เปิดดูและแก้ไขแคตตาล็อกสินค้าในแท็บคลังสินค้า"
                >
                  <span>แท็บคลังสินค้า</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Sync button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
            title="ดึงข้อมูลล่าสุดจาก Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์...' : 'ดึงข้อมูลล่าสุด'}</span>
          </button>

          {/* Disconnect / Sign out */}
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
            title="ออกจากระบบ Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ตัดการเชื่อมต่อ</span>
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
