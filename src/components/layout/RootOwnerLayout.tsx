import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Terminal,
  Users,
  Crown,
  TrendingUp,
  Activity,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  Key,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Layers,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { rootService } from "../../services/rootService";
import { useToast } from "../../context/ToastContext";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";

export const RootOwnerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password Change Modal
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  interface RootMenuItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }

  const menuSections: { label: string; items: RootMenuItem[] }[] = [
    {
      label: "IJROCHI MARKAZ",
      items: [
        { name: "Asosiy Boshqaruv", href: "/root", icon: Terminal, badge: "LIVE" },
        { name: "Tizim & Server Holati", href: "/root/system", icon: Activity },
      ],
    },
    {
      label: "FOYDALANUVCHILAR VA ROLLARI",
      items: [
        { name: "Barcha Foydalanuvchilar", href: "/root/users", icon: Users },
        { name: "Direktorlar Nazorati", href: "/root/directors", icon: Crown, highlight: true },
      ],
    },
    {
      label: "GLOBAL MOLIYA VA XAZINA",
      items: [
        { name: "Tizim Balansi & Moliya", href: "/root/finance", icon: TrendingUp },
      ],
    },
    {
      label: "XAVFSIZLIK VA AUDIT",
      items: [
        { name: "Himoyalangan Audit Jurnali", href: "/root/audit", icon: History },
        { name: "Global Sozlamalar", href: "/root/settings", icon: Settings },
      ],
    },
  ];

  const quickJumpPanels = [
    { name: "Direktor Paneli", href: "/director", icon: Crown, desc: "Markaz ERP ko'rinishi" },
    { name: "Admin Paneli", href: "/admin", icon: ShieldAlert, desc: "LMS va testlar boshqaruvi" },
  ];

  const isActive = (path: string) =>
    path === "/root" ? location.pathname === "/root" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Parollar bir-biriga mos kelmadi");
      return;
    }

    setIsChangingPass(true);
    try {
      await rootService.changeRootPassword(newPassword);
      success("Root paroli muvaffaqiyatli yangilandi!");
      setIsPassModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
    } catch (err: any) {
      toastError(err.message || "Parolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="dark min-h-screen flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Must Change Password Warning Banner */}
      {user?.mustChangePassword && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between sticky top-0 z-[60] shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 animate-bounce" />
            <span>
              <strong>Xavfsizlik eslatmasi:</strong> Dastlabki Root parolidan foydalanmoqdasiz. Iltimos, xavfsizlik uchun yangi kuchli parol o'rnating.
            </span>
          </div>
          <button
            onClick={() => setIsPassModalOpen(true)}
            className="px-3 py-1 bg-white text-slate-900 rounded-lg font-bold text-xs hover:bg-slate-100 transition shadow"
          >
            Parolni o'zgartirish
          </button>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Root Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 h-screen w-72 bg-[#090D1A]/95 backdrop-blur-2xl border-r border-purple-500/20 flex flex-col z-50 transition-all duration-300 shadow-2xl ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Header Brand */}
          <div className="p-4 border-b border-purple-500/20 bg-gradient-to-b from-purple-950/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 border border-purple-400/40">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-wide text-white uppercase">
                      ROOT OWNER
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      TIKUVSIZ
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
                    Oliy Tizim Boshqaruvi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active user status badge */}
            <div className="mt-3 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-slate-300 truncate">
                  {user?.email || "hacker@sm.sm"}
                </span>
              </div>
              <button
                onClick={() => setIsPassModalOpen(true)}
                title="Parolni o'zgartirish"
                className="text-purple-400 hover:text-purple-300 p-1 rounded-md hover:bg-purple-900/40 transition"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-wider text-purple-400/70">
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        active
                          ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white border border-purple-500/40 shadow-lg shadow-purple-950/40"
                          : "text-slate-300 hover:text-white hover:bg-purple-950/30 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            active ? "text-purple-400" : "text-slate-400 group-hover:text-purple-300"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Quick jump to lower-level panels */}
            <div className="pt-2 border-t border-purple-500/20 space-y-1">
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                PANELLARGA O'TISH
              </div>
              {quickJumpPanels.map((panel) => {
                const Icon = panel.icon;
                return (
                  <Link
                    key={panel.href}
                    to={panel.href}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{panel.name}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-purple-500/20 bg-slate-950/80">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Tizimdan chiqish</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 bg-[#090D1A]/80 backdrop-blur-xl border-b border-purple-500/20 px-4 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-purple-950/40"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-lg">
                  ROOT PRIVILEGES
                </span>
                <span className="text-xs text-slate-400">
                  To'liq tizim va direktorlar ustidan boshqaruv
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPassModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-medium transition"
              >
                <Key className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Parol</span>
              </button>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-600/30">
                R
              </div>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPassModalOpen && (
        <Modal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          title="Root Owner Parolini O'zgartirish"
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <p className="text-xs text-slate-400">
              Root hisobi uchun yangi xavfsiz parolni kiriting. Parol yangilanishi darhol kuchga kiradi va xavfsizlik auditida qayd etiladi.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Yangi Parol (kamida 6 ta belgi)
              </label>
              <Input
                type="password"
                placeholder="Yangi parol..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Yangi Parolni Tasdiqlang
              </label>
              <Input
                type="password"
                placeholder="Parolni qaytadan kiriting..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPassModalOpen(false)}
                disabled={isChangingPass}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isChangingPass}
                className="bg-purple-600 hover:bg-purple-700 border-none"
              >
                Saqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
