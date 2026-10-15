import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  BookOpen,
  Send,
  Star,
  Award,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { homeworkService } from "../../services/homeworkService";
import { groupService } from "../../services/groupService";
import { Group, Homework, HomeworkSubmission } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { sound } from "../../utils/soundEffects";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { extractYouTubeUrls } from "../../utils/videoUtils";
import { RichTextEditor, FormattedContent } from "../../components/common/RichTextEditor";

export const StudentHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [groups, setGroups] = useState<Group[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      // 1. Load student groups
      let stGroups = await groupService.getStudentGroups(user.uid).catch(() => []);
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

      const groupIds = stGroups.map((g) => g.groupId);

      // 2. Load group homeworks and student submissions in parallel
      const [allHws, subs] = await Promise.all([
        groupIds.length > 0 ? homeworkService.getGroupHomeworks(groupIds).catch(() => []) : [],
        homeworkService.getStudentSubmissions(user.uid).catch(() => []),
      ]);

      setHomeworks(allHws);
      setSubmissions(subs);
    } catch (err: any) {
      toastError(err.message || "Vazifalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const openSubmitModal = (hw: Homework) => {
    setSelectedHw(hw);
    const existing = submissions.find(
      (s) =>
        s.homeworkId === hw.homeworkId ||
        (hw.lessonId && s.lessonId === hw.lessonId) ||
        (hw.lessonId && s.homeworkId === `hw_${hw.lessonId}`)
    );
    setTextAnswer(existing?.textAnswer || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHw || !textAnswer.trim() || !user?.uid) {
      toastError("Iltimos, vazifa javobini yozing");
      return;
    }

    try {
      setSubmitting(true);
      await homeworkService.submitHomework({
        homeworkId: selectedHw.homeworkId,
        lessonId: selectedHw.lessonId,
        studentId: user.uid,
        studentName: user.displayName || user.email || "O'quvchi",
        teacherId: selectedHw.teacherId,
        textAnswer: textAnswer.trim(),
      });

      success("Vazifa ustozga muvaffaqiyatli topshirildi!");
      sound.playSuccess();
      setSelectedHw(null);
      setTextAnswer("");
      loadData();
    } catch (err: any) {
      toastError(err.message || "Topshirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Group homeworks by submission status
  const pendingHomeworkList = homeworks.map((hw) => {
    const sub = submissions.find(
      (s) =>
        s.homeworkId === hw.homeworkId ||
        (hw.lessonId && s.lessonId === hw.lessonId) ||
        (hw.lessonId && s.homeworkId === `hw_${hw.lessonId}`)
    );
    const grp = groups.find((g) => g.groupId === hw.groupId);
    return {
      homework: hw,
      submission: sub,
      groupName: grp?.name || hw.groupName || "O'quv Guruhi",
    };
  });

  const gradedSubmissions = submissions.filter(
    (s) => s.status === "COMPLETED" && s.score !== null
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileCheck className="w-7 h-7 text-indigo-500" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Uy Vazifalarim
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Guruhlaringizga biriktirilgan topshiriqlar, muddatlar va ustoz baholari
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pending"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Kutilayotgan Vazifalar</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {pendingHomeworkList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "completed"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Baholangan Vazifalar</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {gradedSubmissions.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : activeTab === "pending" ? (
        /* PENDING HOMEWORKS TAB */
        pendingHomeworkList.length === 0 ? (
          <Card className="p-12 text-center">
            <FileCheck className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hozircha faol vazifalar yo'q
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Ustozingiz darsga yangi uy vazifasi yuklagach, u shu yerda avtomatik ko'rinadi.
            </p>
            <Link to="/lessons" className="inline-block mt-4">
              <Button size="sm">Darslarimga o'tish</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingHomeworkList.map(({ homework: hw, submission: sub, groupName }) => {
              const isSubmitted = Boolean(sub);
              const isGraded = sub?.status === "COMPLETED";

              return (
                <Card
                  key={hw.homeworkId}
                  className="p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {groupName}
                      </span>

                      {isGraded ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Baholandi: {sub?.score} ball
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Tekshirilmoqda
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Topshirilmagan
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {hw.title}
                      </h3>
                      {hw.instructions && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          {hw.instructions}
                        </p>
                      )}

                      {/* Video embed if instructions or homework has YouTube link */}
                      {(hw as any).videoUrl && (
                        <div className="mt-2.5">
                          <VideoEmbed url={(hw as any).videoUrl} title="Vazifa video qo'llanmasi" />
                        </div>
                      )}
                      {hw.instructions && extractYouTubeUrls(hw.instructions).map((ytUrl, idx) => (
                        <div key={idx} className="mt-2.5">
                          <VideoEmbed url={ytUrl} title="Vazifa videosi" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        Muddat: {hw.deadline ? hw.deadline.slice(0, 10) : "Cheklovsiz"}
                      </span>
                      <span className="font-bold text-amber-500">
                        Max: {hw.maxScore || 100} ball
                      </span>
                    </div>

                    {sub?.teacherComment && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-0.5">
                          Ustoz izohi:
                        </span>
                        <p className="text-emerald-800 dark:text-emerald-200">{sub.teacherComment}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Button
                      onClick={() => openSubmitModal(hw)}
                      size="sm"
                      className="flex-1"
                      variant={isSubmitted ? "outline" : "primary"}
                    >
                      {isSubmitted ? "Javobni yangilash" : "Vazifani topshirish"}
                    </Button>

                    {hw.lessonId && (
                      <Link to={`/lessons/${hw.lessonId}`}>
                        <Button size="sm" variant="secondary" title="Darsni ko'rish">
                          <BookOpen className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* GRADED / HISTORY TAB */
        gradedSubmissions.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Baholangan vazifalar mavjud emas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Siz topshirgan vazifalarni ustoz tekshirib ball qo'ygach, natijalar shu yerda ko'rinadi.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {gradedSubmissions.map((sub) => (
              <Card key={sub.submissionId} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Baholandi: {sub.score} ball
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sub.reviewedAt ? new Date(sub.reviewedAt?.seconds ? sub.reviewedAt.seconds * 1000 : sub.reviewedAt).toLocaleDateString() : "Yaqinda"}
                    </span>
                  </div>

                  {sub.lessonId && (
                    <Link to={`/lessons/${sub.lessonId}`}>
                      <Button variant="secondary" size="sm">
                        Darsga o'tish
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                  <span className="text-slate-500 block mb-1">Topshirgan javobingiz:</span>
                  <p className="text-slate-900 dark:text-slate-100">{sub.textAnswer}</p>

                  {/* If student submitted YouTube video */}
                  {extractYouTubeUrls(sub.textAnswer).map((ytUrl, idx) => (
                    <div key={idx} className="pt-2">
                      <VideoEmbed url={ytUrl} title="Topshirgan video javobingiz" />
                    </div>
                  ))}
                </div>

                {sub.teacherComment && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Ustoz fikri:</strong>
                      <p className="mt-0.5 leading-relaxed">{sub.teacherComment}</p>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      )}

      {/* Quick Submit Homework Modal */}
      <Modal
        isOpen={Boolean(selectedHw)}
        onClose={() => setSelectedHw(null)}
        title={selectedHw ? `Vazifani topshirish: "${selectedHw.title}"` : "Vazifani topshirish"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedHw?.instructions && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <strong className="block text-indigo-600 dark:text-indigo-400 font-bold">Topshiriq sharti:</strong>
              <FormattedContent content={selectedHw.instructions} />

              {extractYouTubeUrls(selectedHw.instructions).map((ytUrl, idx) => (
                <div key={idx} className="pt-1">
                  <VideoEmbed url={ytUrl} title="Vazifa videosi" />
                </div>
              ))}
            </div>
          )}

          <div>
            <RichTextEditor
              label="Javobingiz matni / Yechim (Dizayn berib yozish mumkin):"
              value={textAnswer}
              onChange={setTextAnswer}
              placeholder="Vazifa bo'yicha javobingizni, YouTube video havolasini yoki yechimlaringizni yozing..."
              rows={5}
              required
            />

            {/* Live video preview while typing */}
            {textAnswer && extractYouTubeUrls(textAnswer).length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[11px] font-bold text-sky-500 flex items-center gap-1">
                  🎥 Video havola aniqlandi (Oldindan ko'rish):
                </span>
                {extractYouTubeUrls(textAnswer).map((ytUrl, idx) => (
                  <VideoEmbed key={idx} url={ytUrl} title="Yuborilayotgan video" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedHw(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={submitting} rightIcon={<Send className="w-3.5 h-3.5" />}>
              Ustozga Yuborish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
