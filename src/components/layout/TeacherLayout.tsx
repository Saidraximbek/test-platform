import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  FileCheck,
  MessageSquare,
  ClipboardList,
  UserCheck,
  LogOut,
  Menu,
  X,
  Award,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { sound } from "../../utils/soundEffects";
import { FargoniyLogo } from "../common/FargoniyLogo";

export const TeacherLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Ko'rsatkichlar Paneli", href: "/teacher", icon: LayoutDashboard },
    { name: "Mening Oyligim", href: "/teacher/salary", icon: DollarSign },
    { name: "Bugungi Darslar", href: "/teacher/today", icon: Calendar },
    { name: "Guruhlarim", href: "/teacher/groups", icon: Users },
    { name: "O'quvchilarim", href: "/teacher/students", icon: UserCheck },
    { name: "Darslar & Rejalar", href: "/teacher/lessons", icon: BookOpen },
    { name: "Vazifalarni Tekshirish", href: "/teacher/homework", icon: FileCheck },
    { name: "O'quvchilar Savollari", href: "/teacher/questions", icon: MessageSquare },
    { name: "Davomat Belgilash", href: "/teacher/attendance", icon: ClipboardList },
  ];

  // Mobile bottom bar items (most frequent teacher workflows)
  const mobileNavItems = [
    { name: "Asosiy", href: "/teacher", icon: LayoutDashboard },
    { name: "Darslar", href: "/teacher/lessons", icon: BookOpen },
    { name: "Vazifalar", href: "/teacher/homework", icon: FileCheck },
    { name: "Davomat", href: "/teacher/attendance", icon: ClipboardList },
    { name: "Savollar", href: "/teacher/questions", icon: MessageSquare },
  ];

  const isActive = (path: string) =>
    path === "/teacher" ? location.pathname === "/teacher" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dark min-h-screen flex flex-col bg-[#090D16] text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex">
        {/* Teacher Desktop / Drawer Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0E1322]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col z-50 transition-all duration-300 shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link to="/teacher" className="flex items-center gap-2 group">
              <FargoniyLogo size="sm" subtitle="Ustoz Portali" theme="dark" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            <h3 className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
              O'QITUVCHI AMALLARI
            </h3>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/25 font-bold"
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
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </Link>
              );
            })}
          </nav>

          {/* Teacher Profile & Logout */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-sky-500/40"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {user?.displayName?.charAt(0) || "T"}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate text-white">{user?.displayName || "O'qituvchi"}</p>
                <p className="text-[10px] text-sky-400 font-semibold">O'qituvchi</p>
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
          {/* Mobile & Desktop Header */}
          <header className="sticky top-0 z-30 bg-[#0E1322]/90 backdrop-blur-xl border-b border-slate-800/80 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-sky-300 hover:text-white rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors shadow-sm"
                title="Barcha bo'limlar menyusi"
              >
                <Menu className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold">Menyu</span>
              </button>
              <div className="flex items-center gap-2">
                <FargoniyLogo size={28} showText={false} />
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight truncate">
                  Ustoz Ish Joyi
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

      {/* Teacher Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1322]/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 shadow-2xl flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => sound.playClick()}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                active
                  ? "text-sky-400 font-bold scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default TeacherLayout;
