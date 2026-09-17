export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewer';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  avatarBg: string;
}

export interface AuthCredential {
  id: string;
  password: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ROLE_LABELS: Record<UserRole, { label: string; desc: string; badgeClass: string; dotClass: string }> = {
  superadmin: {
    label: 'Super Admin (ผู้จัดการสิทธิ์)',
    desc: 'จัดการสิทธิ์ผู้ใช้คนอื่น, เพิ่ม/แก้ไข/ลบ ID และรหัสผ่าน, บันทึกสต๊อกได้ทุกส่วน',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    dotClass: 'bg-amber-500',
  },
  admin: {
    label: 'Admin (ผู้ดูแลระบบสต๊อก)',
    desc: 'ดูแลคลังสินค้า บันทึก เข้า-ออก แก้ไขและลบรายการสต๊อก เชื่อมต่อ Google Sheets',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    dotClass: 'bg-rose-500',
  },
  staff: {
    label: 'Staff (พนักงานบันทึกสต๊อก)',
    desc: 'บันทึกรับเข้า-จ่ายออก ตรวจสอบยอดคงเหลือและสถานะสินค้าในคลัง',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
    dotClass: 'bg-emerald-500',
  },
  viewer: {
    label: 'Viewer (ผู้เข้าชม - ดูอย่างเดียว)',
    desc: 'เข้าชมและตรวจสอบสต๊อกคงเหลือและสถานะสินค้า ไม่สามารถบันทึกรับเข้า-จ่ายออกได้',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    dotClass: 'bg-slate-400',
  },
};

/**
 * รายชื่อบัญชีเริ่มต้นของระบบ
 */
export const INITIAL_ACCOUNTS: AuthCredential[] = [
  {
    id: 'superadmin',
    password: '1234',
    name: 'SuperAdmin (ผู้จัดการสิทธิ์)',
    role: 'superadmin',
    avatarBg: 'bg-amber-600 text-white',
  },
  {
    id: 'admin',
    password: '1234',
    name: 'Admin (ผู้ดูแลระบบ)',
    role: 'admin',
    avatarBg: 'bg-rose-500 text-white',
  },
  {
    id: 'kititorn',
    password: '1234',
    name: 'คุณกิตติธร (kititorn)',
    role: 'viewer',
    avatarBg: 'bg-indigo-500 text-white',
  },
  {
    id: 'prasert',
    password: '1234',
    name: 'คุณประเสริฐ (prasert)',
    role: 'viewer',
    avatarBg: 'bg-emerald-500 text-white',
  },
  {
    id: 'sulkiflee',
    password: '1234',
    name: 'คุณซุลกิฟลี (sulkiflee)',
    role: 'viewer',
    avatarBg: 'bg-amber-500 text-white',
  },
  {
    id: 'adisak',
    password: '1234',
    name: 'คุณอดิศักดิ์ (adisak)',
    role: 'viewer',
    avatarBg: 'bg-cyan-500 text-white',
  },
  {
    id: 'kanyakorn',
    password: '1234',
    name: 'คุณกัญญากร (kanyakorn)',
    role: 'viewer',
    avatarBg: 'bg-purple-500 text-white',
  },
  {
    id: 'ple',
    password: '1234',
    name: 'คุณเปิ้ล (ple)',
    role: 'viewer',
    avatarBg: 'bg-pink-500 text-white',
  },
];

const ACCOUNTS_STORAGE_KEY = 'stock_manager_accounts_v3';
const APP_USER_SESSION_KEY = 'stock_manager_active_user';

/**
 * ดึงรายการบัญชีผู้ใช้ทั้งหมดจาก localStorage
 */
export function getAccounts(): AuthCredential[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY) || localStorage.getItem('stock_manager_accounts_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // ตรวจสอบความถูกต้องของบัญชี และรักษาสิทธิ์บทบาทที่ Super Admin ได้แก้ไขหรือกำหนดไว้
        const accountMap = new Map<string, AuthCredential>();
        
        parsed.forEach((acc: AuthCredential) => {
          if (acc && typeof acc.id === 'string' && acc.id.trim()) {
            accountMap.set(acc.id.toLowerCase().trim(), acc);
          }
        });

        // ตรวจสอบว่ามี superadmin อยู่ในระบบหรือไม่ หากยังไม่มีให้แทรกบัญชี superadmin เข้าไป
        const hasSuperAdmin = Array.from(accountMap.values()).some(
          (a) => a.role === 'superadmin' || a.id.toLowerCase() === 'superadmin'
        );
        if (!hasSuperAdmin) {
          accountMap.set('superadmin', INITIAL_ACCOUNTS[0]);
        }

        // ตรวจสอบว่ามีบัญชีพื้นฐานครบหรือไม่ หากยังขาดบัญชีใดให้เพิ่มเข้าไป
        INITIAL_ACCOUNTS.forEach((initAcc) => {
          const key = initAcc.id.toLowerCase().trim();
          if (!accountMap.has(key)) {
            accountMap.set(key, initAcc);
          }
        });

        const finalAccounts = Array.from(accountMap.values());
        return finalAccounts;
      }
    }
  } catch (e) {
    console.warn('Error reading accounts from storage:', e);
  }

  // กำหนดค่าเริ่มต้นและบันทึกลง localStorage หากยังไม่มีข้อมูล
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
  } catch (e) {
    console.warn('Error saving initial accounts:', e);
  }
  return INITIAL_ACCOUNTS;
}

