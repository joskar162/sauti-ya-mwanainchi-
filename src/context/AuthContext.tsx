import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import type { User } from '@/types';
import { firebaseAuth, requireFirebaseAuth } from '@/lib/firebase';

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

interface OversightAccount {
  uid: string;
  name: string;
  email: string;
  organization: string;
  organizationType: OversightRegistration['organizationType'];
  county: string;
  role: 'oversight';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'build-kenya-user';
const OVERSIGHT_PROFILE_KEY_PREFIX = 'build-kenya-oversight-profile:';

const oversightProfileKey = (uid: string) => `${OVERSIGHT_PROFILE_KEY_PREFIX}${uid}`;

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

const firebaseErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'Email or password is incorrect.';
    }
    if (code === 'auth/email-already-in-use') return 'An account already exists for this email.';
    if (code === 'auth/weak-password') return 'Use a stronger password for your account.';
    if (code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a while and try again.';
  }
  if (error instanceof Error) return error.message;
  return 'The Firebase request could not be completed.';
};

const oversightAccountFrom = (firebaseUser: FirebaseUser, record: OversightAccount): User => ({
  id: firebaseUser.uid,
  name: record.name,
  email: record.email,
  organization: record.organization,
  organizationType: record.organizationType,
  role: 'oversight',
  county: record.county
});

const isOversightAccount = (value: unknown): value is OversightAccount => {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.uid === 'string'
    && typeof record.name === 'string'
    && typeof record.email === 'string'
    && typeof record.organization === 'string'
    && (record.organizationType === 'NGO' || record.organizationType === 'Supervisor' || record.organizationType === 'Auditor-General')
    && typeof record.county === 'string'
    && record.role === 'oversight';
};

const readOversightAccount = (firebaseUser: FirebaseUser): User => {
  const key = oversightProfileKey(firebaseUser.uid);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const account: OversightAccount = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Funder',
      email: firebaseUser.email || '',
      organization: '',
      organizationType: 'NGO',
      county: 'Tharaka-Nithi',
      role: 'oversight'
    };
    localStorage.setItem(key, JSON.stringify(account));
    return oversightAccountFrom(firebaseUser, account);
  }

  let record: unknown;
  try {
    record = JSON.parse(stored);
  } catch {
    throw new Error('The saved oversight profile is invalid. Clear this browser profile and sign in again.');
  }
  if (!isOversightAccount(record) || record.uid !== firebaseUser.uid) {
    throw new Error('The saved oversight profile does not match this Firebase account.');
  }
  return oversightAccountFrom(firebaseUser, record);
};

const accountUser = (firebaseUser: FirebaseUser, role: 'admin'): User => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || 'System Administrator',
  email: firebaseUser.email || undefined,
  role
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readCitizenSession);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const authOperationInProgress = useRef(false);

  useEffect(() => {
    const auth = firebaseAuth;
    if (!auth) {
      setAuthError('Add the Firebase web app settings to .env to enable sign-in.');
      setIsLoading(false);
      return;
    }

    return onAuthStateChanged(auth, firebaseUser => {
      if (authOperationInProgress.current) return;
      if (!firebaseUser) {
        setUser(readCitizenSession());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      void (async () => {
        try {
          const token = await getIdTokenResult(firebaseUser);
          if (token.claims.admin === true) {
            setUser(accountUser(firebaseUser, 'admin'));
            setAuthError(null);
            return;
          }
          setUser(readOversightAccount(firebaseUser));
          setAuthError(null);
        } catch (error) {
          setUser(null);
          setAuthError(firebaseErrorMessage(error));
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error('Could not sign out a Firebase account without a valid profile:', signOutError);
          }
        } finally {
          setIsLoading(false);
        }
      })();
    });
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

  const signInWithRole = useCallback(async (email: string, password: string, role: 'oversight' | 'admin') => {
    setAuthError(null);
    setIsLoading(true);
    authOperationInProgress.current = true;
    try {
      const auth = requireFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await getIdTokenResult(credential.user, true);
      const isAdmin = token.claims.admin === true;
      if (role === 'admin') {
        if (!isAdmin) throw new Error('This Firebase account has not been granted administrator access.');
        setUser(accountUser(credential.user, 'admin'));
      } else {
        if (isAdmin) throw new Error('Use the separate administrator sign-in page for this account.');
        setUser(readOversightAccount(credential.user));
      }
    } catch (error) {
      if (firebaseAuth?.currentUser) {
        try {
          await signOut(firebaseAuth);
        } catch (signOutError) {
          console.error('Could not clear Firebase sign-in after a rejected login:', signOutError);
        }
      }
      setUser(readCitizenSession());
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      authOperationInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  const loginOversight = useCallback(
    (email: string, password: string) => signInWithRole(email, password, 'oversight'),
    [signInWithRole]
  );

  const loginAdmin = useCallback(
    (email: string, password: string) => signInWithRole(email, password, 'admin'),
    [signInWithRole]
  );

  const requestOversightAccount = useCallback(async (registration: OversightRegistration) => {
    setAuthError(null);
    setIsLoading(true);
    authOperationInProgress.current = true;
    let createdUser: FirebaseUser | null = null;
    let profileSaved = false;
    try {
      const auth = requireFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        registration.email.trim(),
        registration.password
      );
      createdUser = credential.user;
      await updateProfile(createdUser, { displayName: registration.name.trim() });
      const account: OversightAccount = {
        uid: createdUser.uid,
        name: registration.name.trim(),
        email: createdUser.email || registration.email.trim(),
        organization: registration.organization.trim(),
        organizationType: registration.organizationType,
        county: registration.county.trim() || 'Tharaka-Nithi',
        role: 'oversight'
      };
      localStorage.setItem(oversightProfileKey(createdUser.uid), JSON.stringify(account));
      profileSaved = true;
      setUser(oversightAccountFrom(createdUser, account));
    } catch (error) {
      if (createdUser && !profileSaved) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.error('Could not remove the Firebase account after its local profile could not be saved:', cleanupError);
          throw new Error('The profile could not be saved in this browser, and the new Firebase account could not be removed. Contact the administrator before retrying.');
        }
      }
      const message = firebaseErrorMessage(error);
      setAuthError(message);
      throw new Error(message);
    } finally {
      authOperationInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAuthError(null);
    localStorage.removeItem(STORAGE_KEY);
    if (firebaseAuth) {
      void signOut(firebaseAuth).catch(error => {
        console.error('Firebase sign-out failed:', error);
      });
    }
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
