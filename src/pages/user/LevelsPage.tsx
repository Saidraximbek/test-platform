import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  Unlock,
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { subjectService } from "../../services/subjectService";
import { levelService } from "../../services/levelService";
import { testService } from "../../services/testService";
import { coinService } from "../../services/coinService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Level, Subject, UserProgress } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { sound } from "../../utils/soundEffects";

export const LevelsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user, isSuspended } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  // Unlock Modal State
  const [selectedLevelToUnlock, setSelectedLevelToUnlock] = useState<Level | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isStartingTest, setIsStartingTest] = useState<string | null>(null);

  useEffect(() => {
    const loadLevelsData = async () => {
      if (!subjectId || !user?.uid) return;
      try {
        const [sub, lvlList, prog] = await Promise.all([
          subjectService.getSubjectById(subjectId),
          levelService.getLevelsBySubject(subjectId, true),
          levelService.getUserProgressForSubject(user.uid, subjectId),
        ]);
        setSubject(sub);
        setLevels(lvlList);
        setProgressMap(prog);
      } catch (err) {
        console.error("Error loading levels:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLevelsData();
  }, [subjectId, user?.uid]);

  const handleStartTest = async (levelId: string) => {
    if (isSuspended) {
      toastError("Hisobingiz to'xtatilganligi sababli test boshlay olmaysiz");
      return;
    }
    if (!subjectId) return;

    setIsStartingTest(levelId);
    try {
      sound.playClick();
      const sessionResponse = await testService.startTest(subjectId, levelId);
      success("Test boshlandi! Omad tilaymiz!");
      navigate(`/test/${sessionResponse.sessionId}`, { state: { sessionData: sessionResponse } });
    } catch (err: any) {
      toastError(err.message || "Testni boshlashda xatolik yuz berdi");
    } finally {
      setIsStartingTest(null);
    }
  };

  const handleUnlockLevel = async () => {
    if (!selectedLevelToUnlock || !subjectId) return;
    setIsUnlocking(true);
    try {
      await coinService.unlockLevel(subjectId, selectedLevelToUnlock.levelId);
      sound.playLevelUnlock();
      success(`"${selectedLevelToUnlock.name}" darajasi muvaffaqiyatli ochildi!`);
      // Update local progress map
      setProgressMap((prev) => ({
        ...prev,
        [selectedLevelToUnlock.levelId]: {
          progressId: `${user?.uid}_${selectedLevelToUnlock.levelId}`,
          userId: user?.uid || "",
          subjectId,
          levelId: selectedLevelToUnlock.levelId,
          isUnlocked: true,
          isCompleted: false,
          bestScore: 0,
          attempts: 0,
          correctAnswersTotal: 0,
          unlockedAt: new Date(),
          lastAttemptAt: null,
        },
      }));
      setSelectedLevelToUnlock(null);
    } catch (err: any) {
      toastError(err.message || "Darajani ochishda xatolik yuz berdi");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-bold">Fan topilmadi</h3>
        <Button onClick={() => navigate("/subjects")} className="mt-4">
          Fanlar ro'yxatiga qaytish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/subjects")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Barcha fanlarga qaytish
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {subject.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {subject.description || "Darajalarni navbati bilan yeching va Tillo tangalariga ega bo'ling"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CoinBadge amount={user?.coinBalance || 0} size="md" />
        </div>
      </div>

      {/* Levels Grid */}
      {levels.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 text-sm">Ushbu fan uchun hali darajalar kiritilmagan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level) => {
            const prog = progressMap[level.levelId];
            const isUnlocked = level.isInitialUnlocked || prog?.isUnlocked;
            const isCompleted = prog?.isCompleted;
            const bestScore = prog?.bestScore || 0;
            const unlockCost = level.unlockCostCoins ?? 50;

            const difficultyColors: Record<string, "success" | "warning" | "danger"> = {
              easy: "success",
              medium: "warning",
              hard: "danger",
            };

            return (
              <Card
                key={level.levelId}
                className={`p-6 flex flex-col justify-between relative overflow-hidden ${
                  !isUnlocked ? "opacity-85 bg-slate-50 dark:bg-slate-900/50" : ""
                }`}
              >
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> YAKUNLANGAN
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        isUnlocked
                          ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {level.levelNumber}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {level.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={difficultyColors[level.difficulty] || "neutral"}>
                          {level.difficulty}
                        </Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> {level.questionsRequired || 20} savol
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {level.description || "Ushbu darajani muvaffaqiyatli topshirib keyingi bosqichga o'ting"}
                  </p>

                  {/* Best Score & Attempts */}
                  {isUnlocked && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Eng yuqori natija:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {bestScore > 0 ? `${bestScore}%` : "Topshirilmagan"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Urinishlar:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {prog?.attempts || 0} marta
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isUnlocked ? (
                    <Button
                      onClick={() => handleStartTest(level.levelId)}
                      isLoading={isStartingTest === level.levelId}
                      className="w-full"
                      rightIcon={<Play className="w-4 h-4 fill-current" />}
                    >
                      {bestScore > 0 ? "Qayta topshirish" : "Testni boshlash"}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Ochish narxi:</span>
                        <span className="text-xs font-bold text-amber-500">
                          {unlockCost} Tillo
                        </span>
                      </div>
                      <Button
                        variant="amber"
                        size="sm"
                        onClick={() => setSelectedLevelToUnlock(level)}
                        leftIcon={<Unlock className="w-3.5 h-3.5" />}
                      >
                        Ochish
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Unlock Level Confirmation Modal */}
      <Modal
        isOpen={!!selectedLevelToUnlock}
        onClose={() => setSelectedLevelToUnlock(null)}
        title="Darajani ochishni tasdiqlang"
      >
        {selectedLevelToUnlock && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-center">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                "{selectedLevelToUnlock.name}" darajasi
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Ushbu darajani ochish uchun balansingizdan Tillo tangalari yechiladi.
              </p>
              <div className="mt-3">
                <CoinBadge amount={selectedLevelToUnlock.unlockCostCoins ?? 50} size="lg" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <span className="text-slate-500">Sizning balansingiz:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user?.coinBalance || 0} Tillo
              </span>
            </div>

            {(user?.coinBalance || 0) < (selectedLevelToUnlock.unlockCostCoins ?? 50) && (
              <p className="text-xs text-rose-500 font-medium text-center">
                Balansingizda yetarli Tillo tangasi yo'q. Testlar ishlab tanga to'plang!
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedLevelToUnlock(null)}
                disabled={isUnlocking}
              >
                Bekor qilish
              </Button>
              <Button
                variant="amber"
                onClick={handleUnlockLevel}
                isLoading={isUnlocking}
                disabled={(user?.coinBalance || 0) < (selectedLevelToUnlock.unlockCostCoins ?? 50)}
                leftIcon={<Unlock className="w-4 h-4" />}
              >
                Ochish va Tanga To'lash
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export const SubjectDetailPage = LevelsPage;
