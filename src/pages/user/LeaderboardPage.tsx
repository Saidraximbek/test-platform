import React, { useEffect, useState } from "react";
import { Trophy, Medal, Crown, Sparkles, User, BookOpen } from "lucide-react";
import { leaderboardService } from "../../services/leaderboardService";
import { subjectService } from "../../services/subjectService";
import { useAuth } from "../../context/AuthContext";
import { LeaderboardStats, Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Spinner } from "../../components/common/Spinner";
import { formatCoins } from "../../utils";
import { sound } from "../../utils/soundEffects";

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [boardType, setBoardType] = useState<string>("global_all_time");
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Load subjects for filter
  useEffect(() => {
    subjectService.getSubjects(true).then(setSubjects).catch(console.error);
  }, []);

  // Load selected leaderboard
  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true);
      try {
        const data = await leaderboardService.getLeaderboardStats(boardType);
        setStats(data);
      } catch (err) {
        console.error("Error loading leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [boardType]);

  const rankings = stats?.rankings || [];
  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-600 mb-1">
          <Trophy className="w-3.5 h-3.5" /> Eng Kuchli Ishtirokchilar
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Yetakchilar Jadvali
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Bilimdonlar reytingi: to'g'ri javoblar, yakunlangan testlar va Tillo tangalari asosida hisoblanadi
        </p>
      </div>

      {/* Board Type Selector Tabs (Touch Scrollable on Mobile) */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin">
        <button
          onClick={() => {
            sound.playClick();
            setBoardType("global_all_time");
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            boardType === "global_all_time"
              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
          }`}
        >
          Umumiy Reyting (Barcha vaqt)
        </button>

        {subjects.map((sub) => (
          <button
            key={sub.subjectId}
            onClick={() => {
              sound.playClick();
              setBoardType(`subject_${sub.subjectId}`);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              boardType === `subject_${sub.subjectId}`
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : rankings.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          Ushbu toifa bo'yicha reyting ma'lumotlari ayni damda shakllantirilmoqda
        </Card>
      ) : (
        <>
          {/* Top 3 Podium (Ordered: 1st on top on mobile, center on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {/* Rank 1 (Gold Champion) */}
            {top1 && (
              <Card className="order-1 sm:order-2 p-5 sm:p-6 text-center flex flex-col items-center justify-between border-amber-400/50 bg-gradient-to-b from-amber-500/20 via-yellow-500/5 to-transparent shadow-xl relative">
                <div className="relative mb-2 sm:mb-3">
                  <Crown className="w-7 h-7 text-amber-500 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce" />
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-2xl font-black border-2 border-amber-400 shadow-md overflow-hidden">
                    {top1.photoURL ? (
                      <img src={top1.photoURL} alt={top1.displayName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      top1.displayName?.charAt(0) || "1"
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-white shadow">
                    1
                  </div>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate w-full">
                  {top1.displayName}
                </h3>
                <div className="mt-1 text-lg sm:text-xl font-black text-amber-500">
                  {formatCoins(top1.score)} ball
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {top1.testsCompleted} ta test | {top1.coinBalance} Tillo
                </span>
              </Card>
            )}

            {/* Rank 2 (Silver) */}
            {top2 && (
              <Card className="order-2 sm:order-1 p-5 text-center flex flex-col items-center justify-between border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-100/50 dark:from-slate-800/30 to-transparent sm:translate-y-4">
                <div className="relative mb-2 sm:mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold border-2 border-slate-400 overflow-hidden">
                    {top2.photoURL ? (
                      <img src={top2.photoURL} alt={top2.displayName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      top2.displayName?.charAt(0) || "2"
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-[11px] flex items-center justify-center border-2 border-white shadow">
                    2
                  </div>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate w-full">
                  {top2.displayName}
                </h3>
                <div className="mt-1 text-base font-black text-brand-600">
                  {formatCoins(top2.score)} ball
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  {top2.testsCompleted} ta test | {top2.coinBalance} Tillo
                </span>
              </Card>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 && (
              <Card className="order-3 sm:order-3 p-5 text-center flex flex-col items-center justify-between border-amber-700/30 bg-gradient-to-b from-amber-900/10 to-transparent sm:translate-y-6">
                <div className="relative mb-2 sm:mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-900/20 text-amber-700 flex items-center justify-center text-lg font-bold border-2 border-amber-700 overflow-hidden">
                    {top3.photoURL ? (
                      <img src={top3.photoURL} alt={top3.displayName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      top3.displayName?.charAt(0) || "3"
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-[11px] flex items-center justify-center border-2 border-white shadow">
                    3
                  </div>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate w-full">
                  {top3.displayName}
                </h3>
                <div className="mt-1 text-base font-black text-brand-600">
                  {formatCoins(top3.score)} ball
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  {top3.testsCompleted} ta test | {top3.coinBalance} Tillo
                </span>
              </Card>
            )}
          </div>

          {/* Full Top 100 Rankings Table */}
          <Card className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden mt-6">
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-3 sm:gap-6">
                <span className="w-6 text-center">O'rin</span>
                <span>Ishtirokchi</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-8">
                <span className="hidden sm:inline">Testlar</span>
                <span className="hidden sm:inline">Tillo</span>
                <span className="w-16 text-right">Ball</span>
              </div>
            </div>

            {rankings.map((entry) => {
              const isCurrentUser = user?.uid === entry.userId;
              return (
                <div
                  key={entry.userId}
                  className={`p-3 sm:p-4 flex items-center justify-between transition-colors ${
                    isCurrentUser
                      ? "bg-brand-500/10 border-l-4 border-l-brand-600 font-bold"
                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <span
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 ${
                        entry.rank === 1
                          ? "bg-amber-500 text-slate-950"
                          : entry.rank === 2
                          ? "bg-slate-300 text-slate-800"
                          : entry.rank === 3
                          ? "bg-amber-700 text-white"
                          : "text-slate-500 bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {entry.rank}
                    </span>

                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {entry.photoURL ? (
                        <img
                          src={entry.photoURL}
                          alt={entry.displayName}
                          loading="lazy"
                          decoding="async"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {entry.displayName?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {entry.displayName} {isCurrentUser && "(Siz)"}
                        </span>
                        <span className="text-[10px] text-slate-400 sm:hidden block">
                          {entry.testsCompleted} test | {entry.coinBalance} Tillo
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 text-xs shrink-0">
                    <span className="hidden sm:inline text-slate-500">
                      {entry.testsCompleted} ta
                    </span>
                    <span className="hidden sm:inline font-semibold text-amber-600">
                      {formatCoins(entry.coinBalance)}
                    </span>
                    <span className="w-16 text-right font-black text-brand-600 text-xs sm:text-sm">
                      {formatCoins(entry.score)}
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
};
