import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Level, UserProgress } from "../types";

export const levelService = {
  async getLevelsBySubject(subjectId: string, onlyActive = true): Promise<Level[]> {
    const levelsRef = collection(db, "levels");
    let q = query(levelsRef, where("subjectId", "==", subjectId));
    if (onlyActive) {
      q = query(levelsRef, where("subjectId", "==", subjectId), where("isActive", "==", true));
    }

    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Level);
    return list.sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0));
  },

  async getLevelById(levelId: string): Promise<Level | null> {
    const snap = await getDoc(doc(db, "levels", levelId));
    if (!snap.exists()) return null;
    return snap.data() as Level;
  },

  async getUserProgressForSubject(userId: string, subjectId: string): Promise<Record<string, UserProgress>> {
    const progressRef = collection(db, "user_progress");
    const q = query(
      progressRef,
      where("userId", "==", userId),
      where("subjectId", "==", subjectId)
    );

    const snap = await getDocs(q);
    const map: Record<string, UserProgress> = {};
    snap.docs.forEach((d) => {
      const prog = d.data() as UserProgress;
      map[prog.levelId] = prog;
    });
    return map;
  },

  async getAllUserProgress(userId: string): Promise<UserProgress[]> {
    const progressRef = collection(db, "user_progress");
    const q = query(progressRef, where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProgress);
  },

  async saveLevel(data: Partial<Level> & { subjectId: string; levelNumber: number; name: string }) {
    const levelRef = data.levelId
      ? doc(db, "levels", data.levelId)
      : doc(collection(db, "levels"));

    const levelId = levelRef.id;
    const docData: Level = {
      levelId,
      subjectId: data.subjectId,
      levelNumber: Number(data.levelNumber),
      name: data.name,
      description: data.description || "",
      unlockCostCoins: data.unlockCostCoins !== undefined ? data.unlockCostCoins : null,
      difficulty: data.difficulty || "medium",
      questionsRequired: data.questionsRequired || 20,
      durationMinutes: data.durationMinutes !== undefined ? data.durationMinutes : null,
      isInitialUnlocked: data.isInitialUnlocked !== undefined ? data.isInitialUnlocked : false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(levelRef, docData, { merge: true });
    return docData;
  },

  async deleteLevel(levelId: string) {
    await deleteDoc(doc(db, "levels", levelId));
  },
};