/**
 * บันทึกรายการบัญชีทั้งหมดลง localStorage
 */
export function saveAccounts(accounts: AuthCredential[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error persisting accounts:', e);
  }
}

/**
 * เพิ่มผู้ใช้งานใหม่ (เฉพาะผู้มีสิทธิ์)
 */
export function addAccount(account: AuthCredential): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const normalizedId = account.id.trim().toLowerCase();

  if (!normalizedId) {
    return { success: false, error: 'กรุณาระบุ ID ผู้ใช้งาน' };
  }

  if (accounts.some((a) => a.id.toLowerCase() === normalizedId)) {
    return { success: false, error: `ID "${account.id}" มีอยู่ในระบบแล้ว กรุณาใช้ ID อื่น` };
  }

  if (!account.password.trim()) {
    return { success: false, error: 'กรุณาระบุ Password' };
  }

  const newAcc: AuthCredential = {
    id: account.id.trim(),
    password: account.password.trim(),
    name: account.name.trim() || account.id.trim(),
    role: account.role || 'staff',
    avatarBg: account.avatarBg || getRandomAvatarBg(account.role),
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAcc);
  saveAccounts(accounts);
  return { success: true };
}

/**
 * แก้ไขบทบาท, ID, Password และชื่อของผู้ใช้งาน
 */
export function updateAccount(oldId: string, updated: Partial<AuthCredential>): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const index = accounts.findIndex((a) => a.id.toLowerCase() === oldId.trim().toLowerCase());

  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการแก้ไข' };
  }

  // หากมีการเปลี่ยน ID ต้องตรวจว่าซ้ำกับคนอื่นหรือไม่
  if (updated.id && updated.id.trim().toLowerCase() !== oldId.trim().toLowerCase()) {
    const newIdNormalized = updated.id.trim().toLowerCase();
    if (accounts.some((a, idx) => idx !== index && a.id.toLowerCase() === newIdNormalized)) {
      return { success: false, error: `ID "${updated.id}" มีผู้ใช้งานคนอื่นใช้อยู่แล้ว` };
    }
  }

  // ตรวจสอบว่าต้องมี superadmin หลงเหลืออย่างน้อย 1 บัญชี
  if (accounts[index].role === 'superadmin' && updated.role && updated.role !== 'superadmin') {
    const superadminCount = accounts.filter((a) => a.role === 'superadmin').length;
    if (superadminCount <= 1) {
      return { success: false, error: 'ต้องมีผู้ใช้งานบทบาท Super Admin อย่างน้อย 1 บัญชีในระบบ' };
    }
  }

  const existing = accounts[index];
  accounts[index] = {
    ...existing,
    ...updated,
    id: updated.id ? updated.id.trim() : existing.id,
    password: updated.password !== undefined && updated.password !== '' ? updated.password.trim() : existing.password,
    name: updated.name ? updated.name.trim() : existing.name,
    role: updated.role || existing.role,
    avatarBg: updated.avatarBg || existing.avatarBg,
    updatedAt: new Date().toISOString(),
  };

  saveAccounts(accounts);

  // ถ้าผู้ใช้ปัจจุบันคือคนที่ถูกแก้ไข ให้ปรับปรุง session ด้วย
  const currentUser = getStoredAppUser();
  if (currentUser && currentUser.id.toLowerCase() === oldId.trim().toLowerCase()) {
    saveAppUser({
      id: accounts[index].id,
      name: accounts[index].name,
      role: accounts[index].role,
      avatarBg: accounts[index].avatarBg,
    });
  }

  return { success: true };
}

