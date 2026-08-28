import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Subject } from "../types";

export const subjectService = {
  async getSubjects(onlyActive = true): Promise<Subject[]> {
    const subjectsRef = collection(db, "subjects");
    const snap = await getDocs(subjectsRef);
    let list = snap.docs.map((d) => d.data() as Subject);

    if (onlyActive) {
      list = list.filter((s) => s.isActive !== false);
    }

    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  },

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    const snap = await getDoc(doc(db, "subjects", subjectId));
    if (!snap.exists()) return null;
    return snap.data() as Subject;
  },

  async saveSubject(data: Partial<Subject> & { name: string; slug: string }) {
    const subjectRef = data.subjectId
      ? doc(db, "subjects", data.subjectId)
      : doc(collection(db, "subjects"));

    const subjectId = subjectRef.id;
    const docData: Subject = {
      subjectId,
      name: data.name,
      slug: data.slug,
      icon: data.icon || "BookOpen",
      description: data.description || "",
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order !== undefined ? Number(data.order) : 1,
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(subjectRef, docData, { merge: true });
    return docData;
  },

  async deleteSubject(subjectId: string) {
    await deleteDoc(doc(db, "subjects", subjectId));
  },
};