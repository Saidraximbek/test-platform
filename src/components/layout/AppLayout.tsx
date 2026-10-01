import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import { Footer } from "../common/Footer";
import { useAuth } from "../../context/AuthContext";
import {
  AlertTriangle,
  LayoutDashboard,
  GraduationCap,
  FileCheck,
  MessageSquare,
  User,
} from "lucide-react";
import { sound } from "../../utils/soundEffects";

export const AppLayout: React.FC = () => {
  const { isSuspended } = useAuth();
  const location = useLocation();

  const mobileNavItems = [
    { name: "Asosiy", href: "/dashboard", icon: LayoutDashboard },
    { name: "Darslar", href: "/lessons", icon: GraduationCap },
    { name: "Vazifalar", href: "/homework", icon: FileCheck },
    { name: "Savollar", href: "/questions/teacher", icon: MessageSquare },
    { name: "Profil", href: "/profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <Navbar />

      {isSuspended && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Hisobingiz vaqtincha to'xtatilgan. Test boshlash yoki xarid qilish imkoniyati cheklangan.</span>
        </div>
      )}

      {/* Main Content with bottom padding for mobile navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-8">
        <Outlet />
      </main>

      <Footer />

      {/* Native Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0E1322]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-2xl flex items-center justify-around">
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
                  ? "text-brand-600 dark:text-brand-400 font-bold scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600 dark:bg-brand-400" />
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
