import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  casaId: number;
  casaNumero: string;
  nome: string;
  email: string;
  impersonatedBy?: string;
  deveTrocarSenha?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  hasCasas: boolean;
  login: (credential: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  loginWithPassword: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (novaSenha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true, hasCasas: true,
  login: async () => ({ success: false }),
  loginWithPassword: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  logout: async () => {},
});

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') return '';
  return 'http://localhost:3000';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCasas, setHasCasas] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getBaseUrl()}/api/auth/me`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${getBaseUrl()}/trpc/casas.list`).then(r => r.json()),
    ]).then(([authData, casasData]) => {
      setUser(authData.user || null);
      const casasList = casasData?.result?.data || [];
      setHasCasas(casasList.length > 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const login = async (credential: string) => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (res.ok) { setUser(data.user); return { success: true }; }
      return { success: false, error: data.error, data };
    } catch { return { success: false, error: 'network_error' }; }
  };

  const loginWithPassword = async (email: string, senha: string) => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (res.ok) { setUser(data.user); return { success: true }; }
      return { success: false, error: data.error };
    } catch { return { success: false, error: 'Erro de conexão' }; }
  };

  const changePassword = async (novaSenha: string) => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ novaSenha }),
      });
      const data = await res.json();
      if (res.ok) { setUser(u => u ? { ...u, deveTrocarSenha: false } : null); return { success: true }; }
      return { success: false, error: data.error };
    } catch { return { success: false, error: 'Erro de conexão' }; }
  };

  const logout = async () => {
    await fetch(`${getBaseUrl()}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasCasas, login, loginWithPassword, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
