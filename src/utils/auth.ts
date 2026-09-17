export interface AppUser {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  avatarBg: string;
}

export interface AuthCredential {
  id: string;
  password: string;
  name: string;
  role: 'admin' | 'staff';
  avatarBg: string;
}

/**
 * บัญชีผู้ใช้งานที่ได้รับอนุญาตให้เข้าถึงระบบสต๊อกสินค้า
 */
export const AUTHORIZED_ACCOUNTS: AuthCredential[] = [
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
    role: 'staff',
    avatarBg: 'bg-indigo-500 text-white',
  },
  {
    id: 'prasert',
    password: '1234',
    name: 'คุณประเสริฐ (prasert)',
    role: 'staff',
    avatarBg: 'bg-emerald-500 text-white',
  },
  {
    id: 'sulkiflee',
    password: '1234',
    name: 'คุณซุลกิฟลี (sulkiflee)',
    role: 'staff',
    avatarBg: 'bg-amber-500 text-white',
  },
  {
    id: 'adisak',
    password: '1234',
    name: 'คุณอดิศักดิ์ (adisak)',
    role: 'staff',
    avatarBg: 'bg-cyan-500 text-white',
  },
  {
    id: 'kanyakorn',
    password: '1234',
    name: 'คุณกัญญากร (kanyakorn)',
    role: 'staff',
    avatarBg: 'bg-purple-500 text-white',
  },
  {
    id: 'ple',
    password: '1234',
    name: 'คุณเปิ้ล (ple)',
    role: 'staff',
    avatarBg: 'bg-pink-500 text-white',
  },
];

const APP_USER_SESSION_KEY = 'stock_manager_active_user';

/**
 * ตรวจสอบ ID และ Password สำหรับ Login
 */
export function verifyCredentials(id: string, password: string): AppUser | null {
  const normalizedId = id.trim().toLowerCase();
  const normalizedPw = password.trim();

  const account = AUTHORIZED_ACCOUNTS.find(
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
      // Validate that the ID still exists in our authorized list
      const valid = AUTHORIZED_ACCOUNTS.find((a) => a.id.toLowerCase() === parsed.id.toLowerCase());
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
