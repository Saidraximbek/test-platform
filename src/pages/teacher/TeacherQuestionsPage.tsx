import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Video,
  Send,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { teacherQuestionService } from "../../services/teacherQuestionService";
import { TeacherQuestion, TeacherQuestionStatus } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { extractYouTubeUrls } from "../../utils/videoUtils";

export const TeacherQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Answer Modal
  const [selectedQuestion, setSelectedQuestion] = useState<TeacherQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [videoAnswerUrl, setVideoAnswerUrl] = useState("");
  const [answering, setAnswering] = useState(false);

  const loadQuestions = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const list = await teacherQuestionService.getTeacherQuestions(user.uid);
      setQuestions(list);
    } catch (err: any) {
      toastError(err.message || "Savollarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [user?.uid]);

  const openAnswerModal = (q: TeacherQuestion) => {
    setSelectedQuestion(q);
    setAnswerText(q.answerText || "");
    setVideoAnswerUrl(q.videoAnswerUrl || "");
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !answerText.trim()) {
      toastError("Javob matnini kiriting");
      return;
    }

    try {
      setAnswering(true);
      await teacherQuestionService.answerQuestion(
        selectedQuestion.questionId,
        answerText,
        videoAnswerUrl || undefined
      );

      success("Javob muvaffaqiyatli yuborildi!");
      setSelectedQuestion(null);
      loadQuestions();
    } catch (err: any) {
      toastError(err.message || "Javob yuborishda xatolik");
    } finally {
      setAnswering(false);
    }
  };

  const filtered = questions.filter((q) => {
    const matchSearch =
      q.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            O'quvchilar Savollari
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          O'quvchilar tomonidan mavzu yoki dars yuzasidan yo'llangan savollarga javob berish
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi yoki savol matni bo'yicha qidirish..."
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
            <option value="all">Barcha savollar</option>
            <option value="NEW">Yangi (Javob berilmagan)</option>
            <option value="ANSWERED">Javob berilgan</option>
          </select>
        </div>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Savollar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha o'quvchilar tomonidan hech qanday yangi savol yo'llanmagan.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const isNew = q.status === "NEW";

            return (
              <Card
                key={q.questionId}
                className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{q.studentName}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isNew
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {isNew ? "Yangi Savol" : "Javob berilgan"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-white leading-relaxed">
                    {q.text}
                  </div>

                  {q.answerText && (
                    <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-xs text-emerald-300">
                      <span className="font-bold block mb-0.5">Sizning javobingiz:</span>
                      <p className="leading-relaxed">{q.answerText}</p>
                      {q.videoAnswerUrl && (
                        <div className="mt-2">
                          <VideoEmbed url={q.videoAnswerUrl} title="Ustoz video javobi" />
                        </div>
                      )}
                      {extractYouTubeUrls(q.answerText).map((yt, idx) => (
                        <div key={idx} className="mt-2">
                          <VideoEmbed url={yt} title="Video havola" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant={isNew ? "primary" : "secondary"}
                    onClick={() => openAnswerModal(q)}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    {isNew ? "Javob berish" : "Tahrirlash"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Answer Question */}
      <Modal
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        title={selectedQuestion ? `${selectedQuestion.studentName}ning savoliga javob berish` : ""}
      >
        <form onSubmit={handleSendAnswer} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-semibold block mb-1">Savol:</span>
            <p className="text-white leading-relaxed">{selectedQuestion?.text}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ustoz javobi (Matn)
            </label>
            <textarea
              rows={4}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Savol bo'yicha batafsil tushuntirish yozing..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <Input
              label="🎥 Qisqa video javob havolasi (Ixtiyoriy)"
              placeholder="https://... yoki YouTube shorts/unlisted video"
              value={videoAnswerUrl}
              onChange={(e) => setVideoAnswerUrl(e.target.value)}
            />
            {videoAnswerUrl && extractYouTubeUrls(videoAnswerUrl).length > 0 && (
              <div className="mt-2">
                <VideoEmbed url={videoAnswerUrl} title="Video oldindan ko'rish" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedQuestion(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={answering}>
              Javobni yuborish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
