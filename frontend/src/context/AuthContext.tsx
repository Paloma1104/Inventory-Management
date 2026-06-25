import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authApi } from '../services/api';
import type { UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  name: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  register: (data: { name: string; email: string; password: string; confirm_password: string }) => Promise<UserRole>;
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
  const [role, setRole] = useState<UserRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('token');
    if ((storedRole === 'admin' || storedRole === 'user') && storedToken) {
      setToken(storedToken);
      setName(localStorage.getItem('name'));
      setRole(storedRole);
    } else if (storedToken) {
      clearAuthStorage();
    }
    setReady(true);
  }, []);

  const persistAuth = useCallback((accessToken: string, userName: string, userRole: UserRole) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('name', userName);
    setToken(accessToken);
    setName(userName);
    setRole(userRole);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    persistAuth(data.access_token, data.name, data.role);
    return data.role;
  }, [persistAuth]);

  const register = useCallback(async (formData: { name: string; email: string; password: string; confirm_password: string }) => {
    const { data } = await authApi.register(formData);
    persistAuth(data.access_token, data.name, data.role);
    return data.role;
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setName(null);
    setRole(null);
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider
      value={{
        token,
        name,
        role,
        isAuthenticated: !!token,
        isAdmin: role === 'admin',
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
