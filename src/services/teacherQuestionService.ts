import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { TeacherQuestion, TeacherQuestionStatus } from "../types";

const QUESTIONS_CACHE_KEY = "fm_teacher_questions_cache";

function getLocalQuestions(): TeacherQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalQuestions(items: TeacherQuestion[]): void {
  try {
    localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(items));
  } catch {}
}

export const teacherQuestionService = {
  async askQuestion(data: {
    studentId: string;
    studentName: string;
    studentPhoto?: string | null;
    teacherId: string;
    teacherName?: string;
    groupId?: string;
    groupName?: string;
    lessonId?: string;
    subjectId?: string;
    text: string;
    imageUrl?: string | null;
    attachmentUrl?: string | null;
  }): Promise<TeacherQuestion> {
    const qRef = doc(collection(db, "teacher_questions"));
    const questionId = qRef.id;

    const question: TeacherQuestion = {
      questionId,
      studentId: data.studentId || "",
      studentName: data.studentName || "O'quvchi",
      studentPhoto: data.studentPhoto || null,
      teacherId: data.teacherId || "teacher",
      teacherName: data.teacherName || "",
      groupId: data.groupId || "",
      groupName: data.groupName || "",
      lessonId: data.lessonId || "",
      subjectId: data.subjectId || "",
      text: data.text || "",
      imageUrl: data.imageUrl || null,
      attachmentUrl: data.attachmentUrl || null,
      status: "NEW",
      answerText: null,
      videoAnswerUrl: null,
      createdAt: new Date().toISOString(),
      answeredAt: null,
    };

    // 1. Cache immediately
    const cached = getLocalQuestions();
    saveLocalQuestions([question, ...cached.filter((q) => q.questionId !== questionId)]);

    // 2. Write to student's user doc in Firestore (users/{studentId}.askedQuestions)
    if (question.studentId) {
      try {
        const sRef = doc(db, "users", question.studentId);
        const sSnap = await getDoc(sRef);
        let existing: TeacherQuestion[] = [];
        if (sSnap.exists()) {
          const sData = sSnap.data();
          existing = Array.isArray(sData.askedQuestions) ? sData.askedQuestions : [];
        }
        const updated = [...existing.filter((q) => q.questionId !== questionId), question];
        await setDoc(sRef, { askedQuestions: updated, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err: any) {
        console.warn("Firestore sync question to student doc warning:", err?.message);
      }
    }

    // 3. Write to teacher's user doc in Firestore (users/{teacherId}.receivedQuestions)
    if (question.teacherId && question.teacherId !== "teacher") {
      try {
        const tRef = doc(db, "users", question.teacherId);
        const tSnap = await getDoc(tRef);
        let existing: TeacherQuestion[] = [];
        if (tSnap.exists()) {
          const tData = tSnap.data();
          existing = Array.isArray(tData.receivedQuestions) ? tData.receivedQuestions : [];
        }
        const updated = [...existing.filter((q) => q.questionId !== questionId), question];
        await setDoc(tRef, { receivedQuestions: updated, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err: any) {
        console.warn("Firestore sync question to teacher doc warning:", err?.message);
      }
    }

    // 4. Also try writing to Firestore collection "teacher_questions"
    try {
      await setDoc(qRef, {
        ...question,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {}

    return question;
  },

  async getStudentQuestions(studentId: string): Promise<TeacherQuestion[]> {
    const qMap = new Map<string, TeacherQuestion>();

    // 1. From student user doc
    try {
      const sSnap = await getDoc(doc(db, "users", studentId));
      if (sSnap.exists()) {
        const sData = sSnap.data();
        if (Array.isArray(sData.askedQuestions)) {
          sData.askedQuestions.forEach((q: TeacherQuestion) => {
            if (q && q.questionId) qMap.set(q.questionId, q);
          });
        }
      }
    } catch {}

    // 2. From Firestore collection
    try {
      const q = query(collection(db, "teacher_questions"), where("studentId", "==", studentId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const item = d.data() as TeacherQuestion;
        if (item && item.questionId) qMap.set(item.questionId, item);
      });
    } catch {}

    // 3. From Local Cache
    const cached = getLocalQuestions().filter((q) => q.studentId === studentId);
    cached.forEach((q) => {
      if (!qMap.has(q.questionId)) qMap.set(q.questionId, q);
    });

    const list = Array.from(qMap.values());
    if (list.length > 0) {
      const allCached = getLocalQuestions();
      const merged = [...list];
      for (const cq of allCached) {
        if (!merged.some((m) => m.questionId === cq.questionId)) {
          merged.push(cq);
        }
      }
      saveLocalQuestions(merged);
    }

    return list.sort((a, b) => {
      const aSec = a.createdAt?.seconds || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() / 1000 : 0);
      const bSec = b.createdAt?.seconds || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async getTeacherQuestions(
    teacherId: string,
    statusFilter?: TeacherQuestionStatus
  ): Promise<TeacherQuestion[]> {
    const qMap = new Map<string, TeacherQuestion>();

    // 1. From teacher user doc (users/{teacherId}.receivedQuestions)
    try {
      const tSnap = await getDoc(doc(db, "users", teacherId));
      if (tSnap.exists()) {
        const tData = tSnap.data();
        if (Array.isArray(tData.receivedQuestions)) {
          tData.receivedQuestions.forEach((q: TeacherQuestion) => {
            if (q && q.questionId) qMap.set(q.questionId, q);
          });
        }
      }
    } catch {}

    // 2. From Firestore collection
    try {
      const q = query(collection(db, "teacher_questions"), where("teacherId", "==", teacherId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const item = d.data() as TeacherQuestion;
        if (item && item.questionId) qMap.set(item.questionId, item);
      });
    } catch {}

    // 3. Fallback scan all users (students) in users collection to collect any questions targeted to this teacher
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.docs.forEach((d) => {
        const uData = d.data();
        if (Array.isArray(uData.askedQuestions)) {
          uData.askedQuestions.forEach((q: TeacherQuestion) => {
            if (q && q.questionId) {
              const isMatch = q.teacherId === teacherId || (!q.teacherId || q.teacherId === "teacher");
              if (isMatch) {
                if (!qMap.has(q.questionId)) {
                  qMap.set(q.questionId, { ...q, teacherId });
                }
              }
            }
          });
        }
      });
    } catch {}

    // 4. From Local Cache
    const cached = getLocalQuestions().filter((q) => q.teacherId === teacherId);
    cached.forEach((q) => {
      if (!qMap.has(q.questionId)) qMap.set(q.questionId, q);
    });

    let list = Array.from(qMap.values());
    if (list.length > 0) {
      const allCached = getLocalQuestions();
      const merged = [...list];
      for (const cq of allCached) {
        if (!merged.some((m) => m.questionId === cq.questionId)) {
          merged.push(cq);
        }
      }
      saveLocalQuestions(merged);
    }

    if (statusFilter) {
      list = list.filter((item) => item.status === statusFilter);
    }

    return list.sort((a, b) => {
      const aSec = a.createdAt?.seconds || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() / 1000 : 0);
      const bSec = b.createdAt?.seconds || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async answerQuestion(
    questionId: string,
    answerText: string,
    videoAnswerUrl?: string
  ): Promise<void> {
    const answeredAt = new Date().toISOString();

    // 1. Update cache
    const cached = getLocalQuestions();
    let targetQ: TeacherQuestion | undefined;
    const updated = cached.map((q) => {
      if (q.questionId === questionId) {
        targetQ = {
          ...q,
          answerText,
          videoAnswerUrl: videoAnswerUrl || null,
          status: "ANSWERED" as TeacherQuestionStatus,
          answeredAt,
        };
        return targetQ;
      }
      return q;
    });
    saveLocalQuestions(updated);

    // 2. Search targetQ from users if not in cache
    if (!targetQ) {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        for (const d of usersSnap.docs) {
          const uData = d.data();
          if (Array.isArray(uData.receivedQuestions)) {
            const match = uData.receivedQuestions.find((q: any) => q.questionId === questionId);
            if (match) {
              targetQ = { ...match, answerText, videoAnswerUrl: videoAnswerUrl || null, status: "ANSWERED", answeredAt };
              break;
            }
          }
          if (!targetQ && Array.isArray(uData.askedQuestions)) {
            const match = uData.askedQuestions.find((q: any) => q.questionId === questionId);
            if (match) {
              targetQ = { ...match, answerText, videoAnswerUrl: videoAnswerUrl || null, status: "ANSWERED", answeredAt };
              break;
            }
          }
        }
      } catch {}
    }

    const effectiveTarget = targetQ || {
      questionId,
      answerText,
      videoAnswerUrl: videoAnswerUrl || null,
      status: "ANSWERED" as TeacherQuestionStatus,
      answeredAt,
    };

    // 3. Update teacher doc in Firestore (users/{teacherId}.receivedQuestions)
    const teacherId = targetQ?.teacherId;
    if (teacherId && teacherId !== "teacher") {
      try {
        const tRef = doc(db, "users", teacherId);
        const tSnap = await getDoc(tRef);
        if (tSnap.exists()) {
          const tData = tSnap.data();
          const existing = Array.isArray(tData.receivedQuestions) ? tData.receivedQuestions : [];
          const updatedT = existing.map((q: any) =>
            q.questionId === questionId
              ? { ...q, answerText, videoAnswerUrl: videoAnswerUrl || null, status: "ANSWERED", answeredAt }
              : q
          );
          await setDoc(tRef, { receivedQuestions: updatedT, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err: any) {
        console.warn("Firestore update teacher receivedQuestions warning:", err?.message);
      }
    }

    // 4. Update student doc in Firestore (users/{studentId}.askedQuestions)
    let studentId = targetQ?.studentId;
    if (!studentId) {
      // Find which student asked this question
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        for (const d of usersSnap.docs) {
          const uData = d.data();
          if (Array.isArray(uData.askedQuestions) && uData.askedQuestions.some((q: any) => q.questionId === questionId)) {
            studentId = d.id;
            break;
          }
        }
      } catch {}
    }

    if (studentId) {
      try {
        const sRef = doc(db, "users", studentId);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const sData = sSnap.data();
          const existing = Array.isArray(sData.askedQuestions) ? sData.askedQuestions : [];
          const updatedS = existing.map((q: any) =>
            q.questionId === questionId
              ? { ...q, answerText, videoAnswerUrl: videoAnswerUrl || null, status: "ANSWERED", answeredAt }
              : q
          );
          await setDoc(sRef, { askedQuestions: updatedS, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch (err: any) {
        console.warn("Firestore update student askedQuestions warning:", err?.message);
      }
    }

    // 5. Update Firestore collection if accessible
    try {
      const qRef = doc(db, "teacher_questions", questionId);
      await updateDoc(qRef, {
        answerText,
        videoAnswerUrl: videoAnswerUrl || null,
        status: "ANSWERED",
        answeredAt: serverTimestamp(),
      });
    } catch (err: any) {}
  },
};
