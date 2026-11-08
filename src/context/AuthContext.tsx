import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id: string;
  role_name?: Role;
  country?: 'AR' | 'CL' | 'ES' | 'NL' | 'US';
  locale?: 'es-AR' | 'es-CL' | 'es-ES' | 'nl-NL' | 'en-US';
  client_id: string | null;
  document_type?: string | null;
  document_number?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: {
    address?: string | null;
    city?: string | null;
    province?: string | null;
    zone?: string | null;
    postal_code?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    zone?: string;
    postal_code?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  savingProfile: boolean;
  setUserRegion: (country: NonNullable<User['country']>, locale: NonNullable<User['locale']>) => void;
}

export interface RegisterData {
  country: NonNullable<User['country']>;
  email: string;
  password: string;
  full_name: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
  role?: string;
  type?: 'particular' | 'enterprise';
  corporate_name?: string;
  trade_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  billing_email?: string;
  address?: string;
  city?: string;
  province?: string;
  zone?: string;
  postal_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_MARKER_KEY = 'doctor-tech-session';

let accessToken: string | null = null;

export function getAuthToken(): string | null {
  return accessToken;
}

export function setAuthToken(token: string | null) {
  accessToken = token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const setUserRegion = useCallback((country: NonNullable<User['country']>, locale: NonNullable<User['locale']>) => {
    setUser((current) => current ? { ...current, country, locale } : current);
  }, []);
  const restoreStarted = useRef(false);

  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    const restoreSession = async () => {
      try {
        if (localStorage.getItem(SESSION_MARKER_KEY) !== 'active') return;
        const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (!response.ok) {
          localStorage.removeItem(SESSION_MARKER_KEY);
          return;
        }
        const data = await response.json();
        const authData = data.data || data;
        setAuthToken(authData.accessToken || null);
        setUser(authData.user || null);
      } catch {
        // Keep the session marker so a later reload can retry after a network outage.
      } finally {
        setLoading(false);
      }
    };
    void restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.error || data.message || 'Error al iniciar sesión' };
      }
      const authData = data.data || data;
      setAuthToken(authData.accessToken || authData.token || null);
      setUser(authData.user);
      localStorage.setItem(SESSION_MARKER_KEY, 'active');
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error de conexión.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        credentials: 'include',
      });
    } catch { /* ignore */ }
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(SESSION_MARKER_KEY);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.error || result.message || 'Error al registrarse.' };
      }
      return { success: true, message: result.message || 'Registro exitoso. Inicia sesión con tus credenciales.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error de conexión.' };
    }
  }, []);

  const updateProfile = useCallback(async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    zone?: string;
    postal_code?: string;
  }) => {
    try {
      setSavingProfile(true);
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, message: result.error || result.message || 'Error al actualizar perfil.' };
      }
      // Actualizar usuario local
      const updatedUser = result.data?.user || result.user;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return { success: true, message: result.message || 'Perfil actualizado exitosamente.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error de conexión.' };
    } finally {
      setSavingProfile(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile, savingProfile, setUserRegion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export type Role = 'particular' | 'enterprise' | 'technician' | 'supervisor' | 'marketing' | 'admin';

export function useRole(): Role | null {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role_name) return user.role_name;
  const map: Record<string, Role> = {
    'role_particular': 'particular',
    'role_enterprise': 'enterprise',
    'role_technician': 'technician',
    'role_supervisor': 'supervisor',
    'role_marketing': 'marketing',
    'role_admin': 'admin',
  };
  return map[user.role_id] || null;
}

export function useIsClient(): boolean {
  const role = useRole();
  return role === 'particular' || role === 'enterprise';
}

export function useIsTechnician(): boolean {
  return useRole() === 'technician';
}

export function useIsSupervisor(): boolean {
  return useRole() === 'supervisor';
}

export function useIsAdmin(): boolean {
  return useRole() === 'admin';
}

export function useHasAccess(...roles: Role[]): boolean {
  const current = useRole();
  return current !== null && roles.includes(current);
}
