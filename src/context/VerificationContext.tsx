import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface VerificationContextType {
  unverifiedProjects: Set<string>;
  isVerified: (projectId: string) => boolean;
  markVerified: (projectId: string) => void;
  markUnverified: (projectId: string) => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

const STORAGE_KEY = 'build-kenya-verified-projects';

export const VerificationProvider = ({ children }: { children: ReactNode }) => {
  const [unverifiedProjects, setUnverifiedProjects] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unverifiedProjects]));
  }, [unverifiedProjects]);

  const isVerified = (projectId: string) => {
    return !unverifiedProjects.has(projectId);
  };

  const markVerified = (projectId: string) => {
    setUnverifiedProjects(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  const markUnverified = (projectId: string) => {
    setUnverifiedProjects(prev => {
      const next = new Set(prev);
      next.add(projectId);
      return next;
    });
  };

  return (
    <VerificationContext.Provider value={{ unverifiedProjects, isVerified, markVerified, markUnverified }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};