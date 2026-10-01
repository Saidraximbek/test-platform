import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  BookOpen,
  ClipboardList,
  FileCheck,
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { lessonService } from "../../services/lessonService";
import { groupService } from "../../services/groupService";
import { Lesson, Group } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { extractYouTubeUrls } from "../../utils/videoUtils";

export const TeacherTodayLessonsPage: React.FC = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  const formattedDate = new Date().toLocaleDateString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [gList, lList] = await Promise.all([
        groupService.getTeacherGroups(user.uid).catch(() => []),
        lessonService.getTeacherLessons(user.uid).catch(() => []),
      ]);

      setGroups(gList);
      setAllLessons(lList);

      const today = lList.filter((l) => l.scheduledDate === todayStr);
      setTodayLessons(today);
    } catch (err: any) {
      toastError(err.message || "Bugungi darslarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-sky-500" />
      </div>
    );
  }

  // Next upcoming lessons if today is empty
  const upcomingLessons = allLessons
    .filter((l) => l.scheduledDate !== todayStr)
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-brand-600 text-white p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-sky-100 border border-white/20 mb-2 capitalize">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Bugungi Darslar</h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              Kunlik o'quv rejasidagi darslar jadvali, dars materiallari va davomat amallari
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/teacher/lessons">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Dars Qo'shish</Button>
            </Link>
            <Link to="/teacher/attendance">
              <Button variant="secondary" leftIcon={<ClipboardList className="w-4 h-4" />}>
                Davomat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Today Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> Bugun o'tilishi rejalashtirilgan ({todayLessons.length})
          </h2>
          <span className="text-xs text-slate-400">Sana: {todayStr}</span>
        </div>

        {todayLessons.length === 0 ? (
          <Card className="p-10 text-center bg-slate-900/40 border-slate-800 space-y-3">
            <Calendar className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-sm font-bold text-slate-200">Bugungi kunga darslar belgilanmagan</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bugungi sana ({todayStr}) bo'yicha hech qanday dars jadvali kiritilmagan. Yangi dars qo'shishingiz yoki yaqin kunlardagi darslarni ko'rishingiz mumkin.
            </p>
            <div className="pt-2">
              <Link to="/teacher/lessons">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Yangi Dars Kiritish
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {todayLessons.map((les) => {
              const group = groups.find((g) => g.groupId === les.groupId);
              const ytUrls = les.videoUrl ? [les.videoUrl] : [];

              return (
                <Card
                  key={les.lessonId}
                  className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">
                        {group?.name || "O'quv Guruhi"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        #{les.lessonNumber}-Dars
                      </span>
                      {group?.room && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3 text-amber-400" /> {group.room}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{les.durationMinutes || 80} daqiqa</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{les.title}</h3>
                    {les.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{les.description}</p>
                    )}
                  </div>

                  {/* Embedded video if exists */}
                  {ytUrls.map((url, idx) => (
                    <div key={idx} className="max-w-xl">
                      <VideoEmbed url={url} title={les.title} />
                    </div>
                  ))}

                  {/* Quick Action Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/teacher/attendance?groupId=${les.groupId}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Davomat Olish
                        </Button>
                      </Link>
                      <Link to={`/teacher/homework`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Vazifalar
                        </Button>
                      </Link>
                    </div>

                    <Link to="/teacher/lessons">
                      <Button size="sm" className="text-xs" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
                        Darsni Boshqarish
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming / Other Lessons */}
      {upcomingLessons.length > 0 && (
        <div className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Boshqa rejalashtirilgan darslar
            </h3>
            <Link to="/teacher/lessons" className="text-xs text-sky-400 hover:underline">
              Barchasini ko'rish →
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingLessons.map((les) => {
              const group = groups.find((g) => g.groupId === les.groupId);
              return (
                <Card
                  key={les.lessonId}
                  className="p-3.5 bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-slate-800 font-bold text-slate-300 text-[11px] shrink-0">
                      #{les.lessonNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{les.title}</h4>
                      <span className="text-[11px] text-slate-400">
                        {group?.name || "Guruh"} • Sana: {les.scheduledDate || "Belgilanmagan"}
                      </span>
                    </div>
                  </div>

                  <Link to="/teacher/lessons">
                    <Button variant="outline" size="sm" className="text-xs">
                      Ko'rish
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
