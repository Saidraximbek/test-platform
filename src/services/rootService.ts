import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
  orderBy as firestoreOrderBy,
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import { UserProfile, UserRole, UserStatus } from "../types";

export interface RootAuditLogItem {
  id?: string;
  action: string;
  performedBy: string;
  targetUid?: string;
  targetEmail?: string;
  changes?: Record<string, any>;
  notes?: string;
  timestamp: any;
}

export interface RootSystemMetrics {
  totalUsers: number;
  totalDirectors: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  activeUsers: number;
  blockedUsers: number;
  totalCoins: number;
  totalGroups: number;
  totalSubjects: number;
  totalQuestions: number;
  systemStatus: "healthy" | "warning" | "maintenance";
}

export const rootService = {
  /**
   * Fetch all users in the system without hiding Root Owner or Directors
   */
  async getAllUsers(
    search = "",
    roleFilter = "all",
    statusFilter = "all",
    limitCount = 200
  ): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const snap = await getDocs(query(usersRef, limit(limitCount)));

    let list = snap.docs
      .filter((d) => d.id !== "system_finance" && d.id !== "system_admissions" && !d.id.startsWith("lead_"))
      .map((d) => {
        const data = d.data();
        return {
          ...data,
          uid: data.uid || d.id,
          displayName: data.displayName || "Foydalanuvchi",
          status: (data.status as UserStatus) || "active",
          role: (data.role as UserRole) || "user",
          coinBalance: data.coinBalance ?? 0,
        } as UserProfile;
      });

    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((u) => u.status === statusFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.login?.toLowerCase().includes(s) ||
          u.phoneNumber?.toLowerCase().includes(s) ||
          u.educationPlace?.toLowerCase().includes(s)
      );
    }

    return list;
  },

  /**
   * Get all directors specifically
   */
  async getDirectors(): Promise<UserProfile[]> {
    return this.getAllUsers("", "director", "all", 100);
  },

  /**
   * Root Owner overrides user role
   */
  async setUserRole(targetUid: string, role: UserRole, reason = "Root administrative decision") {
    const currentUser = auth.currentUser;
    if (targetUid === currentUser?.uid && role !== "root_owner") {
      throw new Error("Yagona Root Owner hisobini o'chirib bo'lmaydi yoki rolini tushirib bo'lmaydi.");
    }

    const userRef = doc(db, "users", targetUid);
    const snap = await getDoc(userRef);
    const prevRole = snap.exists() ? snap.data().role : "unknown";

    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp(),
    });

    await this.logAction({
      action: "ROOT_OVERRIDE_ROLE",
      performedBy: currentUser?.email || currentUser?.uid || "ROOT_OWNER",
      targetUid,
      changes: { prevRole, newRole: role, reason },
      notes: `Rol o'zgartirildi: ${prevRole} -> ${role}`,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },

  /**
   * Root Owner suspends, blocks, or reactivates any account (including Directors)
   */
  async setUserStatus(targetUid: string, status: UserStatus, reason: string) {
    const currentUser = auth.currentUser;
    if (targetUid === currentUser?.uid && (status === "blocked" || status === "suspended")) {
      throw new Error("Root Owner hisobini bloklab bo'lmaydi.");
    }

    const userRef = doc(db, "users", targetUid);
    const snap = await getDoc(userRef);
    const prevStatus = snap.exists() ? snap.data().status : "unknown";

    await updateDoc(userRef, {
      status,
      statusReason: reason,
      updatedAt: serverTimestamp(),
    });

    await this.logAction({
      action: `ROOT_USER_${status.toUpperCase()}`,
      performedBy: currentUser?.email || currentUser?.uid || "ROOT_OWNER",
      targetUid,
      changes: { prevStatus, newStatus: status, reason },
      notes: `Hisob holati o'zgartirildi: ${prevStatus} -> ${status}. Sabab: ${reason}`,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },

  /**
   * Root Owner deletes an account
   */
  async deleteUser(targetUid: string, reason = "Root administrative deletion") {
    const currentUser = auth.currentUser;
    if (targetUid === currentUser?.uid) {
      throw new Error("Root Owner hisobini o'chirib bo'lmaydi.");
    }

    const userRef = doc(db, "users", targetUid);
    const snap = await getDoc(userRef);
    const targetData = snap.exists() ? snap.data() : {};

    await deleteDoc(userRef);

    await this.logAction({
      action: "ROOT_USER_DELETE",
      performedBy: currentUser?.email || currentUser?.uid || "ROOT_OWNER",
      targetUid,
      changes: { deletedUserData: targetData, reason },
      notes: `Foydalanuvchi butunlay o'chirildi: ${targetData.displayName || targetUid}`,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },

  /**
   * Root Owner edits user details
   */
  async updateUserDetails(targetUid: string, updates: Partial<UserProfile>) {
    const userRef = doc(db, "users", targetUid);
    await setDoc(
      userRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await this.logAction({
      action: "ROOT_USER_UPDATE",
      performedBy: auth.currentUser?.email || "ROOT_OWNER",
      targetUid,
      changes: updates,
      notes: "Foydalanuvchi ma'lumotlari Root panel orqali tahrirlandi",
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },

  /**
   * Fetch protected root audit logs
   */
  async getAuditLogs(limitCount = 100): Promise<RootAuditLogItem[]> {
    try {
      const logsRef = collection(db, "root_audit_logs");
      const snap = await getDocs(query(logsRef, limit(limitCount)));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RootAuditLogItem[];

      return list.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
    } catch (e) {
      console.warn("Could not fetch root audit logs:", e);
      return [];
    }
  },

  /**
   * Log action into protected root_audit_logs collection
   */
  async logAction(logItem: Omit<RootAuditLogItem, "id">) {
    try {
      const logsRef = collection(db, "root_audit_logs");
      await setDoc(doc(logsRef), {
        ...logItem,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to write to root_audit_logs:", err);
    }
  },

  /**
   * Compute comprehensive system health metrics
   */
  async getSystemMetrics(): Promise<RootSystemMetrics> {
    const [usersSnap, groupsSnap, subjectsSnap, questionsSnap] = await Promise.all([
      getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      getDocs(collection(db, "groups")).catch(() => ({ docs: [] })),
      getDocs(collection(db, "subjects")).catch(() => ({ docs: [] })),
      getDocs(collection(db, "questions")).catch(() => ({ docs: [] })),
    ]);

    const users = (usersSnap.docs || [])
      .filter((d) => d.id !== "system_finance" && d.id !== "system_admissions" && !d.id.startsWith("lead_"))
      .map((d) => d.data() as UserProfile);

    const totalUsers = users.length;
    const totalDirectors = users.filter((u) => u.role === "director").length;
    const totalAdmins = users.filter((u) => u.role === "admin").length;
    const totalTeachers = users.filter((u) => u.role === "teacher").length;
    const totalStudents = users.filter((u) => u.role === "student" || u.role === "user" || !u.role).length;
    const activeUsers = users.filter((u) => u.status === "active" || !u.status).length;
    const blockedUsers = users.filter((u) => u.status === "blocked" || u.status === "suspended").length;
    const totalCoins = users.reduce((acc, u) => acc + (u.coinBalance || 0), 0);

    return {
      totalUsers,
      totalDirectors,
      totalAdmins,
      totalTeachers,
      totalStudents,
      activeUsers,
      blockedUsers,
      totalCoins,
      totalGroups: groupsSnap.docs?.length || 0,
      totalSubjects: subjectsSnap.docs?.length || 0,
      totalQuestions: questionsSnap.docs?.length || 0,
      systemStatus: "healthy",
    };
  },

  /**
   * Change Root Password via Firebase Auth API
   */
  async changeRootPassword(newPassword: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Foydalanuvchi tizimga kirmagan");
    if (newPassword.length < 6) throw new Error("Parol kamida 6 belgidan iborat bo'lishi kerak");

    await updatePassword(user, newPassword);

    // Update mustChangePassword in Firestore
    await updateDoc(doc(db, "users", user.uid), {
      mustChangePassword: false,
      updatedAt: serverTimestamp(),
    });

    await this.logAction({
      action: "ROOT_PASSWORD_CHANGED",
      performedBy: user.email || user.uid,
      targetUid: user.uid,
      notes: "Root Owner paroli muvaffaqiyatli yangilandi",
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },

  /**
   * Fetch Global System Settings
   */
  async getGlobalSettings() {
    try {
      const snap = await getDoc(doc(db, "system_settings", "global"));
      if (snap.exists()) return snap.data();
    } catch {}
    return {
      allowRegistration: true,
      maintenanceMode: false,
      dailyRewardCoins: 10,
      testPassingScore: 70,
      systemAnnouncements: "",
    };
  },

  /**
   * Update Global System Settings
   */
  async updateGlobalSettings(settings: Record<string, any>) {
    await setDoc(doc(db, "system_settings", "global"), {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.email || "ROOT_OWNER",
    }, { merge: true });

    await this.logAction({
      action: "ROOT_GLOBAL_SETTINGS_UPDATE",
      performedBy: auth.currentUser?.email || "ROOT_OWNER",
      changes: settings,
      notes: "Global tizim sozlamalari yangilandi",
      timestamp: serverTimestamp(),
    });

    return { success: true };
  },
};
