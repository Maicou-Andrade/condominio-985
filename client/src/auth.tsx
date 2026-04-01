import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  casaId: number;
  casaNumero: string;
  nome: string;
  email: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (credential: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
});

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') return '';
  return 'http://localhost:3000';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setUser(data.user || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const login = async (credential: string) => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error, data };
    } catch (err) {
      return { success: false, error: 'network_error' };
    }
  };

  const logout = async () => {
    await fetch(`${getBaseUrl()}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
