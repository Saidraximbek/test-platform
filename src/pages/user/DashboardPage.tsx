import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Play,
  Gift,
  Flame,
  Zap,
  Package,
  Video,
  FileText,
  HelpCircle,
  GraduationCap,
  FileCheck,
  Calendar,
  MessageSquare,
  AlertCircle,
  Star,
  Check,
  UserCheck,
  DoorOpen,
  Users,
  MapPin,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { subjectService } from "../../services/subjectService";
import { testService } from "../../services/testService";
import { levelService } from "../../services/levelService";
import { shopService } from "../../services/shopService";
import { lessonService } from "../../services/lessonService";
import { groupService } from "../../services/groupService";
import { homeworkService } from "../../services/homeworkService";
import { attendanceService, StudentAttendanceSummary } from "../../services/attendanceService";
import {
  Subject,
  TestSession,
  UserProgress,
  Product,
  Lesson,
  Group,
  Homework,
  HomeworkSubmission,
} from "../../types";
import { Card } from "../../components/common/Card";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";
import { sound } from "../../utils/soundEffects";

interface EnrichedHomework {
  homework: Homework;
  groupName: string;
  lessonTitle?: string;
  submission?: HomeworkSubmission;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [todayLessonInfo, setTodayLessonInfo] = useState<{ lesson: Lesson; groupName: string } | null>(null);

  // LMS Data
  const [studentGroups, setStudentGroups] = useState<Group[]>([]);
  const [studentLessons, setStudentLessons] = useState<{ lesson: Lesson; groupName: string }[]>([]);
  const [enrichedHomeworks, setEnrichedHomeworks] = useState<EnrichedHomework[]>([]);
  const [studentSubmissions, setStudentSubmissions] = useState<HomeworkSubmission[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);

        // 1. Parallel basic and LMS queries
        const [
          subList,
          sessList,
          progList,
          prods,
          stGroups,
          stSubmissions,
        ] = await Promise.all([
          subjectService.getSubjects(true),
          testService.getUserSessions(user.uid, 5),
          levelService.getAllUserProgress(user.uid),
          shopService.getProducts(undefined, true),
          groupService.getStudentGroups(user.uid),
          homeworkService.getStudentSubmissions(user.uid),
        ]);

