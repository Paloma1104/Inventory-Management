import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  token: string | null;
  name: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirm_password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('token');
    if (storedRole === 'admin' && storedToken) {
      setToken(storedToken);
      setName(localStorage.getItem('name'));
    } else if (storedToken) {
      clearAuthStorage();
    }
    setReady(true);
  }, []);

  const persistAuth = useCallback((accessToken: string, userName: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('role', 'admin');
    localStorage.setItem('name', userName);
    setToken(accessToken);
    setName(userName);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    if (data.role !== 'admin') {
      throw new Error('Access Denied');
    }
    persistAuth(data.access_token, data.name);
  }, [persistAuth]);

  const register = useCallback(async (formData: { name: string; email: string; password: string; confirm_password: string }) => {
    const { data } = await authApi.register(formData);
    if (data.role !== 'admin') {
      throw new Error('Access Denied');
    }
    persistAuth(data.access_token, data.name);
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setName(null);
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider
      value={{
        token,
        name,
        isAuthenticated: !!token,
        isAdmin: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
