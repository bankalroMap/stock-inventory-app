import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Edit2,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  Shield,
  Search,
} from 'lucide-react';
import {
  AuthCredential,
  UserRole,
  ROLE_LABELS,
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  resetAccountsToDefault,
  AppUser,
  getRandomAvatarBg,
} from '../utils/auth';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onUserSessionUpdated?: (updatedUser: AppUser) => void;
}

export function UserManagementModal({
  isOpen,
  onClose,
  currentUser,
  onUserSessionUpdated,
}: UserManagementModalProps) {
  const [accounts, setAccounts] = useState<AuthCredential[]>(() => getAccounts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');

  // Add User State
  const [isAdding, setIsAdding] = useState(false);
  const [newId, setNewId] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Edit User State
  const [editingTarget, setEditingTarget] = useState<AuthCredential | null>(null);
  const [editId, setEditId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('staff');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Password reveal map for table rows
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Confirm delete state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<AuthCredential | null>(null);

  // Alert/Toast feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const refreshAccountsList = () => {
    const fresh = getAccounts();
    setAccounts(fresh);
    // If current user was updated, also update session
    const currentFresh = fresh.find((a) => a.id.toLowerCase() === currentUser.id.toLowerCase());
    if (currentFresh && onUserSessionUpdated) {
      onUserSessionUpdated({
        id: currentFresh.id,
        name: currentFresh.name,
        role: currentFresh.role,
        avatarBg: currentFresh.avatarBg,
      });
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleToggleReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Start Adding User
  const handleOpenAdd = () => {
    setNewId('');
    setNewPassword('1234');
    setNewName('');
    setNewRole('staff');
    setShowNewPassword(false);
    setIsAdding(true);
    setEditingTarget(null);
  };

  // Submit Add User
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) {
      showFeedback('error', 'กรุณาระบุ ID ผู้ใช้งาน');
      return;
    }
    if (!newPassword.trim()) {
      showFeedback('error', 'กรุณาระบุ Password');
      return;
    }

    const result = addAccount({
      id: newId.trim(),
      password: newPassword.trim(),
      name: newName.trim() || newId.trim(),
      role: newRole,
      avatarBg: getRandomAvatarBg(newRole),
    });

    if (result.success) {
      refreshAccountsList();
      setIsAdding(false);
      showFeedback('success', `เพิ่มผู้ใช้งาน "${newId.trim()}" เรียบร้อยแล้ว`);
    } else {
      showFeedback('error', result.error || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
    }
  };

  // Start Editing User
  const handleStartEdit = (acc: AuthCredential) => {
    setEditingTarget(acc);
    setEditId(acc.id);
    setEditName(acc.name);
    setEditRole(acc.role);
    setEditPassword(acc.password);
    setShowEditPassword(false);
    setIsAdding(false);
  };

  // Submit Edit User
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    if (!editId.trim()) {
      showFeedback('error', 'กรุณาระบุ ID');
      return;
    }
    if (!editPassword.trim()) {
      showFeedback('error', 'รหัสผ่านต้องไม่ว่างเปล่า');
      return;
    }

    const result = updateAccount(editingTarget.id, {
      id: editId.trim(),
      name: editName.trim() || editId.trim(),
      role: editRole,
      password: editPassword.trim(),
      avatarBg: editingTarget.role !== editRole ? getRandomAvatarBg(editRole) : editingTarget.avatarBg,
    });

    if (result.success) {
      refreshAccountsList();
      setEditingTarget(null);
      showFeedback('success', `อัปเดตข้อมูลบัญชี "${editId.trim()}" สำเร็จแล้ว`);
    } else {
      showFeedback('error', result.error || 'ไม่สามารถแก้ไขข้อมูลได้');
    }
  };

  // Execute Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;

    const result = deleteAccount(deleteConfirmTarget.id, currentUser.id);
    if (result.success) {
      refreshAccountsList();
      showFeedback('success', `ลบบัญชี "${deleteConfirmTarget.id}" เรียบร้อยแล้ว`);
    } else {
      showFeedback('error', result.error || 'ไม่สามารถลบบัญชีได้');
    }
    setDeleteConfirmTarget(null);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการรีเซ็ตบัญชีผู้ใช้ทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่? บัญชีที่สร้างขึ้นใหม่จะถูกลบออก')) {
      resetAccountsToDefault();
      refreshAccountsList();
      showFeedback('success', 'รีเซ็ตบัญชีผู้ใช้กลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว');
    }
  };

  // Filtered List
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || acc.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-2 ring-white/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">จัดการสิทธิ์ผู้ใช้งานและรหัสผ่าน</h2>
                <span className="text-[11px] bg-amber-400/30 text-amber-100 font-semibold px-2 py-0.5 rounded-full border border-amber-300/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                เพิ่มผู้เข้าใช้, กำหนดบทบาทสิทธิ์ (Super Admin / Admin / Staff) และแก้ไข ID & Password
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition text-white"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Bar */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-medium border-b shrink-0 transition ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Controls Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาตาม ID หรือชื่อผู้ใช้..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
              />
            </div>

            {/* Filter by Role */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
            >
              <option value="all">ทุกบทบาท ({accounts.length})</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-xl border border-slate-200 transition"
              title="รีเซ็ตบัญชีกลับสู่ค่าเริ่มต้นเริ่มต้น 8 บัญชี"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Add User Form Drawer */}
          {isAdding && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <UserPlus className="w-4 h-4 text-amber-600" />
                  <span>เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ยกเลิก
                </button>
              </div>

              <form onSubmit={handleSubmitAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID ผู้ใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="เช่น manager1, somchai"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password / รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="รหัสผ่าน"
                      className="w-full px-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อที่แสดง / ตำแหน่ง</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น คุณสมชาย (คลังสินค้า)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาทสิทธิ์ (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden font-semibold text-slate-800"
                  >
                    <option value="staff">Staff (บันทึกสต๊อก เข้า-ออก)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบสต๊อก)</option>
                    <option value="superadmin">Super Admin (จัดการสิทธิ์ผู้ใช้)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    บันทึกผู้ใช้ใหม่
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit User Form Drawer */}
          {editingTarget && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 shadow-xs animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-200/60">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Edit2 className="w-4 h-4 text-indigo-600" />
                  <span>
                    แก้ไขบทบาท &amp; รหัสผ่าน: <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded font-mono">{editingTarget.id}</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ยกเลิก
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID ผู้ใช้งาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editId}
                    onChange={(e) => setEditId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password / รหัสผ่านใหม่ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อที่แสดง</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">บทบาทสิทธิ์ (Role)</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-semibold text-slate-800"
                  >
                    <option value="staff">Staff (บันทึกสต๊อก เข้า-ออก)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบสต๊อก)</option>
                    <option value="superadmin">Super Admin (จัดการสิทธิ์ผู้ใช้)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-indigo-700">
                    {editRole === 'superadmin' && '⭐ ได้รับสิทธิ์สูงสุด จัดการผู้ใช้งานและสต๊อกได้ทุกอย่าง'}
                    {editRole === 'admin' && '🛡️ ได้รับสิทธิ์ผู้ดูแลสต๊อก ล้างข้อมูล เชื่อมต่อ Google Sheets'}
                    {editRole === 'staff' && '📦 ได้รับสิทธิ์พนักงาน บันทึกรับเข้า-จ่ายออก ตรวจสอบสต๊อก'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTarget(null)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      บันทึกการแก้ไข
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Accounts Table List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ผู้ใช้งาน (ID / ชื่อ)</th>
                    <th className="py-3 px-3">บทบาท &amp; สิทธิ์</th>
                    <th className="py-3 px-3">รหัสผ่าน (Password)</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        ไม่พบบัญชีผู้ใช้งานที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => {
                      const isMe = acc.id.toLowerCase() === currentUser.id.toLowerCase();
                      const roleConfig = ROLE_LABELS[acc.role] || ROLE_LABELS.staff;
                      const isRevealed = Boolean(revealedPasswords[acc.id]);

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition group">
                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl ${acc.avatarBg} font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs`}
                              >
                                {acc.id.slice(0, 2)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 font-mono text-sm">{acc.id}</span>
                                  {isMe && (
                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded border border-indigo-200">
                                      (ฉัน)
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-xs">{acc.name}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${roleConfig.badgeClass}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotClass}`} />
                                <span>{roleConfig.label}</span>
                              </span>
                              <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] line-clamp-1">
                                {roleConfig.desc}
                              </p>
                            </div>
                          </td>

                          {/* Password */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 font-mono">
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                  isRevealed ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isRevealed ? acc.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleReveal(acc.id)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
                                title={isRevealed ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(acc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition shadow-2xs"
                                title="แก้ไขสิทธิ์, ชื่อ หรือ Password"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>แก้ไข</span>
                              </button>

                              {!isMe && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget(acc)}
                                  className="inline-flex items-center p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                                  title={`ลบบัญชี ${acc.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Explanations Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>สรุปสิทธิ์ของแต่ละบทบาทในระบบ:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 block mb-1">⭐ Super Admin</span>
                <span className="text-slate-600">
                  จัดการสิทธิ์คนอื่นได้ทั้งหมด, เพิ่มผู้ใช้ใหม่, เปลี่ยนรหัสผ่านของใครก็ได้, แก้ไขบทบาท และบันทึกสต๊อกสินค้า
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-rose-200">
                <span className="font-bold text-rose-800 block mb-1">🛡️ Admin</span>
                <span className="text-slate-600">
                  ดูแลสต๊อก เข้า-ออก แก้ไขรายการสต๊อก, ลบรายการสินค้า, ดู Monitor Dashboard และเชื่อมต่อ Google Sheets
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-800 block mb-1">📦 Staff</span>
                <span className="text-slate-600">
                  พนักงานประจำ ทำหน้าที่บันทึกรับเข้า-จ่ายออก ค้นหาสินค้า และดูยอดสต๊อกคงเหลือในคลัง
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            จำนวนผู้ใช้งานในระบบทั้งหมด: <strong className="text-slate-800">{accounts.length}</strong> บัญชี
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs transition"
          >
            เสร็จสิ้น (ปิด)
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">ยืนยันการลบบัญชีผู้ใช้</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              คุณต้องการลบบัญชีผู้ใช้งาน ID: <strong className="text-slate-900 font-mono font-bold">{deleteConfirmTarget.id}</strong> ({deleteConfirmTarget.name}) ใช่หรือไม่? ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้อีก
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
