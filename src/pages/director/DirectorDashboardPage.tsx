import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  GraduationCap,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Sparkles,
  PieChart,
  Clock,
} from "lucide-react";
import { financeService, FinancialSummary } from "../../services/financeService";
import { lmsAnalyticsService, LMSAnalytics } from "../../services/lmsAnalyticsService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const DirectorDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [analytics, setAnalytics] = useState<LMSAnalytics | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fin, lms] = await Promise.all([
          financeService.getFinancialSummary(selectedMonth),
          lmsAnalyticsService.getOverview(),
        ]);
        setSummary(fin);
        setAnalytics(lms);
      } catch (err) {
        console.error("Error loading director dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const handleSync = () => loadData();
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-amber-500" />
      </div>
    );
  }

  const netIncome = summary?.netIncome || 0;
  const isProfitable = netIncome >= 0;

  return (
    <div className="space-y-8">
      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Markaz Ko'rsatkichlari Paneli
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ta'lim markazi moliyasi, tushumlar, oylik tizimlari, to'lovlar, qoldiqlar va sof foyda tahlili
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/20 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-semibold">Tahlil oyi:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Primary Financial Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue (Tushum) */}
        <Link to="/admin/payments" className="block group">
          <Card className="p-5 bg-slate-900/90 border-emerald-500/30 group-hover:border-emerald-500/60 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Jami Tushum
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-white">
                {formatNumber(summary?.totalRevenue || 0)}{" "}
                <span className="text-xs font-bold text-emerald-400">UZS</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> O'quv to'lovlaridan yig'ilgan
              </span>
            </div>
          </Card>
        </Link>

        {/* Monthly Expenses (Xarajatlar) */}
        <Link to="/director/expenses" className="block group">
          <Card className="p-5 bg-slate-900/90 border-rose-500/30 group-hover:border-rose-500/60 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Operatsion Xarajat
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-white">
                {formatNumber(summary?.totalExpenses || 0)}{" "}
                <span className="text-xs font-bold text-rose-400">UZS</span>
              </h3>
              <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1 mt-1">
                <ArrowDownRight className="w-3.5 h-3.5" /> Ijara, reklama va boshqa
              </span>
            </div>
          </Card>
        </Link>

        {/* Teacher Salaries (Ustozlar maoshi: To'langan va Qoldiq) */}
        <Link to="/director/salaries" className="block group">
          <Card className="p-5 bg-slate-900/90 border-sky-500/30 group-hover:border-sky-500/60 transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ustozlar Maoshi
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black text-white">
                {formatNumber(summary?.totalSalaries || 0)}{" "}
                <span className="text-xs font-bold text-sky-400">UZS</span>
              </h3>
              <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-slate-800">
                <span className="text-emerald-400 font-bold">
                  To'landi: {formatNumber(summary?.totalSalariesPaid || 0)}
                </span>
                <span className="text-rose-400 font-bold">
                  Qoldiq: {formatNumber(summary?.totalSalariesRemaining || 0)}
                </span>
              </div>
            </div>
          </Card>
        </Link>

        {/* Net Income (Sof Foyda) */}
        <Card
          className={`p-5 bg-slate-900/90 border-2 flex flex-col justify-between ${
            isProfitable ? "border-amber-500/40 shadow-lg shadow-amber-500/10" : "border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Sof Foyda (Kassa)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black ${isProfitable ? "text-amber-400" : "text-rose-400"}`}>
              {formatNumber(netIncome)} <span className="text-xs font-bold">UZS</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
              Tushum - (Xarajat + To'langan Maosh)
            </span>
          </div>
        </Card>
      </div>

      {/* Operational Stats: Students, Groups, Teachers, Debts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">Jami O'quvchilar</span>
              <span className="text-xl font-black text-white">{analytics?.totalStudents || 0} nafar</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">Faol O'quvchilar</span>
              <span className="text-xl font-black text-emerald-400">{analytics?.activeStudents || 0} nafar</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">O'qituvchilar</span>
              <span className="text-xl font-black text-white">{analytics?.totalTeachers || 0} nafar</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">Guruhlar Soni</span>
              <span className="text-xl font-black text-white">{analytics?.totalGroups || 0} ta</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses History */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" /> Oylik Moliyaviy Dinamika
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">So'nggi 6 oylik tushum va xarajatlar tahlili</p>
            </div>
          </div>

          <div className="space-y-4">
            {summary?.monthlyRevenueHistory.map((item, idx) => {
              const expItem = summary.monthlyExpenseHistory[idx];
              const maxVal = Math.max(
                ...summary.monthlyRevenueHistory.map((h) => h.amount),
                1000000
              );
              const revPercent = Math.min(100, Math.round((item.amount / maxVal) * 100));
              const expPercent = Math.min(100, Math.round(((expItem?.amount || 0) / maxVal) * 100));

              return (
                <div key={item.month} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">{item.month}</span>
                    <span className="text-emerald-400">
                      Tushum: {formatNumber(item.amount)} UZS
                    </span>
                  </div>

                  {/* Revenue Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, revPercent)}%` }}
                    />
                  </div>

                  {/* Expense Bar */}
                  <div className="w-full h-1.5 bg-slate-800/60 rounded-full overflow-hidden flex gap-1">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(3, expPercent)}%` }}
                      title={`Xarajat: ${formatNumber(expItem?.amount || 0)} UZS`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Tushum (Daromad)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-400">Operatsion Xarajatlar</span>
            </div>
          </div>
        </Card>

        {/* Group Capacities */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" /> Guruhlar To'lalik Darajasi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">O'quvchi sig'imi va mavjud bo'sh joylar</p>
            </div>
            <Link to="/admin/groups" className="text-xs text-amber-400 hover:underline font-bold">
              Barcha guruhlar →
            </Link>
          </div>

          {!analytics?.groupCapacities || analytics.groupCapacities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">Guruhlar mavjud emas</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.groupCapacities.slice(0, 6).map((g) => {
                const empty = Math.max(0, g.max - g.current);
                return (
                  <div key={g.groupId || g.groupName} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">{g.groupName}</span>
                      <span className={g.filledPercent >= 90 ? "text-rose-400" : "text-emerald-400"}>
                        {g.current} / {g.max} nafar ({g.filledPercent}%)
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          g.filledPercent >= 90
                            ? "bg-rose-500"
                            : g.filledPercent >= 70
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(5, g.filledPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Bo'sh o'rinlar: {empty} ta</span>
                      <span>Maksimal sig'im: {g.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/director/salaries">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group">
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                Ustozlar Maoshini Boshqarish
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Hisoblash, tasdiqlash, to'lash va qoldiqlar</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>

        <Link to="/director/expenses">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group">
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                Xarajatlar Hisoboti
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Kategoriya bo'yicha operatsion xarajatlar</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>

        <Link to="/director/analytics">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group">
            <div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                To'liq Analitika & Tahlil
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">O'quvchilar o'sishi va LMS statistikasi</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>
      </div>
    </div>
  );
};
