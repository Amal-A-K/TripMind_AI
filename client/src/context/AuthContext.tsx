import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { User, AuthState, LoginPayload, RegisterPayload } from '@/types';
import { authService } from '@/services/authService';

// ─── Actions ──────────────────────────────────────────────────
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

// ─── Reducer ──────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('tripmind_token'),
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false, token: null };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('tripmind_token');
    const userRaw = localStorage.getItem('tripmind_user');
    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // NOTE: Do NOT dispatch SET_LOADING here — that flag is only for the
  // initial app-boot rehydration check. Toggling it during login causes
  // AuthLayout to unmount the Login form (erasing its local error state).
  // Login.tsx manages its own local isLoading for the spinner.
  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    localStorage.setItem('tripmind_token', res.token);
    localStorage.setItem('tripmind_user', JSON.stringify(res.user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user: res.user, token: res.token } });
    // Errors propagate naturally to Login.tsx's catch block
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    localStorage.setItem('tripmind_token', res.token);
    localStorage.setItem('tripmind_user', JSON.stringify(res.user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user: res.user, token: res.token } });
    // Errors propagate naturally to Register.tsx's catch block
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
