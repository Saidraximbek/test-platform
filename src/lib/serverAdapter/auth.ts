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
          admin: role === 'admin' || role === 'director' || role === 'root_owner',
          director: role === 'director' || role === 'root_owner',
          rootOwner: role === 'root_owner',
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

class SecondaryAuthState {
  currentUser: FirebaseUser | null = null;
  readonly isSecondary = true;

  setCurrentUser(user: FirebaseUser | null) {
    this.currentUser = user;
  }
}

const authInstance = new AuthState();
const secondaryAuthInstances = new Map<string, SecondaryAuthState>();

export const getAuth = (app?: any) => {
  if (app && app.name && app.name !== '[DEFAULT]') {
    if (!secondaryAuthInstances.has(app.name)) {
      secondaryAuthInstances.set(app.name, new SecondaryAuthState());
    }
    return secondaryAuthInstances.get(app.name)!;
  }
  return authInstance;
};

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
  auth: any,
  email: string,
  pass: string
): Promise<{ user: FirebaseUser }> {
  const res = await apiRequest<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });

  const newUser = createFirebaseUser(res.user);

  // If this is a secondary app or if there is already an active session (e.g. admin creating a user):
  // DO NOT overwrite the active session or token!
  const isSecondary = auth?.isSecondary || (auth && auth !== authInstance);
  const currentToken = getAuthToken();

  if (isSecondary || currentToken) {
    if (auth && typeof auth.setCurrentUser === 'function') {
      auth.setCurrentUser(newUser);
    }
    return { user: newUser };
  }

  setAuthToken(res.token);
  authInstance.setCurrentUser(newUser);
  return { user: newUser };
}

export async function signOut(auth: any): Promise<void> {
  const isSecondary = auth?.isSecondary || (auth && auth !== authInstance);
  if (isSecondary) {
    if (auth && typeof auth.setCurrentUser === 'function') {
      auth.setCurrentUser(null);
    }
    return;
  }

  setAuthToken(null);
  authInstance.setCurrentUser(null);
}

export function onAuthStateChanged(_auth: any, callback: AuthCallback): () => void {
  return authInstance.subscribe(callback);
}

export async function updatePassword(user: any, newPass: string): Promise<void> {
  const uid = user?.uid || authInstance.currentUser?.uid;
  if (!uid) throw new Error("Foydalanuvchi aniqlanmadi");
  await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ userId: uid, newPassword: newPass }),
  });
}

export type { FirebaseUser as User };
