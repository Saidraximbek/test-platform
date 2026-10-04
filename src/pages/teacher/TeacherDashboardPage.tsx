import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  FileCheck,
  MessageSquare,
  BookOpen,
  Plus,
  ClipboardList,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Video,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { groupService } from "../../services/groupService";
import { lessonService } from "../../services/lessonService";
import { homeworkService } from "../../services/homeworkService";
import { teacherQuestionService } from "../../services/teacherQuestionService";
import { Group, Lesson, HomeworkSubmission, TeacherQuestion } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<HomeworkSubmission[]>([]);
  const [newQuestions, setNewQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacherData = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const [teacherGroups, allLessons, submissions, questions] = await Promise.all([
          groupService.getTeacherGroups(user.uid).catch(() => []),
          lessonService.getTeacherLessons(user.uid).catch(() => []),
          homeworkService.getTeacherSubmissions(user.uid).catch(() => []),
          teacherQuestionService.getTeacherQuestions(user.uid, "NEW").catch(() => []),
        ]);

        const finalGroups = teacherGroups;
        const todayStr = new Date().toISOString().slice(0, 10);
        const today = allLessons.filter((l) => l.scheduledDate === todayStr);

        setGroups(finalGroups);
        setTodayLessons(today.length > 0 ? today : allLessons.slice(0, 3));
        setPendingSubmissions(submissions.filter((s) => s.status === "SUBMITTED"));
        setNewQuestions(questions);
      } catch (err) {
        console.error("Error loading teacher dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-sky-500" />
      </div>
    );
  }

  const totalStudentsCount = groups.reduce(
    (acc, g) => acc + (g.studentIds?.length || g.currentStudentsCount || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-brand-600 text-white p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-sky-100 border border-white/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>O'qituvchi boshqaruv markazi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xush kelibsiz, {user?.displayName || "Ustoz"}! 👨‍🏫
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl mt-1 leading-relaxed">
              Bugungi darslarni rejalashtiring, o'quvchilar uy vazifalarini tekshiring va savollarga javob bering.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link to="/teacher/lessons">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Yangi Dars Qo'shish</Button>
            </Link>
            <Link to="/teacher/salary">
              <Button variant="secondary" leftIcon={<DollarSign className="w-4 h-4" />}>
                Mening Oyligim
              </Button>
            </Link>
            <Link to="/teacher/attendance">
              <Button variant="outline" leftIcon={<ClipboardList className="w-4 h-4" />}>
                Davomat Olish
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Guruhlarim</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{groups.length} ta</h3>
            <span className="text-[11px] text-slate-400 font-medium block">Jami o'quvchi: {totalStudentsCount}</span>
            <Link to="/teacher/groups" className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-1">
              Guruhlarni boshqarish <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Bugungi Darslar</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{todayLessons.length} ta</h3>
            <span className="text-[11px] text-indigo-400 font-medium block">Rejadagi darslar</span>
            <Link to="/teacher/today" className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
              Jadvalga o'tish <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Tekshirilmagan Vazifalar</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-400">{pendingSubmissions.length} ta</h3>
            <Link to="/teacher/homework" className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-0.5">
              Tekshirishga o'tish <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Yangi Savollar</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400">{newQuestions.length} ta</h3>
            <Link to="/teacher/questions" className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 mt-0.5">
              Javob berish <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Today's Lessons and Pending Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" /> Darslar Rejasi
            </h3>
            <Link to="/teacher/lessons" className="text-xs text-sky-400 hover:underline">
              Barcha darslar
            </Link>
          </div>

          {todayLessons.length === 0 ? (
            <Card className="p-8 text-center bg-slate-900/40 border-slate-800">
              <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">Bugungi kunga darslar belgilanmagan</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((les) => {
                const group = groups.find((g) => g.groupId === les.groupId);
                return (
                  <Card
                    key={les.lessonId}
                    className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {group?.name || "Guruh"}
                        </span>
                        <span className="text-xs text-slate-400">#{les.lessonNumber}-dars</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{les.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{les.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {les.videoUrl && (
                        <span title="Video dars mavjud" className="p-1.5 rounded-lg bg-slate-800 text-sky-400">
                          <Video className="w-4 h-4" />
                        </span>
                      )}
                      <Link to="/teacher/lessons">
                        <Button variant="secondary" size="sm">
                          Boshqarish
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* My Groups Quick List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Guruhlarim ({groups.length})
            </h3>
            <Link to="/teacher/groups" className="text-xs text-sky-400 hover:underline">
              Barchasi →
            </Link>
          </div>

          {groups.length === 0 ? (
            <Card className="p-8 text-center bg-slate-900/40 border-slate-800 text-xs text-slate-400">
              Sizga hali guruhlar biriktirilmagan
            </Card>
          ) : (
            <div className="space-y-2.5">
              {groups.map((g) => {
                const count = g.studentIds?.length || g.currentStudentsCount || 0;
                return (
                  <Card key={g.groupId} className="p-3.5 bg-slate-900/70 border-slate-800">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-white">{g.name}</h5>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        {count} ta o'quvchi
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{g.schedule}</span>
                      <span>{g.startTime}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
