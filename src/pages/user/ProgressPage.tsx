import React, { useEffect, useState } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { coinService } from "../../services/coinService";
import { levelService } from "../../services/levelService";
import { CoinTransaction, UserProgress } from "../../types";
import { Card } from "../../components/common/Card";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        const [txs, progs] = await Promise.all([
          coinService.getUserTransactions(user.uid, 50),
          levelService.getAllUserProgress(user.uid),
        ]);
        setTransactions(txs);
        setProgressList(progs);
      } catch (err) {
        console.error("Error loading progress data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const earnedTotal = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const spentTotal = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          O'sish va Tangalar Tarixi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Barcha yutuqlaringiz, ochilgan darajalaringiz va Tillo tangalari harakati
        </p>
      </div>

      {/* Balance & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent border-amber-400/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Mavjud Balans
            </span>
            <Coins className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatCoins(user?.coinBalance || 0)}{" "}
            <span className="text-sm font-bold text-amber-500">Tillo</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Darajalarni ochish va do'kondan sovg'alar olish uchun ishlatishingiz mumkin
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Jami Ishlangan
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            +{formatCoins(earnedTotal)}{" "}
            <span className="text-sm font-bold text-slate-500">Tillo</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Testlar va savol yuborish orqali to'plangan umumiy daromad
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Jami Sarflangan
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">
            -{formatCoins(spentTotal)}{" "}
            <span className="text-sm font-bold text-slate-500">Tillo</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Darajalar ochish va xaridlar uchun sarflangan mablag'
          </p>
        </Card>
      </div>

      {/* Progress Levels Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Ochilgan Darajalar ({progressList.length} ta)
        </h2>

        {progressList.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            Hali birorta daraja ochilmagan. Fanlar bo'limidan testlarni boshlang!
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressList.map((prog) => (
              <Card key={prog.progressId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      prog.isCompleted
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-brand-500/15 text-brand-600"
                    }`}
                  >
                    {prog.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Daraja #{prog.levelId ? prog.levelId.substring(0, 8) : "N/A"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Natija: <strong className="text-slate-700 dark:text-slate-300">{prog.bestScore}%</strong> | Urinishlar: {prog.attempts}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Transactions History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Tangalar Harakati Tarixi
        </h2>

        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tranzaksiyalar mavjud emas
            </div>
          ) : (
            transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.transactionId} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {tx.reason}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        isPositive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isPositive ? `+${formatCoins(tx.amount)}` : formatCoins(tx.amount)} Tillo
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Balans: {formatCoins(tx.balanceAfter)} Tillo
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
};
