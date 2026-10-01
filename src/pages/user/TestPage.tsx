import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { testService, StartTestResponse } from "../../services/testService";
import { useToast } from "../../context/ToastContext";
import { SafeTestQuestion } from "../../types";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Card } from "../../components/common/Card";
import { sound } from "../../utils/soundEffects";

interface TestCountdownTimerProps {
  expiresAt: string;
  onTimeUp: () => void;
}

const TestCountdownTimer: React.FC<TestCountdownTimerProps> = React.memo(({ expiresAt, onTimeUp }) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now())
  );

  useEffect(() => {
    const expiresMs = new Date(expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = expiresMs - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        onTimeUp();
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onTimeUp]);

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const isUrgent = minutes < 5;

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shrink-0 ${
        isUrgent
          ? "bg-rose-500/10 border-rose-500/30 text-rose-600 animate-pulse"
          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
      }`}
    >
      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
});

export const TestPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { error: toastError, warning } = useToast();

  const [sessionData, setSessionData] = useState<StartTestResponse | null>(
    (location.state as any)?.sessionData || null
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(!sessionData);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAbandoning, setIsAbandoning] = useState<boolean>(false);

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showAbandonModal, setShowAbandonModal] = useState<boolean>(false);

  // Load session if not passed via state
  useEffect(() => {
    if (sessionData) {
      setLoading(false);
      return;
    }
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const sess = await testService.getSession(sessionId);
        if (!sess) {
          toastError("Test sessiyasi topilmadi");
          navigate("/dashboard");
          return;
        }

        if (sess.status !== "in_progress") {
          toastError(`Test yakunlangan (${sess.status})`);
          navigate(`/test/${sessionId}/result`);
          return;
        }

        setAnswers(sess.answers || {});
        setSessionData({
          sessionId: sess.sessionId,
          subjectId: sess.subjectId,
          levelId: sess.levelId,
          startedAt: sess.startedAt ? sess.startedAt.toDate?.()?.toISOString() : new Date().toISOString(),
          expiresAt: sess.expiresAt ? sess.expiresAt.toDate?.()?.toISOString() : new Date().toISOString(),
          configSnapshot: sess.configSnapshot,
          questions: sess.questionIds.map((qId, idx) => ({
            questionId: qId,
            text: `Savol #${idx + 1}`,
            imageUrl: null,
            options: [
              { id: "A", text: "Variant A" },
              { id: "B", text: "Variant B" },
              { id: "C", text: "Variant C" },
              { id: "D", text: "Variant D" },
            ],
            difficulty: 2,
          })),
        });
      } catch (err: any) {
        toastError(err.message || "Sessiyani yuklashda xatolik");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, sessionData, navigate, toastError]);

  // Debounced answers sync to Firestore
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAnswersRef = useRef<Record<string, string> | null>(null);

  const flushAnswersToFirestore = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    if (pendingAnswersRef.current && sessionId) {
      testService.updateAnswers(sessionId, pendingAnswersRef.current).catch(console.error);
      pendingAnswersRef.current = null;
    }
  }, [sessionId]);

  const syncAnswersToFirestore = useCallback(
    (newAnswers: Record<string, string>) => {
      if (!sessionId) return;
      pendingAnswersRef.current = newAnswers;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        flushAnswersToFirestore();
      }, 700);
    },
    [sessionId, flushAnswersToFirestore]
  );

  useEffect(() => {
    return () => {
      flushAnswersToFirestore();
    };
  }, [flushAnswersToFirestore]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    sound.playOptionSelect();
    const updated = { ...answers, [questionId]: optionId };
    setAnswers(updated);
    syncAnswersToFirestore(updated);
  };

  const handleSubmitTest = async () => {
    if (!sessionId) return;
    flushAnswersToFirestore();
    setIsSubmitting(true);
    try {
      const result = await testService.submitTest(sessionId, answers);
      sound.playSuccess();
      navigate(`/test/${sessionId}/result`, { state: { resultData: result } });
    } catch (err: any) {
      toastError(err.message || "Testni topshirishda xatolik yuz berdi");
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    if (!isSubmitting && sessionId) {
      warning("Vaqt tugadi! Test avtomatik tarzda yakunlanmoqda...");
      handleSubmitTest();
    }
  }, [isSubmitting, sessionId]);

  const handleAbandonTest = async () => {
    if (!sessionId) return;
    flushAnswersToFirestore();
    setIsAbandoning(true);
    try {
      const res = await testService.abandonTest(sessionId);
      warning(`Test tark etildi. Jarima: ${res.penaltyCoins} Tillo`);
      navigate("/dashboard");
    } catch (err: any) {
      toastError(err.message || "Testni tark etishda xatolik");
    } finally {
      setIsAbandoning(false);
      setShowAbandonModal(false);
    }
  };

  if (loading || !sessionData) {
    return (
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <Spinner size="lg" className="text-brand-600" />
        <p className="text-xs text-slate-500 font-medium">Test savollari tayyorlanmoqda...</p>
      </div>
    );
  }

  const questions = sessionData.questions || [];
  const currentQuestion: SafeTestQuestion | undefined = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
      {/* Top Test Navigation Bar (Mobile Ergonomic) */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
              {currentIndex + 1}/{totalQuestions}
            </div>
            <div>
              <h3 className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-slate-100">
                {answeredCount} / {totalQuestions} belgilandi
              </h3>
              <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Isolated Timer Component */}
          {sessionData?.expiresAt && (
            <TestCountdownTimer expiresAt={sessionData.expiresAt} onTimeUp={handleTimeUp} />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAbandonModal(true)}
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex-1 sm:flex-none"
          >
            Tark etish
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="text-xs flex-1 sm:flex-none font-bold"
          >
            Yakunlash
          </Button>
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <Card className="p-4 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/50 px-3 py-1 rounded-full">
              <HelpCircle className="w-3.5 h-3.5" /> Savol #{currentIndex + 1}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {currentQuestion.text}
          </div>

          {/* Question Image if exists */}
          {currentQuestion.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-72 flex justify-center bg-slate-100 dark:bg-slate-950">
              <img
                src={currentQuestion.imageUrl}
                alt="Savol rasmi"
                loading="lazy"
                decoding="async"
                className="object-contain max-h-72 w-auto"
              />
            </div>
          )}

          {/* Options List (Touch Friendly on Mobile) */}
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 pt-2">
            {currentQuestion.options.map((option, optIdx) => {
              const isSelected = answers[currentQuestion.questionId] === option.id;
              const optionLetters = ["A", "B", "C", "D", "E"];

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.questionId, option.id)}
                  className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? "bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-md ring-2 ring-brand-500/30"
                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {optionLetters[optIdx] || option.id}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed flex-1 font-medium">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Prev / Next Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800 gap-3">
            <Button
              variant="outline"
              size="md"
              disabled={currentIndex === 0}
              onClick={() => {
                sound.playClick();
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Oldingisi
            </Button>

            {currentIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1));
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="flex-1 sm:flex-none font-bold"
              >
                Keyingisi
              </Button>
            ) : (
              <Button
                variant="amber"
                size="md"
                onClick={() => {
                  sound.playClick();
                  setShowSubmitModal(true);
                }}
                rightIcon={<Send className="w-4 h-4" />}
                className="flex-1 sm:flex-none font-black"
              >
                Testni Yakunlash
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Question Numbers Grid (Quick Jump with Horizontal Scroll on Mobile) */}
      <Card className="p-3.5 sm:p-5">
        <h4 className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 uppercase tracking-wider">
          Barcha savollar ({answeredCount}/{totalQuestions})
        </h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.questionId];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.questionId}
                onClick={() => {
                  sound.playClick();
                  setCurrentIndex(idx);
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold text-xs transition-all ${
                  isCurrent
                    ? "ring-2 ring-brand-500 ring-offset-1 bg-brand-600 text-white scale-105"
                    : isAnswered
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !isSubmitting && setShowSubmitModal(false)}
        title="Testni yakunlash"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            Siz <strong>{totalQuestions}</strong> ta savoldan <strong>{answeredCount}</strong> tasiga javob berdingiz. Testni topshirmoqchimisiz?
          </p>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
            Test yakunlangach, to'plagan ballaringiz va Tillo tangalaringiz darhol hisoblanadi.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setShowSubmitModal(false)}
            >
              Davom etish
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitTest}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Tasdiqlash
            </Button>
          </div>
        </div>
      </Modal>

      {/* Abandon Modal */}
      <Modal
        isOpen={showAbandonModal}
        onClose={() => !isAbandoning && setShowAbandonModal(false)}
        title="Testni tark etish"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3 text-rose-500 font-bold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Testni yarimida tark etmoqchimisiz?</span>
          </div>

          <p className="text-slate-600 dark:text-slate-300">
            Agar testni hozir tark etsangiz, hisobingizdan jarima sifatida <strong>5 Tillo tangasi</strong> yechiladi.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isAbandoning}
              onClick={() => setShowAbandonModal(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isAbandoning}
              onClick={handleAbandonTest}
            >
              Ha, tark etish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
