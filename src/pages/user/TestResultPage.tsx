import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
} from "lucide-react";
import { testService } from "../../services/testService";
import { TestSubmitResult, TestSession } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";

export const TestResultPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState<TestSubmitResult | null>(
    (location.state as any)?.resultData || null
  );
  const [sessionDoc, setSessionDoc] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(!resultData);

  useEffect(() => {
    const loadSessionIfMissing = async () => {
      if (!sessionId || resultData) return;
      try {
        const sess = await testService.getSession(sessionId);
        if (sess) {
          setSessionDoc(sess);
        }
      } catch (err) {
        console.error("Error loading session:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSessionIfMissing();
  }, [sessionId, resultData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const score = resultData ? resultData.score : sessionDoc?.score || 0;
  const correctCount = resultData ? resultData.correctCount : sessionDoc?.correctCount || 0;
  const totalQuestions = resultData
    ? resultData.totalQuestions
    : sessionDoc?.questionIds.length || 20;
  const earnedCoins = resultData ? resultData.earnedCoins : sessionDoc?.earnedCoins || 0;
  const isPassed = score >= 60;

  const attemptNumber = resultData?.attemptNumber || (sessionDoc as any)?.attemptNumber || 1;
  const pointsPerCorrect = resultData?.pointsPerCorrect !== undefined
    ? resultData.pointsPerCorrect
    : (sessionDoc as any)?.pointsPerCorrect !== undefined
    ? (sessionDoc as any)?.pointsPerCorrect
    : (attemptNumber === 1 ? 1 : attemptNumber === 2 ? 0.5 : attemptNumber === 3 ? 0.3 : 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Result Hero Banner */}
      <div
        className={`rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-xl ${
          isPassed
            ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-emerald-500/10"
            : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white shadow-slate-900/10"
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto text-3xl font-extrabold shadow-lg">
            {isPassed ? "🎉" : "📚"}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isPassed ? "Ajoyib natija!" : "Yaxshi urinish!"}
          </h1>

          <p className="text-sm sm:text-base opacity-90">
            {isPassed
              ? "Siz testni muvaffaqiyatli topshirdingiz va bilimingizni isbotladingiz."
              : "Bu safar yetarli bo'lmadi, xatolaringiz ustida ishlab qayta urinib ko'ring."}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md">
              <span className="block text-xs uppercase tracking-wider font-semibold opacity-75">
                Natija
              </span>
              <span className="text-2xl font-black">{score}%</span>
            </div>

            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md">
              <span className="block text-xs uppercase tracking-wider font-semibold opacity-75">
                To'g'ri javoblar
              </span>
              <span className="text-2xl font-black">
                {correctCount} / {totalQuestions}
              </span>
            </div>

            <div className="px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md">
              <span className="block text-xs uppercase tracking-wider font-semibold opacity-75">
                Urinish va Mukofot
              </span>
              <span className="text-2xl font-black text-amber-300">
                {earnedCoins > 0 ? `+${earnedCoins} ball` : "0 ball"}
              </span>
              <span className="block text-[11px] font-semibold opacity-90 mt-1">
                {attemptNumber === 1 && "1-urinish (har bir testga 1 balldan)"}
                {attemptNumber === 2 && "2-urinish (har bir testga 0.5 balldan)"}
                {attemptNumber === 3 && "3-urinish (har bir testga 0.3 balldan)"}
                {attemptNumber >= 4 && `${attemptNumber}-urinish (ball berilmaydi)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/subjects">
          <Button variant="secondary" size="lg" leftIcon={<RotateCcw className="w-4 h-4" />}>
            Boshqa fanlarni tanlash
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Bosh sahifaga o'tish
          </Button>
        </Link>
      </div>

      {/* Question Review Section (with server-authorized explanations) */}
      {resultData?.questionsReview && resultData.questionsReview.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Savollar tahlili va to'g'ri javoblar
              </h2>
              <p className="text-xs text-slate-500">
                Xatolaringizni ko'rib chiqing va tushuntirishlar bilan tanishing
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {resultData.questionsReview.map((q, idx) => (
              <Card
                key={q.questionId}
                className={`p-6 border-l-4 ${
                  q.isCorrect
                    ? "border-l-emerald-500"
                    : "border-l-rose-500 bg-rose-500/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Savol #{idx + 1}</span>
                    {q.isCorrect ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline" /> To'g'ri
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <XCircle className="w-3 h-3 mr-1 inline" /> Noto'g'ri
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  {q.text}
                </p>

                {/* Options Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {q.options.map((opt) => {
                    const isSelected = q.selectedOptionId === opt.id;
                    const isCorrectOption = q.correctOptionId === opt.id;

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
                          isCorrectOption
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold"
                            : isSelected && !isCorrectOption
                            ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-medium"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-80"
                        }`}
                      >
                        <span>{opt.text}</span>
                        {isCorrectOption && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                            To'g'ri javob
                          </span>
                        )}
                        {isSelected && !isCorrectOption && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                            Sizning javobingiz
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700">
                    <strong className="text-brand-600 dark:text-brand-400 block mb-1">
                      💡 Tushuntirish:
                    </strong>
                    {q.explanation}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
