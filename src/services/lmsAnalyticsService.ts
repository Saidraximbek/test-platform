import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Group, UserProfile, Lesson, TestSession } from "../types";
import { groupService } from "./groupService";

export interface LMSAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalGroups: number;
  groupCapacities: {
    groupId: string;
    groupName: string;
    current: number;
    max: number;
    filledPercent: number;
  }[];
  studentGrowthMonthly: { month: string; newStudents: number }[];
  totalLessons: number;
  completedTestsCount: number;
  averageTestScore: number;
}

let lmsAnalyticsMemCache: { data: LMSAnalytics; time: number } | null = null;

export function invalidateAnalyticsCache(): void {
  lmsAnalyticsMemCache = null;
}

export const lmsAnalyticsService = {
  invalidateAnalyticsCache,

  async getOverview(forceRefresh = false): Promise<LMSAnalytics> {
    if (!forceRefresh && lmsAnalyticsMemCache && Date.now() - lmsAnalyticsMemCache.time < 45000) {
      return lmsAnalyticsMemCache.data;
    }

    const [usersSnap, allGroups, lessonsSnap, testsSnap] = await Promise.all([
      getDocs(collection(db, "users")).catch(() => ({ docs: [] })),
      groupService.getGroups().catch(() => []),
      getDocs(collection(db, "lessons")).catch(() => ({ docs: [] })),
      getDocs(collection(db, "test_sessions")).catch(() => ({ docs: [] })),
    ]);

    const allUsers = usersSnap.docs.map((d) => d.data() as UserProfile);
    const allLessons = lessonsSnap.docs.map((d) => d.data() as Lesson);
    const allTests = testsSnap.docs.map((d) => d.data() as TestSession);

    const students = allUsers.filter((u) => u.role === "student" || u.role === "user" || !u.role);
    const activeStudents = students.filter((s) => s.status !== "blocked" && s.status !== "suspended");
    const teachers = allUsers.filter((u) => u.role === "teacher");

    const groupCapacities = allGroups.map((g) => {
      const current = g.studentIds ? g.studentIds.length : g.currentStudentsCount || 0;
      const max = g.maxStudents || 20;
      const filledPercent = Math.min(100, Math.round((current / max) * 100));
      return {
        groupId: g.groupId,
        groupName: g.name,
        current,
        max,
        filledPercent,
      };
    });

    // Student growth by registration month (last 6 months)
    const monthlyGrowthMap: Record<string, number> = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const mStr = past.toISOString().slice(0, 7);
      monthlyGrowthMap[mStr] = 0;
    }

    students.forEach((s) => {
      let createdStr = "";
      if (s.createdAt?.toDate) {
        createdStr = s.createdAt.toDate().toISOString().slice(0, 7);
      } else if (typeof s.createdAt === "string") {
        createdStr = s.createdAt.slice(0, 7);
      }
      if (createdStr && monthlyGrowthMap[createdStr] !== undefined) {
        monthlyGrowthMap[createdStr]++;
      }
    });

    const studentGrowthMonthly = Object.keys(monthlyGrowthMap)
      .sort()
      .map((month) => ({
        month,
        newStudents: monthlyGrowthMap[month] || 0,
      }));

    const completedTests = allTests.filter((t) => t.status === "completed");
    const avgScore =
      completedTests.length > 0
        ? Math.round(completedTests.reduce((acc, t) => acc + (t.score || 0), 0) / completedTests.length)
        : 0;

    const result: LMSAnalytics = {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      totalTeachers: teachers.length,
      totalGroups: allGroups.length,
      groupCapacities,
      studentGrowthMonthly,
      totalLessons: allLessons.length,
      completedTestsCount: completedTests.length,
      averageTestScore: avgScore,
    };

    lmsAnalyticsMemCache = { data: result, time: Date.now() };
    return result;
  },
};
