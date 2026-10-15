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
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, auth } from "../lib/firebase";
import {
  UserProfile,
  UserStatus,
  SystemSettings,
  AuditLogItem,
  Question,
} from "../types";

export interface BulkQuestionInput {
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  difficulty: number;
}

export const adminService = {
  // Users Management
  async getAllUsers(search = "", statusFilter = "all", limitCount = 50, includeRootOwner = false): Promise<UserProfile[]> {
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
          status: data.status || "active",
          role: data.role || "user",
          coinBalance: data.coinBalance ?? 0,
        } as UserProfile;
      })
      .filter((u) => {
        // Enforce Restricted Visibility: Root Owner must NEVER appear in ordinary directories or director/admin lists!
        if (!includeRootOwner && (u.role === "root_owner" || u.email?.toLowerCase() === "hacker@sm.sm" || u.isProtectedRoot)) {
          return false;
        }
        return true;
      });

    if (statusFilter !== "all") {
      list = list.filter((u) => u.status === statusFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.displayName?.toLowerCase().includes(s) ||
          u.phoneNumber?.toLowerCase().includes(s) ||
          u.educationPlace?.toLowerCase().includes(s)
      );
    }
    return list;
  },

  async setUserStatus(userId: string, status: UserStatus, reason: string) {
    const targetSnap = await getDoc(doc(db, "users", userId));
    if (targetSnap.exists()) {
      const d = targetSnap.data();
      if (d.role === "root_owner" || d.email?.toLowerCase() === "hacker@sm.sm" || d.isProtectedRoot) {
        throw new Error("Ildiz egasi (Root Owner) hisobini to'xtatish yoki bloklash taqiqlangan!");
      }
    }

    try {
      const fn = httpsCallable<{ userId: string; status: UserStatus; reason: string }, { success: boolean }>(
        functions,
        "setUserStatus"
      );
      const result = await fn({ userId, status, reason });
      return result.data;
    } catch (fnErr) {
      await updateDoc(doc(db, "users", userId), {
        status,
        updatedAt: serverTimestamp(),
      });

      const logRef = doc(collection(db, "audit_logs"));
      await setDoc(logRef, {
        logId: logRef.id,
        adminUid: auth.currentUser?.uid || "admin",
        action: `USER_${status.toUpperCase()}`,
        targetCollection: "users",
        targetDocumentId: userId,
        changes: { status, reason },
        createdAt: serverTimestamp(),
      });

      return { success: true };
    }
  },

  async setUserRole(userId: string, role: string) {
    if (role === "root_owner") {
      throw new Error("Root Owner rolini bu yerdan tayinlash taqiqlangan!");
    }
    const targetSnap = await getDoc(doc(db, "users", userId));
    if (targetSnap.exists()) {
      const d = targetSnap.data();
      if (d.role === "root_owner" || d.email?.toLowerCase() === "hacker@sm.sm" || d.isProtectedRoot) {
        throw new Error("Ildiz egasi (Root Owner) rolini o'zgartirish taqiqlangan!");
      }
    }

    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  },

  async setAdminRole(userId: string, makeAdmin: boolean) {
    const targetSnap = await getDoc(doc(db, "users", userId));
    if (targetSnap.exists()) {
      const d = targetSnap.data();
      if (d.role === "root_owner" || d.email?.toLowerCase() === "hacker@sm.sm" || d.isProtectedRoot) {
        throw new Error("Ildiz egasi (Root Owner) rolini o'zgartirish taqiqlangan!");
      }
    }

    try {
      const fn = httpsCallable<{ userId: string; makeAdmin: boolean }, { success: boolean }>(
        functions,
        "setAdminRole"
      );
      const result = await fn({ userId, makeAdmin });
      return result.data;
    } catch (fnErr) {
      await updateDoc(doc(db, "users", userId), {
        role: makeAdmin ? "admin" : "user",
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    }
  },

  // Questions Management
  async getAdminQuestions(subjectId: string, levelId?: string): Promise<Question[]> {
    const qRef = collection(db, "questions");
    const snap = await getDocs(query(qRef, limit(200)));
    let list = snap.docs.map((d) => d.data() as Question);

    if (subjectId) {
      list = list.filter((q) => q.subjectId === subjectId);
    }
    if (levelId) {
      list = list.filter((q) => q.levelId === levelId);
    }

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async saveQuestion(data: Partial<Question> & { subjectId: string; levelId: string; text: string }) {
    const qRef = data.questionId
      ? doc(db, "questions", data.questionId)
      : doc(collection(db, "questions"));

    const questionId = qRef.id;
    const docData: Question = {
      questionId,
      subjectId: data.subjectId,
      levelId: data.levelId,
      text: data.text,
      imageUrl: data.imageUrl || null,
      options: data.options || [],
      correctOptionId: data.correctOptionId || "A",
      explanation: data.explanation || "",
      difficulty: data.difficulty || 2,
      status: data.status || "approved",
      randomWeight: data.randomWeight !== undefined ? data.randomWeight : Math.random(),
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(qRef, docData, { merge: true });
    return docData;
  },

  async bulkImportQuestions(
    subjectId: string,
    levelId: string,
    questions: BulkQuestionInput[]
  ): Promise<number> {
    const chunkSize = 400; // Batch limit is 500 in Firestore
    let imported = 0;

    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunk = questions.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const qRef = doc(collection(db, "questions"));
        const docData: Question = {
          questionId: qRef.id,
          subjectId,
          levelId,
          text: item.text,
          imageUrl: null,
          options: item.options,
          correctOptionId: item.correctOptionId.toUpperCase(),
          explanation: item.explanation || "",
          difficulty: item.difficulty || 2,
          status: "approved",
          randomWeight: Math.random(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(qRef, docData);
      });

      await batch.commit();
      imported += chunk.length;
    }

    return imported;
  },

  async deleteQuestion(questionId: string) {
    await deleteDoc(doc(db, "questions", questionId));
  },

  // Audit Logs
  async getAuditLogs(actionFilter = "all", limitCount = 50): Promise<AuditLogItem[]> {
    const logsRef = collection(db, "audit_logs");
    const snap = await getDocs(query(logsRef, limit(limitCount)));
    let list = snap.docs.map((d) => d.data() as AuditLogItem);

    if (actionFilter !== "all") {
      list = list.filter((l) => l.action.includes(actionFilter));
    }

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  // System Settings
  async getSystemSettings(): Promise<SystemSettings | null> {
    const snap = await getDoc(doc(db, "system_settings", "global_config"));
    if (!snap.exists()) return null;
    return snap.data() as SystemSettings;
  },

  async updateSystemSettings(settings: Partial<SystemSettings>) {
    try {
      const fn = httpsCallable<{ settings: Partial<SystemSettings> }, { success: boolean }>(
        functions,
        "updateSystemSettings"
      );
      const result = await fn({ settings });
      return result.data;
    } catch (fnErr) {
      await setDoc(doc(db, "system_settings", "global_config"), {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || "admin",
      }, { merge: true });
      return { success: true };
    }
  },

  // Rewards
  async grantWeeklyReward(params: {
    weekId: string;
    userId: string;
    rewardType: "coins" | "real_gift" | "discount_voucher";
    amount: number | null;
    giftTitle: string | null;
    reason: string;
  }) {
    try {
      const fn = httpsCallable<typeof params, { success: boolean; rewardId: string }>(
        functions,
        "grantWeeklyReward"
      );
      const result = await fn(params);
      return result.data;
    } catch (fnErr) {
      const rewardId = `reward_${params.weekId}_${params.userId}`;
      const rewardRef = doc(db, "weekly_rewards", rewardId);

      await setDoc(rewardRef, {
        rewardId,
        weekId: params.weekId,
        userId: params.userId,
        rewardType: params.rewardType,
        amount: params.amount,
        giftTitle: params.giftTitle,
        reason: params.reason,
        status: "awarded",
        awardedAt: serverTimestamp(),
        awardedBy: auth.currentUser?.uid || "admin",
      });

      if (params.rewardType === "coins" && params.amount) {
        await updateDoc(doc(db, "users", params.userId), {
          coinBalance: increment(params.amount),
          updatedAt: serverTimestamp(),
        });
      }

      // Notification
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        userId: params.userId,
        title: "Haftalik mukofot sohibi bo'ldingiz! 🎁",
        body: `${params.reason}: ${params.amount ? `${params.amount} Tillo tangasi` : params.giftTitle || "Sovg'a"}`,
        type: "weekly_reward",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      return { success: true, rewardId };
    }
  },
};
