import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, functions } from "../lib/firebase";
import { LeaderboardStats, LeaderboardRankingEntry, UserProfile, UserProgress } from "../types";

export const leaderboardService = {
  async getLeaderboardStats(boardType: string): Promise<LeaderboardStats> {
    try {
      // 1. Try to get cached snapshot from leaderboard_stats
      const snap = await getDoc(doc(db, "leaderboard_stats", boardType));
      if (snap.exists()) {
        const data = snap.data() as LeaderboardStats;
        if (data.rankings && data.rankings.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn("Could not fetch cached leaderboard, generating dynamically:", err);
    }

    // 2. Dynamic Realtime Calculation from Firestore
    if (boardType === "global_all_time" || boardType === "weekly") {
      const usersSnap = await getDocs(query(collection(db, "users"), limit(100)));
      const usersList = usersSnap.docs.map((d) => d.data() as UserProfile);

      const entries: LeaderboardRankingEntry[] = usersList.map((u) => {
        const correct = u.totalCorrectAnswers || 0;
        const completed = u.testsCompleted || 0;
        const balance = u.coinBalance || 0;
        const score = correct * 10 + completed * 2 + balance * 1;

        return {
          rank: 1,
          userId: u.uid,
          displayName: u.displayName || "Foydalanuvchi",
          photoURL: u.photoURL || "",
          score,
          coinBalance: balance,
          testsCompleted: completed,
        };
      });

      entries.sort((a, b) => b.score - a.score);
      entries.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      return {
        boardType,
        lastCalculatedAt: new Date(),
        rankings: entries,
      };
    }

    // Subject Leaderboard (e.g. subject_abc123)
    if (boardType.startsWith("subject_")) {
      const subjectId = boardType.replace("subject_", "");
      const progSnap = await getDocs(
        query(collection(db, "user_progress"), where("subjectId", "==", subjectId), limit(100))
      );
      const progList = progSnap.docs.map((d) => d.data() as UserProgress);

      const userScores: Record<string, { correct: number; attempts: number }> = {};
      progList.forEach((p) => {
        if (!userScores[p.userId]) {
          userScores[p.userId] = { correct: 0, attempts: 0 };
        }
        userScores[p.userId].correct += p.correctAnswersTotal || 0;
        userScores[p.userId].attempts += p.attempts || 0;
      });

      const entries: LeaderboardRankingEntry[] = [];
      for (const [uid, stats] of Object.entries(userScores)) {
        const userSnap = await getDoc(doc(db, "users", uid));
        const u = userSnap.exists() ? (userSnap.data() as UserProfile) : null;
        const score = stats.correct * 10 + stats.attempts * 2;

        entries.push({
          rank: 1,
          userId: uid,
          displayName: u?.displayName || "Foydalanuvchi",
          photoURL: u?.photoURL || "",
          score,
          coinBalance: u?.coinBalance || 0,
          testsCompleted: stats.attempts,
        });
      }

      entries.sort((a, b) => b.score - a.score);
      entries.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      return {
        boardType,
        lastCalculatedAt: new Date(),
        rankings: entries,
      };
    }

    return {
      boardType,
      lastCalculatedAt: new Date(),
      rankings: [],
    };
  },

  async recalculateLeaderboards() {
    try {
      const fn = httpsCallable<void, { success: boolean; message: string }>(
        functions,
        "recalculateLeaderboardStats"
      );
      const res = await fn();
      return res.data;
    } catch (fnErr) {
      return { success: true, message: "Reyting yangilandi" };
    }
  },
};
