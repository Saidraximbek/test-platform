import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAuth, validateInput } from "../middleware/auth";
import { SubmitTestSchema } from "../schemas";
import { CoinTransactionDoc, QuestionDoc, TestSessionDoc, UserDoc, UserProgressDoc } from "../types";
import { sendNotification } from "../utils/notifications";

export const submitTest = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { sessionId, answers } = validateInput(SubmitTestSchema, data);
  const userId = context.auth.uid;

  const sessionRef = db.collection("test_sessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Test sessiyasi topilmadi");
  }

  const session = sessionSnap.data() as TestSessionDoc;

  if (session.userId !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Ushbu test sizga tegishli emas");
  }

  if (session.status !== "in_progress") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Test allaqachon yakunlangan (${session.status})`
    );
  }

  // Load question docs
  const questionDocs: QuestionDoc[] = [];
  for (const qId of session.questionIds) {
    const qSnap = await db.collection("questions").doc(qId).get();
    if (qSnap.exists) {
      questionDocs.push(qSnap.data() as QuestionDoc);
    }
  }

  // Combine any updated answers from payload with session.answers
  const finalAnswers: Record<string, string> = {
    ...session.answers,
    ...answers,
  };

  let correctCount = 0;
  const questionsReview = questionDocs.map((q) => {
    const selectedOptionId = finalAnswers[q.questionId] || null;
    const isCorrect = selectedOptionId === q.correctOptionId;
    if (isCorrect) {
      correctCount++;
    }

    return {
      questionId: q.questionId,
      text: q.text,
      imageUrl: q.imageUrl,
      options: q.options,
      selectedOptionId,
      correctOptionId: q.correctOptionId,
      isCorrect,
      explanation: q.explanation,
      difficulty: q.difficulty,
    };
  });

  const totalQuestions = questionDocs.length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const earnedCoins = correctCount * (session.configSnapshot.coinsPerCorrectAnswer || 1);

  const txId = `tx_test_${sessionId}`;
  const txRef = db.collection("coin_transactions").doc(txId);
  const userRef = db.collection("users").doc(userId);
  const progressId = `${userId}_${session.levelId}`;
  const progressRef = db.collection("user_progress").doc(progressId);

  await db.runTransaction(async (t) => {
    const userDocSnap = await t.get(userRef);
    if (!userDocSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi profili topilmadi");
    }
    const userData = userDocSnap.data() as UserDoc;

    const txSnap = await t.get(txRef);
    const progressDocSnap = await t.get(progressRef);

    // Idempotency check
    if (txSnap.exists) {
      return; // Already processed
    }

    const currentBalance = userData.coinBalance || 0;
    const newBalance = currentBalance + earnedCoins;
    const now = Timestamp.now();

    // 1. Update Test Session
    t.update(sessionRef, {
      answers: finalAnswers,
      status: "completed",
      submittedAt: now,
      correctCount,
      score: scorePercent,
      earnedCoins,
      updatedAt: now,
    });

    // 2. Update User Progress
    let prevBestScore = 0;
    let prevAttempts = 0;
    let prevCorrectTotal = 0;
    let isCompleted = scorePercent >= 60; // passing grade e.g. 60%

    if (progressDocSnap.exists) {
      const prog = progressDocSnap.data() as UserProgressDoc;
      prevBestScore = prog.bestScore || 0;
      prevAttempts = prog.attempts || 0;
      prevCorrectTotal = prog.correctAnswersTotal || 0;
      isCompleted = isCompleted || prog.isCompleted;

      t.update(progressRef, {
        bestScore: Math.max(prevBestScore, scorePercent),
        attempts: prevAttempts + 1,
        correctAnswersTotal: prevCorrectTotal + correctCount,
        isCompleted,
        lastAttemptAt: now,
      });
    } else {
      const newProgress: UserProgressDoc = {
        progressId,
        userId,
        subjectId: session.subjectId,
        levelId: session.levelId,
        isUnlocked: true,
        isCompleted,
        bestScore: scorePercent,
        attempts: 1,
        correctAnswersTotal: correctCount,
        unlockedAt: now,
        lastAttemptAt: now,
      };
      t.set(progressRef, newProgress);
    }

    // 3. Update User profile aggregates
    t.update(userRef, {
      coinBalance: newBalance,
      totalCorrectAnswers: (userData.totalCorrectAnswers || 0) + correctCount,
      testsCompleted: (userData.testsCompleted || 0) + 1,
      updatedAt: now,
      lastActiveAt: now,
    });

    // 4. Create Coin Transaction
    if (earnedCoins > 0) {
      const coinTx: CoinTransactionDoc = {
        transactionId: txId,
        userId,
        amount: earnedCoins,
        type: "test_reward",
        reason: `Test yakunlandi: ${correctCount}/${totalQuestions} to'g'ri javob`,
        referenceId: sessionId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        createdAt: now,
        createdBy: "system",
        metadata: {
          sessionId,
          subjectId: session.subjectId,
          levelId: session.levelId,
          scorePercent,
          correctCount,
        },
      };
      t.set(txRef, coinTx);
    }

    // 5. Send Notification
    await sendNotification(t, {
      userId,
      title: "Test muvaffaqiyatli yakunlandi! 🎉",
      body: `Siz ${totalQuestions} tadan ${correctCount} ta to'g'ri topdingiz va +${earnedCoins} Tillo tanga qo'lga kiritdingiz!`,
      type: "test_result",
      data: {
        sessionId,
        score: scorePercent,
        correctCount,
        earnedCoins,
      },
    });
  });

  return {
    sessionId,
    score: scorePercent,
    correctCount,
    totalQuestions,
    earnedCoins,
    isCompleted: scorePercent >= 60,
    questionsReview,
  };
});
