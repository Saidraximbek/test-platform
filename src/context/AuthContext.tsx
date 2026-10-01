import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { authService } from "../services/authService";
import { UserProfile } from "../types";
import { getErrorMessage } from "../utils";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isDirector: boolean;
  isStudent: boolean;
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
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [isDirector, setIsDirector] = useState<boolean>(false);
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
          const tokenResult = await fUser.getIdTokenResult();
          const claims = tokenResult.claims;
          const claimDirector = claims.role === "director";
          const claimAdmin = claims.admin === true || claims.role === "admin" || claimDirector;
          const claimTeacher = claims.role === "teacher";

          if (claimDirector) setIsDirector(true);
          if (claimAdmin) setIsAdmin(true);
          if (claimTeacher) setIsTeacher(true);
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
                let existingProfile: UserProfile | null = null;
                if (fUser.email) {
                  try {
                    const qE = query(collection(db, "users"), where("email", "==", fUser.email));
                    const snapE = await getDocs(qE);
                    if (!snapE.empty) {
                      existingProfile = snapE.docs[0].data() as UserProfile;
                    }
                  } catch {}
                }

                const fallbackProfile: UserProfile = {
                  uid: fUser.uid,
                  displayName: existingProfile?.displayName || fUser.displayName || fUser.email?.split("@")[0] || "Foydalanuvchi",
                  age: existingProfile?.age || 18,
                  phoneNumber: existingProfile?.phoneNumber || fUser.phoneNumber || "",
                  educationPlace: existingProfile?.educationPlace || "",
                  isCenterStudent: existingProfile?.isCenterStudent || false,
                  photoURL: fUser.photoURL || null,
                  role: existingProfile?.role || "user",
                  status: existingProfile?.status || "active",
                  coinBalance: existingProfile?.coinBalance || 0,
                  totalCorrectAnswers: existingProfile?.totalCorrectAnswers || 0,
                  testsCompleted: existingProfile?.testsCompleted || 0,
                  teachingGroups: existingProfile?.teachingGroups || [],
                  enrolledGroups: existingProfile?.enrolledGroups || [],
                  groupIds: existingProfile?.groupIds || [],
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  lastActiveAt: serverTimestamp(),
                };
                await setDoc(doc(db, "users", fUser.uid), fallbackProfile, { merge: true });
                setUser(fallbackProfile);
                if (fallbackProfile.role === "director") {
                  setIsDirector(true);
                  setIsAdmin(true);
                } else if (fallbackProfile.role === "admin") {
                  setIsAdmin(true);
                } else if (fallbackProfile.role === "teacher") {
                  setIsTeacher(true);
                }
              }
            } catch (e) {
              console.warn("Could not create fallback user doc:", e);
            }
          } else {
            setUser(userDoc);
            if (userDoc.role === "director") {
              setIsDirector(true);
              setIsAdmin(true);
            } else if (userDoc.role === "admin") {
              setIsAdmin(true);
            } else if (userDoc.role === "teacher") {
              setIsTeacher(true);
            }
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUser(null);
        setIsAdmin(false);
        setIsTeacher(false);
        setIsDirector(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setError(null);
    try {
      const fUser = await authService.login(email, pass);
      setFirebaseUser(fUser);
      const tokenResult = await fUser.getIdTokenResult();
      const claims = tokenResult.claims;
      const claimDirector = claims.role === "director";
      const claimAdmin = claims.admin === true || claims.role === "admin" || claimDirector;
      const claimTeacher = claims.role === "teacher";

      if (claimDirector) setIsDirector(true);
      if (claimAdmin) setIsAdmin(true);
      if (claimTeacher) setIsTeacher(true);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, pass: string, profile: any) => {
    setError(null);
    try {
      const fUser = await authService.register(email, pass, profile);
      setFirebaseUser(fUser);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setFirebaseUser(null);
    setIsAdmin(false);
    setIsTeacher(false);
    setIsDirector(false);
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error("Foydalanuvchi tizimga kirmagan");
    await authService.updateProfile(firebaseUser.uid, data);
  }, [firebaseUser]);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    const docData = await authService.getUserDoc(firebaseUser.uid);
    setUser(docData);
    if (docData?.role === "director") {
      setIsDirector(true);
      setIsAdmin(true);
    } else if (docData?.role === "admin") {
      setIsAdmin(true);
    } else if (docData?.role === "teacher") {
      setIsTeacher(true);
    }
  }, [firebaseUser]);

  const isSuspended = user?.status === "suspended";
  const isBlocked = user?.status === "blocked";
  const isStudent = !isAdmin && !isTeacher && !isDirector;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      isAdmin,
      isTeacher,
      isDirector,
      isStudent,
      isSuspended,
      isBlocked,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    }),
    [
      firebaseUser,
      user,
      isAdmin,
      isTeacher,
      isDirector,
      isStudent,
      isSuspended,
      isBlocked,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
