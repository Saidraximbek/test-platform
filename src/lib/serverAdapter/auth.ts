import { apiRequest, setAuthToken, getAuthToken } from './client';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<{
    token: string;
    claims: {
      role?: string;
      admin?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  }>;
}

export function createFirebaseUser(u: any): FirebaseUser {
  const uid = u.uid || u._id || '';
  const role = u.role || 'user';
  return {
    uid,
    email: u.email || null,
    displayName: u.displayName || null,
    phoneNumber: u.phoneNumber || null,
    photoURL: u.photoURL || null,
    getIdToken: async () => getAuthToken() || '',
    getIdTokenResult: async () => {
      const token = getAuthToken() || '';
      return {
        token,
        claims: {
          role,
          admin: role === 'admin' || role === 'director',
        },
        authTime: new Date().toISOString(),
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        signInProvider: 'password',
        signInSecondFactor: null,
      };
    },
  };
}

type AuthCallback = (user: FirebaseUser | null) => void;

class AuthState {
  currentUser: FirebaseUser | null = null;
  private listeners: AuthCallback[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;
    const token = getAuthToken();
    if (token) {
      try {
        const user = await apiRequest<any>('/auth/me');
        if (user && (user.uid || user._id)) {
          this.currentUser = createFirebaseUser(user);
        } else {
          setAuthToken(null);
          this.currentUser = null;
        }
      } catch (e) {
        setAuthToken(null);
        this.currentUser = null;
      }
    }
    this.initialized = true;
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error('Auth state change listener error:', e);
      }
    });
  }

  subscribe(cb: AuthCallback): () => void {
    this.listeners.push(cb);
    if (this.initialized) {
      cb(this.currentUser);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  setCurrentUser(user: FirebaseUser | null) {
    this.currentUser = user;
    this.notify();
  }
}

const authInstance = new AuthState();

export const getAuth = (_app?: any) => authInstance;
export const connectAuthEmulator = () => {};

export async function signInWithEmailAndPassword(
  _auth: any,
  emailOrLogin: string,
  pass: string
): Promise<{ user: FirebaseUser }> {
  const res = await apiRequest<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrLogin, password: pass }),
  });

  setAuthToken(res.token);
  const user = createFirebaseUser(res.user);
  authInstance.setCurrentUser(user);
  return { user };
}

export async function createUserWithEmailAndPassword(
  _auth: any,
  email: string,
  pass: string
): Promise<{ user: FirebaseUser }> {
  const res = await apiRequest<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });

  setAuthToken(res.token);
  const user = createFirebaseUser(res.user);
  authInstance.setCurrentUser(user);
  return { user };
}

export async function signOut(_auth: any): Promise<void> {
  setAuthToken(null);
  authInstance.setCurrentUser(null);
}

export function onAuthStateChanged(_auth: any, callback: AuthCallback): () => void {
  return authInstance.subscribe(callback);
}

export type { FirebaseUser as User };
