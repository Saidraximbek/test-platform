import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Crown,
  Shield,
  TrendingUp,
  Activity,
  History,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Coins,
  GraduationCap,
  Briefcase,
  Terminal,
} from "lucide-react";
import { rootService, RootSystemMetrics, RootAuditLogItem } from "../../services/rootService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";
import { UserProfile } from "../../types";

export const RootDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<RootSystemMetrics | null>(null);
  const [directors, setDirectors] = useState<UserProfile[]>([]);
  const [recentLogs, setRecentLogs] = useState<RootAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [m, d, l] = await Promise.all([
        rootService.getSystemMetrics(),
        rootService.getDirectors(),
        rootService.getAuditLogs(10),
      ]);
      setMetrics(m);
      setDirectors(d);
      setRecentLogs(l);
    } catch (err) {
      console.error("Root dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-950/70 to-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              ROOT OWNER • LEVEL 0 AUTHORITY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Oliy Boshqaruv Markazi
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ushbu konsol barcha direktorlar, administratorlar, o'quv markazlari va moliyaviy oqimlar ustidan cheklovsiz oliy nazoratni ta'minlaydi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchData(true)}
              isLoading={refreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
              className="bg-purple-950/50 border-purple-500/30 text-purple-200 hover:bg-purple-900/50"
            >
              Yangilash
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B0F1F]/90 border-purple-500/20 p-5 rounded-2xl hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Jami Foydalanuvchilar
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {metrics?.totalUsers || 0}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400">
            {metrics?.activeUsers || 0} ta faol foydalanuvchi
          </p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-amber-500/20 p-5 rounded-2xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Direktorlar Soni
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {metrics?.totalDirectors || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Barcha ta'lim markazlari rahbarlari
          </p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-indigo-500/20 p-5 rounded-2xl hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admin & Ustozlar
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {(metrics?.totalAdmins || 0) + (metrics?.totalTeachers || 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {metrics?.totalAdmins || 0} admin / {metrics?.totalTeachers || 0} ustoz
          </p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-emerald-500/20 p-5 rounded-2xl hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tillo Muomalasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-300">
            {formatCoins(metrics?.totalCoins || 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Platformada aylanayotgan mukofotlar
          </p>
        </Card>
      </div>

      {/* Directors Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Direktorlar Nazorati
            </h2>
            <p className="text-xs text-slate-400">
              O'quv markazlari rahbarlari va ularning hisob holatlari
            </p>
          </div>
          <Link
            to="/root/directors"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            Barchasini boshqarish &rarr;
          </Link>
        </div>

        <Card className="bg-[#0B0F1F]/90 border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {directors.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Hozircha tizimda direktorlar belgilanmagan.
            </div>
          ) : (
            directors.map((dir) => (
              <div
                key={dir.uid}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                    {dir.displayName?.charAt(0) || "D"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{dir.displayName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        DIREKTOR
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span>{dir.email || dir.login || "—"}</span>
                      {dir.phoneNumber && <span>• {dir.phoneNumber}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      dir.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {dir.status || "ACTIVE"}
                  </span>
                  <Link
                    to="/root/directors"
                    className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold border border-purple-500/30 transition"
                  >
                    Boshqarish
                  </Link>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Recent Protected Audit Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Himoyalangan Audit Jurnali
            </h2>
            <p className="text-xs text-slate-400">
              Faqat Root Owner ko'ra oladigan maxfiy xavfsizlik va boshqaruv hodisalari
            </p>
          </div>
          <Link
            to="/root/audit"
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            To'liq jurnal &rarr;
          </Link>
        </div>

        <Card className="bg-[#0B0F1F]/90 border-purple-500/20 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Hozircha audit yozuvlari mavjud emas.
            </div>
          ) : (
            recentLogs.map((log, idx) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 uppercase">
                      {log.action}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono">{log.performedBy}</span>
                  </div>
                  <p className="text-slate-300">{log.notes || "Root amali bajarildi"}</p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
};
