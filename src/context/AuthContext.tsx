import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name?: string, county?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('build-kenya-user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('build-kenya-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('build-kenya-user');
    }
  }, [user]);

  const login = (role: UserRole, name?: string, county?: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name || (role === 'oversight' ? 'Oversight Officer' : 'Citizen'),
      role,
      county: county || 'Tharaka-Nithi'
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};