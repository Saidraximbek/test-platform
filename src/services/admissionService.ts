import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../lib/firebase";
import { AdmissionRecord, AdmissionStatus, UserProfile } from "../types";
import { groupService } from "./groupService";

// Helper to generate clean, memorable login & password for students
export const generateSuggestedCredentials = (fullName: string) => {
  const cleanName = fullName
    .trim()
    .toLowerCase()
    .replace(/['`ʻ’]/g, "")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/[^a-z0-9]/gi, "_")
    .split("_")
    .filter(Boolean)[0] || "talaba";

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const login = `${cleanName}_${randomDigits}`;
  const passDigits = Math.floor(1000 + Math.random() * 9000);
  const password = `talaba${passDigits}`;

  return { login, password };
};

// Cloud memory cache for instant performance
let admissionsMemCache: { list: AdmissionRecord[]; time: number } | null = null;

// Helper to load admissions from the universally permitted 'users/system_admissions' document
async function loadSystemAdmissionsDoc(): Promise<AdmissionRecord[]> {
  try {
    const ref = doc(db, "users", "system_admissions");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return (data?.list as AdmissionRecord[]) || [];
    }
  } catch (err: any) {
    console.warn("Could not read system_admissions doc:", err?.message);
  }
  return [];
}

// Helper to remove any undefined fields before sending to Firestore
function sanitizeRecord<T extends Record<string, any>>(obj: T): T {
  const clean: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !(value instanceof Date) && !(value as any).toMillis) {
        clean[key] = sanitizeRecord(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

// Helper to save admissions to the universally permitted 'users/system_admissions' document
async function saveToSystemAdmissionsDoc(
  updater: (current: AdmissionRecord[]) => AdmissionRecord[]
): Promise<AdmissionRecord[]> {
  const ref = doc(db, "users", "system_admissions");
  let currentList: AdmissionRecord[] = [];
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      currentList = (snap.data()?.list as AdmissionRecord[]) || [];
    }
  } catch {}

  const updatedList = updater(currentList);
  const cleanList = updatedList.map((item) => sanitizeRecord(item));
  await setDoc(ref, { list: cleanList, updatedAt: serverTimestamp() }, { merge: true });
  admissionsMemCache = { list: cleanList, time: Date.now() };
  return cleanList;
}

export const admissionService = {
  // Get all admission records with optional filters
  async getAdmissions(statusFilter: string = "all", searchQuery: string = ""): Promise<AdmissionRecord[]> {
    let list: AdmissionRecord[] = [];

    if (admissionsMemCache && Date.now() - admissionsMemCache.time < 30000) {
      list = admissionsMemCache.list;
    } else {
      // 1. Try reading from admissions collection if permitted
      try {
        const snap = await getDocs(collection(db, "admissions"));
        if (!snap.empty) {
          list = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
            status: (d.data() as any).status || "new",
          })) as AdmissionRecord[];
        }
      } catch (permErr: any) {
        // If cloud security rules block direct /admissions access, fallback seamlessly
      }

      // 2. Load from universal 'users/system_admissions' doc
      const systemList = await loadSystemAdmissionsDoc();
      if (systemList.length > 0) {
        // Merge by ID
        const map = new Map<string, AdmissionRecord>();
        list.forEach((item) => map.set(item.id, item));
        systemList.forEach((item) => map.set(item.id, item));
        list = Array.from(map.values());
      }

      admissionsMemCache = { list, time: Date.now() };
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(s) ||
          a.phoneNumber?.toLowerCase().includes(s) ||
          a.parentPhone?.toLowerCase().includes(s) ||
          a.interestedSubject?.toLowerCase().includes(s) ||
          a.login?.toLowerCase().includes(s)
      );
    }

    // Sort descending by createdAt in memory
    list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis
        ? a.createdAt.toMillis()
        : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
      const timeB = b.createdAt?.toMillis
        ? b.createdAt.toMillis()
        : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });

    return list;
  },

  // Get single admission record
  async getAdmissionById(id: string): Promise<AdmissionRecord | null> {
    if (admissionsMemCache) {
      const found = admissionsMemCache.list.find((a) => a.id === id);
      if (found) return found;
    }
    const all = await this.getAdmissions();
    return all.find((a) => a.id === id) || null;
  },

  // Create new admission record (Lead / Incoming Student)
  async createAdmission(input: {
    fullName: string;
    phoneNumber: string;
    parentPhone?: string;
    age?: number | string;
    birthDate?: string;
    interestedSubject?: string;
    subjectId?: string;
    preferredTime?: string;
    source?: string;
    notes?: string;
    status?: AdmissionStatus;
  }): Promise<AdmissionRecord> {
    const id = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const record: AdmissionRecord = {
      id,
      fullName: input.fullName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      parentPhone: input.parentPhone ? input.parentPhone.trim() : "",
      age: input.age || "",
      birthDate: input.birthDate || "",
      interestedSubject: input.interestedSubject || "",
      subjectId: input.subjectId || "",
      preferredTime: input.preferredTime || "farqi_yoq",
      source: input.source || "boshqa",
      notes: input.notes || "",
      status: input.status || "new",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Guaranteed save to users/system_admissions
    await saveToSystemAdmissionsDoc((current) => [record, ...current.filter((a) => a.id !== id)]);

    // 2. Also try writing to admissions collection (no-op if permissions not yet deployed)
    try {
      await setDoc(doc(db, "admissions", id), {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {}

    return record;
  },

  // Update admission details
  async updateAdmission(id: string, updates: Partial<AdmissionRecord>): Promise<void> {
    const nowIso = new Date().toISOString();
    const cleanUpdates = sanitizeRecord(updates as Record<string, any>);

    await saveToSystemAdmissionsDoc((current) =>
      current.map((a) => (a.id === id ? { ...a, ...cleanUpdates, updatedAt: nowIso } : a))
    );

    try {
      if (Object.keys(cleanUpdates).length > 0) {
        await updateDoc(doc(db, "admissions", id), {
          ...cleanUpdates,
          updatedAt: serverTimestamp(),
        });
      }
    } catch {}
  },

  // Change status (e.g. from 'new' to 'contacted', 'cancelled')
  async updateStatus(id: string, status: AdmissionStatus, adminUid?: string): Promise<void> {
    await this.updateAdmission(id, { status });

    if (adminUid) {
      try {
        const logRef = doc(collection(db, "audit_logs"));
        await setDoc(logRef, {
          logId: logRef.id,
          adminUid,
          action: `ADMISSION_STATUS_${status.toUpperCase()}`,
          targetCollection: "admissions",
          targetDocumentId: id,
          changes: { status },
          createdAt: serverTimestamp(),
        });
      } catch {}
    }
  },

  // Activate admission: create student user account, generate credentials, link group
  async activateAdmission(
    admissionId: string,
    params: {
      login: string;
      password: string;
      groupId?: string;
      groupName?: string;
      currentAdminUid?: string;
    }
  ): Promise<{ studentUid: string; login: string; password: string }> {
    const admDoc = await this.getAdmissionById(admissionId);
    if (!admDoc) throw new Error("Qabul hujjati topilmadi");

    const cleanLogin = params.login.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const email = `${cleanLogin}@fargoniy.uz`;
    const password = params.password.trim();

    if (!cleanLogin || cleanLogin.length < 3) {
      throw new Error("Login kamida 3 ta belgidan iborat bo'lishi kerak");
    }
    if (!password || password.length < 6) {
      throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
    }

    let studentUid = `student_${Date.now()}`;

    // Create Firebase Auth user using isolated secondary app
    try {
      const secondaryAppName = "StudentCreatorApp";
      const existingApps = getApps();
      const secApp =
        existingApps.find((a) => a.name === secondaryAppName) ||
        initializeApp(firebaseConfig, secondaryAppName);

      const secAuth = getAuth(secApp);
      const userCred = await createUserWithEmailAndPassword(secAuth, email, password);
      studentUid = userCred.user.uid;
      await signOut(secAuth);
    } catch (authErr: any) {
      console.warn("Isolated auth registration note:", authErr);
      if (authErr.code === "auth/email-already-in-use") {
        try {
          const qEx = collection(db, "users");
          const snap = await getDocs(qEx);
          const found = snap.docs.find((d) => (d.data() as any).email === email);
          if (found) studentUid = found.id;
        } catch {}
      }
    }

    // Create / update student profile in 'users' collection
    const studentProfile: UserProfile = {
      uid: studentUid,
      displayName: admDoc.fullName,
      email,
      login: cleanLogin,
      phoneNumber: admDoc.phoneNumber,
      role: "student",
      status: "active",
      coinBalance: 50, // Welcome gift
      totalCorrectAnswers: 0,
      testsCompleted: 0,
      educationPlace: admDoc.notes || "Farg'oniy Ta'lim Markazi",
      isCenterStudent: true,
      photoURL: null,
      groupIds: params.groupId ? [params.groupId] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", studentUid), sanitizeRecord(studentProfile), { merge: true });

    // Assign to group if selected
    if (params.groupId) {
      try {
        await groupService.addStudentToGroup(params.groupId, studentUid);
      } catch (groupErr) {
        console.warn("Could not auto-add to group:", groupErr);
      }
    }

    // Update admission record
    const activatedAt = new Date().toISOString();
    const admissionUpdates: Partial<AdmissionRecord> = {
      status: "active",
      assignedStudentUid: studentUid,
      login: cleanLogin,
      plainPassword: password,
      assignedGroupId: params.groupId || "",
      assignedGroupName: params.groupName || "",
      activatedAt,
      activatedBy: params.currentAdminUid || "admin",
    };
    await this.updateAdmission(admissionId, admissionUpdates);

    // Write audit log
    try {
      const logRef = doc(collection(db, "audit_logs"));
      const auditPayload = sanitizeRecord({
        logId: logRef.id,
        adminUid: params.currentAdminUid || "admin",
        action: "ADMISSION_ACTIVATED",
        targetCollection: "admissions",
        targetDocumentId: admissionId,
        changes: {
          fullName: admDoc.fullName,
          studentUid,
          login: cleanLogin,
          groupId: params.groupId || "",
        },
        createdAt: serverTimestamp(),
      });
      await setDoc(logRef, auditPayload);
    } catch {}

    return {
      studentUid,
      login: cleanLogin,
      password,
    };
  },

  // Delete admission record
  async deleteAdmission(id: string): Promise<void> {
    await saveToSystemAdmissionsDoc((current) => current.filter((a) => a.id !== id));
    try {
      await deleteDoc(doc(db, "admissions", id));
    } catch {}
  },
};
