import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Play,
  Gift,
  Flame,
  Zap,
  Package,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { subjectService } from "../../services/subjectService";
import { testService } from "../../services/testService";
import { levelService } from "../../services/levelService";
import { shopService } from "../../services/shopService";
import { Subject, TestSession, UserProgress, Product } from "../../types";
import { Card } from "../../components/common/Card";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";
import { sound } from "../../utils/soundEffects";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSessions, setRecentSessions] = useState<TestSession[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return;
      try {
        const [subList, sessList, progList, prods] = await Promise.all([
          subjectService.getSubjects(true),
          testService.getUserSessions(user.uid, 5),
          levelService.getAllUserProgress(user.uid),
          shopService.getProducts(undefined, true),
        ]);
        setSubjects(subList);
        setRecentSessions(sessList);
        setProgressList(progList);
        setFeaturedProducts(prods.slice(0, 3));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const completedProgressCount = progressList.filter((p) => p.isCompleted).length;
  const totalCorrect = user?.totalCorrectAnswers || 0;
  const userBalance = user?.coinBalance || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Welcome Interactive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-sky-600 text-white p-6 sm:p-10 shadow-2xl shadow-brand-500/20">
        {/* Ambient floating lights */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse-glow" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/20 shadow-sm animate-float">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>Har bir to'g'ri javob uchun +1 Tillo tangasi!</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Assalomu alaykum, {user?.displayName || "Foydalanuvchi"}! 👋
            </h1>
            <p className="text-sm sm:text-base text-brand-100 max-w-xl leading-relaxed">
              Bugun bilimingizni sinab ko'ring, yangi bosqichlarni zabt eting va Tillo tangalariga ajoyib sovg'alar yutib oling!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/subjects"
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Test Boshlash
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT EYE-CATCHING TILLO SHOP SHOWCASE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-brand-500/15 border-2 border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/30 shrink-0 animate-float">
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Tillo Sovg'alar Do'koni 🎁
                </span>
                <span className="text-xs font-bold text-amber-500 animate-pulse">
                  Markazdan olib ketish
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                To'plagan Tangalaringizni Haqiqiy Sovg'alarga Almashtiring!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Daftarlar, ruchkalar, o'quv qurollari va boshqa ajoyib sovg'alar sizni kutmoqda.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Balansingiz:</span>
              <span className="text-lg font-black text-amber-500">
                {formatCoins(userBalance)} Tillo
              </span>
            </div>

            <Link
              to="/shop"
              onClick={() => sound.playCoin()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 hover:scale-105 transition-all shrink-0"
            >
              <ShoppingBag className="w-4 h-4" /> Do'konga O'tish
            </Link>
          </div>
        </div>

        {/* Featured Products Quick Carousel / Grid */}
        {featuredProducts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredProducts.map((p) => (
              <Link
                key={p.productId}
                to={`/shop/${p.productId}`}
                onClick={() => sound.playClick()}
                className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 transition-all hover:scale-102 group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 font-bold overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block group-hover:text-amber-500 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{p.stock} dona qoldi</span>
                  </div>
                </div>

                <span className="text-xs font-black text-amber-500 shrink-0">
                  {formatCoins(p.priceCoins)} Tillo
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tillo Tangalari</span>
            <span className="text-xl sm:text-2xl font-black text-amber-500">
              {formatCoins(userBalance)}
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">To'g'ri Javoblar</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-500">
              {totalCorrect} ta
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-500 flex items-center justify-center font-bold shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Yutilgan Darajalar</span>
            <span className="text-xl sm:text-2xl font-black text-brand-500">
              {completedProgressCount} ta
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:scale-102 transition-transform">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold shadow-sm">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Topshirilgan Testlar</span>
            <span className="text-xl sm:text-2xl font-black text-purple-500">
              {user?.testsCompleted || 0} ta
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Subject Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" /> Mavjud Fanlar va Bosqichlar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              O'zingizga qiziq fanni tanlang va testlarni yechishni boshlang
            </p>
          </div>

          <Link
            to="/subjects"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
          >
            Barcha fanlar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <Link
              key={sub.subjectId}
              to={`/subjects/${sub.subjectId}/levels`}
              onClick={() => sound.playClick()}
              className="group"
            >
              <Card hoverEffect className="p-6 h-full flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-md group-hover:border-brand-500/40">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sub.description || "Darajalar bo'yicha savollarni yechib, ball to'plang."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600 mt-4">
                  <span>Bosqichlarni ko'rish</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> So'nggi Natijalaringiz
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map((s) => {
              const isDone = s.status === "completed";
              return (
                <Card key={s.sessionId} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      Test Sessiyasi #{s.sessionId.substring(5, 11)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        isDone
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {isDone ? "Yakunlangan" : "Jarayonda"}
                    </span>
                  </div>

                  {isDone && (
                    <div className="flex items-center justify-between pt-1 font-semibold">
                      <span className="text-slate-500">Natija:</span>
                      <span className="font-black text-emerald-600">{s.score}%</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400">
                    {formatDate(s.createdAt)}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