/**
 * ลบบัญชีผู้ใช้งาน
 */
export function deleteAccount(idToDelete: string, currentUserId: string): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const normalizedId = idToDelete.trim().toLowerCase();

  if (normalizedId === currentUserId.trim().toLowerCase()) {
    return { success: false, error: 'ไม่สามารถลบบัญชีที่กำลังเข้าสู่ระบบอยู่ในขณะนี้ได้' };
  }

  const target = accounts.find((a) => a.id.toLowerCase() === normalizedId);
  if (!target) {
    return { success: false, error: 'ไม่พบบัญชีที่ต้องการลบ' };
  }

  if (target.role === 'superadmin') {
    const superadminCount = accounts.filter((a) => a.role === 'superadmin').length;
    if (superadminCount <= 1) {
      return { success: false, error: 'ไม่สามารถลบ Super Admin บัญชีสุดท้ายของระบบได้' };
    }
  }

  const filtered = accounts.filter((a) => a.id.toLowerCase() !== normalizedId);
  saveAccounts(filtered);
  return { success: true };
}

/**
 * รีเซ็ตบัญชีกลับสู่ค่าเริ่มต้น
 */
export function resetAccountsToDefault(): AuthCredential[] {
  saveAccounts(INITIAL_ACCOUNTS);
  return INITIAL_ACCOUNTS;
}

/**
 * ตรวจสอบ ID และ Password สำหรับ Login
 */
export function verifyCredentials(id: string, password: string): AppUser | null {
  const normalizedId = id.trim().toLowerCase();
  const normalizedPw = password.trim();

  const accounts = getAccounts();
  const account = accounts.find(
    (acc) => acc.id.toLowerCase() === normalizedId && acc.password === normalizedPw
  );

  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    role: account.role,
    avatarBg: account.avatarBg,
  };
}

/**
 * ดึงข้อมูลผู้ใช้ที่บันทึกไว้ในเบราว์เซอร์
 */
export function getStoredAppUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(APP_USER_SESSION_KEY) || sessionStorage.getItem(APP_USER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === 'string') {
      const accounts = getAccounts();
      const valid = accounts.find((a) => a.id.toLowerCase() === parsed.id.toLowerCase());
      if (valid) {
        return {
          id: valid.id,
          name: valid.name,
          role: valid.role,
          avatarBg: valid.avatarBg,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading stored user session:', e);
  }
  return null;
}

/**
 * บันทึกสถานะการล็อกอิน
 */
export function saveAppUser(user: AppUser, remember: boolean = true): void {
  try {
    const serialized = JSON.stringify(user);
    if (remember) {
      localStorage.setItem(APP_USER_SESSION_KEY, serialized);
    } else {
      sessionStorage.setItem(APP_USER_SESSION_KEY, serialized);
    }
  } catch (e) {
    console.warn('Error saving user session:', e);
  }
}

/**
 * ออกจากระบบ (Logout)
 */
export function clearAppUser(): void {
  try {
    localStorage.removeItem(APP_USER_SESSION_KEY);
    sessionStorage.removeItem(APP_USER_SESSION_KEY);
  } catch (e) {
    console.warn('Error clearing user session:', e);
  }
}

/**
 * สุ่มสีอวาตาร์ตามบทบาท
 */
export function getRandomAvatarBg(role: UserRole): string {
  if (role === 'superadmin') return 'bg-amber-600 text-white';
  if (role === 'admin') return 'bg-rose-500 text-white';
  if (role === 'viewer') return 'bg-slate-600 text-white';

  const staffColors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-cyan-500 text-white',
    'bg-purple-500 text-white',
    'bg-teal-500 text-white',
    'bg-blue-500 text-white',
  ];
  return staffColors[Math.floor(Math.random() * staffColors.length)];
}
