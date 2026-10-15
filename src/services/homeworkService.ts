import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Homework, HomeworkSubmission, HomeworkSubmissionStatus, UserProfile } from "../types";
import { lessonService } from "./lessonService";

const HOMEWORKS_CACHE_KEY = "fm_homeworks_cache";
const SUBMISSIONS_CACHE_KEY = "fm_homework_submissions_cache";

function getLocalHomeworks(): Homework[] {
  try {
    const raw = localStorage.getItem(HOMEWORKS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHomeworks(items: Homework[]): void {
  try {
    localStorage.setItem(HOMEWORKS_CACHE_KEY, JSON.stringify(items));
  } catch {}
}

function getLocalSubmissions(): HomeworkSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSubmissions(items: HomeworkSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSIONS_CACHE_KEY, JSON.stringify(items));
  } catch {}
}

export const homeworkService = {
  async getHomeworkById(homeworkId: string): Promise<Homework | null> {
    try {
      const snap = await getDoc(doc(db, "homeworks", homeworkId));
      if (snap.exists()) return snap.data() as Homework;
    } catch (err: any) {}

    const cached = getLocalHomeworks();
    const foundCached = cached.find((h) => h.homeworkId === homeworkId);
    if (foundCached) return foundCached;

    // Search teachers' publishedHomeworks in Firestore
    try {
      const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapTeachers = await getDocs(qTeachers);
      for (const d of snapTeachers.docs) {
        const u = d.data() as UserProfile;
        if (Array.isArray(u.publishedHomeworks)) {
          const match = u.publishedHomeworks.find((h) => h && h.homeworkId === homeworkId);
          if (match) {
            saveLocalHomeworks([match, ...cached.filter((h) => h.homeworkId !== homeworkId)]);
            return match;
          }
        }
      }
    } catch {}

    return null;
  },

  async getHomeworkByLesson(lessonId: string): Promise<Homework | null> {
    try {
      const q = query(collection(db, "homeworks"), where("lessonId", "==", lessonId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const hw = snap.docs[0].data() as Homework;
        const cached = getLocalHomeworks();
        saveLocalHomeworks([hw, ...cached.filter((h) => h.homeworkId !== hw.homeworkId)]);
        return hw;
      }
    } catch (err: any) {}

    const cached = getLocalHomeworks();
    const foundCached = cached.find((h) => h.lessonId === lessonId);
    if (foundCached) return foundCached;

    // Search teachers' publishedHomeworks in Firestore
    try {
      const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapTeachers = await getDocs(qTeachers);
      for (const d of snapTeachers.docs) {
        const u = d.data() as UserProfile;
        if (Array.isArray(u.publishedHomeworks)) {
          const match = u.publishedHomeworks.find((h) => h && h.lessonId === lessonId);
          if (match) {
            saveLocalHomeworks([match, ...cached.filter((h) => h.homeworkId !== match.homeworkId)]);
            return match;
          }
        }
      }
    } catch {}

    // 4. Auto-generate from lesson if no separate homework was explicitly created
    try {
      const les = await lessonService.getLessonById(lessonId);
      if (les) {
        const autoHw: Homework = {
          homeworkId: les.homeworkId || `hw_${les.lessonId}`,
          lessonId: les.lessonId,
          groupId: les.groupId,
          teacherId: les.teacherId,
          title: `${les.title} - Uy vazifasi`,
          instructions: les.description || `${les.title} mavzusi yuzasidan berilgan topshiriq va mashqlarni bajaring.`,
          maxScore: 100,
          deadline: les.scheduledDate || "",
          lessonTitle: les.title,
          attachments: [],
          createdAt: les.createdAt,
          updatedAt: les.updatedAt,
        };
        saveLocalHomeworks([autoHw, ...cached.filter((h) => h.homeworkId !== autoHw.homeworkId)]);
        return autoHw;
      }
    } catch {}

    return null;
  },

  async getGroupHomeworks(groupIds: string[]): Promise<Homework[]> {
    if (!groupIds || groupIds.length === 0) return [];
    const resultMap = new Map<string, Homework>();

    for (const gId of groupIds) {
      try {
        const q = query(collection(db, "homeworks"), where("groupId", "==", gId));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          const hw = d.data() as Homework;
          if (hw && hw.homeworkId) resultMap.set(hw.homeworkId, hw);
        });
      } catch (err: any) {}
    }

    // Query teachers' publishedHomeworks from Firestore
    try {
      const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapTeachers = await getDocs(qTeachers);
      snapTeachers.docs.forEach((d) => {
        const u = d.data() as UserProfile;
        if (Array.isArray(u.publishedHomeworks)) {
          u.publishedHomeworks.forEach((h) => {
            if (h && h.homeworkId && groupIds.includes(h.groupId)) {
              resultMap.set(h.homeworkId, h);
            }
          });
        }
      });
    } catch {}

    // Auto-include homework for any group lessons that don't have separate homework docs
    for (const gId of groupIds) {
      try {
        const groupLessons = await lessonService.getLessons(gId);
        for (const les of groupLessons) {
          const hwId = les.homeworkId || `hw_${les.lessonId}`;
          const alreadyHasLessonHw = Array.from(resultMap.values()).some((h) => h.lessonId === les.lessonId);
          if (!resultMap.has(hwId) && !alreadyHasLessonHw) {
            resultMap.set(hwId, {
              homeworkId: hwId,
              lessonId: les.lessonId,
              groupId: les.groupId,
              teacherId: les.teacherId,
              title: `${les.title} - Uy vazifasi`,
              instructions: les.description || `${les.title} mavzusi yuzasidan topshiriq va mashqlarni bajaring.`,
              maxScore: 100,
              deadline: les.scheduledDate || "",
              lessonTitle: les.title,
              attachments: [],
              createdAt: les.createdAt,
              updatedAt: les.updatedAt,
            });
          }
        }
      } catch {}
    }

    // Merge from local cache
    const cached = getLocalHomeworks();
    for (const ch of cached) {
      if (groupIds.includes(ch.groupId) && !resultMap.has(ch.homeworkId)) {
        resultMap.set(ch.homeworkId, ch);
      }
    }

    const result = Array.from(resultMap.values());
    if (result.length > 0) {
      const allCached = getLocalHomeworks();
      const merged = [...result];
      for (const item of allCached) {
        if (!merged.some((m) => m.homeworkId === item.homeworkId)) {
          merged.push(item);
        }
      }
      saveLocalHomeworks(merged);
    }

    return result.sort((a, b) => {
      const aSec = a.createdAt?.seconds || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() / 1000 : 0);
      const bSec = b.createdAt?.seconds || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async getTeacherHomeworks(teacherId: string): Promise<Homework[]> {
    const hwMap = new Map<string, Homework>();

    // 1. Read teacher doc publishedHomeworks
    try {
      const tSnap = await getDoc(doc(db, "users", teacherId));
      if (tSnap.exists()) {
        const tData = tSnap.data() as UserProfile;
        if (Array.isArray(tData.publishedHomeworks)) {
          tData.publishedHomeworks.forEach((h) => {
            if (h && h.homeworkId) hwMap.set(h.homeworkId, h);
          });
        }
      }
    } catch {}

    // 2. Query Firestore homeworks collection
    try {
      const q = query(collection(db, "homeworks"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const hw = d.data() as Homework;
        if (hw && hw.homeworkId) hwMap.set(hw.homeworkId, hw);
      });
    } catch {}

    // 3. Local cache
    const cached = getLocalHomeworks().filter((h) => h.teacherId === teacherId);
    cached.forEach((h) => {
      if (!hwMap.has(h.homeworkId)) hwMap.set(h.homeworkId, h);
    });

    const list = Array.from(hwMap.values());
    if (list.length > 0) {
      const allCached = getLocalHomeworks();
      const merged = [...list];
      for (const ch of allCached) {
        if (!merged.some((m) => m.homeworkId === ch.homeworkId)) merged.push(ch);
      }
      saveLocalHomeworks(merged);
    }

    return list;
  },

  async saveHomework(data: Partial<Homework>): Promise<Homework> {
    const hwRef = data.homeworkId
      ? doc(db, "homeworks", data.homeworkId)
      : doc(collection(db, "homeworks"));

    const homeworkId = hwRef.id;
    const teacherId = data.teacherId || auth.currentUser?.uid || "";
    const docData: Homework = {
      homeworkId,
      lessonId: data.lessonId || "",
      groupId: data.groupId || "",
      teacherId,
      title: data.title || "Uy vazifasi",
      instructions: data.instructions || "",
      maxScore: data.maxScore !== undefined ? Number(data.maxScore) : 100,
      deadline: data.deadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      lessonTitle: data.lessonTitle || "",
      groupName: data.groupName || "",
      attachments: Array.isArray(data.attachments) ? data.attachments : [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Cache immediately
    const cached = getLocalHomeworks();
    saveLocalHomeworks([docData, ...cached.filter((h) => h.homeworkId !== homeworkId)]);

    // 2. Write to Firestore collection "homeworks"
    try {
      await setDoc(hwRef, {
        ...docData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (docData.lessonId) {
        await updateDoc(doc(db, "lessons", docData.lessonId), {
          homeworkId,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (err: any) {}

    // 3. Authoritative sync to teacher doc in Firestore (users/{teacherId}.publishedHomeworks)
    if (teacherId) {
      try {
        const teacherRef = doc(db, "users", teacherId);
        const tSnap = await getDoc(teacherRef);
        let existingHw: Homework[] = [];
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          existingHw = Array.isArray(tData.publishedHomeworks) ? tData.publishedHomeworks : [];
        }
        const updatedPublishedHw = [
          ...existingHw.filter((h) => h.homeworkId !== homeworkId),
          docData,
        ];
        await setDoc(
          teacherRef,
          {
            publishedHomeworks: updatedPublishedHw,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn("Firestore sync homework to teacher doc warning:", err?.message);
      }
    }

    return docData;
  },

  async submitHomework(params: {
    homeworkId?: string;
    lessonId?: string;
    studentId: string;
    studentName?: string;
    teacherId?: string;
    textAnswer: string;
    fileUrls?: string[];
  }): Promise<HomeworkSubmission> {
    const effectiveHwId = params.homeworkId || (params.lessonId ? `hw_${params.lessonId}` : `hw_${Date.now()}`);
    const submissionId = `sub_${effectiveHwId}_${params.studentId}`;
    const subRef = doc(db, "homework_submissions", submissionId);

    // Resolve teacherId if missing
    let resolvedTeacherId = params.teacherId || "";
    if (!resolvedTeacherId && params.lessonId) {
      try {
        const les = await lessonService.getLessonById(params.lessonId);
        if (les?.teacherId) resolvedTeacherId = les.teacherId;
      } catch {}
    }
    if (!resolvedTeacherId && params.studentId) {
      try {
        const sSnap = await getDoc(doc(db, "users", params.studentId));
        if (sSnap.exists()) {
          const sData = sSnap.data() as UserProfile;
          if (sData.teacherId) resolvedTeacherId = sData.teacherId;
          else if (Array.isArray(sData.enrolledGroups) && sData.enrolledGroups[0]?.teacherId) {
            resolvedTeacherId = sData.enrolledGroups[0].teacherId;
          }
        }
      } catch {}
    }

    const submission: HomeworkSubmission = {
      submissionId,
      homeworkId: effectiveHwId,
      lessonId: params.lessonId || "",
      studentId: params.studentId || "",
      studentName: params.studentName || "O'quvchi",
      teacherId: resolvedTeacherId,
      textAnswer: params.textAnswer || "",
      fileUrls: Array.isArray(params.fileUrls) ? params.fileUrls : [],
      status: "SUBMITTED",
      score: null,
      teacherComment: null,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Cache immediately
    const cached = getLocalSubmissions();
    saveLocalSubmissions([submission, ...cached.filter((s) => s.submissionId !== submissionId)]);

    // 2. Write to Firestore collection "homework_submissions"
    try {
      await setDoc(subRef, {
        ...submission,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {}

    // 3. Sync to student doc in Firestore (users/{studentId}.submissions)
    if (params.studentId) {
      try {
        const studentRef = doc(db, "users", params.studentId);
        const sSnap = await getDoc(studentRef);
        let existingSubs: HomeworkSubmission[] = [];
        if (sSnap.exists()) {
          const sData = sSnap.data() as UserProfile;
          existingSubs = Array.isArray(sData.submissions) ? sData.submissions : [];
        }
        const updatedSubs = [
          ...existingSubs.filter((s) => s.submissionId !== submissionId),
          submission,
        ];
        await setDoc(
          studentRef,
          {
            submissions: updatedSubs,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn("Firestore sync submission to student doc warning:", err?.message);
      }
    }

    // 4. Sync to teacher doc in Firestore (users/{resolvedTeacherId}.studentSubmissions)
    if (resolvedTeacherId) {
      try {
        const teacherRef = doc(db, "users", resolvedTeacherId);
        const tSnap = await getDoc(teacherRef);
        let existingTSubs: HomeworkSubmission[] = [];
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          existingTSubs = Array.isArray(tData.studentSubmissions) ? tData.studentSubmissions : [];
        }
        const updatedTSubs = [
          ...existingTSubs.filter((s) => s.submissionId !== submissionId),
          submission,
        ];
        await setDoc(
          teacherRef,
          {
            studentSubmissions: updatedTSubs,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn("Firestore sync submission to teacher doc warning:", err?.message);
      }
    }

    return submission;
  },

  async getStudentSubmissions(studentId: string): Promise<HomeworkSubmission[]> {
    const subsMap = new Map<string, HomeworkSubmission>();

    // 1. From student user doc
    try {
      const sSnap = await getDoc(doc(db, "users", studentId));
      if (sSnap.exists()) {
        const sData = sSnap.data() as UserProfile;
        if (Array.isArray(sData.submissions)) {
          sData.submissions.forEach((s) => {
            if (s && s.submissionId) subsMap.set(s.submissionId, s);
          });
        }
      }
    } catch {}

    // 2. From Firestore collection
    try {
      const q = query(
        collection(db, "homework_submissions"),
        where("studentId", "==", studentId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const s = d.data() as HomeworkSubmission;
        if (s && s.submissionId) subsMap.set(s.submissionId, s);
      });
    } catch {}

    // 3. Local cache
    const cached = getLocalSubmissions().filter((s) => s.studentId === studentId);
    cached.forEach((s) => {
      if (!subsMap.has(s.submissionId)) subsMap.set(s.submissionId, s);
    });

    const list = Array.from(subsMap.values());
    if (list.length > 0) {
      const allCached = getLocalSubmissions();
      const merged = [...list];
      for (const cs of allCached) {
        if (!merged.some((m) => m.submissionId === cs.submissionId)) merged.push(cs);
      }
      saveLocalSubmissions(merged);
    }

    return list.sort((a, b) => {
      const aSec = a.submittedAt?.seconds || (typeof a.submittedAt === "string" ? new Date(a.submittedAt).getTime() / 1000 : 0);
      const bSec = b.submittedAt?.seconds || (typeof b.submittedAt === "string" ? new Date(b.submittedAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async getTeacherSubmissions(teacherId: string): Promise<HomeworkSubmission[]> {
    const subsMap = new Map<string, HomeworkSubmission>();

    // 1. From teacher user doc
    try {
      const tSnap = await getDoc(doc(db, "users", teacherId));
      if (tSnap.exists()) {
        const tData = tSnap.data() as UserProfile;
        if (Array.isArray(tData.studentSubmissions)) {
          tData.studentSubmissions.forEach((s) => {
            if (s && s.submissionId) subsMap.set(s.submissionId, s);
          });
        }
      }
    } catch {}

    // 2. From Firestore collection
    try {
      const q = query(
        collection(db, "homework_submissions"),
        where("teacherId", "==", teacherId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const s = d.data() as HomeworkSubmission;
        if (s && s.submissionId) subsMap.set(s.submissionId, s);
      });
    } catch {}

    // 2b. From all students' submissions in Firestore users collection
    try {
      const qStudents = query(collection(db, "users"), where("role", "==", "student"));
      const snapStudents = await getDocs(qStudents);
      snapStudents.docs.forEach((d) => {
        const sData = d.data() as UserProfile;
        if (Array.isArray(sData.submissions)) {
          sData.submissions.forEach((s) => {
            if (s && s.submissionId) {
              if (s.teacherId === teacherId || !s.teacherId) {
                if (!subsMap.has(s.submissionId)) {
                  subsMap.set(s.submissionId, s);
                }
              }
            }
          });
        }
      });
    } catch {}

    // 3. From Local cache
    const cached = getLocalSubmissions().filter((s) => s.teacherId === teacherId);
    cached.forEach((s) => {
      if (!subsMap.has(s.submissionId)) subsMap.set(s.submissionId, s);
    });

    const list = Array.from(subsMap.values());
    if (list.length > 0) {
      const allCached = getLocalSubmissions();
      const merged = [...list];
      for (const cs of allCached) {
        if (!merged.some((m) => m.submissionId === cs.submissionId)) merged.push(cs);
      }
      saveLocalSubmissions(merged);
    }

    return list.sort((a, b) => {
      const aSec = a.submittedAt?.seconds || (typeof a.submittedAt === "string" ? new Date(a.submittedAt).getTime() / 1000 : 0);
      const bSec = b.submittedAt?.seconds || (typeof b.submittedAt === "string" ? new Date(b.submittedAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async gradeSubmission(
    submissionId: string,
    score: number,
    teacherComment: string
  ): Promise<void> {
    const reviewedAt = new Date().toISOString();

    // 1. Update cache
    const cached = getLocalSubmissions();
    let targetSub: HomeworkSubmission | undefined;
    const updated = cached.map((s) => {
      if (s.submissionId === submissionId) {
        targetSub = {
          ...s,
          score,
          teacherComment,
          status: "COMPLETED" as const,
          reviewedAt,
        };
        return targetSub;
      }
      return s;
    });
    saveLocalSubmissions(updated);

    // 2. Update Firestore collection
    try {
      const subRef = doc(db, "homework_submissions", submissionId);
      await updateDoc(subRef, {
        score,
        teacherComment,
        status: "COMPLETED",
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {}

    // 3. Update in teacher's user doc
    const teacherId = targetSub?.teacherId || auth.currentUser?.uid;
    if (teacherId) {
      try {
        const teacherRef = doc(db, "users", teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          if (Array.isArray(tData.studentSubmissions)) {
            const updatedTSubs = tData.studentSubmissions.map((s) =>
              s.submissionId === submissionId
                ? { ...s, score, teacherComment, status: "COMPLETED" as const, reviewedAt }
                : s
            );
            await setDoc(teacherRef, { studentSubmissions: updatedTSubs }, { merge: true });
          }
        }
      } catch {}
    }

    // 4. Update in student's user doc
    let studentId = targetSub?.studentId;
    if (!studentId) {
      try {
        const qStudents = query(collection(db, "users"), where("role", "==", "student"));
        const snapStudents = await getDocs(qStudents);
        for (const d of snapStudents.docs) {
          const sData = d.data() as UserProfile;
          if (Array.isArray(sData.submissions) && sData.submissions.some((s) => s.submissionId === submissionId)) {
            studentId = d.id;
            break;
          }
        }
      } catch {}
    }

    if (studentId) {
      try {
        const studentRef = doc(db, "users", studentId);
        const sSnap = await getDoc(studentRef);
        if (sSnap.exists()) {
          const sData = sSnap.data() as UserProfile;
          if (Array.isArray(sData.submissions)) {
            const updatedSubs = sData.submissions.map((s) =>
              s.submissionId === submissionId
                ? { ...s, score, teacherComment, status: "COMPLETED" as const, reviewedAt }
                : s
            );
            await setDoc(studentRef, { submissions: updatedSubs }, { merge: true });
          }
        }
      } catch {}
    }

    // 5. Award coins (Tillo) to the student according to the awarded score!
    if (studentId && score > 0) {
      try {
        const studentRef = doc(db, "users", studentId);
        await updateDoc(studentRef, {
          coinBalance: increment(score),
          updatedAt: serverTimestamp(),
        });

        // Record coin transaction in coin_transactions
        const txId = `tx_hw_${Date.now()}_${studentId}`;
        await setDoc(doc(db, "coin_transactions", txId), {
          transactionId: txId,
          userId: studentId,
          amount: score,
          type: "homework_reward",
          description: `Uy vazifasi baholandi (+${score} Tillo tangasi)`,
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.warn("Coin award for homework warning:", err?.message);
      }
    }
  },
};
