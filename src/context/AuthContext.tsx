import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from '@/types';
import { firebaseAuth, firestore, requireFirebase } from '@/lib/firebase';

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

interface AccountRequest {
  uid: string;
  name: string;
  email: string;
  organization: string;
  organizationType: OversightRegistration['organizationType'];
  county: string;
  role: 'oversight';
  approvalStatus: 'pending' | 'approved' | 'rejected';
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

const firebaseErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'Email or password is incorrect.';
    }
    if (code === 'auth/email-already-in-use') return 'An account already exists for this email.';
    if (code === 'auth/weak-password') return 'Use a stronger password for your account.';
    if (code === 'permission-denied') return 'Firestore denied this request. Check that the supplied Firestore rules are deployed.';
    if (code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a while and try again.';
  }
  if (error instanceof Error) return error.message;
  return 'The Firebase request could not be completed.';
};

const accountRequestFrom = (firebaseUser: FirebaseUser, record: AccountRequest): User => ({
  id: firebaseUser.uid,
  name: record.name,
  email: record.email,
  organization: record.organization,
  organizationType: record.organizationType,
  role: 'oversight',
  county: record.county
});

const readApprovedAccount = async (firebaseUser: FirebaseUser): Promise<User> => {
  const { db } = requireFirebase();
  const accountSnapshot = await getDoc(doc(db, 'accountRequests', firebaseUser.uid));
  if (!accountSnapshot.exists()) {
    throw new Error('No oversight access request was found for this Firebase account.');
  }
  const record = accountSnapshot.data() as AccountRequest;
  if (record.approvalStatus === 'pending') {
    throw new Error('Your account request is awaiting administrator approval.');
  }
  if (record.approvalStatus !== 'approved') {
    throw new Error('Your account request was not approved. Contact your organization administrator.');
  }
  if (record.role !== 'oversight') {
    throw new Error('This account does not have oversight access.');
  }
  return accountRequestFrom(firebaseUser, record);
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
    if (!auth || !firestore) {
      setAuthError('Add the Firebase web app settings to .env to enable organization and administrator sign-in.');
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
          setUser(await readApprovedAccount(firebaseUser));
          setAuthError(null);
        } catch (error) {
          setUser(null);
          setAuthError(firebaseErrorMessage(error));
          try {
            await signOut(auth);
          } catch (signOutError) {
            console.error('Could not sign out an unapproved Firebase account:', signOutError);
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
      const { auth } = requireFirebase();
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const token = await getIdTokenResult(credential.user, true);
      const isAdmin = token.claims.admin === true;
      if (role === 'admin') {
        if (!isAdmin) throw new Error('This Firebase account has not been granted administrator access.');
        setUser(accountUser(credential.user, 'admin'));
      } else {
        if (isAdmin) throw new Error('Use the separate administrator sign-in page for this account.');
        setUser(await readApprovedAccount(credential.user));
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
    let requestSaved = false;
    try {
      const { auth, db } = requireFirebase();
      const credential = await createUserWithEmailAndPassword(
        auth,
        registration.email.trim(),
        registration.password
      );
      createdUser = credential.user;
      await setDoc(doc(db, 'accountRequests', createdUser.uid), {
        uid: createdUser.uid,
        name: registration.name.trim(),
        email: createdUser.email || registration.email.trim(),
        organization: registration.organization.trim(),
        organizationType: registration.organizationType,
        county: registration.county.trim() || 'Tharaka-Nithi',
        role: 'oversight',
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null
      });
      requestSaved = true;
      await signOut(auth);
      setUser(readCitizenSession());
    } catch (error) {
      if (createdUser && !requestSaved) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.error('Could not remove the Firebase account after its Firestore request failed:', cleanupError);
          throw new Error('The request could not be saved to Firestore, and the new Firebase account could not be removed. Contact the administrator before retrying.');
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
