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
  attemptNumber?: number;
}

// Yordamchi: agar fanda savol umuman yo'q bo'lsa, test baribir ishlashi uchun demo savollar
function getFallbackQuestionsForSubject(subjectId: string, levelId: string): Question[] {
  return [
    {
      questionId: `fallback_${subjectId}_1`,
      subjectId,
      levelId,
      text: "Qaysi javob to'g'ri ta'riflangan?",
      imageUrl: null,
      options: [
        { id: "A", text: "To'g'ri variant" },
        { id: "B", text: "Noto'g'ri variant 1" },
        { id: "C", text: "Noto'g'ri variant 2" },
        { id: "D", text: "Noto'g'ri variant 3" },
      ],
      correctOptionId: "A",
      explanation: "A varianti to'g'ri javob hisoblanadi.",
      difficulty: 1,
      status: "approved",
    },
    {
      questionId: `fallback_${subjectId}_2`,
      subjectId,
      levelId,
      text: "Berilgan ma'lumotlar asosida to'g'ri xulosani tanlang:",
      imageUrl: null,
      options: [
        { id: "A", text: "Variant A" },
        { id: "B", text: "Variant B (To'g'ri)" },
        { id: "C", text: "Variant C" },
        { id: "D", text: "Variant D" },
      ],
      correctOptionId: "B",
      explanation: "B varianti mantiqan to'g'ri javob.",
      difficulty: 1,
      status: "approved",
    },
    {
      questionId: `fallback_${subjectId}_3`,
      subjectId,
      levelId,
      text: "Ushbu fanning asosiy tamoyillaridan biri qaysi?",
      imageUrl: null,
      options: [
        { id: "A", text: "Noto'g'ri variant" },
        { id: "B", text: "Noto'g'ri variant" },
        { id: "C", text: "Asosiy tamoyil (To'g'ri)" },
        { id: "D", text: "Qo'shimcha variant" },
      ],
      correctOptionId: "C",
      explanation: "C varianti asosiy tamoyilga mos keladi.",
      difficulty: 1,
      status: "approved",
    },
  ];
}

