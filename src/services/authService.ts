import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";

export const authService = {
  async login(emailOrLogin: string, pass: string) {
    const trimmed = emailOrLogin.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      // User entered a plain login/username without domain
      try {
        const cred = await signInWithEmailAndPassword(auth, `${trimmed}@fargoniy.uz`, pass);
        return cred.user;
      } catch (err: any) {
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/invalid-credential" ||
          err.code === "auth/invalid-email"
        ) {
          try {
            const cred2 = await signInWithEmailAndPassword(auth, `${trimmed}@tillo.uz`, pass);
            return cred2.user;
          } catch (e2) {
            // fallback
          }
        }
        throw err;
      }
    }
    const cred = await signInWithEmailAndPassword(auth, trimmed, pass);
    return cred.user;
  },

  async register(
    email: string,
    pass: string,
    profile: {
      displayName: string;
      age: number;
      phoneNumber: string;
      educationPlace: string;
      isCenterStudent: boolean;
    }
  ) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = cred.user.uid;

    const userProfile: UserProfile = {
      uid,
      displayName: profile.displayName,
      age: profile.age,
      phoneNumber: profile.phoneNumber,
      educationPlace: profile.educationPlace,
      isCenterStudent: profile.isCenterStudent,
      photoURL: null,
      role: "user",
      status: "active",
      coinBalance: 0,
      totalCorrectAnswers: 0,
      testsCompleted: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", uid), userProfile);
    return cred.user;
  },

  async logout() {
    await signOut(auth);
  },

  async getUserDoc(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  },

  async updateProfile(uid: string, data: Partial<UserProfile>) {
    // Only safe profile fields allowed
    const safeData = {
      displayName: data.displayName,
      age: data.age,
      phoneNumber: data.phoneNumber,
      educationPlace: data.educationPlace,
      isCenterStudent: data.isCenterStudent,
      photoURL: data.photoURL,
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };
    await updateDoc(doc(db, "users", uid), safeData);
  },

  onAuthChanged(cb: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, cb);
  },

  listenUserDoc(uid: string, cb: (user: UserProfile | null) => void) {
    return onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        cb(snap.data() as UserProfile);
      } else {
        cb(null);
      }
    });
  },
};
