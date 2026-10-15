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
  isRootOwner: boolean;
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
  const [isRootOwner, setIsRootOwner] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isTeacher, setIsTeacher] = useState<boolean>(false);
  const [isDirector, setIsDirector] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: any = null;

    const unsubscribeAuth = authService.onAuthChanged(async (fUser) => {
      // Clean up previous document listener if user changed or re-authenticated
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setFirebaseUser(fUser);
      if (fUser) {
        const isRootEmail = fUser.email?.toLowerCase() === "hacker@sm.sm";
        const cachedRole = typeof window !== "undefined" ? localStorage.getItem(`fargoniy_role_${fUser.uid}`) : null;
        let authoritativeRole: string = isRootEmail ? "root_owner" : (cachedRole || "user");

        // Check custom claims from Firebase Auth
        try {
          const tokenResult = await fUser.getIdTokenResult();
          const claims = tokenResult.claims;
          const claimRootOwner = claims.role === "root_owner" || claims.rootOwner === true || isRootEmail;
          const claimDirector = claims.role === "director" || claims.director === true || claimRootOwner;
          const claimAdmin = claims.admin === true || claims.role === "admin" || claimDirector;
          const claimTeacher = claims.role === "teacher";

          if (claimRootOwner) {
            authoritativeRole = "root_owner";
            setIsRootOwner(true);
            setIsDirector(true);
            setIsAdmin(true);
            setIsTeacher(false);
          } else if (claimDirector) {
            authoritativeRole = "director";
            setIsRootOwner(false);
            setIsDirector(true);
            setIsAdmin(true);
            setIsTeacher(false);
          } else if (claimAdmin) {
            authoritativeRole = "admin";
            setIsRootOwner(false);
            setIsDirector(false);
            setIsAdmin(true);
            setIsTeacher(false);
          } else if (claimTeacher) {
            authoritativeRole = "teacher";
            setIsRootOwner(false);
            setIsDirector(false);
            setIsAdmin(false);
            setIsTeacher(true);
          }
        } catch (e) {
          console.warn("Could not fetch token result:", e);
        }

        // Cache role if authoritative
        if (authoritativeRole && authoritativeRole !== "user" && typeof window !== "undefined") {
          localStorage.setItem(`fargoniy_role_${fUser.uid}`, authoritativeRole);
        }

        // Immediate non-destructive fallback so UI never shows blank/flicker
        setUser((prev) => {
          if (prev && prev.uid === fUser.uid) {
            const preservedRole = prev.role && prev.role !== "user" ? prev.role : authoritativeRole;
            return {
              ...prev,
              role: preservedRole as any,
            };
          }
          return {
            uid: fUser.uid,
            displayName: fUser.displayName || fUser.email?.split("@")[0] || "Foydalanuvchi",
            age: 18,
            phoneNumber: fUser.phoneNumber || "",
            educationPlace: "",
            isCenterStudent: false,
            photoURL: fUser.photoURL || null,
            role: authoritativeRole as any,
            status: "active",
            coinBalance: 0,
            totalCorrectAnswers: 0,
            testsCompleted: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActiveAt: new Date(),
          };
        });

        // Listen to User Profile doc with role preservation
        unsubscribeDoc = authService.listenUserDoc(fUser.uid, async (userDoc) => {
          if (!userDoc) {
            // Document might be loading or offline; DO NOT OVERWRITE THE DATABASE WITH A DEFAULT ROLE!
            try {
              const uSnap = await getDoc(doc(db, "users", fUser.uid));
              if (uSnap.exists()) {
                const fetchedDoc = uSnap.data() as UserProfile;
                applyProfileWithRole(fetchedDoc, fUser);
              }
            } catch (err) {
              console.warn("Could not fetch user document directly:", err);
            }
          } else {
            applyProfileWithRole(userDoc, fUser);
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setUser(null);
        setIsRootOwner(false);
        setIsAdmin(false);
        setIsTeacher(false);
        setIsDirector(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
    };
  }, []);

  const applyProfileWithRole = (userDoc: UserProfile, fUser: FirebaseUser) => {
    const isRootEmail = fUser.email?.toLowerCase() === "hacker@sm.sm";
    const cachedRole = typeof window !== "undefined" ? localStorage.getItem(`fargoniy_role_${fUser.uid}`) : null;

    // Preserve existing role: Never downgrade a higher role to "user" due to partial document or transient state
    let effectiveRole = userDoc.role;
    if (isRootEmail) {
      effectiveRole = "root_owner";
    } else if (!effectiveRole || effectiveRole === "user") {
      if (cachedRole && cachedRole !== "user") {
        effectiveRole = cachedRole as any;
      }
    }

    const mergedProfile: UserProfile = {
      ...userDoc,
      role: (effectiveRole || "user") as any,
    };

    if (typeof window !== "undefined" && effectiveRole && effectiveRole !== "user") {
      localStorage.setItem(`fargoniy_role_${fUser.uid}`, effectiveRole);
    }

    setUser(mergedProfile);

    const isAccountRestricted = mergedProfile.status === "blocked" || mergedProfile.status === "suspended";
    if (isAccountRestricted) {
      setIsRootOwner(false);
      setIsDirector(false);
      setIsAdmin(false);
      setIsTeacher(false);
    } else {
      if (effectiveRole === "root_owner" || mergedProfile.isProtectedRoot || isRootEmail) {
        setIsRootOwner(true);
        setIsDirector(true);
        setIsAdmin(true);
        setIsTeacher(false);
      } else if (effectiveRole === "director") {
        setIsRootOwner(false);
        setIsDirector(true);
        setIsAdmin(true);
        setIsTeacher(false);
      } else if (effectiveRole === "admin") {
        setIsRootOwner(false);
        setIsDirector(false);
        setIsAdmin(true);
        setIsTeacher(false);
      } else if (effectiveRole === "teacher") {
        setIsRootOwner(false);
        setIsDirector(false);
        setIsAdmin(false);
        setIsTeacher(true);
      } else {
        setIsRootOwner(false);
        setIsDirector(false);
        setIsAdmin(false);
        setIsTeacher(false);
      }
    }
  };

  const login = useCallback(async (email: string, pass: string) => {
    setError(null);
    try {
      const fUser = await authService.login(email, pass);
      const userProfile = await authService.getUserDoc(fUser.uid);
      if (userProfile && (userProfile.status === "blocked" || userProfile.status === "suspended")) {
        await authService.logout();
        const errMessage =
          userProfile.status === "blocked"
            ? "Ushbu hisob qoidabuzarlik sababli bloklangan."
            : "Ushbu hisob faoliyati vaqtincha to'xtatilgan.";
        throw new Error(errMessage);
      }

      setFirebaseUser(fUser);
      setUser(userProfile);

      const tokenResult = await fUser.getIdTokenResult();
      const claims = tokenResult.claims;
      const claimRootOwner = claims.role === "root_owner" || claims.rootOwner === true || userProfile?.role === "root_owner";
      const claimDirector = claims.role === "director" || claimRootOwner;
      const claimAdmin = claims.admin === true || claims.role === "admin" || claimDirector;
      const claimTeacher = claims.role === "teacher";

      if (userProfile?.status !== "blocked" && userProfile?.status !== "suspended") {
        if (claimRootOwner || userProfile?.role === "root_owner") {
          setIsRootOwner(true);
          setIsDirector(true);
          setIsAdmin(true);
        } else if (claimDirector || userProfile?.role === "director") {
          setIsDirector(true);
          setIsAdmin(true);
        } else if (claimAdmin || userProfile?.role === "admin") {
          setIsAdmin(true);
        } else if (claimTeacher || userProfile?.role === "teacher") {
          setIsTeacher(true);
        }
      }
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
    setIsRootOwner(false);
    setIsAdmin(false);
    setIsTeacher(false);
    setIsDirector(false);
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error("Foydalanuvchi tizimga kirmagan");
    await authService.updateProfile(firebaseUser.uid, data);
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, [firebaseUser]);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    const docData = await authService.getUserDoc(firebaseUser.uid);
    setUser(docData);
    const isRestricted = docData?.status === "blocked" || docData?.status === "suspended";
    if (isRestricted) {
      setIsRootOwner(false);
      setIsDirector(false);
      setIsAdmin(false);
      setIsTeacher(false);
    } else {
      if (docData?.role === "root_owner" || docData?.isProtectedRoot) {
        setIsRootOwner(true);
        setIsDirector(true);
        setIsAdmin(true);
      } else if (docData?.role === "director") {
        setIsDirector(true);
        setIsAdmin(true);
      } else if (docData?.role === "admin") {
        setIsAdmin(true);
      } else if (docData?.role === "teacher") {
        setIsTeacher(true);
      }
    }
  }, [firebaseUser]);

  const isSuspended = user?.status === "suspended";
  const isBlocked = user?.status === "blocked";
  const isRootEmail = firebaseUser?.email?.toLowerCase() === "hacker@sm.sm";
  const effectiveIsRootOwner = !isBlocked && !isSuspended && (isRootOwner || user?.role === "root_owner" || user?.isProtectedRoot || isRootEmail);
  const effectiveIsDirector = !isBlocked && !isSuspended && (isDirector || effectiveIsRootOwner || user?.role === "director");
  const effectiveIsAdmin = !isBlocked && !isSuspended && (isAdmin || effectiveIsDirector || user?.role === "admin");
  const effectiveIsTeacher = !isBlocked && !isSuspended && (isTeacher || user?.role === "teacher");
  const isStudent = !effectiveIsRootOwner && !effectiveIsDirector && !effectiveIsAdmin && !effectiveIsTeacher;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      isRootOwner: effectiveIsRootOwner,
      isAdmin: effectiveIsAdmin,
      isTeacher: effectiveIsTeacher,
      isDirector: effectiveIsDirector,
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
      effectiveIsRootOwner,
      effectiveIsAdmin,
      effectiveIsTeacher,
      effectiveIsDirector,
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
