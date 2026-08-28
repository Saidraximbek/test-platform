"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTest = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
exports.startTest = functions.https.onCall(async (data, context) => {
    const user = await (0, auth_1.requireActiveUser)(context);
    const { subjectId, levelId } = (0, auth_1.validateInput)(schemas_1.StartTestSchema, data);
    // 1. Global settings check
    const configDocRef = firebase_1.db.collection("system_settings").doc("global_config");
    const configSnap = await configDocRef.get();
    let globalConfig = {
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
        updatedAt: firebase_1.Timestamp.now(),
        updatedBy: "system",
    };
    if (configSnap.exists) {
        globalConfig = { ...globalConfig, ...configSnap.data() };
    }
    if (globalConfig.maintenanceMode && user.role !== "admin") {
        throw new functions.https.HttpsError("unavailable", "Platformada texnik ishlar olib borilmoqda. Iltimos keyinroq urinib ko'ring.");
    }
    // 2. Verify Subject
    const subjectSnap = await firebase_1.db.collection("subjects").doc(subjectId).get();
    if (!subjectSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Tanlangan fan topilmadi");
    }
    const subject = subjectSnap.data();
    if (!subject.isActive && user.role !== "admin") {
        throw new functions.https.HttpsError("failed-precondition", "Ushbu fan ayni paytda faol emas");
    }
    // 3. Verify Level
    const levelSnap = await firebase_1.db.collection("levels").doc(levelId).get();
    if (!levelSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Tanlangan daraja topilmadi");
    }
    const level = levelSnap.data();
    if (!level.isActive && user.role !== "admin") {
        throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja ayni paytda faol emas");
    }
    // 4. Verify User Progress & Unlock state
    const progressId = `${user.uid}_${levelId}`;
    const progressRef = firebase_1.db.collection("user_progress").doc(progressId);
    const progressSnap = await progressRef.get();
    let isUnlocked = level.isInitialUnlocked;
    if (progressSnap.exists) {
        const progress = progressSnap.data();
        isUnlocked = progress.isUnlocked;
    }
    else if (level.isInitialUnlocked) {
        // Initialize unlocked record
        const newProgress = {
            progressId,
            userId: user.uid,
            subjectId,
            levelId,
            isUnlocked: true,
            isCompleted: false,
            bestScore: 0,
            attempts: 0,
            correctAnswersTotal: 0,
            unlockedAt: firebase_1.Timestamp.now(),
            lastAttemptAt: null,
        };
        await progressRef.set(newProgress);
        isUnlocked = true;
    }
    if (!isUnlocked) {
        throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja qulflangan. Test boshlash uchun avval darajani Tillo tangalari bilan oching.");
    }
    // 5. Check conflicting active sessions
    const activeSessionsSnap = await firebase_1.db
        .collection("test_sessions")
        .where("userId", "==", user.uid)
        .where("status", "==", "in_progress")
        .get();
    const nowMs = Date.now();
    for (const doc of activeSessionsSnap.docs) {
        const sess = doc.data();
        if (sess.expiresAt.toMillis() <= nowMs) {
            // Auto-expire
            await doc.ref.update({
                status: "expired",
                updatedAt: firebase_1.Timestamp.now(),
            });
        }
        else {
            throw new functions.https.HttpsError("already-exists", "Sizda allaqachon boshlangan faol test mavjud. Avval uni tugallang yoki yakunlang.");
        }
    }
    // 6. Config snapshots and duration
    const durationMinutes = level.durationMinutes || globalConfig.testDurationMinutes || 40;
    const questionsCount = level.questionsRequired || globalConfig.questionsPerTest || 20;
    // 7. Select questions securely via randomWeight + seed
    const seed = Math.random();
    const qRef = firebase_1.db.collection("questions");
    const q1 = await qRef
        .where("subjectId", "==", subjectId)
        .where("levelId", "==", levelId)
        .where("status", "==", "approved")
        .where("randomWeight", ">=", seed)
        .orderBy("randomWeight")
        .limit(questionsCount)
        .get();
    let selectedQuestions = q1.docs.map((d) => d.data());
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
        const additionalQuestions = q2.docs.map((d) => d.data());
        selectedQuestions = [...selectedQuestions, ...additionalQuestions];
    }
    if (selectedQuestions.length === 0) {
        throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja uchun tasdiqlangan savollar bazada mavjud emas");
    }
    // Fisher-Yates shuffle
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }
    // 8. Generate Session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const startedAt = firebase_1.Timestamp.now();
    const expiresAt = firebase_1.Timestamp.fromMillis(startedAt.toMillis() + durationMinutes * 60 * 1000);
    const sessionData = {
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
    await firebase_1.db.collection("test_sessions").doc(sessionId).set(sessionData);
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
//# sourceMappingURL=startTest.js.map