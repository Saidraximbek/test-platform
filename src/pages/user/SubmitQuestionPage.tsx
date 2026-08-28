import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PlusCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { questionSubmissionService } from "../../services/questionSubmissionService";
import { subjectService } from "../../services/subjectService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { QuestionSubmissionFormSchema } from "../../schemas";
import { QuestionSubmission, Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";
import { z } from "zod";

type SubmissionFormData = z.infer<typeof QuestionSubmissionFormSchema>;

export const SubmitQuestionPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mySubmissions, setMySubmissions] = useState<QuestionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(QuestionSubmissionFormSchema),
    defaultValues: {
      subjectId: "",
      suggestedLevelNumber: 1,
      text: "",
      imageUrl: "",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" },
        { id: "D", text: "" },
      ],
      correctOptionId: "A",
      explanation: "",
      difficulty: 2,
    },
  });

  const correctOptionId = watch("correctOptionId");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        const [subList, submissions] = await Promise.all([
          subjectService.getSubjects(true),
          questionSubmissionService.getUserSubmissions(user.uid),
        ]);
        setSubjects(subList);
        setMySubmissions(submissions);
        if (subList.length > 0) {
          setValue("subjectId", subList[0].subjectId);
        }
      } catch (err) {
        console.error("Error loading submissions data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid, setValue]);

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user?.uid) return;
    setIsSubmitting(true);
    try {
      const newSub = await questionSubmissionService.submitQuestion({
        userId: user.uid,
        subjectId: data.subjectId,
        suggestedLevelNumber: Number(data.suggestedLevelNumber),
        text: data.text,
        imageUrl: data.imageUrl || null,
        options: data.options,
        correctOptionId: data.correctOptionId,
        explanation: data.explanation,
        difficulty: Number(data.difficulty),
      });

      success("Savolingiz tekshiruv uchun yuborildi!");
      setMySubmissions((prev) => [newSub, ...prev]);
      reset();
    } catch (err: any) {
      toastError(err.message || "Savol yuborishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const statusBadges: Record<string, "warning" | "info" | "success" | "danger"> = {
    pending: "warning",
    reviewing: "info",
    approved: "success",
    rejected: "danger",
  };

  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    reviewing: "Ko'rib chiqilmoqda",
    approved: "Tasdiqlandi (+20 Tillo)",
    rejected: "Rad etildi",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Info */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-purple-500/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Hamjamiyat Savollari
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Savol Taklif Qiling va Tangalar Yuting!
          </h1>
          <p className="text-xs sm:text-sm opacity-90 mt-1 max-w-xl">
            Siz tuzgan har bir sifatli va tasdiqlangan test savoli uchun profilingizga +20 Tillo tangasi mukofot beriladi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Question Submission Form */}
        <Card className="lg:col-span-2 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand-600" /> Yangi Test Savoli Yaratish
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fan
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs py-2.5 px-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
                  {...register("subjectId")}
                >
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-xs text-rose-500 mt-1">{errors.subjectId.message}</p>}
              </div>

              <Input
                label="Tavsiya etiladigan daraja raqami"
                type="number"
                min="1"
                error={errors.suggestedLevelNumber?.message}
                {...register("suggestedLevelNumber")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Savol matni
              </label>
              <textarea
                rows={3}
                placeholder="Savol matnini aniq va ravshan kiriting..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
                {...register("text")}
              />
              {errors.text && <p className="text-xs text-rose-500 mt-1">{errors.text.message}</p>}
            </div>

            {/* 4 Options */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                4 ta javob varianti va to'g'ri javobni tanlang:
              </label>

              {["A", "B", "C", "D"].map((letter, idx) => {
                const isSelected = correctOptionId === letter;
                return (
                  <div key={letter} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("correctOptionId", letter)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      placeholder={`Variant ${letter} matni`}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs py-2 px-3 focus:ring-2 focus:ring-brand-500"
                      {...register(`options.${idx}.text` as any)}
                    />
                  </div>
                );
              })}
              {errors.options && <p className="text-xs text-rose-500">{errors.options.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                To'g'ri javob tushuntirishi (Explanation)
              </label>
              <textarea
                rows={2}
                placeholder="Nega aynan ushbu javob to'g'riligini tushuntirib bering..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-3 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
                {...register("explanation")}
              />
              {errors.explanation && (
                <p className="text-xs text-rose-500 mt-1">{errors.explanation.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Savolni Tekshiruvga Yuborish
              </Button>
            </div>
          </form>
        </Card>

        {/* User's Previous Submissions */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Yuborilgan Savollarim ({mySubmissions.length})
          </h3>

          <Card className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {mySubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Siz hali savol taklif qilmagansiz
              </div>
            ) : (
              mySubmissions.map((sub) => (
                <div key={sub.submissionId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={statusBadges[sub.status] || "neutral"}>
                      {statusLabels[sub.status] || sub.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{formatDate(sub.createdAt)}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {sub.text}
                  </p>

                  {sub.status === "rejected" && sub.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600">
                      <strong>Rad sababi:</strong> {sub.rejectionReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
