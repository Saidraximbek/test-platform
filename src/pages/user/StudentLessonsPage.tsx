import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Clock,
  Video,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Search,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { groupService } from "../../services/groupService";
import { lessonService } from "../../services/lessonService";
import { Group, Lesson } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";

export const StudentLessonsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [lessons, setLessons] = useState<{ lesson: Lesson; groupName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  useEffect(() => {
    const loadLessons = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        let stGroups = await groupService.getStudentGroups(user.uid);
        const deletedGroupIds = groupService.getDeletedGroupIds ? groupService.getDeletedGroupIds() : new Set();

        if (stGroups.length === 0 && Array.isArray(user?.enrolledGroups) && user.enrolledGroups.length > 0) {
          const validEnrolled = user.enrolledGroups.filter((eg) => eg && eg.groupId && !deletedGroupIds.has(eg.groupId));
          if (validEnrolled.length > 0) {
            stGroups = validEnrolled.map((eg) => ({
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
        setGroups(stGroups);

        const list: { lesson: Lesson; groupName: string }[] = [];
        const seenLessonIds = new Set<string>();

        const groupLessonsResults = await Promise.all(
          stGroups.map(async (g) => {
            const groupLessons = await lessonService.getLessons(g.groupId).catch(() => []);
            return { group: g, lessons: groupLessons };
          })
        );

        for (const res of groupLessonsResults) {
          const { group: g, lessons: groupLessons } = res;
          groupLessons.forEach((les) => {
            if ((les.status === "published" || !les.status) && !seenLessonIds.has(les.lessonId)) {
              list.push({ lesson: les, groupName: g.name });
              seenLessonIds.add(les.lessonId);
            }
          });
        }

        // Broad fallback scan only if no lessons found from direct group query
        if (list.length === 0 && stGroups.length > 0) {
          try {
            const gIds = new Set(stGroups.map((g) => g.groupId));
            const allLessons = await lessonService.getLessons();
            allLessons.forEach((les) => {
              if (les.groupId && gIds.has(les.groupId) && !seenLessonIds.has(les.lessonId)) {
                if (les.status === "published" || !les.status) {
                  const g = stGroups.find((grp) => grp.groupId === les.groupId);
                  list.push({ lesson: les, groupName: g?.name || "Guruh darsi" });
                  seenLessonIds.add(les.lessonId);
                }
              }
            });
          } catch (e) {}
        }

        // Fallback: if student is assigned a teacher directly (user.teacherId)
        if (list.length === 0 && (user as any)?.teacherId) {
          try {
            const tLessons = await lessonService.getTeacherLessons((user as any).teacherId);
            tLessons.forEach((les) => {
              if ((les.status === "published" || !les.status) && !seenLessonIds.has(les.lessonId)) {
                list.push({ lesson: les, groupName: "Ustoz darsi" });
                seenLessonIds.add(les.lessonId);
              }
            });
          } catch (e) {}
        }

        setLessons(list);
      } catch (err) {
        console.error("Error loading student lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [user?.uid, user?.enrolledGroups, user?.groupIds]);

  const filtered = lessons.filter(({ lesson, groupName }) => {
    const matchGroup = selectedGroupFilter === "all" || groupName === selectedGroupFilter;
    const matchSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-brand-500" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Mening Darslarim
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Siz a'zo bo'lgan guruhlarning darslari, mavzular, videolar va topshiriqlar
        </p>
      </div>

      {/* Enrolled Groups Schedule Cards */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((g) => {
            const isSelected = selectedGroupFilter === g.name;
            return (
              <div
                key={g.groupId}
                onClick={() => setSelectedGroupFilter(isSelected ? "all" : g.name)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {g.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full shrink-0">
                    {g.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="font-medium">{g.schedule}</span>
                  {g.room && <span>• Xona: {g.room}</span>}
                  {g.teacherName && <span className="truncate">• Ustoz: {g.teacherName}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter and Search */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Dars mavzusi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {groups.length > 1 && (
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha guruhlarim</option>
            {groups.map((g) => (
              <option key={g.groupId} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Lessons List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Darslar mavjud emas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha sizning guruhingizga darslar rejalashtirilmagan yoki guruhga biriktirilmagansiz.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(({ lesson, groupName }) => (
            <Card
              key={lesson.lessonId}
              className="p-5 flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    {groupName}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" /> {lesson.scheduledDate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  #{lesson.lessonNumber}-Dars: {lesson.title}
                </h3>

                {lesson.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {lesson.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {lesson.videoUrl && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded">
                      <Video className="w-3 h-3" /> Video dars
                    </span>
                  )}
                  {lesson.materialsText && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                      <FileText className="w-3 h-3" /> Konspekt
                    </span>
                  )}
                  {lesson.testId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                      <HelpCircle className="w-3 h-3" /> Test
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <Link to={`/lessons/${lesson.lessonId}`}>
                  <Button className="w-full" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Darsni boshlash
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
