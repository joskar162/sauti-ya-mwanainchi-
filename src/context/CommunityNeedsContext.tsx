import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { CommunityNeed } from '@/types';
import { communityNeeds as initialNeeds } from '@/data/projects';

interface CommunityNeedsContextType {
  needs: CommunityNeed[];
  addNeed: (need: Omit<CommunityNeed, 'id' | 'submittedAt' | 'status'>) => void;
  expressInterest: (needId: string, funderName: string) => void;
}

const CommunityNeedsContext = createContext<CommunityNeedsContextType | undefined>(undefined);

const STORAGE_KEY = 'build-kenya-community-needs';

export const CommunityNeedsProvider = ({ children }: { children: ReactNode }) => {
  const [needs, setNeeds] = useState<CommunityNeed[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return [...initialNeeds, ...parsed];
      } catch {
        return initialNeeds;
      }
    }
    return initialNeeds;
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let parsed: CommunityNeed[] = [];
    if (stored) {
      try {
        parsed = JSON.parse(stored);
      } catch {
        parsed = [];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }, [needs]);

  const addNeed = (needData: Omit<CommunityNeed, 'id' | 'submittedAt' | 'status'>) => {
    const newNeed: CommunityNeed = {
      ...needData,
      id: `need-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'New'
    };
    setNeeds(prev => [newNeed, ...prev]);
  };

  const expressInterest = (needId: string, funderName: string) => {
    setNeeds(prev => prev.map(n => {
      if (n.id === needId) {
        const interested = (n as any).interestedFunders || [];
        if (!interested.includes(funderName)) {
          return { ...n, interestedFunders: [...interested, funderName] };
        }
      }
      return n;
    }));
  };

  return (
    <CommunityNeedsContext.Provider value={{ needs, addNeed, expressInterest }}>
      {children}
    </CommunityNeedsContext.Provider>
  );
};

export const useCommunityNeeds = () => {
  const context = useContext(CommunityNeedsContext);
  if (!context) {
    throw new Error('useCommunityNeeds must be used within a CommunityNeedsProvider');
  }
  return context;
};