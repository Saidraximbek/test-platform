import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Send,
  Upload,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Play,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { lessonService } from "../../services/lessonService";
import { homeworkService } from "../../services/homeworkService";
import { testService } from "../../services/testService";
import { Lesson, Homework, HomeworkSubmission } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { sound } from "../../utils/soundEffects";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { extractYouTubeUrls } from "../../utils/videoUtils";
import { RichTextEditor, FormattedContent } from "../../components/common/RichTextEditor";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const StudentLessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [homeworkText, setHomeworkText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingHw, setSubmittingHw] = useState(false);
  const [startingTest, setStartingTest] = useState(false);
  const [completedTestSession, setCompletedTestSession] = useState<any | null>(null);

  useEffect(() => {
    const loadLessonDetails = async () => {
      if (!lessonId || !user?.uid) return;
      try {
        setLoading(true);
        const les = await lessonService.getLessonById(lessonId);
        setLesson(les);

        if (les) {
          let hw = await homeworkService.getHomeworkByLesson(les.lessonId);
          if (!hw) {
            hw = {
              homeworkId: les.homeworkId || `hw_${les.lessonId}`,
              lessonId: les.lessonId,
              groupId: les.groupId,
              teacherId: les.teacherId,
              title: `${les.title} - Uy vazifasi`,
              instructions: les.description || `${les.title} mavzusi yuzasidan berilgan topshiriq va mashqlarni bajaring.`,
              maxScore: 100,
              deadline: les.scheduledDate || "",
              lessonTitle: les.title,
              attachments: [],
              createdAt: les.createdAt,
              updatedAt: les.updatedAt,
            };
          }
          setHomework(hw);

          const subs = await homeworkService.getStudentSubmissions(user.uid);
          const mySub = subs.find(
            (s) =>
              (hw && s.homeworkId === hw.homeworkId) ||
              s.lessonId === les.lessonId ||
              s.homeworkId === `hw_${les.lessonId}`
          );
          if (mySub) {
            setSubmission(mySub);
            setHomeworkText(mySub.textAnswer || "");
          }

          // Check if student has already completed the attached test
          if (les.testId && user?.uid) {
            try {
              const qSess = query(
                collection(db, "test_sessions"),
                where("userId", "==", user.uid),
                where("levelId", "==", les.testId)
              );
              const sSnap = await getDocs(qSess);
              if (!sSnap.empty) {
                const completed = sSnap.docs.find((d) => (d.data() as any).status === "completed") || sSnap.docs[0];
                setCompletedTestSession(completed.data());
              }
            } catch (sessErr) {
              console.warn("Could not check attached test session:", sessErr);
            }
          }
        }
      } catch (err: any) {
        toastError(err.message || "Dars ma'lumotlarini yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };

    loadLessonDetails();
  }, [lessonId, user?.uid]);

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkText.trim()) {
      toastError("Iltimos, vazifa javobini yozing");
      return;
    }
    if (!lesson || !user?.uid) {
      toastError("Dars yoki foydalanuvchi ma'lumotlari topilmadi");
      return;
    }

    try {
      setSubmittingHw(true);
      const effectiveHwId = homework?.homeworkId || lesson.homeworkId || `hw_${lesson.lessonId}`;
      const effectiveTeacherId = homework?.teacherId || lesson.teacherId || "";

      const sub = await homeworkService.submitHomework({
        homeworkId: effectiveHwId,
        lessonId: lesson.lessonId,
        studentId: user.uid,
        studentName: user.displayName || user.email || "O'quvchi",
        teacherId: effectiveTeacherId,
        textAnswer: homeworkText.trim(),
      });

      setSubmission(sub);
      success("Uy vazifasi ustozga muvaffaqiyatli yuborildi!");
      sound.playSuccess();
    } catch (err: any) {
      console.error("Submit homework error:", err);
      toastError(err.message || "Topshirishda xatolik yuz berdi");
    } finally {
      setSubmittingHw(false);
    }
  };

  const handleStartAttachedTest = async () => {
    if (startingTest) return;
    if (completedTestSession && completedTestSession.status === "completed") {
      toastError("Ushbu dars testi faqat 1 marta topshiriladi. Siz allaqachon topshirgansiz.");
      return;
    }
    if (!lesson?.testId) return;

    try {
      setStartingTest(true);
      sound.playClick();
      const effectiveSubjectId = lesson.subjectId || "general";
      // TestId in lesson links to levelId in existing test system
      const res = await testService.startTest(effectiveSubjectId, lesson.testId);
      navigate(`/test/${res.sessionId}`, { state: { sessionData: res } });
    } catch (err: any) {
      toastError(err.message || "Testni boshlab bo'lmadi");
    } finally {
      setStartingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-400">Dars topilmadi</p>
        <Link to="/lessons" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">
            Darslar ro'yxatiga qaytish
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <Link
        to="/lessons"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Darslar ro'yxatiga qaytish
      </Link>

      {/* Lesson Header */}
      <div className="bg-gradient-to-r from-brand-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-100 uppercase tracking-wider mb-2">
          <span>#{lesson.lessonNumber}-Dars</span>
          <span>•</span>
          <span>{lesson.scheduledDate}</span>
          <span>•</span>
          <span>{lesson.durationMinutes} daqiqa</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-xs sm:text-sm text-brand-100 mt-2 leading-relaxed">
            {lesson.description}
          </p>
        )}
      </div>

      {/* 1. Video Player Section */}
      {lesson.videoUrl && (
        <Card className="p-6 space-y-3 overflow-hidden">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-500" /> 🎥 Mavzu Bo'yicha Qisqa Video Dars
          </h3>
          <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
        </Card>
      )}

      {/* 2. Text Materials & Notes */}
      {lesson.materialsText && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-emerald-500" /> 📄 Dars Konspekti va Qoidalari
          </h3>

          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {lesson.materialsText}
          </div>

          {lesson.pdfUrl && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <a
                href={lesson.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-brand-600 hover:text-white transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 text-rose-500" /> PDF Materialni ochish / yuklab olish
                <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
              </a>
            </div>
          )}
        </Card>
      )}

      {/* 3. Attached Test Integration (uses existing test engine) */}
      {lesson.testId && (
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-900 border-amber-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  🧪 Mavzulashtirilgan Test
                </span>
                {completedTestSession && completedTestSession.status === "completed" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 1 marta topshirilgan
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Mavzuni Test Orqali Mustahkamlash
              </h3>
              {completedTestSession && completedTestSession.status === "completed" ? (
                <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Natijangiz: {completedTestSession.score}% ({completedTestSession.correctCount || 0} to'g'ri javob)
                  </span>
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    +{completedTestSession.earnedCoins || completedTestSession.correctCount || 0} Tillo ball olindi
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ushbu dars uchun maxsus test mavjud (Faqat 1 marta ishlash mumkin). Har bir to'g'ri javob uchun +1 Tillo tangasiga ega bo'lasiz!
                </p>
              )}
            </div>

            {completedTestSession && completedTestSession.status === "completed" ? (
              <Button
                onClick={() => navigate(`/test/${completedTestSession.sessionId}/result`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-lg shadow-emerald-600/25"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Natijani ko'rish
              </Button>
            ) : (
              <Button
                onClick={handleStartAttachedTest}
                isLoading={startingTest}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0"
                leftIcon={<Play className="w-4 h-4" />}
              >
                Testni Boshlash
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 4. Homework Assignment & Submission */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> 📝 Uy Vazifasi
          </h3>
          {submission && (
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                submission.status === "COMPLETED"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              }`}
            >
              {submission.status === "COMPLETED"
                ? `Baholandi: ${submission.score} ball (+${submission.score} Tillo)`
                : "Topshirildi (Tekshirilmoqda)"}
            </span>
          )}
        </div>

        {homework?.instructions ? (
          <div className="mb-4 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
              <span className="font-bold block mb-2 text-slate-900 dark:text-white">
                Vazifa sharti:
              </span>
              <FormattedContent content={homework.instructions} />
            </div>

            {/* Embedded video if homework has a videoUrl or instructions contains YouTube links */}
            {(homework as any)?.videoUrl && (
              <VideoEmbed url={(homework as any).videoUrl} title="Vazifa video qo'llanmasi" />
            )}
            {extractYouTubeUrls(homework.instructions).map((ytUrl, idx) => (
              <VideoEmbed key={idx} url={ytUrl} title="Vazifa bo'yicha video havola" />
            ))}
          </div>
        ) : (
          <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
            <span className="font-bold block mb-2 text-slate-900 dark:text-white">
              Vazifa sharti:
            </span>
            <FormattedContent content={lesson.description || `${lesson.title} mavzusi bo'yicha berilgan amaliy topshiriq va mashqlarni bajaring hamda yechimlarini yuboring.`} />
          </div>
        )}

        {/* If student submitted an answer with a YouTube video, show player */}
        {submission?.textAnswer && extractYouTubeUrls(submission.textAnswer).length > 0 && (
          <div className="mb-4 space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Video className="w-4 h-4 text-sky-500" /> Topshirgan video javobingiz:
            </span>
            {extractYouTubeUrls(submission.textAnswer).map((ytUrl, idx) => (
              <VideoEmbed key={idx} url={ytUrl} title="Siz topshirgan video" />
            ))}
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmitHomework} className="space-y-4">
          <RichTextEditor
            label="Sizning javobingiz (Dizayn berib yozishingiz mumkin):"
            value={homeworkText}
            onChange={setHomeworkText}
            placeholder="Masalalar yechimi, YouTube video havolasi yoki javoblaringizni batafsil yozing..."
            rows={5}
            required
          />

          {/* Live video preview while student types a YouTube link */}
          {homeworkText && extractYouTubeUrls(homeworkText).length > 0 && !submission && (
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] font-bold text-sky-500 flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> Video havola aniqlandi (Oldindan ko'rish):
              </span>
              {extractYouTubeUrls(homeworkText).map((ytUrl, idx) => (
                <VideoEmbed key={idx} url={ytUrl} title="Yuborilayotgan video" />
              ))}
            </div>
          )}

          {submission?.teacherComment && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-400">
              <span className="font-bold block mb-1">Ustoz tekshirib izoh qoldirdi:</span>
              <FormattedContent content={submission.teacherComment} />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={submittingHw}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {submission ? "Qayta topshirish" : "Vazifani topshirish"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
