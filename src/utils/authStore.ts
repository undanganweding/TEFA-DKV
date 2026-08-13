import { UserProfile } from '../types';

const STORAGE_KEY_SESSION = 'tefa_active_session_v2';

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
    statusAkun: 'Active',
    phone: '',
    theme: 'light',
    notifications: { orderNotif: false, fileInboxNotif: false, productionNotif: false, stockNotif: false },
  };
};
