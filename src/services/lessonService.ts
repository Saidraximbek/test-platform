import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Lesson, UserProfile, Group } from "../types";
import { groupService, getDeletedGroupIds } from "./groupService";

const LESSONS_CACHE_KEY = "fm_lessons_cache";
const DELETED_LESSONS_KEY = "fm_deleted_lessons";

export function getDeletedLessonIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_LESSONS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markLessonAsDeleted(lessonId: string): void {
  try {
    const set = getDeletedLessonIds();
    set.add(lessonId);
    localStorage.setItem(DELETED_LESSONS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

async function syncDeletedLessons(): Promise<Set<string>> {
  const localSet = getDeletedLessonIds();
  try {
    const delSnap = await getDocs(collection(db, "deleted_lessons"));
    delSnap.docs.forEach((d) => {
      const data = d.data();
      const id = data?.lessonId || d.id;
      if (id) localSet.add(id);
    });
    localStorage.setItem(DELETED_LESSONS_KEY, JSON.stringify(Array.from(localSet)));
  } catch {}
  return localSet;
}

function getLocalLessons(): Lesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_CACHE_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const deletedIds = getDeletedLessonIds();
    return list.filter((l) => l && l.lessonId && !deletedIds.has(l.lessonId)) as Lesson[];
  } catch {
    return [];
  }
}

const lessonsMemCache = new Map<string, { data: Lesson[]; time: number }>();

export function invalidateLessonsCache(): void {
  lessonsMemCache.clear();
}

function saveLocalLessons(lessons: Lesson[]): void {
  try {
    const deletedIds = getDeletedLessonIds();
    const clean = lessons.filter((l) => l && l.lessonId && !deletedIds.has(l.lessonId));
    localStorage.setItem(LESSONS_CACHE_KEY, JSON.stringify(clean));
  } catch {}
}

export const lessonService = {
  invalidateLessonsCache,
  getDeletedLessonIds,
  markLessonAsDeleted,

  async getLessons(groupId?: string): Promise<Lesson[]> {
    const cacheKey = groupId || "all";
    const cachedMem = lessonsMemCache.get(cacheKey);
    if (cachedMem && Date.now() - cachedMem.time < 30000) {
      return cachedMem.data;
    }

    const deletedGroupIds = getDeletedGroupIds();
    if (groupId && deletedGroupIds.has(groupId)) {
      return [];
    }

    // Always sync deleted lesson IDs from server first
    const deletedLessonIds = await syncDeletedLessons();

    const lessonsMap = new Map<string, Lesson>();
    let firestoreSuccess = false;

    // 1. From Firestore "lessons" collection
    try {
      const lessonsRef = collection(db, "lessons");
      let snap;
      if (groupId) {
        snap = await getDocs(query(lessonsRef, where("groupId", "==", groupId)));
      } else {
        snap = await getDocs(lessonsRef);
      }
      firestoreSuccess = true;

      snap.docs.forEach((d) => {
        const data = d.data() as Lesson;
        const id = data.lessonId || d.id;
        if (id && !deletedLessonIds.has(id)) {
          if (groupId ? data.groupId === groupId : true) {
            if (!data.groupId || !deletedGroupIds.has(data.groupId)) {
              lessonsMap.set(id, { ...data, lessonId: id });
            }
          }
        }
      });
    } catch (err: any) {
      // Offline / network failure
    }

    if (firestoreSuccess) {
      // SERVER IS AUTHORITATIVE:
      // What the server returns is the current reality. Update local cache to match.
      // Purge any deleted or stale lessons from local cache.
      const currentAll = getLocalLessons().filter((l) => !deletedLessonIds.has(l.lessonId));

      if (groupId) {
        // Replace all cached lessons for this specific group with server's result
        const remainingOtherGroups = currentAll.filter((l) => l.groupId !== groupId);
        const serverGroupLessons = Array.from(lessonsMap.values());
        saveLocalLessons([...remainingOtherGroups, ...serverGroupLessons]);
      } else {
        saveLocalLessons(Array.from(lessonsMap.values()));
      }
    } else {
      // OFFLINE FALLBACK ONLY: If network failed, read from local cache
      const cached = getLocalLessons();
      cached.forEach((l) => {
        const gId = l.groupId;
        if (gId && deletedGroupIds.has(gId)) return;
        if (deletedLessonIds.has(l.lessonId)) return;
        if (groupId ? gId === groupId : true) {
          if (!lessonsMap.has(l.lessonId)) {
            lessonsMap.set(l.lessonId, l);
          }
        }
      });
    }

    const list = Array.from(lessonsMap.values()).filter((l) => !deletedLessonIds.has(l.lessonId));

    const sorted = list.sort((a, b) => {
      if (a.scheduledDate && b.scheduledDate) {
        return b.scheduledDate.localeCompare(a.scheduledDate);
      }
      return (b.lessonNumber || 0) - (a.lessonNumber || 0);
    });

    lessonsMemCache.set(cacheKey, { data: sorted, time: Date.now() });
    return sorted;
  },

  async getLessonById(lessonId: string): Promise<Lesson | null> {
    if (!lessonId) return null;
    const deletedIds = getDeletedLessonIds();
    if (deletedIds.has(lessonId)) return null;

    // 1. Try Firestore "lessons" doc
    try {
      const snap = await getDoc(doc(db, "lessons", lessonId));
      if (snap.exists()) {
        const data = snap.data() as Lesson;
        const id = data.lessonId || snap.id;
        if (deletedIds.has(id)) return null;
        return { ...data, lessonId: id };
      } else {
        // Doc not found on server -> it was deleted! Purge from cache.
        markLessonAsDeleted(lessonId);
        const cached = getLocalLessons();
        saveLocalLessons(cached.filter((l) => l.lessonId !== lessonId));
        return null;
      }
    } catch (err: any) {
      // Offline fallback only
      const cached = getLocalLessons();
      const foundCached = cached.find((l) => l.lessonId === lessonId && !deletedIds.has(l.lessonId));
      return foundCached || null;
    }
  },

  async getTeacherLessons(teacherId: string): Promise<Lesson[]> {
    const deletedLessonIds = await syncDeletedLessons();
    const deletedGroupIds = getDeletedGroupIds();
    const lessonsMap = new Map<string, Lesson>();

    // 1. Query Firestore "lessons" collection by teacherId
    try {
      const q = query(collection(db, "lessons"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const les = d.data() as Lesson;
        const id = les.lessonId || d.id;
        if (id && !deletedLessonIds.has(id)) {
          if (!les.groupId || !deletedGroupIds.has(les.groupId)) {
            lessonsMap.set(id, { ...les, lessonId: id });
          }
        }
      });
    } catch (err: any) {}

    // 2. Query Firestore by teacher's groups
    try {
      const teacherGroups = await groupService.getTeacherGroups(teacherId).catch(() => []);
      for (const grp of teacherGroups) {
        if (grp.groupId && !deletedGroupIds.has(grp.groupId)) {
          const qG = query(collection(db, "lessons"), where("groupId", "==", grp.groupId));
          const snapG = await getDocs(qG);
          snapG.docs.forEach((d) => {
            const les = d.data() as Lesson;
            const id = les.lessonId || d.id;
            if (id && !deletedLessonIds.has(id)) {
              lessonsMap.set(id, { ...les, lessonId: id });
            }
          });
        }
      }
    } catch (err: any) {}

    const list = Array.from(lessonsMap.values()).filter((l) => !deletedLessonIds.has(l.lessonId));
    saveLocalLessons(list);

    return list.sort((a, b) => (b.lessonNumber || 0) - (a.lessonNumber || 0));
  },

  async getTodayLessonForStudent(
    studentId: string,
    preloadedGroups?: Group[]
  ): Promise<{ lesson: Lesson; groupName: string } | null> {
    const groups = preloadedGroups || (await groupService.getStudentGroups(studentId));
    if (groups.length === 0) return null;

    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const allStudentLessons: { lesson: Lesson; groupName: string }[] = [];

    const groupLessonResults = await Promise.all(
      groups.map(async (group) => {
        const lessons = await this.getLessons(group.groupId);
        return lessons
          .filter((les) => les.status === "published" || !les.status)
          .map((les) => ({ lesson: les, groupName: group.name }));
      })
    );

    groupLessonResults.forEach((arr) => allStudentLessons.push(...arr));
    if (allStudentLessons.length === 0) return null;

    // First try exact date match for today
    const exactToday = allStudentLessons.find((item) => item.lesson.scheduledDate === todayStr);
    if (exactToday) return exactToday;

    // Otherwise return the most recent active lesson
    return allStudentLessons[0];
  },

  async saveLesson(lessonData: Partial<Lesson>): Promise<Lesson> {
    const lessonRef = lessonData.lessonId
      ? doc(db, "lessons", lessonData.lessonId)
      : doc(collection(db, "lessons"));

    const lessonId = lessonRef.id;
    const todayStr = new Date().toISOString().split("T")[0];
    const teacherId = lessonData.teacherId || auth.currentUser?.uid || "";

    const data: Lesson = {
      lessonId,
      title: (lessonData.title || "Yangi Dars").trim(),
      description: (lessonData.description || "").trim(),
      subjectId: lessonData.subjectId || "",
      groupId: lessonData.groupId || "",
      teacherId,
      moduleId: lessonData.moduleId || "",
      lessonNumber: Number(lessonData.lessonNumber) || 1,
      scheduledDate: lessonData.scheduledDate || todayStr,
      durationMinutes: Number(lessonData.durationMinutes) || 80,
      videoUrl: lessonData.videoUrl || null,
      materialsText: lessonData.materialsText || null,
      pdfUrl: lessonData.pdfUrl || null,
      homeworkId: lessonData.homeworkId || null,
      testId: lessonData.testId || null,
      status: lessonData.status || "published",
      createdAt: lessonData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Unmark from deleted lessons if previously deleted
    try {
      const deletedSet = getDeletedLessonIds();
      if (deletedSet.has(lessonId)) {
        deletedSet.delete(lessonId);
        localStorage.setItem(DELETED_LESSONS_KEY, JSON.stringify(Array.from(deletedSet)));
      }
    } catch {}

    // 1. Cache immediately
    const cached = getLocalLessons();
    saveLocalLessons([data, ...cached.filter((l) => l.lessonId !== lessonId)]);
    invalidateLessonsCache();

    // 2. Persist to Firestore "lessons" collection
    try {
      await setDoc(
        lessonRef,
        {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err: any) {
      try {
        await setDoc(lessonRef, data, { merge: true });
      } catch (innerErr: any) {}
    }

    // 3. Authoritative sync to teacher user doc in Firestore (users/{teacherId}.publishedLessons)
    if (teacherId) {
      try {
        const teacherRef = doc(db, "users", teacherId);
        const tSnap = await getDoc(teacherRef);
        let existingLessons: Lesson[] = [];
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          existingLessons = Array.isArray(tData.publishedLessons) ? tData.publishedLessons : [];
        }
        const updatedPublishedLessons = [
          ...existingLessons.filter((l) => l.lessonId !== lessonId),
          data,
        ];
        await setDoc(
          teacherRef,
          {
            publishedLessons: updatedPublishedLessons,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn("Firestore sync lesson to teacher doc warning:", err?.message);
      }
    }

    if (auth.currentUser?.uid && auth.currentUser.uid !== teacherId) {
      try {
        const curRef = doc(db, "users", auth.currentUser.uid);
        const curSnap = await getDoc(curRef);
        if (curSnap.exists() && curSnap.data()?.role === "teacher") {
          const ex = (curSnap.data()?.publishedLessons as Lesson[]) || [];
          const updated = [...ex.filter((l) => l.lessonId !== lessonId), data];
          await setDoc(curRef, { publishedLessons: updated }, { merge: true });
        }
      } catch {}
    }

    return data;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    if (!lessonId) return;

    // 1. Mark as deleted locally
    markLessonAsDeleted(lessonId);
    const cached = getLocalLessons();
    saveLocalLessons(cached.filter((l) => l.lessonId !== lessonId));
    invalidateLessonsCache();

    // 2. Delete from Firestore "lessons" collection (triggers server-side deep cleanup)
    try {
      await deleteDoc(doc(db, "lessons", lessonId));
    } catch (err: any) {
      console.warn("Delete doc error:", err?.message);
    }

    // 3. Persist to "deleted_lessons" collection so all clients/devices sync
    try {
      await setDoc(doc(db, "deleted_lessons", lessonId), {
        lessonId,
        deletedAt: new Date().toISOString(),
      });
    } catch (err: any) {}

    // 4. Clean from teacher's publishedLessons array
    try {
      const teacherId = auth.currentUser?.uid;
      if (teacherId) {
        const teacherRef = doc(db, "users", teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          if (Array.isArray(tData.publishedLessons)) {
            const updated = tData.publishedLessons.filter((l) => l.lessonId !== lessonId);
            await setDoc(teacherRef, { publishedLessons: updated }, { merge: true });
          }
        }
      }
    } catch {}

    // 5. Invalidate groups cache
    try {
      groupService.invalidateGroupsCache?.();
    } catch {}
  },
};
