import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onTryGsi?: () => void;
  isConnecting?: boolean;
}

export function UnauthorizedDomainModal({
  isOpen,
  onClose,
  onRetry,
  onTryGsi,
  isConnecting = false,
}: UnauthorizedDomainModalProps) {
  const [copied, setCopied] = useState(false);
  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = 'gen-lang-client-0315336896';
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                วิธีแก้ไขข้อผิดพลาด (auth/unauthorized-domain)
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่มโดเมนของแอปพลิเคชันเข้าสู่ Firebase Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Root Cause Explanation */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
            สาเหตุของปัญหานี้:
          </p>
          ระบบความปลอดภัยของ Firebase กำหนดว่าจะต้องเพิ่มชื่อโดเมนของเว็บไซต์ลงในรายการ{' '}
          <span className="font-semibold underline">Authorized domains</span>{' '}
          ก่อน จึงจะอนุญาตให้ป๊อปอัปเข้าสู่ระบบของ Google ทำงานได้
        </div>

        {/* Current Domain with Copy Button */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            โดเมนของแอปพลิเคชันของคุณในปัจจุบัน:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 break-all select-all font-semibold">
              {currentHostname}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโดเมน</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Easy Steps */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-900">
            ขั้นตอนการแก้ไขใน Firebase Console (ใช้เวลาเพียง 1 นาที):
          </p>
          <ol className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                1
              </span>
              <span>
                กดปุ่ม <strong>"คัดลอกโดเมน"</strong> ด้านบน
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                2
              </span>
              <span>
                คลิกปุ่ม <strong>"เปิดหน้าตั้งค่า Firebase Console"</strong> ด้านล่าง แล้วเลื่อนไปที่หัวข้อ{' '}
                <strong>Authorized domains (โดเมนที่ได้รับอนุญาต)</strong>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200">
                3
              </span>
              <span>
                คลิก <strong>"Add domain" (เพิ่มโดเมน)</strong> วางชื่อโดเมนที่คัดลอกไว้ แล้วกด{' '}
                <strong>Save</strong>
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <a
            href={consoleSettingsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>เปิดหน้าตั้งค่า Firebase Console</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onTryGsi && (
              <button
                type="button"
                onClick={onTryGsi}
                disabled={isConnecting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition disabled:opacity-50"
                title="ลองเข้าสู่ระบบผ่าน Google Identity Services ตรง"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ลองเชื่อมต่อด้วย GSI</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRetry}
              disabled={isConnecting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
              <span>{isConnecting ? 'กำลังทดสอบ...' : 'ลองเชื่อมต่ออีกครั้ง'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