        let activeGroups = stGroups;
        const deletedGroupIds = groupService.getDeletedGroupIds ? groupService.getDeletedGroupIds() : new Set();
        if (activeGroups.length === 0 && Array.isArray(user?.enrolledGroups) && user.enrolledGroups.length > 0) {
          const validEnrolled = user.enrolledGroups.filter((eg) => eg && eg.groupId && !deletedGroupIds.has(eg.groupId));
          if (validEnrolled.length > 0) {
            activeGroups = validEnrolled.map((eg) => ({
              groupId: eg.groupId,
              name: eg.name || "Guruh",
              subjectId: eg.subjectId || "",
              teacherId: eg.teacherId || "",
              teacherName: eg.teacherName || "",
              room: eg.room || "",
              schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
              startTime: eg.startTime || "14:00",
              endTime: eg.endTime || "",
              lessonDuration: eg.lessonDuration || 80,
              monthlyPrice: eg.monthlyPrice || 0,
              maxStudents: 20,
              currentStudentsCount: 1,
              studentIds: [user.uid],
              status: "active" as const,
              createdAt: eg.enrolledAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
          }
        }

        const activeGroupIds = activeGroups.map((g) => g.groupId);

        // 2. Fetch today's lesson, attendance stats, homeworks in batch, and group lessons concurrently
        const hwBatchPromise = activeGroupIds.length > 0
          ? (activeGroupIds.length <= 10
              ? getDocs(query(collection(db, "homeworks"), where("groupId", "in", activeGroupIds))).catch(() => ({ docs: [] }))
              : Promise.all(
                  activeGroupIds.map((gId) =>
                    getDocs(query(collection(db, "homeworks"), where("groupId", "==", gId))).catch(() => ({ docs: [] }))
                  )
                ).then((snaps) => ({ docs: snaps.flatMap((s) => s.docs) }))
            )
          : Promise.resolve({ docs: [] });

        const [tLesson, attStats, hwSnapResult, ...groupLessonsList] = await Promise.all([
          lessonService.getTodayLessonForStudent(user.uid, activeGroups),
          attendanceService.getStudentAttendanceStats(user.uid, activeGroupIds),
          hwBatchPromise,
          ...activeGroups.map((g) => lessonService.getLessons(g.groupId).catch(() => [])),
        ]);

        setSubjects(subList);
        setRecentSessions(sessList);
        setProgressList(progList);
        setFeaturedProducts(prods.slice(0, 3));
        setTodayLessonInfo(tLesson);
        setStudentGroups(activeGroups);
        setStudentSubmissions(stSubmissions);
        setAttendanceStats(attStats);

        const allLessons: { lesson: Lesson; groupName: string }[] = [];
        const seenLessonIds = new Set<string>();
        const groupHomeworks: EnrichedHomework[] = [];
        const lessonsByGroup = new Map<string, Lesson[]>();

        activeGroups.forEach((g, idx) => {
          const gLessons = groupLessonsList[idx] || [];
          lessonsByGroup.set(g.groupId, gLessons);

          gLessons.forEach((les) => {
            if ((les.status === "published" || !les.status) && !seenLessonIds.has(les.lessonId)) {
              allLessons.push({ lesson: les, groupName: g.name });
              seenLessonIds.add(les.lessonId);
            }
          });
        });

        const groupNameMap = new Map(activeGroups.map((g) => [g.groupId, g.name]));

        if (hwSnapResult && Array.isArray((hwSnapResult as any).docs)) {
          (hwSnapResult as any).docs.forEach((docSnap: any) => {
            const hw = docSnap.data() as Homework;
            const gName = groupNameMap.get(hw.groupId) || "Guruh";
            const gLessons = lessonsByGroup.get(hw.groupId) || [];
            const matchingSub = stSubmissions.find((s) => s.homeworkId === hw.homeworkId);
            const matchingLesson = gLessons.find((l) => l.lessonId === hw.lessonId);
            groupHomeworks.push({
              homework: hw,
              groupName: gName,
              lessonTitle: matchingLesson?.title || "Dars vazifasi",
              submission: matchingSub,
            });
          });
        }

        setStudentLessons(allLessons);
        setEnrichedHomeworks(groupHomeworks);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  // Derived metrics
  const completedProgressCount = progressList.filter((p) => p.isCompleted).length;
  const userBalance = user?.coinBalance || 0;

  // Homework status calculations
  const pendingHomeworks = enrichedHomeworks.filter(
    (eh) => !eh.submission || eh.submission.status === "SUBMITTED"
  );
  const gradedHomeworks = enrichedHomeworks.filter(
    (eh) => eh.submission && eh.submission.status === "COMPLETED" && eh.submission.score !== null
  );

  // Calculate student's average academic score
  let totalScoreSum = 0;
  let totalScoreCount = 0;

  gradedHomeworks.forEach((gh) => {
    if (gh.submission?.score !== null && gh.submission?.score !== undefined) {
      totalScoreSum += gh.submission.score;
      totalScoreCount++;
    }
  });

  const completedSessions = recentSessions.filter((s) => s.status === "completed");
  completedSessions.forEach((s) => {
    totalScoreSum += s.score;
    totalScoreCount++;
  });

  const averageAcademicScore =
    totalScoreCount > 0 ? Math.round(totalScoreSum / totalScoreCount) : null;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Academic Student Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-sky-700 text-white p-6 sm:p-10 shadow-2xl shadow-brand-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Farg'oniy Maktabi LMS</span>
              </span>

              {studentGroups.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-sky-100 border border-white/10">
                  <UserCheck className="w-3 h-3 text-sky-300" />
                  <span>{studentGroups.map((g) => g.name).join(", ")}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Assalomu alaykum, {user?.displayName || "O'quvchi"}! 👋
            </h1>
            <p className="text-sm sm:text-base text-brand-100 max-w-xl leading-relaxed">
              Bugungi darslaringizni o'rganing, uyga vazifalarni topshiring va bilimlaringizni yangi bosqichga ko'taring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {todayLessonInfo ? (
              <Link
                to={`/lessons/${todayLessonInfo.lesson.lessonId}`}
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 transition-all"
              >
                <Play className="w-4 h-4 fill-current" /> Bugungi Darsga O'tish
              </Link>
            ) : (
              <Link
                to="/lessons"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-brand-700 font-black text-sm shadow-xl hover:scale-105 transition-all"
              >
                <BookOpen className="w-4 h-4" /> Barcha Darslarim
              </Link>
            )}

            <Link
              to="/homework"
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/20 hover:scale-105 transition-all"
            >
              <FileCheck className="w-4 h-4" /> Vazifalarim
            </Link>
          </div>
        </div>
      </div>

      {/* 2. BUGUNGI DARS (Hero Section) */}
      {todayLessonInfo ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 shadow-2xl shadow-sky-500/20">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-sky-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Bugungi Dars — Nima qilishim kerak?</span>
              </div>

              <div>
                <span className="text-xs font-bold text-sky-200 uppercase">
                  {todayLessonInfo.groupName}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  Mavzu: "{todayLessonInfo.lesson.title}"
                </h2>
                {todayLessonInfo.lesson.description && (
                  <p className="text-xs text-sky-100 mt-1 line-clamp-2 leading-relaxed">
                    {todayLessonInfo.lesson.description}
                  </p>
                )}
              </div>

              {/* Badges / checklist */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {todayLessonInfo.lesson.videoUrl && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                    <Video className="w-3.5 h-3.5 text-sky-300" /> 🎥 Qisqa video dars
                  </span>
                )}
                {todayLessonInfo.lesson.materialsText && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                    <FileText className="w-3.5 h-3.5 text-emerald-300" /> 📄 Konspekt & Qoidalar
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                  <FileText className="w-3.5 h-3.5 text-indigo-300" /> 📝 Uy vazifasi
                </span>
                {todayLessonInfo.lesson.testId && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl shadow-md">
                    <HelpCircle className="w-3.5 h-3.5" /> 🧪 Dars testi (+Tillo)
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <Link to={`/lessons/${todayLessonInfo.lesson.lessonId}`}>
                <Button
                  size="lg"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xl shadow-amber-500/30 hover:scale-105 transition-all text-sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Darsni Boshlash
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Darslar jadvali</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bugun uchun yangi dars belgilanmagan. O'tgan mavzularni takrorlashingiz mumkin.
              </p>
            </div>
          </div>
          <Link to="/lessons">
            <Button variant="secondary" size="sm">
              Barcha darslarimga o'tish
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Asosiy LMS Ta'lim Ko'rsatkichlari (Academic KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Darslar */}
        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shadow-sm shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs text-slate-500 block truncate">Guruh Darslari</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {studentLessons.length} ta
            </span>
          </div>
        </Card>

        {/* Vazifalar */}
        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shadow-sm shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs text-slate-500 block truncate">Kutilayotgan Vazifa</span>
            <span className="text-xl sm:text-2xl font-black text-amber-500">
              {pendingHomeworks.length} ta
            </span>
          </div>
        </Card>

        {/* O'rtacha Baho */}
        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shadow-sm shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs text-slate-500 block truncate">O'rtacha Baho</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-500">
              {averageAcademicScore !== null ? `${averageAcademicScore} ball` : "—"}
            </span>
          </div>
        </Card>

        {/* Davomat */}
        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold shadow-sm shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs text-slate-500 block truncate">Davomat Ko'rsatkichi</span>
            <span className="text-xl sm:text-2xl font-black text-purple-500">
              {attendanceStats ? `${attendanceStats.percentage}%` : "100%"}
            </span>
          </div>
        </Card>
      </div>

      {/* 3.5. MENING O'QUV GURUHLARIM & DARS JADVALI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Mening O'quv Guruhlarim
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Siz a'zo bo'lgan guruhlar, ustozlar, xonalar va dars vaqtlari jadvali
            </p>
          </div>

          {studentGroups.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {studentGroups.length} ta guruh
            </span>
          )}
        </div>

        {studentGroups.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Hozircha birorta ham guruhga biriktirilmagansiz
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              O'quv markaz ma'muriyati yoki ustozingiz sizni guruhga biriktirgach, dars jadvalingiz, dars materiallari va vazifalar avtomatik ravishda profilingizda paydo bo'ladi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {studentGroups.map((g) => (
              <div
                key={g.groupId}
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-lg shadow-slate-200/30 dark:shadow-none hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-sky-500" />

                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{g.name}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Faol Guruh
                    </span>
                  </div>

                  {/* Teacher and Room */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 block font-medium">Ustoz</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {g.teacherName || "Tayinlangan"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <DoorOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 block font-medium">Auditoriya</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {g.room || "1-xona"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Days & Time */}
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {g.schedule || "Dushanba, Chorshanba, Juma"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {g.startTime} {g.endTime ? `- ${g.endTime}` : ""}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto font-medium">
                        ({g.lessonDuration || 80} daqiqa)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Link Button */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500">
                    O'quv jarayoni
                  </span>
                  <Link to="/lessons">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 text-xs font-bold"
                    >
                      Darslarga o'tish <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DARSLAR BO'LIMI: So'nggi va Rejalashtirilgan Darslar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" /> Mening Darslarim
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Biriktirilgan guruhlaringiz bo'yicha eng so'nggi darslar va materiallar
            </p>
          </div>

          <Link
            to="/lessons"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            Barcha darslar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {studentLessons.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Hozircha faol darslar mavjud emas
            </h4>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              Administrator yoki o'qituvchingiz sizni o'quv guruhiga biriktirgach, darslaringiz shu yerda paydo bo'ladi.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {studentLessons.slice(0, 6).map(({ lesson, groupName }) => (
              <Card
                key={lesson.lessonId}
                hoverEffect
                className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                      {groupName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {lesson.durationMinutes || 80} daq
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      {lesson.lessonNumber ? `${lesson.lessonNumber}-dars` : "Dars"}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors line-clamp-1">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  {/* Resource Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {lesson.videoUrl && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    )}
                    {lesson.materialsText && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Konspekt
                      </span>
                    )}
                    {lesson.testId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> Test
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {lesson.scheduledDate || "Rejalashtirilgan"}
                  </span>
                  <Link to={`/lessons/${lesson.lessonId}`}>
                    <Button size="sm" variant="secondary" className="group-hover:bg-brand-50 dark:group-hover:bg-brand-950/30">
                      Darsga kirish <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 5. VAZIFALAR BO'LIMI: Kutilayotgan va Topshirilgan Uy Vazifalari */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-500" /> Uyga Vazifalar va Topshiriqlar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Topshirilishi kerak bo'lgan vazifalar, muddatlar va olingan baholar
            </p>
          </div>

          <Link
            to="/homework"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline"
          >
            Barcha vazifalar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrichedHomeworks.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
            <FileCheck className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Hozirda berilgan uy vazifalari yo'q
            </h4>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              O'qituvchingiz darslar bo'yicha yangi vazifa yuklaganda shu yerda ko'rinadi.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrichedHomeworks.slice(0, 6).map(({ homework, groupName, lessonTitle, submission }) => {
              const isSubmitted = !!submission;
              const isGraded = submission?.status === "COMPLETED";

              return (
                <Card
                  key={homework.homeworkId}
                  className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {groupName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          isGraded
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : isSubmitted
                            ? "bg-sky-500/10 text-sky-600 border-sky-500/30"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse"
                        }`}
                      >
                        {isGraded
                          ? `Baholandi: ${submission?.score} ball`
                          : isSubmitted
                          ? "Tekshirilmoqda"
                          : "Topshirish kerak"}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {homework.title}
                    </h4>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium line-clamp-1">
                      {lessonTitle}
                    </p>

                    {homework.instructions && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {homework.instructions}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Maksimal: <strong className="text-slate-700 dark:text-slate-300">{homework.maxScore || 100} ball</strong>
                    </span>

                    <Link to={`/lessons/${homework.lessonId}`}>
                      <Button size="sm" variant={isGraded ? "secondary" : "primary"}>
                        {isGraded ? "Ko'rish" : isSubmitted ? "Tekshirish" : "Topshirish"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. BAXOLASHLAR VA USTOZ TAQRIZLARI BO'LIMI */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-500" /> So'nggi Baholashlar va Ustoz Fikrlari
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O'qituvchilaringiz tomonidan qo'yilgan baholar, tavsiyalar va test natijalari
            </p>
          </div>

          <Link
            to="/questions/teacher"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
          >
            Ustozga savol yo'llash <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Ustoz Baholari & Izohlari */}
          <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" /> Vazifa Baholari & O'qituvchi Taqrizlari
            </h3>

            {gradedHomeworks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Hozircha baholangan vazifalar mavjud emas. Vazifalaringiz o'qituvchi tomonidan tekshirilgach, baho va fikrlar shu yerda chiqadi.
              </div>
            ) : (
              <div className="space-y-3">
                {gradedHomeworks.slice(0, 3).map((gh) => (
                  <div
                    key={gh.homework.homeworkId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {gh.homework.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {gh.submission?.score} / 100 ball
                      </span>
                    </div>

                    {gh.submission?.teacherComment ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/15">
                        💬 "{gh.submission.teacherComment}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">O'qituvchi muvaffaqiyatli qabul qildi.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Test Baholari va Davomat */}
          <Card className="p-5 space-y-4 border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Test Baholari & Davomat Ko'rsatkichi
            </h3>

            <div className="space-y-3">
              {/* Davomat summary card */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-purple-900 dark:text-purple-200 block">
                    Umumiy Dars Davomati
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300">
                    Kelgan: {attendanceStats?.present || 0} ta • Kechikkan: {attendanceStats?.late || 0} ta • Qoldirgan: {attendanceStats?.absent || 0} ta
                  </span>
                </div>
                <span className="text-lg font-black text-purple-600 dark:text-purple-300">
                  {attendanceStats ? `${attendanceStats.percentage}%` : "100%"}
                </span>
              </div>

              {/* So'nggi test natijalari */}
              {recentSessions.slice(0, 2).map((s) => (
                <div
                  key={s.sessionId}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Test Sessiyasi
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(s.createdAt)}</span>
                  </div>
                  <span className="font-black text-emerald-500 text-sm">{s.score}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 7. MUSTAQIL TESTLAR VA BOSQICHLAR (Mavjud Fanlar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-600" /> Mustaqil Test Mashg'ulotlari
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fanlar bo'yicha mustaqil test ishlab, Tillo tangalarini to'plang
            </p>
          </div>

          <Link
            to="/subjects"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            Barcha fanlar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.slice(0, 4).map((sub) => (
            <Link
              key={sub.subjectId}
              to={`/subjects/${sub.subjectId}/levels`}
              onClick={() => sound.playClick()}
              className="group"
            >
              <Card hoverEffect className="p-4 h-full flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:border-brand-500/40">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {sub.description || "Darajalar bo'yicha testlar."}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600 mt-3">
                  <span>Test ishlash</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 8. TILLO SOVG'ALAR DO'KONI (Vitrina Banneri) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-brand-500/15 border-2 border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
              <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Tillo Sovg'alar Do'koni 🎁
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                To'plagan Tangalaringizni Haqiqiy Sovg'alarga Almashtiring!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Daftarlar, ruchkalar va maxsus o'quv qurollari. Balansingiz: <strong className="text-amber-500">{formatCoins(userBalance)} Tillo</strong>
              </p>
            </div>
          </div>

          <Link
            to="/shop"
            onClick={() => sound.playCoin()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-md hover:scale-105 transition-all shrink-0"
          >
            <ShoppingBag className="w-4 h-4" /> Do'konga O'tish
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
