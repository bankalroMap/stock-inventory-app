import React, { useState } from 'react';
import {
  Boxes,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react';
import {
  AppUser,
  getAccounts,
  verifyCredentials,
  saveAppUser,
} from '../utils/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('กรุณากรอก ID หรือชื่อผู้ใช้งาน');
      return;
    }
    if (!password) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsLoading(true);

    // Simulate snappy verification with slight realistic feedback
    setTimeout(() => {
      const user = verifyCredentials(username, password);
      if (user) {
        saveAppUser(user, rememberMe);
        onLoginSuccess(user);
      } else {
        setErrorMsg('ID หรือ Password ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleSelectQuickAccount = (accountId: string) => {
    setUsername(accountId);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Boxes className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-3 ring-white shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            ระบบบันทึกสต๊อกสินค้า เข้า-ออก
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กรุณาลงชื่อเข้าใช้ด้วย ID และ Password เพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">เข้าสู่ระบบความปลอดภัย</h2>
              <p className="text-[11px] text-slate-500">ป้องกันผู้อื่นเข้ามาดัดแปลงหรือแกล้งสต๊อกสินค้า</p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / ID */}
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ID / รหัสผู้ใช้งาน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, kititorn, prasert..."
                  autoFocus
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition outline-hidden"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password / รหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-600">จดจำการเข้าสู่ระบบในเครื่องนี้</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบสิทธิ์...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Sign In)</span>
                </>
              )}
            </button>
          </form>

          {/* Authorized Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                รายชื่อผู้มีสิทธิ์เข้าใช้งาน ({accounts.length} บัญชี)
              </span>
              <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                คลิกเพื่อเลือก ID
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {accounts.map((acc) => {
                const isSelected = username.toLowerCase() === acc.id.toLowerCase();
                const isSuperAdmin = acc.role === 'superadmin';
                const isAdmin = acc.role === 'admin';
                const isViewer = acc.role === 'viewer';

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition border ${
                      isSelected
                        ? isSuperAdmin
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : isViewer
                          ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : isSuperAdmin
                        ? 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border-amber-300 font-semibold'
                        : isViewer
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title={`คลิกเพื่อใส่ ID: ${acc.id} (${acc.name} - ${acc.role})`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSuperAdmin
                          ? 'bg-amber-500 ring-1 ring-amber-300'
                          : isAdmin
                          ? 'bg-rose-500'
                          : isViewer
                          ? 'bg-slate-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="font-semibold">{acc.id}</span>
                    {isSuperAdmin && <span className="text-[10px]">⭐</span>}
                    {isViewer && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-normal ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        ดูอย่างเดียว
                      </span>
                    )}
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100/80 text-[11px] text-slate-500 space-y-1 text-center">
              <p>
                รหัสผ่านเริ่มต้นสำหรับทุกบัญชีคือ: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono font-bold">1234</code>
              </p>
              <p className="text-[10px] text-slate-400">
                🔒 kititorn, prasert, sulkiflee, kanyakorn, ple มีสิทธิ์เป็น <span className="font-semibold text-slate-600">ผู้เข้าชม (ดูอย่างเดียว)</span> ไม่สามารถบันทึกสต๊อกได้
              </p>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ระบบป้องกันข้อมูลและการบันทึกสต๊อกสินค้า (Access Control Protected)</span>
        </div>
      </div>
    </div>
  );
}
