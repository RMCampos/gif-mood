import { createContext } from "react";
import type { AuthContextValue } from '../types/index.js';

export const AuthContext = createContext<AuthContextValue | null>(null);
