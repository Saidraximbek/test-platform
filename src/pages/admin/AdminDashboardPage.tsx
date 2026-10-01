import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  HelpCircle,
  FileQuestion,
  ShoppingBag,
  Package,
  Award,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Activity,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
  UserPlus,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { subjectService } from "../../services/subjectService";
import { shopService } from "../../services/shopService";
import { questionSubmissionService } from "../../services/questionSubmissionService";
import { useAuth } from "../../context/AuthContext";
import { AuditLogItem } from "../../types";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSubjects: 0,
    pendingSubmissions: 0,
    totalOrders: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersList, subjectsList, submissions, ordersList, logs] = await Promise.all([
          adminService.getAllUsers("", "all", 100),
          subjectService.getSubjects(false),
          questionSubmissionService.getAllSubmissions("pending"),
          shopService.getAllOrders("all"),
          adminService.getAuditLogs("all", 6),
        ]);

        setStats({
          totalUsers: usersList.length,
          activeUsers: usersList.filter((u) => u.status === "active").length,
          totalSubjects: subjectsList.length,
          pendingSubmissions: submissions.length,
          totalOrders: ordersList.length,
        });
        setRecentLogs(logs);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-brand-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Jami Foydalanuvchilar",
      value: stats.totalUsers,
      sub: `${stats.activeUsers} faol o'quvchilar`,
      icon: Users,
      glow: "from-blue-600/20 to-cyan-500/10",
      accent: "text-sky-400 bg-sky-500/15 border-sky-500/30",
      href: "/admin/users",
    },
    {
      title: "Mavjud Fanlar",
      value: stats.totalSubjects,
      sub: "Barcha faol va nofaol fanlar",
      icon: BookOpen,
      glow: "from-emerald-600/20 to-teal-500/10",
      accent: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      href: "/admin/subjects",
    },
    {
      title: "Kutilayotgan Savollar",
      value: stats.pendingSubmissions,
      sub: "O'quvchilar taklif qilgan",
      icon: FileQuestion,
      glow: "from-amber-600/20 to-orange-500/10",
      accent: "text-amber-400 bg-amber-500/15 border-amber-500/30",
      href: "/admin/question-submissions",
    },
    {
      title: "Do'kon Xaridlari",
      value: stats.totalOrders,
      sub: "Markazdan olib ketiladigan",
      icon: Package,
      glow: "from-purple-600/20 to-pink-500/10",
      accent: "text-purple-400 bg-purple-500/15 border-purple-500/30",
      href: "/admin/orders",
    },
  ];

  const quickActions = [
    {
      title: "Qabul Bo'limi (Lidlar)",
      desc: "Yangi kelgan o'quvchilarni qabul qilish va login-parol berish",
      icon: UserPlus,
      href: "/admin/admissions",
      color: "from-emerald-600 to-teal-600",
    },
    {
      title: "Savollar Bazasi",
      desc: "Ommaviy CSV yoki yangi test savollari qo'shish",
      icon: HelpCircle,
      href: "/admin/questions",
      color: "from-brand-600 to-indigo-600",
    },
    {
      title: "Do'kon Buyurtmalari",
      desc: "Sovg'a qabul kodlarini tasdiqlash va topshirish",
      icon: Package,
      href: "/admin/orders",
      color: "from-purple-600 to-indigo-600",
    },
    {
      title: "Yangi Fan / Daraja",
      desc: "Fanlar yaratish va ball parametrlarini sozlash",
      icon: BookOpen,
      href: "/admin/subjects",
      color: "from-emerald-600 to-teal-600",
    },
    {
      title: "Foydalanuvchilar",
      desc: "Hisoblarni boshqarish va Tillo tangalarini sozlash",
      icon: Users,
      href: "/admin/users",
      color: "from-amber-600 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Xush kelibsiz, {user?.displayName || "Admin"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              TILLO Test Boshqaruv Markazi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
              O'quv platformasining barcha testlari, fanlari, Tillo tangalari va xaridlarini bir joydan to'liq nazorat qiling.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/admin/questions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" /> Savol Yuklash
            </Link>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-all"
            >
              <Package className="w-4 h-4" /> Xaridlarni Tekshirish
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} to={c.href} className="group">
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${c.glow} bg-slate-900/90 border border-slate-800/80 p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-slate-700 group-hover:shadow-xl`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">{c.title}</span>
                  <div className={`p-2.5 rounded-xl border ${c.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white tracking-tight">{c.value}</div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{c.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Navigation Modules */}
      <div>
        <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Tezkor Boshqaruv Bo'limlari
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((qa, idx) => {
            const Icon = qa.icon;
            return (
              <Link key={idx} to={qa.href} className="group">
                <div className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 transition-all duration-200 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${qa.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-brand-400 transition-colors">
                      {qa.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{qa.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-brand-400 group-hover:translate-x-1 transition-transform">
                    O'tish <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Audit Logs Snapshot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-400" /> So'nggi Boshqaruv Jurnali (Audit Logs)
          </h3>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 hover:underline"
          >
            Barcha jurnallarni ko'rish <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 shadow-xl">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Audit yozuvlari mavjud emas
            </div>
          ) : (
            recentLogs.map((log) => (
              <div
                key={log.logId}
                className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-800/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/20">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-bold">→</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {log.targetCollection} ({log.targetDocumentId ? log.targetDocumentId.substring(0, 10) : "-"}...)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Administrator: <strong className="text-slate-300">{log.adminUid ? log.adminUid.substring(0, 10) : "admin"}</strong>
                  </p>
                </div>

                <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
