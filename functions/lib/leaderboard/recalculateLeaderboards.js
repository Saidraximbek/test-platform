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
exports.scheduledLeaderboardRecalculation = exports.recalculateLeaderboardStats = void 0;
exports.computeAndSaveLeaderboards = computeAndSaveLeaderboards;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
async function computeAndSaveLeaderboards() {
    // 1. Get system settings for weights
    const configSnap = await firebase_1.db.collection("system_settings").doc("global_config").get();
    const weights = configSnap.exists
        ? configSnap.data().leaderboardWeights || {
            correctAnswersWeight: 10,
            testsCompletedWeight: 2,
            coinBalanceWeight: 1,
        }
        : {
            correctAnswersWeight: 10,
            testsCompletedWeight: 2,
            coinBalanceWeight: 1,
        };
    // 2. Load top active users
    const usersSnap = await firebase_1.db
        .collection("users")
        .where("status", "==", "active")
        .limit(500)
        .get();
    const userEntries = [];
    for (const doc of usersSnap.docs) {
        const user = doc.data();
        const score = (user.totalCorrectAnswers || 0) * weights.correctAnswersWeight +
            (user.testsCompleted || 0) * weights.testsCompletedWeight +
            (user.coinBalance || 0) * weights.coinBalanceWeight;
        userEntries.push({
            rank: 0,
            userId: user.uid,
            displayName: user.displayName || "Foydalanuvchi",
            photoURL: user.photoURL || "",
            score: Math.round(score),
            coinBalance: user.coinBalance || 0,
            testsCompleted: user.testsCompleted || 0,
        });
    }
    // Sort descending by score
    userEntries.sort((a, b) => b.score - a.score);
    // Take top 100 and assign ranks
    const top100 = userEntries.slice(0, 100).map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
    }));
    const now = firebase_1.Timestamp.now();
    // Save global all time
    const globalDoc = {
        boardType: "global_all_time",
        lastCalculatedAt: now,
        rankings: top100,
    };
    await firebase_1.db.collection("leaderboard_stats").doc("global_all_time").set(globalDoc);
    // Save weekly
    const nowObj = new Date();
    const weekNum = Math.ceil(((nowObj.getTime() - new Date(nowObj.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    const weekId = `${nowObj.getFullYear()}-W${weekNum < 10 ? `0${weekNum}` : weekNum}`;
    const weeklyBoardId = `global_weekly_${weekId}`;
    const weeklyDoc = {
        boardType: weeklyBoardId,
        lastCalculatedAt: now,
        rankings: top100,
    };
    await firebase_1.db.collection("leaderboard_stats").doc(weeklyBoardId).set(weeklyDoc);
    // Compute Subject boards
    const subjectsSnap = await firebase_1.db.collection("subjects").where("isActive", "==", true).get();
    for (const subjectDoc of subjectsSnap.docs) {
        const subjectId = subjectDoc.id;
        // Load progress for this subject
        const progressSnap = await firebase_1.db
            .collection("user_progress")
            .where("subjectId", "==", subjectId)
            .limit(300)
            .get();
        // Group user stats
        const userSubjectMap = new Map();
        for (const pDoc of progressSnap.docs) {
            const p = pDoc.data();
            const existing = userSubjectMap.get(p.userId) || {
                correctTotal: 0,
                attempts: 0,
                bestScoreTotal: 0,
            };
            existing.correctTotal += p.correctAnswersTotal || 0;
            existing.attempts += p.attempts || 0;
            existing.bestScoreTotal += p.bestScore || 0;
            userSubjectMap.set(p.userId, existing);
        }
        const subjectRankings = [];
        for (const [userId, stats] of userSubjectMap.entries()) {
            const userSnap = await firebase_1.db.collection("users").doc(userId).get();
            if (!userSnap.exists)
                continue;
            const u = userSnap.data();
            if (u.status !== "active")
                continue;
            const score = stats.correctTotal * 10 + stats.attempts * 2 + stats.bestScoreTotal;
            subjectRankings.push({
                rank: 0,
                userId: u.uid,
                displayName: u.displayName || "Foydalanuvchi",
                photoURL: u.photoURL || "",
                score: Math.round(score),
                coinBalance: u.coinBalance || 0,
                testsCompleted: stats.attempts,
            });
        }
        subjectRankings.sort((a, b) => b.score - a.score);
        const topSubject = subjectRankings.slice(0, 100).map((e, idx) => ({
            ...e,
            rank: idx + 1,
        }));
        const subjectBoardDoc = {
            boardType: `subject_${subjectId}`,
            lastCalculatedAt: now,
            rankings: topSubject,
        };
        await firebase_1.db.collection("leaderboard_stats").doc(`subject_${subjectId}`).set(subjectBoardDoc);
    }
}
exports.recalculateLeaderboardStats = functions.https.onCall(async (_data, context) => {
    await (0, auth_1.requireAdmin)(context);
    await computeAndSaveLeaderboards();
    return { success: true, message: "Yetakchilar jadvali muvaffaqiyatli yangilandi" };
});
exports.scheduledLeaderboardRecalculation = functions.pubsub
    .schedule("every 1 hours")
    .onRun(async () => {
    await computeAndSaveLeaderboards();
    return null;
});
//# sourceMappingURL=recalculateLeaderboards.js.map