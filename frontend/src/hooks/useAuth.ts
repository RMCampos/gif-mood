import { useContext } from 'react';
import { AuthContextValue } from '../types';
import { AuthContext } from '../context/AuthContextInstance';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
