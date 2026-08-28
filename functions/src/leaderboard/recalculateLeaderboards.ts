import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin } from "../middleware/auth";
import {
  LeaderboardRankingEntry,
  LeaderboardStatsDoc,
  SystemSettingsDoc,
  UserDoc,
  UserProgressDoc,
} from "../types";

export async function computeAndSaveLeaderboards() {
  // 1. Get system settings for weights
  const configSnap = await db.collection("system_settings").doc("global_config").get();
  const weights = configSnap.exists
    ? (configSnap.data() as SystemSettingsDoc).leaderboardWeights || {
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
  const usersSnap = await db
    .collection("users")
    .where("status", "==", "active")
    .limit(500)
    .get();

  const userEntries: LeaderboardRankingEntry[] = [];

  for (const doc of usersSnap.docs) {
    const user = doc.data() as UserDoc;
    const score =
      (user.totalCorrectAnswers || 0) * weights.correctAnswersWeight +
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

  const now = Timestamp.now();

  // Save global all time
  const globalDoc: LeaderboardStatsDoc = {
    boardType: "global_all_time",
    lastCalculatedAt: now,
    rankings: top100,
  };
  await db.collection("leaderboard_stats").doc("global_all_time").set(globalDoc);

  // Save weekly
  const nowObj = new Date();
  const weekNum = Math.ceil(
    ((nowObj.getTime() - new Date(nowObj.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );
  const weekId = `${nowObj.getFullYear()}-W${weekNum < 10 ? `0${weekNum}` : weekNum}`;
  const weeklyBoardId = `global_weekly_${weekId}`;

  const weeklyDoc: LeaderboardStatsDoc = {
    boardType: weeklyBoardId,
    lastCalculatedAt: now,
    rankings: top100,
  };
  await db.collection("leaderboard_stats").doc(weeklyBoardId).set(weeklyDoc);

  // Compute Subject boards
  const subjectsSnap = await db.collection("subjects").where("isActive", "==", true).get();

  for (const subjectDoc of subjectsSnap.docs) {
    const subjectId = subjectDoc.id;
    // Load progress for this subject
    const progressSnap = await db
      .collection("user_progress")
      .where("subjectId", "==", subjectId)
      .limit(300)
      .get();

    // Group user stats
    const userSubjectMap = new Map<
      string,
      { correctTotal: number; attempts: number; bestScoreTotal: number }
    >();

    for (const pDoc of progressSnap.docs) {
      const p = pDoc.data() as UserProgressDoc;
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

    const subjectRankings: LeaderboardRankingEntry[] = [];

    for (const [userId, stats] of userSubjectMap.entries()) {
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) continue;
      const u = userSnap.data() as UserDoc;
      if (u.status !== "active") continue;

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

    const subjectBoardDoc: LeaderboardStatsDoc = {
      boardType: `subject_${subjectId}`,
      lastCalculatedAt: now,
      rankings: topSubject,
    };
    await db.collection("leaderboard_stats").doc(`subject_${subjectId}`).set(subjectBoardDoc);
  }
}

export const recalculateLeaderboardStats = functions.https.onCall(async (_data, context) => {
  await requireAdmin(context);
  await computeAndSaveLeaderboards();
  return { success: true, message: "Yetakchilar jadvali muvaffaqiyatli yangilandi" };
});

export const scheduledLeaderboardRecalculation = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    await computeAndSaveLeaderboards();
    return null;
  });
