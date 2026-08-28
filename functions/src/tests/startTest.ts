import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireActiveUser, validateInput } from "../middleware/auth";
import { StartTestSchema } from "../schemas";
import { LevelDoc, QuestionDoc, SubjectDoc, SystemSettingsDoc, TestSessionDoc, UserProgressDoc } from "../types";

export const startTest = functions.https.onCall(async (data, context) => {
  const user = await requireActiveUser(context);
  const { subjectId, levelId } = validateInput(StartTestSchema, data);

  // 1. Global settings check
  const configDocRef = db.collection("system_settings").doc("global_config");
  const configSnap = await configDocRef.get();
  
  let globalConfig: SystemSettingsDoc = {
    questionsPerTest: 20,
    testDurationMinutes: 40,
    coinsPerCorrectAnswer: 1,
    coinsPenaltyOnAbandon: 5,
    defaultLevelUnlockCost: 50,
    weeklyRewardDefaultCoins: 100,
    maxActiveSessionsPerUser: 1,
    maintenanceMode: false,
    leaderboardWeights: {
      correctAnswersWeight: 10,
      testsCompletedWeight: 2,
      coinBalanceWeight: 1,
    },
    updatedAt: Timestamp.now(),
    updatedBy: "system",
  };

  if (configSnap.exists) {
    globalConfig = { ...globalConfig, ...(configSnap.data() as SystemSettingsDoc) };
  }

  if (globalConfig.maintenanceMode && user.role !== "admin") {
    throw new functions.https.HttpsError(
      "unavailable",
      "Platformada texnik ishlar olib borilmoqda. Iltimos keyinroq urinib ko'ring."
    );
  }

  // 2. Verify Subject
  const subjectSnap = await db.collection("subjects").doc(subjectId).get();
  if (!subjectSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Tanlangan fan topilmadi");
  }
  const subject = subjectSnap.data() as SubjectDoc;
  if (!subject.isActive && user.role !== "admin") {
    throw new functions.https.HttpsError("failed-precondition", "Ushbu fan ayni paytda faol emas");
  }

  // 3. Verify Level
  const levelSnap = await db.collection("levels").doc(levelId).get();
  if (!levelSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Tanlangan daraja topilmadi");
  }
  const level = levelSnap.data() as LevelDoc;
  if (!level.isActive && user.role !== "admin") {
    throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja ayni paytda faol emas");
  }

  // 4. Verify User Progress & Unlock state
  const progressId = `${user.uid}_${levelId}`;
  const progressRef = db.collection("user_progress").doc(progressId);
  const progressSnap = await progressRef.get();

  let isUnlocked = level.isInitialUnlocked;
  if (progressSnap.exists) {
    const progress = progressSnap.data() as UserProgressDoc;
    isUnlocked = progress.isUnlocked;
  } else if (level.isInitialUnlocked) {
    // Initialize unlocked record
    const newProgress: UserProgressDoc = {
      progressId,
      userId: user.uid,
      subjectId,
      levelId,
      isUnlocked: true,
      isCompleted: false,
      bestScore: 0,
      attempts: 0,
      correctAnswersTotal: 0,
      unlockedAt: Timestamp.now(),
      lastAttemptAt: null,
    };
    await progressRef.set(newProgress);
    isUnlocked = true;
  }

  if (!isUnlocked) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Ushbu daraja qulflangan. Test boshlash uchun avval darajani Tillo tangalari bilan oching."
    );
  }

  // 5. Check conflicting active sessions
  const activeSessionsSnap = await db
    .collection("test_sessions")
    .where("userId", "==", user.uid)
    .where("status", "==", "in_progress")
    .get();

  const nowMs = Date.now();
  for (const doc of activeSessionsSnap.docs) {
    const sess = doc.data() as TestSessionDoc;
    if (sess.expiresAt.toMillis() <= nowMs) {
      // Auto-expire
      await doc.ref.update({
        status: "expired",
        updatedAt: Timestamp.now(),
      });
    } else {
      throw new functions.https.HttpsError(
        "already-exists",
        "Sizda allaqachon boshlangan faol test mavjud. Avval uni tugallang yoki yakunlang."
      );
    }
  }

  // 6. Config snapshots and duration
  const durationMinutes = level.durationMinutes || globalConfig.testDurationMinutes || 40;
  const questionsCount = level.questionsRequired || globalConfig.questionsPerTest || 20;

  // 7. Select questions securely via randomWeight + seed
  const seed = Math.random();
  const qRef = db.collection("questions");

  const q1 = await qRef
    .where("subjectId", "==", subjectId)
    .where("levelId", "==", levelId)
    .where("status", "==", "approved")
    .where("randomWeight", ">=", seed)
    .orderBy("randomWeight")
    .limit(questionsCount)
    .get();

  let selectedQuestions: QuestionDoc[] = q1.docs.map((d) => d.data() as QuestionDoc);

  if (selectedQuestions.length < questionsCount) {
    const remaining = questionsCount - selectedQuestions.length;
    const q2 = await qRef
      .where("subjectId", "==", subjectId)
      .where("levelId", "==", levelId)
      .where("status", "==", "approved")
      .where("randomWeight", "<", seed)
      .orderBy("randomWeight")
      .limit(remaining)
      .get();

    const additionalQuestions = q2.docs.map((d) => d.data() as QuestionDoc);
    selectedQuestions = [...selectedQuestions, ...additionalQuestions];
  }

  if (selectedQuestions.length === 0) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Ushbu daraja uchun tasdiqlangan savollar bazada mavjud emas"
    );
  }

  // Fisher-Yates shuffle
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  // 8. Generate Session
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const startedAt = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(startedAt.toMillis() + durationMinutes * 60 * 1000);

  const sessionData: TestSessionDoc = {
    sessionId,
    userId: user.uid,
    subjectId,
    levelId,
    questionIds: selectedQuestions.map((q) => q.questionId),
    answers: {},
    status: "in_progress",
    startedAt,
    expiresAt,
    submittedAt: null,
    correctCount: 0,
    score: 0,
    earnedCoins: 0,
    penaltyCoins: 0,
    configSnapshot: {
      durationMinutes,
      coinsPerCorrectAnswer: globalConfig.coinsPerCorrectAnswer || 1,
      penaltyCoins: globalConfig.coinsPenaltyOnAbandon || 5,
    },
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  await db.collection("test_sessions").doc(sessionId).set(sessionData);

  // 9. Prepare SAFE questions for client (strip correctOptionId and explanation)
  const safeQuestions = selectedQuestions.map((q) => ({
    questionId: q.questionId,
    text: q.text,
    imageUrl: q.imageUrl,
    options: q.options, // Options have id and text
    difficulty: q.difficulty,
  }));

  return {
    sessionId,
    subjectId,
    levelId,
    startedAt: startedAt.toDate().toISOString(),
    expiresAt: expiresAt.toDate().toISOString(),
    configSnapshot: sessionData.configSnapshot,
    questions: safeQuestions,
  };
});
