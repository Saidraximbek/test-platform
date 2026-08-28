import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
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
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  Activity,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
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
      label: "TA'LIM VA TESTLAR",
      items: [
        { name: "Fanlar Boshqaruvi", href: "/admin/subjects", icon: BookOpen },
        { name: "Darajalar (Levels)", href: "/admin/levels", icon: Layers },
        { name: "Savollar Bazasi", href: "/admin/questions", icon: HelpCircle },
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

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <div className="dark min-h-screen flex bg-[#090D16] text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0E1322]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col z-50 transition-all duration-300 shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base tracking-tight text-white">TILLO</h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  PRO ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Boshqaruv Markazi</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Back to student platform quick link */}
        <div className="px-4 pt-4 pb-2">
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/40 hover:bg-brand-600/20 hover:text-white border border-slate-700/50 hover:border-brand-500/30 transition-all group"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-brand-400 group-hover:-translate-x-1 transition-transform" />
              Foydalanuvchi qismi
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400" />
          </Link>
        </div>

        {/* Categorized Navigation items */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
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
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Administrator Profile Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-9 h-9 rounded-full object-cover border border-brand-500/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                {user?.displayName?.charAt(0) || "A"}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold truncate text-white">{user?.displayName || "Admin"}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Faol Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0E1322]/80 backdrop-blur-xl border-b border-slate-800/80 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Tillo Admin Console
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tizim barqaror ishlamoqda</span>
            </div>

            <div className="text-right hidden md:block">
              <span className="text-[11px] text-slate-400 block">Sana</span>
              <span className="text-xs font-bold text-slate-200">
                {new Date().toLocaleDateString("uz-UZ", { weekday: "short", day: "numeric", month: "long" })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
