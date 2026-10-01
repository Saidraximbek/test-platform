import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { teacherQuestionService } from "../../services/teacherQuestionService";
import { Group, TeacherQuestion, UserProfile } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export const StudentQuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<{ uid: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Ask modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [qList, gList] = await Promise.all([
        teacherQuestionService.getStudentQuestions(user.uid).catch(() => []),
        groupService.getStudentGroups(user.uid).catch(() => []),
      ]);

      let finalGroups = gList;
      const deletedGroupIds = groupService.getDeletedGroupIds ? groupService.getDeletedGroupIds() : new Set();
      if (finalGroups.length === 0 && Array.isArray(user?.enrolledGroups) && user.enrolledGroups.length > 0) {
        const validEnrolled = user.enrolledGroups.filter((eg) => eg && eg.groupId && !deletedGroupIds.has(eg.groupId));
        if (validEnrolled.length > 0) {
          finalGroups = validEnrolled.map((eg) => ({
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

      // Also load all teachers in case student has no groups yet
      let tList: { uid: string; displayName: string }[] = [];
      try {
        const qT = query(collection(db, "users"), where("role", "==", "teacher"));
        const snapT = await getDocs(qT);
        tList = snapT.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string) || (d.data().email as string) || "O'qituvchi",
        }));
      } catch {}

      setQuestions(qList);
      setGroups(finalGroups);
      setTeachers(tList);
      if (finalGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(finalGroups[0].groupId);
      } else if (tList.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(tList[0].uid);
      }
    } catch (err: any) {
      toastError(err.message || "Savollarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !user?.uid) {
      toastError("Iltimos, savol matnini kiriting");
      return;
    }

    const activeGroupId = selectedGroupId || (groups.length > 0 ? groups[0].groupId : "");
    const group = groups.find((g) => g.groupId === activeGroupId);

    let resolvedTeacherId = group?.teacherId || selectedTeacherId || "";
    let resolvedTeacherName = group?.teacherName || "";

    if (!resolvedTeacherId || resolvedTeacherId === "teacher") {
      if (user?.teacherId) {
        resolvedTeacherId = user.teacherId;
      } else if (Array.isArray(user?.enrolledGroups)) {
        const found = user.enrolledGroups.find((eg: any) => eg.teacherId && eg.teacherId !== "teacher");
        if (found) {
          resolvedTeacherId = found.teacherId || "";
          resolvedTeacherName = found.teacherName || resolvedTeacherName;
        }
      }
    }

    if (!resolvedTeacherId && teachers.length > 0) {
      resolvedTeacherId = teachers[0].uid;
      resolvedTeacherName = teachers[0].displayName;
    }

    try {
      setSubmitting(true);
      await teacherQuestionService.askQuestion({
        studentId: user.uid,
        studentName: user.displayName || user.email || "O'quvchi",
        studentPhoto: user.photoURL || null,
        teacherId: resolvedTeacherId || "teacher",
        teacherName: resolvedTeacherName,
        groupId: activeGroupId || "",
        groupName: group?.name || "O'quv Guruhi",
        subjectId: group?.subjectId || "",
        text: questionText.trim(),
      });

      success("Savolingiz ustozga yuborildi! Tez orada javob olasiz.");
      setIsModalOpen(false);
      setQuestionText("");
      loadData();
    } catch (err: any) {
      toastError(err.message || "Savol yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-500" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Ustozga Savol
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mavzular bo'yicha tushunmagan savollaringizni ustozingizga to'g'ridan-to'g'ri yo'llang
          </p>
        </div>

        {groups.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Yangi Savol Berish
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Savollar yo'q</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha ustozingizga savol yubormagansiz. Yuqoridagi tugma orqali savol yo'llang.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const isAnswered = q.status === "ANSWERED";

            return (
              <Card key={q.questionId} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                      isAnswered
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {isAnswered ? "Javob berildi" : "Ustoz ko'rib chiqmoqda"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <strong className="text-slate-500 block mb-1">Sizning savolingiz:</strong>
                  <p className="text-slate-900 dark:text-slate-100">{q.text}</p>
                </div>

                {q.answerText && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
                    <strong className="block text-emerald-700 dark:text-emerald-400">
                      Ustoz javobi:
                    </strong>
                    <p className="leading-relaxed">{q.answerText}</p>

                    {q.videoAnswerUrl && (
                      <div className="pt-2">
                        <VideoEmbed url={q.videoAnswerUrl} title="Ustoz video tushuntirishi" />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Ask Question */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ustozga Savol Yo'llash"
      >
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {groups.length > 0 ? "Qaysi guruh ustoziga?" : "Savolingiz qaysi ustozga?"}
            </label>
            <select
              value={groups.length > 0 ? selectedGroupId : selectedTeacherId}
              onChange={(e) => {
                if (groups.length > 0) setSelectedGroupId(e.target.value);
                else setSelectedTeacherId(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              required
            >
              {groups.length > 0 ? (
                groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.name} {g.teacherName ? `(Ustoz: ${g.teacherName})` : ""}
                  </option>
                ))
              ) : teachers.length > 0 ? (
                teachers.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    Ustoz: {t.displayName}
                  </option>
                ))
              ) : (
                <option value="">O'qituvchilar topilmadi</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Savolingiz matni
            </label>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Qaysi mavzu yoki masala tushunarsiz bo'ldi? Aniqroq tushuntirib bering..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={submitting} leftIcon={<Send className="w-4 h-4" />}>
              Yuborish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
