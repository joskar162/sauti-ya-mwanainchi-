import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types';

export interface OversightRegistration {
  name: string;
  email: string;
  password: string;
  organization: string;
  organizationType: 'NGO' | 'Supervisor' | 'Auditor-General';
  county: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  loginCitizen: (name: string, county: string) => void;
  loginOversight: (email: string, password: string) => Promise<void>;
  requestOversightAccount: (registration: OversightRegistration) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  user?: User;
  message?: string;
  error?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'build-kenya-user';

const readCitizenSession = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const user = JSON.parse(stored) as User;
    if (user.role === 'citizen') return user;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  localStorage.removeItem(STORAGE_KEY);
  return null;
};

const sendAuthRequest = async (path: string, body?: unknown): Promise<AuthResponse> => {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json() as AuthResponse;
  if (!response.ok) throw new Error(result.error || 'The authentication request failed.');
  return result;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readCitizenSession);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const restoreServerSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const result = await response.json() as { user: User };
          if (active) setUser(result.user);
        } else if (response.status !== 401) {
          const result = await response.json() as AuthResponse;
          if (active) setAuthError(result.error || 'Could not restore your sign-in session.');
        }
      } catch {
        if (active) setAuthError('The account service is unavailable. Try again when it is running.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restoreServerSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (user?.role === 'citizen') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const loginCitizen = useCallback((name: string, county: string) => {
    setAuthError(null);
    setUser({
      id: `citizen-${Date.now()}`,
      name: name.trim() || 'Citizen',
      role: 'citizen',
      county: county.trim() || 'Tharaka-Nithi'
    });
  }, []);

  const loginOversight = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const result = await sendAuthRequest('/api/auth/login', { email, password });
    if (!result.user || result.user.role !== 'oversight') {
      throw new Error('This sign-in is for approved oversight and funder accounts.');
    }
    setUser(result.user);
  }, []);

  const requestOversightAccount = useCallback(async (registration: OversightRegistration) => {
    setAuthError(null);
    await sendAuthRequest('/api/auth/register', registration);
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const result = await sendAuthRequest('/api/admin/login', { email, password });
    if (!result.user || result.user.role !== 'admin') {
      throw new Error('Administrator access is only available to configured system administrators.');
    }
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).then(response => {
      if (!response.ok) throw new Error('The server could not end the session.');
    }).catch(error => {
      console.error('Sign-out request failed:', error);
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      authError,
      loginCitizen,
      loginOversight,
      requestOversightAccount,
      loginAdmin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
