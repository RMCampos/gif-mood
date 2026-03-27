import { useState, useCallback, ReactNode } from 'react';
import { JwtPayload } from '../types/index.js';
import { AuthContext } from './AuthContextInstance.js';

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem('token');
    if (!stored) return null;
    const payload = decodeJwt(stored);
    if (!payload || isTokenExpired(payload)) {
      localStorage.removeItem('token');
      return null;
    }
    return stored;
  });

  const [user, setUser] = useState<JwtPayload | null>(() => {
    const stored = localStorage.getItem('token');
    if (!stored) return null;
    const payload = decodeJwt(stored);
    if (!payload || isTokenExpired(payload)) return null;
    return payload;
  });

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeJwt(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
