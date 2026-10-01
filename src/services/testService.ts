import { httpsCallable } from "firebase/functions";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  limit,
} from "firebase/firestore";
import { db, functions, auth } from "../lib/firebase";
import {
  SafeTestQuestion,
  TestSession,
  TestSubmitResult,
  QuestionReviewItem,
  Question,
  Level,
} from "../types";

export interface StartTestResponse {
  sessionId: string;
  subjectId: string;
  levelId: string;
  startedAt: string;
  expiresAt: string;
  configSnapshot: {
    durationMinutes: number;
    coinsPerCorrectAnswer: number;
    penaltyCoins: number;
  };
  questions: SafeTestQuestion[];
}

export const testService = {
  async startTest(subjectId: string, levelId: string): Promise<StartTestResponse> {
    try {
      const startTestFn = httpsCallable<{ subjectId: string; levelId: string }, StartTestResponse>(
        functions,
        "startTest"
      );
      const result = await startTestFn({ subjectId, levelId });
      return result.data;
    } catch (fnErr: any) {
      console.warn("Cloud function startTest unavailable, using client direct mode:", fnErr);

      // Client Fallback
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Avval tizimga kiring");

      // 1. Fetch Level
      const lvlSnap = await getDoc(doc(db, "levels", levelId));
      if (!lvlSnap.exists()) throw new Error("Daraja topilmadi");
      const level = lvlSnap.data() as Level;

      // 2. Fetch Questions
      const qRef = collection(db, "questions");
      let snap = await getDocs(
        query(qRef, where("subjectId", "==", subjectId), where("levelId", "==", levelId))
      );

      let allQuestions = snap.docs.map((d) => d.data() as Question);
      if (allQuestions.length === 0) {
        // Fallback to any questions for this subject if specific level is empty
        const allSubSnap = await getDocs(query(qRef, where("subjectId", "==", subjectId)));
        allQuestions = allSubSnap.docs.map((d) => d.data() as Question);
      }

      if (allQuestions.length === 0) {
        throw new Error("Ushbu fan yoki daraja uchun hali savollar yuklanmagan. Admin paneldan savollar yuklang.");
      }

      // 3. Shuffle & Pick questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const questionsCount = Math.min(level.questionsRequired || 20, shuffled.length);
      const selected = shuffled.slice(0, questionsCount);

      const durationMin = level.durationMinutes || 40;
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
      const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const sessionDoc: TestSession = {
        sessionId,
        userId: currentUser.uid,
        subjectId,
        levelId,
        status: "in_progress",
        questionIds: selected.map((q) => q.questionId),
        answers: {},
        correctCount: 0,
        score: 0,
        earnedCoins: 0,
        penaltyCoins: 0,
        startedAt,
        expiresAt,
        submittedAt: null,
        configSnapshot: {
          durationMinutes: durationMin,
          coinsPerCorrectAnswer: 1,
          penaltyCoins: 5,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "test_sessions", sessionId), sessionDoc);

      const safeQuestions: SafeTestQuestion[] = selected.map((q) => ({
        questionId: q.questionId,
        text: q.text,
        imageUrl: q.imageUrl || null,
        options: q.options,
        difficulty: q.difficulty,
      }));

      return {
        sessionId,
        subjectId,
        levelId,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        configSnapshot: sessionDoc.configSnapshot,
        questions: safeQuestions,
      };
    }
  },

  async updateAnswers(sessionId: string, answers: Record<string, string>) {
    const sessionRef = doc(db, "test_sessions", sessionId);
    await updateDoc(sessionRef, {
      answers,
      updatedAt: serverTimestamp(),
    });
  },

  async updateTestAnswers(sessionId: string, answers: Record<string, string>) {
    return this.updateAnswers(sessionId, answers);
  },

  async getSession(sessionId: string): Promise<TestSession | null> {
    const snap = await getDoc(doc(db, "test_sessions", sessionId));
    if (!snap.exists()) return null;
    return snap.data() as TestSession;
  },

  async submitTest(sessionId: string, answers: Record<string, string>): Promise<TestSubmitResult> {
    try {
      const submitTestFn = httpsCallable<{ sessionId: string; answers: Record<string, string> }, TestSubmitResult>(
        functions,
        "submitTest"
      );
      const result = await submitTestFn({ sessionId, answers });
      return result.data;
    } catch (fnErr: any) {
      console.warn("Cloud function submitTest unavailable, using client mode:", fnErr);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Foydalanuvchi tizimga kirmagan");

      const sessionSnap = await getDoc(doc(db, "test_sessions", sessionId));
      if (!sessionSnap.exists()) throw new Error("Test sessiyasi topilmadi");
      const session = sessionSnap.data() as TestSession;

      const questionsReview: QuestionReviewItem[] = [];
      let correctCount = 0;

      const questionDocs = await Promise.all(
        session.questionIds.map((qId) => getDoc(doc(db, "questions", qId)))
      );

      questionDocs.forEach((qSnap) => {
        if (qSnap.exists()) {
          const qData = qSnap.data() as Question;
          const userAns = (answers[qData.questionId] || "").toUpperCase();
          const isCorrect = userAns === qData.correctOptionId?.toUpperCase();
          if (isCorrect) {
            correctCount++;
          }
          questionsReview.push({
            questionId: qData.questionId,
            text: qData.text,
            imageUrl: qData.imageUrl || null,
            options: qData.options,
            selectedOptionId: answers[qData.questionId] || null,
            correctOptionId: qData.correctOptionId || "A",
            isCorrect,
            explanation: qData.explanation || "",
            difficulty: qData.difficulty,
          });
        }
      });

      const totalQuestions = session.questionIds.length || 1;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const isPassed = score >= 70;
      const earnedCoins = correctCount * (session.configSnapshot?.coinsPerCorrectAnswer || 1);

      // Update session
      await updateDoc(doc(db, "test_sessions", sessionId), {
        status: "completed",
        answers,
        correctCount,
        score,
        earnedCoins,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update User Progress
      const progressId = `${currentUser.uid}_${session.levelId}`;
      const progRef = doc(db, "user_progress", progressId);
      const progSnap = await getDoc(progRef);

      if (progSnap.exists()) {
        const prevProg = progSnap.data();
        await updateDoc(progRef, {
          isCompleted: prevProg.isCompleted || isPassed,
          bestScorePercent: Math.max(prevProg.bestScorePercent || 0, score),
          attempts: increment(1),
          correctAnswersTotal: increment(correctCount),
          lastAttemptAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(progRef, {
          progressId,
          userId: currentUser.uid,
          subjectId: session.subjectId,
          levelId: session.levelId,
          isUnlocked: true,
          isCompleted: isPassed,
          bestScorePercent: score,
          attempts: 1,
          correctAnswersTotal: correctCount,
          unlockedAt: serverTimestamp(),
          lastAttemptAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Update user stats and balance
      await updateDoc(doc(db, "users", currentUser.uid), {
        coinBalance: increment(earnedCoins),
        totalCorrectAnswers: increment(correctCount),
        testsCompleted: increment(1),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        sessionId,
        score,
        correctCount,
        totalQuestions,
        earnedCoins,
        isCompleted: true,
        questionsReview,
      };
    }
  },

  async abandonTest(sessionId: string) {
    try {
      const abandonTestFn = httpsCallable<{ sessionId: string }, { success: boolean; penaltyCoins: number }>(
        functions,
        "abandonTest"
      );
      const result = await abandonTestFn({ sessionId });
      return result.data;
    } catch (fnErr) {
      await updateDoc(doc(db, "test_sessions", sessionId), {
        status: "abandoned",
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, penaltyCoins: 5 };
    }
  },

  async getUserSessions(userId: string, limitCount = 10): Promise<TestSession[]> {
    try {
      const q = query(
        collection(db, "test_sessions"),
        where("userId", "==", userId),
        limit(limitCount * 2)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as TestSession);
      return list
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, limitCount);
    } catch {
      const q = query(
        collection(db, "test_sessions"),
        where("userId", "==", userId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as TestSession);
      return list
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, limitCount);
    }
  },
};
