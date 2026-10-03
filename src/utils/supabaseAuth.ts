// Formula 1 BD - Supabase Authentication Client
// Zero-dependency direct REST integration with Supabase Auth v1

export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
  role?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  user: AuthUser;
  logged_at?: number;
}

const SUPABASE_URL = "https://bnhbebhffosechglrlhf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JhM4SPWE04fbv2jMVNjD0A_RebSTPKe";
const STORAGE_KEY = "f1bd_auth_session";

// Retrieve stored session from localStorage
export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.access_token && session.user) {
      return session;
    }
  } catch (e) {
    console.warn("Failed to load stored session:", e);
  }
  return null;
}

// Save session to localStorage
export function storeSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, logged_at: Date.now() }));
  } catch (e) {
    console.warn("Failed to store session:", e);
  }
}

// Clear stored session
export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// 1. Sign In with Email & Password
export async function signInWithPassword(email: string, password: string): Promise<{ session?: AuthSession; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error || data.error_description || data.msg) {
      const errorMsg = data.error_description || data.msg || data.error || "Authentication failed";
      return { error: errorMsg };
    }

    const session: AuthSession = {
      access_token: data.access_token,
      token_type: data.token_type || "bearer",
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      user: data.user,
      logged_at: Date.now(),
    };

    storeSession(session);
    return { session };
  } catch (err: any) {
    return { error: err?.message || "Network error connecting to Supabase Auth" };
  }
}

// 2. Sign Up with Email & Password
export async function signUpWithPassword(email: string, password: string): Promise<{ session?: AuthSession; user?: AuthUser; requiresConfirmation?: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error || data.msg) {
      const errorMsg = data.error_description || data.msg || data.error || "Signup failed";
      return { error: errorMsg };
    }

    // If autoconfirm is enabled or access_token returned
    if (data.access_token) {
      const session: AuthSession = {
        access_token: data.access_token,
        token_type: data.token_type || "bearer",
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        user: data.user,
        logged_at: Date.now(),
      };
      storeSession(session);
      return { session, user: data.user, requiresConfirmation: false };
    }

    // Requires email confirmation
    return { user: data.user || data, requiresConfirmation: true };
  } catch (err: any) {
    return { error: err?.message || "Network error connecting to Supabase Auth" };
  }
}

// 3. Send Magic Link / Passwordless OTP
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data?.msg || data?.error_description || "Magic link request failed" };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error" };
  }
}

// 4. Validate current user token
export async function validateUser(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 5. Sign Out
export async function signOut(token?: string): Promise<void> {
  if (token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearStoredSession();
}

// 6. Guest Demo Session (Fast Track)
export function createGuestSession(customName?: string): AuthSession {
  const session: AuthSession = {
    access_token: "f1bd_guest_demo_token_" + Date.now(),
    token_type: "bearer",
    user: {
      id: "guest-paddock-driver",
      email: customName ? `${customName.toLowerCase().replace(/\s+/g, '')}@formula1.bd` : "driver@formula1.bd",
      role: "authenticated",
      user_metadata: {
        full_name: customName || "Paddock Master",
        is_guest: true,
      },
    },
    logged_at: Date.now(),
  };
  storeSession(session);
  return session;
}
