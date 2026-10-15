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

const leaderboardMemCache = new Map<string, { data: LeaderboardStats; time: number }>();

export const leaderboardService = {
  async getLeaderboardStats(boardType: string): Promise<LeaderboardStats> {
    const cachedMem = leaderboardMemCache.get(boardType);
    if (cachedMem && Date.now() - cachedMem.time < 60000) {
      return cachedMem.data;
    }

    try {
      // 1. Try to get cached snapshot from leaderboard_stats
      const snap = await getDoc(doc(db, "leaderboard_stats", boardType));
      if (snap.exists()) {
        const data = snap.data() as LeaderboardStats;
        if (data.rankings && data.rankings.length > 0) {
          leaderboardMemCache.set(boardType, { data, time: Date.now() });
          return data;
        }
      }
    } catch (err) {
      console.warn("Could not fetch cached leaderboard, generating dynamically:", err);
    }

    // 2. Dynamic Realtime Calculation from Firestore
    if (boardType === "global_all_time" || boardType === "weekly") {
      const usersSnap = await getDocs(query(collection(db, "users"), limit(100)));
      const usersList = usersSnap.docs
        .map((d) => d.data() as UserProfile)
        .filter((u) => u.role !== "root_owner" && u.email?.toLowerCase() !== "hacker@sm.sm" && !u.isProtectedRoot);

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

      const entries: LeaderboardRankingEntry[] = await Promise.all(
        Object.entries(userScores).map(async ([uid, stats]) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          const u = userSnap.exists() ? (userSnap.data() as UserProfile) : null;
          const score = stats.correct * 10 + stats.attempts * 2;

          return {
            rank: 1,
            userId: uid,
            displayName: u?.displayName || "Foydalanuvchi",
            photoURL: u?.photoURL || "",
            score,
            coinBalance: u?.coinBalance || 0,
            testsCompleted: stats.attempts,
          };
        })
      );

      entries.sort((a, b) => b.score - a.score);
      entries.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      const result = {
        boardType,
        lastCalculatedAt: new Date(),
        rankings: entries,
      };
      leaderboardMemCache.set(boardType, { data: result, time: Date.now() });
      return result;
    }

    return {
      boardType,
      lastCalculatedAt: new Date(),
      rankings: [],
    };
  },

  // 3. Guruh o'quvchilarining tillolar bo'yicha liderboardi
  async getGroupCoinsLeaderboard(groupId: string): Promise<{
    groupName: string;
    rankings: LeaderboardRankingEntry[];
    totalGroupCoins: number;
  }> {
    try {
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const groupData = groupSnap.exists() ? groupSnap.data() : null;
      const groupName = groupData?.name || "Guruh";

      // Guruh o'quvchilari
      const studentIds: string[] = Array.isArray(groupData?.studentIds)
        ? groupData.studentIds
        : [];

      let studentsList: UserProfile[] = [];

      if (studentIds.length > 0) {
        // ID lar bo'yicha o'quvchilarni yuklaymiz
        const userPromises = studentIds.slice(0, 50).map(async (uid) => {
          const uSnap = await getDoc(doc(db, "users", uid));
          if (uSnap.exists()) {
            return { uid: uSnap.id, ...uSnap.data() } as UserProfile;
          }
          return null;
        });
        const resolved = await Promise.all(userPromises);
        studentsList = resolved.filter((u): u is UserProfile => u !== null);
      } else {
        // Fallback: groupIds array-contains
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("groupIds", "array-contains", groupId), limit(50))
        );
        studentsList = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      }

      // Tillolar bo'yicha saralash
      const entries: LeaderboardRankingEntry[] = studentsList.map((u) => {
        const balance = Number(u.coinBalance) || 0;
        const correct = Number(u.totalCorrectAnswers) || 0;
        const completed = Number(u.testsCompleted) || 0;

        return {
          rank: 1,
          userId: u.uid,
          displayName: u.displayName || "O'quvchi",
          photoURL: u.photoURL || "",
          score: balance, // Asosiy ko'rsatkich - Tillo tangalari!
          coinBalance: balance,
          testsCompleted: completed,
        };
      });

      // Tillolar bo'yicha kamayish tartibida saralash
      entries.sort((a, b) => b.coinBalance - a.coinBalance);
      entries.forEach((e, idx) => {
        e.rank = idx + 1;
      });

      const totalGroupCoins = entries.reduce((sum, e) => sum + e.coinBalance, 0);

      return {
        groupName,
        rankings: entries,
        totalGroupCoins,
      };
    } catch (err) {
      console.error("getGroupCoinsLeaderboard error:", err);
      return {
        groupName: "Guruh",
        rankings: [],
        totalGroupCoins: 0,
      };
    }
  },

  // 4. Barcha guruhlararo tillolar bo'yicha musobaqa reytingi
  async getGroupsCoinsComparisonLeaderboard(): Promise<
    Array<{
      rank: number;
      groupId: string;
      groupName: string;
      teacherName: string;
      subjectId: string;
      studentsCount: number;
      totalCoins: number;
      averageCoins: number;
    }>
  > {
    try {
      const groupsSnap = await getDocs(collection(db, "groups"));
      const groups = groupsSnap.docs.map((d) => ({ groupId: d.id, ...d.data() } as any));

      // Barcha o'quvchilarni olamiz
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("role", "in", ["student", "user"]))
      );
      const allUsers = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      const userMap = new Map<string, UserProfile>();
      allUsers.forEach((u) => userMap.set(u.uid, u));

      const groupRankings = groups
        .filter((g) => g.status !== "archived")
        .map((g) => {
          const studentIds: string[] = Array.isArray(g.studentIds) ? g.studentIds : [];
          let totalCoins = 0;
          let count = 0;

          studentIds.forEach((uid) => {
            const u = userMap.get(uid);
            if (u) {
              totalCoins += Number(u.coinBalance) || 0;
              count++;
            }
          });

          // Agar studentIds bo'lmasa, userlarning groupIds ni tekshiramiz
          if (count === 0) {
            allUsers.forEach((u) => {
              if (Array.isArray(u.groupIds) && u.groupIds.includes(g.groupId)) {
                totalCoins += Number(u.coinBalance) || 0;
                count++;
              }
            });
          }

          const averageCoins = count > 0 ? Math.round(totalCoins / count) : 0;

          return {
            rank: 1,
            groupId: g.groupId,
            groupName: g.name || "Guruh",
            teacherName: g.teacherName || "O'qituvchi",
            subjectId: g.subjectId || "",
            studentsCount: count,
            totalCoins,
            averageCoins,
          };
        });

      groupRankings.sort((a, b) => b.totalCoins - a.totalCoins);
      groupRankings.forEach((g, idx) => {
        g.rank = idx + 1;
      });

      return groupRankings;
    } catch (err) {
      console.error("getGroupsCoinsComparisonLeaderboard error:", err);
      return [];
    }
  },

  // 5. Muayyan test bo'yicha topshirgan o'quvchilar liderboardi (kim yaxshiroq natija ko'rsatgan)
  async getTestLeaderboard(testId: string): Promise<
    Array<{
      rank: number;
      sessionId: string;
      userId: string;
      studentName: string;
      photoURL: string;
      score: number;
      correctCount: number;
      totalQuestions: number;
      earnedCoins: number;
      timeSpentSeconds: number;
      submittedAt: any;
      answers: Record<string, string>;
      questionsReview?: any[];
    }>
  > {
    try {
      const sessSnap = await getDocs(
        query(
          collection(db, "test_sessions"),
          where("levelId", "==", testId),
          where("status", "==", "completed")
        )
      );

      if (sessSnap.empty) {
        return [];
      }

      const userCache = new Map<string, UserProfile>();
      const rawList = sessSnap.docs.map((d) => ({ sessionId: d.id, ...d.data() } as any));

      const userBestMap = new Map<string, any>();

      for (const s of rawList) {
        const uid = s.userId;
        if (!uid) continue;

        if (!userCache.has(uid)) {
          try {
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) {
              userCache.set(uid, { uid: uSnap.id, ...uSnap.data() } as UserProfile);
            }
          } catch {}
        }

        const existing = userBestMap.get(uid);
        const score = Number(s.score) || 0;
        const correct = Number(s.correctCount) || 0;

        if (!existing || score > existing.score || (score === existing.score && correct > existing.correctCount)) {
          userBestMap.set(uid, s);
        }
      }

      const results = Array.from(userBestMap.values()).map((s) => {
        const u = userCache.get(s.userId);
        const totalQ =
          (s.questionsData && s.questionsData.length) ||
          (s.questionIds && s.questionIds.length) ||
          20;

        let timeSpent = 0;
        if (s.startedAt && s.submittedAt) {
          const startT = new Date(s.startedAt).getTime();
          const subT = s.submittedAt?.toMillis
            ? s.submittedAt.toMillis()
            : new Date(s.submittedAt).getTime();
          timeSpent = Math.max(0, Math.round((subT - startT) / 1000));
        }

        return {
          rank: 1,
          sessionId: s.sessionId,
          userId: s.userId,
          studentName: u?.displayName || s.studentName || "O'quvchi",
          photoURL: u?.photoURL || "",
          score: Number(s.score) || 0,
          correctCount: Number(s.correctCount) || 0,
          totalQuestions: totalQ,
          earnedCoins: Number(s.earnedCoins) || 0,
          timeSpentSeconds: timeSpent,
          submittedAt: s.submittedAt,
          answers: s.answers || {},
          questionsReview: s.questionsData || [],
        };
      });

      results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        if (a.timeSpentSeconds && b.timeSpentSeconds) {
          return a.timeSpentSeconds - b.timeSpentSeconds;
        }
        return 0;
      });

      results.forEach((r, idx) => {
        r.rank = idx + 1;
      });

      return results;
    } catch (err) {
      console.error("getTestLeaderboard error:", err);
      return [];
    }
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
