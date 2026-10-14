import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Crown,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  GraduationCap,
  Award,
  Settings,
  Shield,
  Menu,
  X,
  PieChart,
  CreditCard,
  CalendarCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { sound } from "../../utils/soundEffects";
import { FargoniyLogo } from "../common/FargoniyLogo";

export const DirectorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuSections = [
    {
      label: "IJROCHI NAZORAT",
      items: [
        { name: "Direktor Paneli", href: "/director", icon: LayoutDashboard },
        { name: "Moliyaviy Balans", href: "/director/finance", icon: TrendingUp },
      ],
    },
    {
      label: "MOLIYA VA MAOSHLAR",
      items: [
        { name: "Oylik To'lov Nazorati", href: "/director/monthly-payments", icon: CalendarCheck },
        { name: "O'quvchilar To'lovlari", href: "/director/payments", icon: CreditCard },
        { name: "O'qituvchilar Maoshi", href: "/director/salaries", icon: DollarSign },
        { name: "Markaz Xarajatlari", href: "/director/expenses", icon: Receipt },
      ],
    },
    {
      label: "MARKAZ VA LMS TAHLILI",
      items: [
        { name: "Statistika & Analitika", href: "/director/analytics", icon: PieChart },
        { name: "Guruhlar Sig'imi", href: "/director/groups", icon: GraduationCap },
        { name: "Ustozlar Samaradorligi", href: "/director/teachers", icon: Award },
      ],
    },
    {
      label: "SOZLAMALAR VA NAZORAT",
      items: [
        { name: "Foydalanuvchilar & Rollar", href: "/director/users", icon: Users },
        { name: "Platforma Qoidalari", href: "/director/settings", icon: Settings },
        { name: "Admin Boshqaruvi", href: "/admin", icon: Shield },
      ],
    },
  ];

  // Mobile Bottom Navigation Bar (Primary executive quick taps)
  const mobileNavItems = [
    { name: "Asosiy", href: "/director", icon: LayoutDashboard },
    { name: "Balans", href: "/director/finance", icon: TrendingUp },
    { name: "Maoshlar", href: "/director/salaries", icon: DollarSign },
    { name: "Xarajatlar", href: "/director/expenses", icon: Receipt },
    { name: "Analitika", href: "/director/analytics", icon: PieChart },
  ];

  const isActive = (path: string) =>
    path === "/director" ? location.pathname === "/director" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dark min-h-screen flex flex-col bg-[#070A12] text-slate-100 font-sans selection:bg-amber-500 selection:text-black">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex">
        {/* Director Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0B0F1E]/95 backdrop-blur-xl border-r border-amber-500/20 flex flex-col z-50 transition-all duration-300 shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between">
            <Link to="/director" className="flex items-center gap-2 group">
              <FargoniyLogo size="sm" subtitle="Direktor ERP" theme="dark" />
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
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {menuSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-extrabold text-amber-500/70 uppercase tracking-wider mb-2">
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
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 font-black"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active ? "text-slate-950 stroke-[2.5]" : "text-slate-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Director Profile & Logout */}
          <div className="p-4 border-t border-amber-500/20 bg-slate-950/40 space-y-2">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                👑
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate text-white">{user?.displayName || "Direktor"}</p>
                <p className="text-[10px] text-amber-400 font-semibold">Tashkilot Rahbari</p>
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
          <header className="sticky top-0 z-30 bg-[#0B0F1E]/90 backdrop-blur-xl border-b border-amber-500/20 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 text-amber-300 hover:text-white rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors shadow-sm"
                title="Barcha bo'limlar menyusi"
              >
                <Menu className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Menyu</span>
              </button>
              <div className="flex items-center gap-2">
                <FargoniyLogo size={28} showText={false} />
                <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight truncate">
                  Direktor Paneli
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all shadow-sm"
                title="Admin boshqaruviga o'tish"
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Admin Boshqaruvi</span>
                <span className="sm:hidden">Admin</span>
              </Link>

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

      {/* Director Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F1E]/95 backdrop-blur-xl border-t border-amber-500/20 px-1 py-1.5 shadow-2xl flex items-center justify-around">
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
                  ? "text-amber-400 font-bold scale-105"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
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

export default DirectorLayout;
