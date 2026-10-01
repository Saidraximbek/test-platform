import React, { useEffect, useState } from "react";
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Award,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { homeworkService } from "../../services/homeworkService";
import { HomeworkSubmission } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { extractYouTubeUrls } from "../../utils/videoUtils";

export const TeacherHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Grading modal
  const [selectedSub, setSelectedSub] = useState<HomeworkSubmission | null>(null);
  const [score, setScore] = useState(100);
  const [comment, setComment] = useState("");
  const [grading, setGrading] = useState(false);

  const loadSubmissions = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const list = await homeworkService.getTeacherSubmissions(user.uid);
      setSubmissions(list);
    } catch (err: any) {
      toastError(err.message || "Vazifalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user?.uid]);

  const openGradeModal = (sub: HomeworkSubmission) => {
    setSelectedSub(sub);
    setScore(sub.score || 100);
    setComment(sub.teacherComment || "Ajoyib, topshiriq to'liq bajarilgan!");
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setGrading(true);
      await homeworkService.gradeSubmission(selectedSub.submissionId, Number(score), comment);
      success("Vazifa baholandi va o'quvchiga izoh yuborildi!");
      setSelectedSub(null);
      loadSubmissions();
    } catch (err: any) {
      toastError(err.message || "Baholashda xatolik");
    } finally {
      setGrading(false);
    }
  };

  const filtered = submissions.filter((sub) => {
    const matchSearch =
      sub.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.textAnswer?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <FileCheck className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">Vazifalarni Tekshirish</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          O'quvchilar tomonidan topshirilgan uy vazifalarini ko'rib chiqish, baholash va fikr bildirish
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi ismi yoki javob matni bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha vazifalar</option>
            <option value="SUBMITTED">Yangi topshirilganlar (Tekshirilmagan)</option>
            <option value="COMPLETED">Baholangan (Tekshirilgan)</option>
          </select>
        </div>
      </Card>

      {/* Submissions List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <FileCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Vazifalar mavjud emas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha tekshirish uchun o'quvchilar tomonidan yuborilgan topshiriqlar yo'q.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const isPending = sub.status === "SUBMITTED";

            return (
              <Card
                key={sub.submissionId}
                className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {sub.studentName || "O'quvchi"}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isPending
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {isPending ? "Kutilmoqda" : `Baholandi: ${sub.score} ball`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed font-mono">
                    {sub.textAnswer}
                  </p>

                  {/* Embedded YouTube video if student submitted a video link */}
                  {extractYouTubeUrls(sub.textAnswer).map((ytUrl, idx) => (
                    <div key={idx} className="mt-2">
                      <VideoEmbed url={ytUrl} title={`${sub.studentName}ning video yechimi`} />
                    </div>
                  ))}

                  {/* Attachments */}
                  {sub.fileUrls && sub.fileUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sub.fileUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-500/30 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> Biriktirilgan fayl #{i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {sub.teacherComment && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Ustoz izohi: {sub.teacherComment}
                    </p>
                  )}
                </div>

                <div className="shrink-0 pt-2 md:pt-0 w-full sm:w-auto">
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    variant={isPending ? "primary" : "secondary"}
                    onClick={() => openGradeModal(sub)}
                  >
                    {isPending ? "Baholash & Izoh" : "Qayta baholash"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Grade Submission */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title={selectedSub ? `${selectedSub.studentName}ning javobini baholash` : ""}
      >
        <form onSubmit={handleGrade} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
            <span className="text-slate-400 font-semibold block">O'quvchi javobi:</span>
            <p className="text-white leading-relaxed font-mono">{selectedSub?.textAnswer}</p>

            {selectedSub && extractYouTubeUrls(selectedSub.textAnswer).map((ytUrl, idx) => (
              <div key={idx} className="pt-2">
                <span className="text-sky-400 text-[11px] font-bold block mb-1">Biriktirilgan video darslik/yechim:</span>
                <VideoEmbed url={ytUrl} title={`${selectedSub.studentName}ning video yechimi`} />
              </div>
            ))}
          </div>

          <Input
            label="Ball (0 - 100)"
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ustoz fikri / Izoh (Studentga ko'rinadi)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Masalan: 3-savolda xatolik bor, lekin umumiy hisobda yaxshi..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedSub(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={grading}>
              Bahoni saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
