/**
 * Auth Token Store
 * Stores the current user's JWT synchronously from onAuthStateChange events.
 * This avoids calling supabase.auth.getSession() during data fetching,
 * which can trigger HTTP/2 refresh requests that conflict with native fetch calls.
 */

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _currentToken: string | null = null;

/** Called by onAuthStateChange when session is established or refreshed */
export function setCurrentToken(token: string | null): void {
  _currentToken = token || null;
}

/** Returns the current user JWT, or anon key if not authenticated */
export function getCurrentToken(): string {
  return _currentToken || ANON_KEY;
}
