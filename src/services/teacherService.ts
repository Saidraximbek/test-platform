import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../lib/firebase";
import { UserProfile } from "../types";

export interface CreateTeacherInput {
  displayName: string;
  loginOrEmail?: string;
  login?: string;
  password?: string;
  phoneNumber: string;
  specialty: string;
  subjectIds?: string[];
  salaryType?: "fixed" | "percentage" | "mixed";
  salaryValue?: number;
  educationPlace?: string;
}

let teachersMemCache: { data: UserProfile[]; time: number } | null = null;

export function invalidateTeachersCache(): void {
  teachersMemCache = null;
}

export const teacherService = {
  invalidateTeachersCache,

  async getAllTeachers(): Promise<UserProfile[]> {
    if (teachersMemCache && Date.now() - teachersMemCache.time < 45000) {
      return teachersMemCache.data;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "teacher"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, uid: data.uid || d.id } as UserProfile;
      });
      if (list.length > 0) {
        teachersMemCache = { data: list, time: Date.now() };
        return list;
      }
    } catch {}

    try {
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      return snap.docs
        .map((d) => {
          const data = d.data();
          return { ...data, uid: data.uid || d.id } as UserProfile;
        })
        .filter((u) => u.role === "teacher");
    } catch {
      return [];
    }
  },

  async getTeacherById(teacherId: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", teacherId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { ...data, uid: data.uid || snap.id } as UserProfile;
  },

  async createTeacher(input: CreateTeacherInput): Promise<UserProfile> {
    const identifier = input.loginOrEmail || input.login || "";
    const rawLogin = identifier.trim().toLowerCase();
    const email = rawLogin.includes("@") ? rawLogin : `${rawLogin}@fargoniy.uz`;
    const password = input.password && input.password.length >= 6 ? input.password : "teacher123";

    let uid = `teacher_${Date.now()}`;

    // Attempt to register in Firebase Auth via isolated secondary app so current admin session is not lost
    try {
      const secondaryAppName = "TeacherCreatorApp";
      let secApp;
      const existingApps = getApps();
      const found = existingApps.find((a) => a.name === secondaryAppName);
      if (found) {
        secApp = found;
      } else {
        secApp = initializeApp(firebaseConfig, secondaryAppName);
      }
      const secAuth = getAuth(secApp);
      const userCred = await createUserWithEmailAndPassword(secAuth, email, password);
      uid = userCred.user.uid;
      // Immediately sign out from secondary app
      await signOut(secAuth);
    } catch (authErr: any) {
      console.warn("Auth creation error (fallback to Firestore document):", authErr);
      // If error is email-already-in-use, user might already exist
      if (authErr.code === "auth/email-already-in-use") {
        // Find existing user by email
        const qExisting = query(collection(db, "users"), where("email", "==", email));
        const exSnap = await getDocs(qExisting);
        if (!exSnap.empty) {
          uid = exSnap.docs[0].id;
        }
      }
    }

    const teacherDoc: UserProfile = {
      uid,
      displayName: input.displayName.trim(),
      email,
      phoneNumber: input.phoneNumber.trim(),
      role: "teacher",
      status: "active",
      specialty: input.specialty.trim(),
      subjectIds: input.subjectIds || [],
      salaryType: input.salaryType || "percentage",
      salaryValue: input.salaryValue || 50,
      educationPlace: input.educationPlace || "Farg'oniy Maktabi O'qituvchisi",
      isCenterStudent: false,
      photoURL: null,
      coinBalance: 0,
      totalCorrectAnswers: 0,
      testsCompleted: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", uid), teacherDoc, { merge: true });
    teachersMemCache = null;
    return teacherDoc;
  },

  async updateTeacher(teacherId: string, data: Partial<UserProfile>): Promise<void> {
    const ref = doc(db, "users", teacherId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    teachersMemCache = null;
  },

  async setTeacherStatus(teacherId: string, status: "active" | "blocked" | "suspended"): Promise<void> {
    const ref = doc(db, "users", teacherId);
    await updateDoc(ref, {
      status,
      updatedAt: serverTimestamp(),
    });
    teachersMemCache = null;
  },
};
