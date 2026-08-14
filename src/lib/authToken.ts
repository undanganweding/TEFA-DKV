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
  // Cloudflare/Reverse proxy header limit is 8KB-16KB.
  // If token is abnormally huge (>8192 chars due to legacy base64 in metadata), reject it to prevent ERR_CONNECTION_RESET.
  if (token && token.length > 8192) {
    console.warn('[AUTH] Token size exceeds safe HTTP header limits (' + token.length + ' bytes). Falling back to anon key.');
    _currentToken = null;
    return;
  }
  _currentToken = token || null;
}

/** Returns the current user JWT, or anon key if not authenticated or oversized */
export function getCurrentToken(): string {
  if (_currentToken && _currentToken.length > 8192) {
    return ANON_KEY;
  }
  return _currentToken || ANON_KEY;
}

