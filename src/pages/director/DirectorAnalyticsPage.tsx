import React, { useEffect, useState } from "react";
import {
  PieChart,
  Users,
  GraduationCap,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Award,
  CheckCircle2,
  BarChart2,
  Calendar,
} from "lucide-react";
import { lmsAnalyticsService, LMSAnalytics } from "../../services/lmsAnalyticsService";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const DirectorAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<LMSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await lmsAnalyticsService.getOverview();
        setAnalytics(data);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-amber-500" />
      </div>
    );
  }

  const maxGrowth = Math.max(
    ...(analytics?.studentGrowthMonthly.map((m) => m.newStudents) || [1]),
    5
  );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <PieChart className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            Markaz & LMS Analitikasi
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          O'quvchilar o'sish dinamikasi, guruh sig'imlari, test natijalari va faollik ko'rsatkichlari
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Jami O'quvchilar</span>
          <h3 className="text-2xl font-black text-white mt-1">
            {analytics?.totalStudents || 0} nafar
          </h3>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {analytics?.activeStudents || 0} nafar faol
          </span>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">O'rtacha Test Balli</span>
          <h3 className="text-2xl font-black text-sky-400 mt-1">
            {analytics?.averageTestScore || 0}%
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics?.completedTestsCount || 0} ta topshirilgan test
          </span>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">Rejalashtirilgan Darslar</span>
          <h3 className="text-2xl font-black text-indigo-400 mt-1">
            {analytics?.totalLessons || 0} ta
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">Barcha guruhlar bo'yicha</span>
        </Card>

        <Card className="p-5 bg-slate-900/80 border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block">O'qituvchilar</span>
          <h3 className="text-2xl font-black text-amber-400 mt-1">
            {analytics?.totalTeachers || 0} nafar
          </h3>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {analytics?.totalGroups || 0} ta guruhda dars beradi
          </span>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Growth Chart */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Yangi O'quvchilar O'sish Dinamikasi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Oylar kesimida yangi qo'shilgan o'quvchilar</p>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.studentGrowthMonthly.map((m) => {
              const percent = Math.min(100, Math.round((m.newStudents / maxGrowth) * 100));

              return (
                <div key={m.month} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-300">{m.month}</span>
                    <span className="text-emerald-400">+{m.newStudents} nafar</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Group Capacities Breakdown */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-400" /> Guruhlar Sig'imi Tahlili
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Mavjud joylar va to'lalik darajasi</p>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {analytics?.groupCapacities.map((g) => {
              const empty = Math.max(0, g.max - g.current);
              return (
                <div
                  key={g.groupName}
                  className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-white">{g.groupName}</span>
                    <span className={g.filledPercent >= 90 ? "text-rose-400" : "text-emerald-400"}>
                      {g.current} / {g.max} ({g.filledPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        g.filledPercent >= 90
                          ? "bg-rose-500"
                          : g.filledPercent >= 70
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${g.filledPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Bo'sh o'rinlar: {empty} ta</span>
                    <span>{empty === 0 ? "Guruh to'lgan" : "Qabul ochiq"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
