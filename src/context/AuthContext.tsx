import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { authService } from "../services/authService";
import { UserProfile } from "../types";
import { getErrorMessage } from "../utils";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  isAdmin: boolean;
  isSuspended: boolean;
  isBlocked: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, profile: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = authService.onAuthChanged(async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        // Immediate fallback so UI never shows "Kirish" while document loads
        setUser((prev) => prev || {
          uid: fUser.uid,
          displayName: fUser.displayName || fUser.email?.split("@")[0] || "Foydalanuvchi",
          age: 18,
          phoneNumber: fUser.phoneNumber || "",
          educationPlace: "",
          isCenterStudent: false,
          photoURL: fUser.photoURL || null,
          role: "user",
          status: "active",
          coinBalance: 0,
          totalCorrectAnswers: 0,
          testsCompleted: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: new Date(),
        });

        // Check custom claims
        try {
          const tokenResult = await fUser.getIdTokenResult(true);
          const claimAdmin = tokenResult.claims.admin === true || tokenResult.claims.role === "admin";
          if (claimAdmin) setIsAdmin(true);
        } catch (e) {
          console.warn("Could not fetch token result:", e);
        }

        // Listen to User Profile doc
        unsubscribeDoc = authService.listenUserDoc(fUser.uid, async (userDoc) => {
          if (!userDoc) {
            // Auto-heal missing firestore profile
            try {
              const uSnap = await getDoc(doc(db, "users", fUser.uid));
              if (!uSnap.exists()) {
                const fallbackProfile: UserProfile = {
                  uid: fUser.uid,
                  displayName: fUser.displayName || fUser.email?.split("@")[0] || "Foydalanuvchi",
                  age: 18,
                  phoneNumber: fUser.phoneNumber || "",
                  educationPlace: "",
                  isCenterStudent: false,
                  photoURL: fUser.photoURL || null,
                  role: "user",
                  status: "active",
                  coinBalance: 0,
                  totalCorrectAnswers: 0,
                  testsCompleted: 0,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  lastActiveAt: serverTimestamp(),
                };
                await setDoc(doc(db, "users", fUser.uid), fallbackProfile, { merge: true });
                setUser(fallbackProfile);
              }
            } catch (e) {
              console.warn("Could not create fallback user doc:", e);
            }
          } else {
            setUser(userDoc);
            if (userDoc.role === "admin") {
              setIsAdmin(true);
            }
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const fUser = await authService.login(email, pass);
      setFirebaseUser(fUser);
      const tokenResult = await fUser.getIdTokenResult(true);
      if (tokenResult.claims.admin === true || tokenResult.claims.role === "admin") {
        setIsAdmin(true);
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    }
  };

  const register = async (email: string, pass: string, profile: any) => {
    setError(null);
    try {
      const fUser = await authService.register(email, pass, profile);
      setFirebaseUser(fUser);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setFirebaseUser(null);
    setIsAdmin(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error("Foydalanuvchi tizimga kirmagan");
    await authService.updateProfile(firebaseUser.uid, data);
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    const docData = await authService.getUserDoc(firebaseUser.uid);
    setUser(docData);
  };

  const isSuspended = user?.status === "suspended";
  const isBlocked = user?.status === "blocked";

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        isAdmin,
        isSuspended,
        isBlocked,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
