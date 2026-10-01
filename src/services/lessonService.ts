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

function getLocalLessons(): Lesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
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
    localStorage.setItem(LESSONS_CACHE_KEY, JSON.stringify(lessons));
  } catch {}
}

export const lessonService = {
  invalidateLessonsCache,

  async getLessons(groupId?: string): Promise<Lesson[]> {
    const cacheKey = groupId || "all";
    const cachedMem = lessonsMemCache.get(cacheKey);
    if (cachedMem && Date.now() - cachedMem.time < 30000) {
      return cachedMem.data;
    }

    const lessonsMap = new Map<string, Lesson>();
    const deletedGroupIds = getDeletedGroupIds();

    if (groupId && deletedGroupIds.has(groupId)) {
      return [];
    }

    // 1. From Firestore "lessons" collection (try/catch)
    try {
      const lessonsRef = collection(db, "lessons");
      let snap;
      if (groupId) {
        snap = await getDocs(query(lessonsRef, where("groupId", "==", groupId)));
      } else {
        snap = await getDocs(lessonsRef);
      }

      snap.docs.forEach((d) => {
        const data = d.data() as Lesson;
        const id = data.lessonId || d.id;
        if (groupId ? data.groupId === groupId : true) {
          if (!data.groupId || !deletedGroupIds.has(data.groupId)) {
            lessonsMap.set(id, { ...data, lessonId: id });
          }
        }
      });
    } catch (err: any) {
      // Handled cleanly
    }

    // 2. Authoritative sync from Firestore "users" collection (teacher's publishedLessons) ONLY if none found
    if (lessonsMap.size === 0) {
      try {
        if (groupId) {
          // Fast path: check teacher of this group
          const group = await groupService.getGroupById(groupId).catch(() => null);
          if (group && group.teacherId) {
            const tSnap = await getDoc(doc(db, "users", group.teacherId)).catch(() => null);
            if (tSnap && tSnap.exists()) {
              const tData = tSnap.data() as UserProfile;
              if (Array.isArray(tData.publishedLessons)) {
                tData.publishedLessons.forEach((les) => {
                  if (les && les.lessonId && les.groupId === groupId) {
                    lessonsMap.set(les.lessonId, les);
                  }
                });
              }
            }
          }
        }

        // Query all teachers in users collection to collect any publishedLessons
        const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
        const snapTeachers = await getDocs(qTeachers);
        snapTeachers.docs.forEach((d) => {
          const u = d.data() as UserProfile;
          if (Array.isArray(u.publishedLessons)) {
            u.publishedLessons.forEach((les) => {
              if (les && les.lessonId) {
                if (groupId ? les.groupId === groupId : true) {
                  if (!les.groupId || !deletedGroupIds.has(les.groupId)) {
                    lessonsMap.set(les.lessonId, les);
                  }
                }
              }
            });
          }
        });
      } catch (err: any) {
        console.warn("Firestore reading publishedLessons from teachers warning:", err?.message);
      }
    }

    // 3. From Local Cache
    const cached = getLocalLessons();
    cached.forEach((l) => {
      const gId = l.groupId;
      if (gId && deletedGroupIds.has(gId)) return;
      if (groupId ? gId === groupId : true) {
        if (!lessonsMap.has(l.lessonId)) {
          lessonsMap.set(l.lessonId, l);
        }
      }
    });

    const list = Array.from(lessonsMap.values());
    if (list.length > 0) {
      // Sync cache
      const currentAll = getLocalLessons();
      const merged = [...list];
      currentAll.forEach((item) => {
        if (!merged.some((m) => m.lessonId === item.lessonId)) {
          merged.push(item);
        }
      });
      saveLocalLessons(merged);
    }

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
    // 1. Try Firestore "lessons" doc
    try {
      const snap = await getDoc(doc(db, "lessons", lessonId));
      if (snap.exists()) return snap.data() as Lesson;
    } catch (err: any) {}

    // 2. Check local cache
    const cached = getLocalLessons();
    const foundCached = cached.find((l) => l.lessonId === lessonId);
    if (foundCached) return foundCached;

    // 3. Fallback: Search all teachers' publishedLessons in Firestore users collection
    try {
      const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapTeachers = await getDocs(qTeachers);
      for (const d of snapTeachers.docs) {
        const u = d.data() as UserProfile;
        if (Array.isArray(u.publishedLessons)) {
          const match = u.publishedLessons.find((l) => l && l.lessonId === lessonId);
          if (match) {
            saveLocalLessons([match, ...cached.filter((l) => l.lessonId !== lessonId)]);
            return match;
          }
        }
      }
    } catch {}

    return null;
  },

  async getTeacherLessons(teacherId: string): Promise<Lesson[]> {
    const lessonsMap = new Map<string, Lesson>();

    // 1. From Firestore "users/{teacherId}.publishedLessons"
    try {
      const teacherSnap = await getDoc(doc(db, "users", teacherId));
      if (teacherSnap.exists()) {
        const tData = teacherSnap.data() as UserProfile;
        if (Array.isArray(tData.publishedLessons)) {
          tData.publishedLessons.forEach((les) => {
            if (les && les.lessonId) lessonsMap.set(les.lessonId, les);
          });
        }
      }
    } catch {}

    // 2. Query Firestore "lessons" collection by teacherId
    try {
      const q = query(collection(db, "lessons"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const les = d.data() as Lesson;
        if (les && les.lessonId) lessonsMap.set(les.lessonId, les);
      });
    } catch (err: any) {}

    // 3. Query Firestore by teacher's groups
    try {
      const teacherGroups = await groupService.getTeacherGroups(teacherId).catch(() => []);
      for (const grp of teacherGroups) {
        if (grp.groupId) {
          const qG = query(collection(db, "lessons"), where("groupId", "==", grp.groupId));
          const snapG = await getDocs(qG);
          snapG.docs.forEach((d) => {
            const les = d.data() as Lesson;
            if (les && les.lessonId) lessonsMap.set(les.lessonId, les);
          });
        }
      }
    } catch (err: any) {}

    // 4. From Local Cache
    const cached = getLocalLessons();
    cached.forEach((l) => {
      if (l.teacherId === teacherId && !lessonsMap.has(l.lessonId)) {
        lessonsMap.set(l.lessonId, l);
      }
    });

    const list = Array.from(lessonsMap.values());
    if (list.length > 0) {
      const currentAll = getLocalLessons();
      const merged = [...list];
      currentAll.forEach((item) => {
        if (!merged.some((m) => m.lessonId === item.lessonId)) {
          merged.push(item);
        }
      });
      saveLocalLessons(merged);
    }

    return list.sort((a, b) => (b.lessonNumber || 0) - (a.lessonNumber || 0));
  },

  async getTodayLessonForStudent(studentId: string, preloadedGroups?: Group[]): Promise<{ lesson: Lesson; groupName: string } | null> {
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

    // 1. Cache immediately so lesson is NEVER lost
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
    // Ensures students across all browsers and devices immediately receive the lesson!
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

    // If currentUser is also a teacher and differs from teacherId, sync to currentUser as well
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
    const cached = getLocalLessons();
    saveLocalLessons(cached.filter((l) => l.lessonId !== lessonId));
    invalidateLessonsCache();

    try {
      await deleteDoc(doc(db, "lessons", lessonId));
    } catch (err: any) {}

    // Remove from teacher's publishedLessons
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
  },
};
