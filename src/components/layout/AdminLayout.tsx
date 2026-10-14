import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Layers,
  HelpCircle,
  FileQuestion,
  ShoppingBag,
  Package,
  Award,
  Trophy,
  Settings,
  ShieldAlert,
  Menu,
  X,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  CreditCard,
  Crown,
  LogOut,
  Briefcase,
  UserPlus,
  Sparkles,
  CalendarCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { sound } from "../../utils/soundEffects";
import { FargoniyLogo } from "../common/FargoniyLogo";

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDirector, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuSections = [
    {
      label: "BOSHQARUV VA STATISTIKA",
      items: [
        { name: "Ko'rsatkichlar Paneli", href: "/admin", icon: LayoutDashboard },
        { name: "Foydalanuvchilar", href: "/admin/users", icon: Users },
      ],
    },
    {
      label: "LMS VA O'QUV JARAYONI",
      items: [
        { name: "Qabul Bo'limi (Lidlar)", href: "/admin/admissions", icon: UserPlus, badge: "Yangi" },
        { name: "O'qituvchilar Boshqaruvi", href: "/admin/teachers", icon: Briefcase },
        { name: "Guruhlar Boshqaruvi", href: "/admin/groups", icon: GraduationCap },
        { name: "O'quvchilar & Guruhlar", href: "/admin/students", icon: UserCheck },
        { name: "Oylik To'lov Nazorati", href: "/admin/monthly-payments", icon: CalendarCheck, badge: "Yangi" },
        { name: "O'quv To'lovlari & Kassa", href: "/admin/payments", icon: CreditCard },
      ],
    },
    {
      label: "TA'LIM VA TESTLAR",
      items: [
        { name: "Fanlar Boshqaruvi", href: "/admin/subjects", icon: BookOpen },
        { name: "Darajalar (Levels)", href: "/admin/levels", icon: Layers },
        { name: "Savollar Bazasi", href: "/admin/questions", icon: HelpCircle },
        { name: "Mavzuli Testlar Banki", href: "/admin/topic-tests", icon: Sparkles, badge: "Yangi" },
        { name: "Taklif Qilingan Savollar", href: "/admin/question-submissions", icon: FileQuestion },
      ],
    },
    {
      label: "DO'KON VA MUKOFOTLAR",
      items: [
        { name: "Do'kon Mahsulotlari", href: "/admin/products", icon: ShoppingBag },
        { name: "Xaridlar va Buyurtmalar", href: "/admin/orders", icon: Package },
        { name: "Haftalik Mukofotlar", href: "/admin/rewards", icon: Award },
        { name: "Yetakchilar Reytingi", href: "/admin/leaderboard", icon: Trophy },
      ],
    },
    {
      label: "TIZIM VA XAVFSIZLIK",
      items: [
        { name: "Tizim Sozlamalari", href: "/admin/settings", icon: Settings },
        { name: "Audit Jurnali (Logs)", href: "/admin/audit-logs", icon: ShieldAlert },
      ],
    },
  ];

  // Mobile Bottom Navigation Bar (Primary admin tasks on phone)
  const mobileNavItems = [
    { name: "Asosiy", href: "/admin", icon: LayoutDashboard },
    { name: "Qabul", href: "/admin/admissions", icon: UserPlus },
    { name: "Guruhlar", href: "/admin/groups", icon: GraduationCap },
    { name: "O'quvchilar", href: "/admin/students", icon: UserCheck },
    { name: "To'lovlar", href: "/admin/payments", icon: CreditCard },
  ];

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dark min-h-screen flex flex-col bg-[#090D16] text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex">
        {/* Modern Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-80 max-w-[85vw] bg-[#0E1322]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col z-50 transition-all duration-300 shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2 group">
              <FargoniyLogo size="sm" subtitle="Admin Panel" theme="dark" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick link to Director if user is Director */}
          {isDirector && (
            <div className="px-4 pt-4 pb-2">
              <Link
                to="/director"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  Direktor Paneliga o'tish
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  ERP
                </span>
              </Link>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {menuSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  {sec.label}
                </h3>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 font-bold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Admin Profile & Logout */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                A
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate text-white">{user?.displayName || "Admin"}</p>
                <p className="text-[10px] text-brand-400 font-semibold">Tizim Administratori</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Chiqish
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#0E1322]/90 backdrop-blur-xl border-b border-slate-800/80 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors shadow-sm"
                title="Barcha bo'limlar menyusi"
              >
                <Menu className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold">Menyu</span>
              </button>
              <div className="flex items-center gap-2">
                <FargoniyLogo size={28} showText={false} />
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight truncate">
                  Administrator Paneli
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isDirector && (
                <Link
                  to="/director"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
                  title="Direktor ERP paneliga qaytish"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Direktor Paneli</span>
                  <span className="sm:hidden">Direktor</span>
                </Link>
              )}

              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Bugun</span>
                <span className="text-xs font-bold text-slate-200">
                  {new Date().toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "long" })}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="lg:hidden p-2 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="p-3 sm:p-6 lg:p-8 flex-1 overflow-x-hidden pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Admin Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1322]/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 shadow-2xl flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => sound.playClick()}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                active
                  ? "text-brand-400 font-bold scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
            </Link>
          );
        })}

        {/* 6th Mobile Bottom Nav button: Open Drawer for all other admin items */}
        <button
          onClick={() => {
            setSidebarOpen(true);
            sound.playClick();
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-400 hover:text-amber-300 transition-all active:scale-95"
          title="Barcha bo'limlar menyusini ochish"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] mt-0.5 tracking-tight font-black">Menyu</span>
        </button>
      </nav>
    </div>
  );
};

export default AdminLayout;