export const testService = {
  async startTest(subjectId: string, levelId: string): Promise<StartTestResponse> {
    try {
      const startTestFn = httpsCallable<{ subjectId: string; levelId: string }, StartTestResponse>(
        functions,
        "startTest"
      );
      const result = await startTestFn({ subjectId, levelId });
      if (result?.data?.sessionId && result?.data?.questions?.length > 0) {
        return result.data;
      }
      throw new Error("Cloud function did not return full session data");
    } catch (fnErr: any) {
      console.warn("Cloud function startTest unavailable or empty, using client direct mode:", fnErr);

      // Client Direct Mode
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Testni boshlash uchun avval tizimga kiring");

      // 1. Fetch Level (xavfsiz usulda, daraja topilmasa ham testni to'xtatmaymiz)
      let level: Partial<Level> = {};
      try {
        const lvlSnap = await getDoc(doc(db, "levels", levelId));
        if (lvlSnap.exists()) {
          level = lvlSnap.data() as Level;
        } else {
          const lSnap = await getDocs(query(collection(db, "levels"), where("levelId", "==", levelId)));
          if (!lSnap.empty) {
            level = lSnap.docs[0].data() as Level;
          }
        }
      } catch (e) {
        console.warn("Level fetch warning:", e);
      }

      // Agar darsdan general kelgan bo'lsa yoki subjectId berilmagan bo'lsa, darajaning haqiqiy subjectId sini olamiz
      if (level?.subjectId && (!subjectId || subjectId === "general")) {
        subjectId = level.subjectId;
      }

      // Fan nomini xatolik xabarida ko'rsatish uchun aniqlaymiz
      let subjectName = "Tanlangan fan";
      try {
        const subSnap = await getDoc(doc(db, "subjects", subjectId));
        if (subSnap.exists()) {
          subjectName = subSnap.data()?.name || "Tanlangan fan";
        }
      } catch (e) {
        console.warn("Subject fetch warning:", e);
      }

      // 2. Fetch Questions (FAQAT TANLANGAN FANGA TEGISHLI SAVOLLAR!)
      const qRef = collection(db, "questions");
      let allQuestions: Question[] = [];

      try {
        // Avval fanning shu darajasi bo'yicha savollarni qidiramiz
        const snap = await getDocs(
          query(qRef, where("subjectId", "==", subjectId), where("levelId", "==", levelId))
        );
        allQuestions = snap.docs
          .map((d) => ({ questionId: d.id, ...d.data() } as Question))
          .filter((q) => q.subjectId === subjectId);
      } catch (e) {
        console.warn("Questions level query error:", e);
      }

      // Agar aynan shu daraja bo'yicha topilmasa, lekin levelId berilgan bo'lsa
      // QAT'IY QOIDA: Faqat va faqat tanlangan fanga (subjectId) tegishli bo'lgan savollarnigina olamiz!
      if (allQuestions.length === 0 && levelId) {
        try {
          const lvlSnap = await getDocs(query(qRef, where("levelId", "==", levelId)));
          allQuestions = lvlSnap.docs
            .map((d) => ({ questionId: d.id, ...d.data() } as Question))
            .filter((q) => q.subjectId === subjectId);
        } catch (e) {
          console.warn("Questions by levelId query error:", e);
        }
      }

      // Agar ushbu darajada savollar bo'lmasa, FAQAT SHU FANNING (subjectId) boshqa savollarini qidiramiz
      if (allQuestions.length === 0) {
        try {
          const allSubSnap = await getDocs(query(qRef, where("subjectId", "==", subjectId)));
          allQuestions = allSubSnap.docs
            .map((d) => ({ questionId: d.id, ...d.data() } as Question))
            .filter((q) => q.subjectId === subjectId);
        } catch (e) {
          console.warn("Questions subject query error:", e);
        }
      }

      // QAT'IY TALAB: Boshqa fanlarning savollari HECH QACHON olinmaydi!
      // Agar bazada shu fan bo'yicha savollar bo'lmasa, aniq xatolik bildiramiz
      if (allQuestions.length === 0) {
        throw new Error(
          `"${subjectName}" fani bo'yicha bazada hali savollar mavjud emas. Iltimos, boshqa fanni tanlang yoki savollar yuklanishini kuting.`
        );
      }

      // 3. Shuffle & Pick questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const reqCount = level.questionsRequired || 20;
      const questionsCount = Math.min(reqCount, shuffled.length);
      const selected = shuffled.slice(0, questionsCount);

      const durationMin = level.durationMinutes || 40;
      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);
      const sessionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // User progress orqali hozirgi urinish raqamini aniqlash
      let currentAttempt = 1;
      try {
        const progressId = `${currentUser.uid}_${levelId || subjectId}`;
        const progSnap = await getDoc(doc(db, "user_progress", progressId));
        if (progSnap.exists()) {
          const prog = progSnap.data();
          currentAttempt = (Number(prog?.attempts) || 0) + 1;
        }
      } catch (e) {
        console.warn("Could not check attempts before start:", e);
      }

      // Savollarning to'liq ma'lumotlarini sessionDoc ichida saqlaymiz!
      // Bu sahifa yangilanganda ham, topshirilganda ham to'g'ri ishlashini 100% kafolatlaydi.
      const questionsData = selected.map((q) => {
        const qId = q.questionId || (q as any)._id || (q as any).id;
        return {
          questionId: qId,
          text: q.text || "Savol matni",
          imageUrl: q.imageUrl || null,
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : [
            { id: "A", text: "Variant A" },
            { id: "B", text: "Variant B" },
            { id: "C", text: "Variant C" },
            { id: "D", text: "Variant D" },
          ],
          correctOptionId: q.correctOptionId || "A",
          explanation: q.explanation || "",
          difficulty: q.difficulty || 1,
        };
      });

      const sessionDoc: any = {
        sessionId,
        userId: currentUser.uid,
        subjectId,
        levelId,
        status: "in_progress",
        questionIds: questionsData.map((q) => q.questionId),
        questionsData,
        answers: {},
        correctCount: 0,
        score: 0,
        earnedCoins: 0,
        penaltyCoins: 0,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        submittedAt: null,
        attemptNumber: currentAttempt,
        configSnapshot: {
          durationMinutes: durationMin,
          coinsPerCorrectAnswer: 1,
          penaltyCoins: 5,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, "test_sessions", sessionId), sessionDoc);
      } catch (e) {
        console.warn("Could not write test session to DB, continuing with local session:", e);
      }

      const safeQuestions: SafeTestQuestion[] = questionsData.map((q) => ({
        questionId: q.questionId,
        text: q.text,
        imageUrl: q.imageUrl,
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
        attemptNumber: currentAttempt,
      };
    }
  },

  async updateAnswers(sessionId: string, answers: Record<string, string>) {
    try {
      const sessionRef = doc(db, "test_sessions", sessionId);
      await updateDoc(sessionRef, {
        answers,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Failed to update answers:", e);
    }
  },

  async updateTestAnswers(sessionId: string, answers: Record<string, string>) {
    return this.updateAnswers(sessionId, answers);
  },

  async getSession(sessionId: string): Promise<TestSession | null> {
    try {
      const snap = await getDoc(doc(db, "test_sessions", sessionId));
      if (snap.exists()) {
        return snap.data() as TestSession;
      }
      // Query fallback
      const qSnap = await getDocs(
        query(collection(db, "test_sessions"), where("sessionId", "==", sessionId))
      );
      if (!qSnap.empty) {
        return qSnap.docs[0].data() as TestSession;
      }
      return null;
    } catch (e) {
      console.warn("getSession error:", e);
      return null;
    }
  },

  async submitTest(sessionId: string, answers: Record<string, string>): Promise<TestSubmitResult> {
    try {
      const submitTestFn = httpsCallable<{ sessionId: string; answers: Record<string, string> }, TestSubmitResult>(
        functions,
        "submitTest"
      );
      const result = await submitTestFn({ sessionId, answers });
      if (result?.data?.sessionId && typeof result.data.score === "number") {
        return result.data;
      }
      throw new Error("Cloud function did not return full submit result");
    } catch (fnErr: any) {
      console.warn("Cloud function submitTest unavailable or failed, using client direct mode:", fnErr);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Foydalanuvchi tizimga kirmagan");

      // 1. Sessiyani olish
      let session: TestSession | null = await this.getSession(sessionId);
      if (!session) {
        throw new Error("Test sessiyasi topilmadi");
      }

      const questionsReview: QuestionReviewItem[] = [];
      let correctCount = 0;

      // 2. Savollar va ularning to'g'ri javoblarini tekshirish
      // Agar sessiyaning o'zida questionsData bo'lsa, zudlik bilan undan foydalanamiz!
      const sessionAny = session as any;
      if (Array.isArray(sessionAny.questionsData) && sessionAny.questionsData.length > 0) {
        sessionAny.questionsData.forEach((qData: any) => {
          const qId = qData.questionId || qData.id || qData._id;
          const userAns = (answers[qId] || "").trim().toUpperCase();
          const correctAns = (qData.correctOptionId || "A").trim().toUpperCase();
          const isCorrect = !!userAns && userAns === correctAns;

          if (isCorrect) {
            correctCount++;
          }

          questionsReview.push({
            questionId: qId,
            text: qData.text,
            imageUrl: qData.imageUrl || null,
            options: qData.options || [],
            selectedOptionId: answers[qId] || null,
            correctOptionId: correctAns,
            isCorrect,
            explanation: qData.explanation || "",
            difficulty: qData.difficulty || 1,
          });
        });
      } else {
        // Fallback: Savollarni savollar to'plamidan qidiramiz
        const questionDocs = await Promise.all(
          (session.questionIds || []).map((qId) => getDoc(doc(db, "questions", qId)))
        );

        questionDocs.forEach((qSnap) => {
          if (qSnap.exists()) {
            const qData = qSnap.data() as Question;
            const qId = qData.questionId || qSnap.id;
            const userAns = (answers[qId] || answers[qSnap.id] || "").trim().toUpperCase();
            const correctAns = (qData.correctOptionId || "A").trim().toUpperCase();
            const isCorrect = !!userAns && userAns === correctAns;

            if (isCorrect) {
              correctCount++;
            }

            questionsReview.push({
              questionId: qId,
              text: qData.text,
              imageUrl: qData.imageUrl || null,
              options: qData.options,
              selectedOptionId: answers[qId] || answers[qSnap.id] || null,
              correctOptionId: correctAns,
              isCorrect,
              explanation: qData.explanation || "",
              difficulty: qData.difficulty,
            });
          }
        });
      }

      const totalQuestions = questionsReview.length || session.questionIds?.length || 1;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const isPassed = score >= 60;

      // 3. FOYDALANUVCHINING URINISHI VA BALL BERISH TIZIMI
      // Qoida:
      // 1-marta ishlaganda: har bir to'g'ri test uchun 1 bal
      // 2-marta urinishga: 0.5 bal
      // 3-marta urinishga: 0.3 bal
      // undan keyin esa: umuman bal bermasin (0 bal)
      const progressId = `${currentUser.uid}_${session.levelId || session.subjectId}`;
      const progRef = doc(db, "user_progress", progressId);

      let prevAttempts = 0;
      let prevProg: any = null;

      try {
        const progSnap = await getDoc(progRef);
        if (progSnap.exists()) {
          prevProg = progSnap.data();
          prevAttempts = Number(prevProg.attempts) || 0;
        } else {
          // Barcha user_progress to'plamidan qidirish
          const qSnap = await getDocs(
            query(
              collection(db, "user_progress"),
              where("userId", "==", currentUser.uid),
              where("levelId", "==", session.levelId)
            )
          );
          if (!qSnap.empty) {
            prevProg = qSnap.docs[0].data();
            prevAttempts = Number(prevProg?.attempts) || 0;
          }
        }
      } catch (e) {
        console.warn("Could not fetch user progress for attempts calculation:", e);
      }

      // Hozirgi urinish raqami (1, 2, 3, ...)
      const currentAttempt = prevAttempts + 1;

      let pointsPerCorrect = 0;
      if (currentAttempt === 1) {
        pointsPerCorrect = 1.0;
      } else if (currentAttempt === 2) {
        pointsPerCorrect = 0.5;
      } else if (currentAttempt === 3) {
        pointsPerCorrect = 0.3;
      } else {
        // 4-urinish va keyingi barcha urinishlar uchun umuman bal bermaymiz
        pointsPerCorrect = 0;
      }

      // Jami to'plangan ball
      const earnedCoins = Number((correctCount * pointsPerCorrect).toFixed(1));

      // 4. Sessiyani yangilash
      try {
        await updateDoc(doc(db, "test_sessions", sessionId), {
          status: "completed",
          answers,
          correctCount,
          score,
          earnedCoins,
          attemptNumber: currentAttempt,
          pointsPerCorrect,
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Could not update test session doc:", e);
      }

      // 5. User Progress ni yangilash
      try {
        if (prevProg) {
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
      } catch (e) {
        console.warn("Could not update user progress:", e);
      }

      // 6. Foydalanuvchining hisobini va statistikasini yangilash
      try {
        const userUpdate: any = {
          totalCorrectAnswers: increment(correctCount),
          testsCompleted: increment(1),
          lastActiveAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (earnedCoins > 0) {
          userUpdate.coinBalance = increment(earnedCoins);
        }

        await updateDoc(doc(db, "users", currentUser.uid), userUpdate);

        // Tranzaksiya yozish
        if (earnedCoins > 0) {
          const txId = `tx_${sessionId}_${Date.now()}`;
          await setDoc(doc(db, "coin_transactions", txId), {
            transactionId: txId,
            userId: currentUser.uid,
            amount: earnedCoins,
            type: "test_reward",
            reason: `Test topshirildi (${currentAttempt}-urinish, ${correctCount} to'g'ri, har biri ${pointsPerCorrect} ball)`,
            referenceId: sessionId,
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.warn("Could not update user stats/balance:", e);
      }

      return {
        sessionId,
        score,
        correctCount,
        totalQuestions,
        earnedCoins,
        isCompleted: true,
        questionsReview,
        attemptNumber: currentAttempt,
        pointsPerCorrect,
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
      try {
        await updateDoc(doc(db, "test_sessions", sessionId), {
          status: "abandoned",
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Could not mark session abandoned:", e);
      }
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
      try {
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
      } catch {
        return [];
      }
    }
  },
};
