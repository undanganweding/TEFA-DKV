import { UserProfile, UserRole } from '../types';

// Simple helper for password hash simulation
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hashed_v1_${Math.abs(hash)}_${password.length}`;
};

// INITIAL SYSTEM ACCOUNTS ACCORDING TO PRODUCTION SPECIFICATION
export const INITIAL_ACCOUNTS: UserProfile[] = [
  {
    id: 'USR-ADMIN-001',
    name: 'Kepala TEFA (Syifa)',
    username: 'syifaanjay',
    email: 'syifaanjay@gmail.com',
    role: 'Kepala TEFA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    defaultPage: 'dashboard',
    statusAkun: 'Aktif',
    phone: '081234567890',
    position: 'Kepala Unit Teaching Factory DKV',
    nip: '198504122010011005',
    schoolEmail: 'syifaanjay@gmail.com',
    passwordHash: hashPassword('punyadkv123'),
    createdAt: '2026-01-01',
    theme: 'light',
    notifications: { orderNotif: true, fileInboxNotif: true, productionNotif: true, stockNotif: true },
  },
  {
    id: 'USR-ADMIN-002',
    name: 'Admin TEFA DKV',
    username: 'admintefa',
    email: 'dkvsmknu@gmail.com',
    role: 'Admin TEFA',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
    defaultPage: 'dashboard',
    statusAkun: 'Aktif',
    phone: '081987654321',
    position: 'Administrator Platform TEFA',
    employeeId: 'ADM-2026-002',
    passwordHash: hashPassword('punyadkv123'),
    createdAt: '2026-01-01',
    theme: 'light',
    notifications: { orderNotif: true, fileInboxNotif: true, productionNotif: true, stockNotif: true },
  },
  {
    id: 'USR-STD-001',
    name: 'Siswa DKV',
    username: 'siswadkv',
    email: 'siswadkv@gmail.com',
    role: 'Siswa',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
    defaultPage: 'public_upload',
    statusAkun: 'Aktif',
    phone: '085712345678',
    whatsapp: '085712345678',
    nis: '202611045',
    studentClass: 'XI DKV 1',
    major: 'Desain Komunikasi Visual',
    passwordHash: hashPassword('trial123'),
    createdAt: '2026-01-10',
    theme: 'light',
    notifications: { orderNotif: true, fileInboxNotif: true, productionNotif: true, stockNotif: true },
  },
];

const STORAGE_KEY_USERS = 'tefa_user_database_v2';
const STORAGE_KEY_SESSION = 'tefa_active_session_v2';

// 1. Get All Stored Users
export const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    const parsed: UserProfile[] = JSON.parse(raw);
    
    // Ensure initial system accounts are always present if missing
    let updated = [...parsed];
    let changed = false;
    
    INITIAL_ACCOUNTS.forEach((initAcc) => {
      const exists = updated.some(
        (u) => u.email.toLowerCase() === initAcc.email.toLowerCase()
      );
      if (!exists) {
        updated.push(initAcc);
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
    }
    return updated;
  } catch (err) {
    console.error('Failed to parse user database from localStorage:', err);
    return INITIAL_ACCOUNTS;
  }
};

// 2. Save Users
export const saveUsers = (users: UserProfile[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save user database:', err);
  }
};

// 3. Authenticate User Login
export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

export const authenticateUser = (identifier: string, passwordInput: string): LoginResult => {
  const users = getStoredUsers();
  const cleanId = identifier.trim().toLowerCase();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId)
  );

  if (!user) {
    return {
      success: false,
      message: 'Email atau username tidak ditemukan dalam sistem.',
    };
  }

  // Check password
  const expectedHash = user.passwordHash || hashPassword('punyadkv123');
  const inputHash = hashPassword(passwordInput);

  if (expectedHash !== inputHash) {
    return {
      success: false,
      message: 'Kata sandi (password) yang Anda masukkan salah.',
    };
  }

  // Check account status
  if (user.statusAkun === 'Menunggu Verifikasi') {
    return {
      success: false,
      message: 'Akun Anda sedang dalam proses verifikasi oleh Admin TEFA. Silakan hubungi pengelola.',
    };
  }

  if (user.statusAkun === 'Nonaktif') {
    return {
      success: false,
      message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Kepala TEFA / Admin.',
    };
  }

  return {
    success: true,
    user,
  };
};

// 4. Student Registration
export interface RegisterStudentInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  nis: string;
  studentClass: string;
  major: string;
  whatsapp: string;
  avatar?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

export const registerStudentAccount = (input: RegisterStudentInput): RegisterResult => {
  const users = getStoredUsers();
  const cleanEmail = input.email.trim().toLowerCase();

  // Validate Email Uniqueness
  const emailExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (emailExists) {
    return {
      success: false,
      message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
    };
  }

  // Validate Password Length
  if (!input.password || input.password.length < 8) {
    return {
      success: false,
      message: 'Password minimal harus 8 karakter.',
    };
  }

  // Validate Password Confirmation
  if (input.password !== input.confirmPassword) {
    return {
      success: false,
      message: 'Konfirmasi password tidak cocok dengan password yang dimasukkan.',
    };
  }

  // Create new Student Profile
  const newStudent: UserProfile = {
    id: `USR-STD-${Date.now().toString().slice(-6)}`,
    name: input.name.trim(),
    username: cleanEmail.split('@')[0],
    email: cleanEmail,
    role: 'Siswa',
    avatar:
      input.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    defaultPage: 'public_upload',
    statusAkun: 'Aktif', // Can be logged in directly or set to Aktif
    phone: input.whatsapp.trim() || '081234567890',
    whatsapp: input.whatsapp.trim(),
    nis: input.nis.trim(),
    studentClass: input.studentClass.trim(),
    major: input.major.trim() || 'Desain Komunikasi Visual',
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString().split('T')[0],
    theme: 'light',
    notifications: { orderNotif: true, fileInboxNotif: true, productionNotif: true, stockNotif: true },
  };

  const updatedUsers = [...users, newStudent];
  saveUsers(updatedUsers);

  return {
    success: true,
    user: newStudent,
    message: 'Registrasi berhasil! Akun Siswa DKV Anda telah aktif.',
  };
};

// 5. Password Reset Flow
export const resetUserPassword = (emailInput: string, newPassword: string): { success: boolean; message: string } => {
  const users = getStoredUsers();
  const cleanEmail = emailInput.trim().toLowerCase();
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIndex === -1) {
    return {
      success: false,
      message: 'Email tidak ditemukan dalam sistem TEFA DKV.',
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      message: 'Password baru minimal harus 8 karakter.',
    };
  }

  users[userIndex].passwordHash = hashPassword(newPassword);
  saveUsers(users);

  return {
    success: true,
    message: 'Kata sandi berhasil diperbarui! Silakan login dengan password baru Anda.',
  };
};

// 6. User Status Management (Admin Action)
export const updateUserStatus = (userId: string, newStatus: 'Aktif' | 'Menunggu Verifikasi' | 'Nonaktif'): UserProfile[] => {
  const users = getStoredUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, statusAkun: newStatus } : u));
  saveUsers(updated);
  return updated;
};

// 7. Session Persistence
export const getStoredSession = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export const setStoredSession = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (err) {
    console.error('Failed to set stored session:', err);
  }
};

export const createGuestUser = (): UserProfile => {
  return {
    id: `GUEST-${Date.now().toString().slice(-6)}`,
    name: 'Guest Customer',
    email: 'guest@customer.public',
    role: 'Guest',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    defaultPage: 'public_upload',
    statusAkun: 'Aktif',
    phone: '',
    theme: 'light',
    notifications: { orderNotif: false, fileInboxNotif: false, productionNotif: false, stockNotif: false },
  };
};
