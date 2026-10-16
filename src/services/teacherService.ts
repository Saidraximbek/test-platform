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
    try {
      const ref = doc(db, "users", teacherId);
      await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      console.warn("updateTeacher Firestore warning:", err?.message);
    }
    teachersMemCache = null;

    // If salary rates were updated, also synchronize current month's teacher salary cache and dispatch finance_updated
    if (data.salaryValue !== undefined || data.salaryType !== undefined || data.salaryFixedAmount !== undefined) {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem("fm_salaries_cache") : null;
        const cached: any[] = raw ? JSON.parse(raw) : [];
        const existing = cached.find((s) => s.teacherId === teacherId && s.month === currentMonth);
        if (existing) {
          const newType = (data.salaryType as any) || existing.salaryType || "percentage";
          const newPercentage = typeof data.salaryValue === "number" ? data.salaryValue : (existing.percentage ?? 50);
          const newFixed = typeof data.salaryFixedAmount === "number" ? data.salaryFixedAmount : (existing.fixedSalary ?? 0);

          let base = 0;
          if (newType === "percentage") {
            base = Math.round((existing.collectedPayment || 0) * (newPercentage / 100));
          } else if (newType === "fixed") {
            base = Number(newFixed);
          } else {
            base = Math.round(Number(newFixed) + (existing.collectedPayment || 0) * (newPercentage / 100));
          }

          const calculatedSalary = Math.max(0, base + (existing.bonus || 0) - (existing.deduction || 0));
          const remainingSalary = Math.max(0, calculatedSalary - (existing.paidSalary || 0));

          const updatedDoc = {
            ...existing,
            salaryType: newType,
            percentage: newPercentage,
            fixedSalary: newFixed,
            calculatedSalary,
            remainingSalary,
            updatedAt: new Date().toISOString(),
          };

          const updatedList = cached.map((s) => (s.salaryId === existing.salaryId ? updatedDoc : s));
          if (typeof localStorage !== "undefined") {
            localStorage.setItem("fm_salaries_cache", JSON.stringify(updatedList));
          }

          setDoc(doc(db, "teacher_salaries", existing.salaryId), {
            ...updatedDoc,
            updatedAt: serverTimestamp(),
          }, { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.warn("Sync salary after updateTeacher error:", e);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("finance_updated", { detail: { type: "teacher_rate_updated", teacherId } })
        );
      }
    }
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
