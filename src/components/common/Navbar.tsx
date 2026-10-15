import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  ShoppingBag,
  PlusCircle,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  LayoutDashboard,
  CheckCircle2,
  Package,
  GraduationCap,
  Award,
  Crown,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { CoinBadge } from "./CoinBadge";
import { sound } from "../../utils/soundEffects";
import { FargoniyLogo } from "./FargoniyLogo";

export const Navbar: React.FC = () => {
  const { user, firebaseUser, isRootOwner, isAdmin, isTeacher, isDirector, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const calculatedRole = isRootOwner
    ? "root_owner"
    : isDirector
    ? "director"
    : isAdmin
    ? "admin"
    : isTeacher
    ? "teacher"
    : (user?.role || "user");

  const currentUser = user ? {
    ...user,
    role: user.role && user.role !== "user" ? user.role : calculatedRole as any,
  } : (firebaseUser ? {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Foydalanuvchi",
    photoURL: firebaseUser.photoURL || null,
    coinBalance: 0,
    role: calculatedRole as any,
  } : null);

  const navLinks = [
    { name: "Bosh sahifa", href: "/dashboard", icon: LayoutDashboard },
    { name: "Testlar", href: "/subjects", icon: FileCheck },
    { name: "Darslarim", href: "/lessons", icon: GraduationCap },
    { name: "Uy vazifasi", href: "/homework", icon: BookOpen },
    { name: "Ustozga savol", href: "/questions/teacher", icon: MessageSquare },
    { name: "Do'kon", href: "/shop", icon: ShoppingBag },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0E1322]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Mobile Trigger */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => {
                setShowMobileMenu(true);
                sound.playClick();
              }}
              className="lg:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Asosiy menyu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 group">
              <FargoniyLogo size="sm" subtitle="LMS & Test" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => sound.playClick()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                {/* Tillo Coins Pill */}
                <Link to="/progress" title="Mening tangalarim" onClick={() => sound.playCoin()}>
                  <CoinBadge amount={currentUser.coinBalance || 0} size="sm" />
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowUserMenu(false);
                      sound.playClick();
                    }}
                    className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover with Mobile responsiveness */}
                  {showNotifMenu && (
                    <div className="absolute right-0 sm:right-0 -mr-12 sm:mr-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          Bildirishnomalar
                        </h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3" /> O'qildi qilish
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            Bildirishnomalar mavjud emas
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.notificationId}
                              onClick={() => markAsRead(n.notificationId)}
                              className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                                !n.isRead ? "bg-brand-50/40 dark:bg-brand-950/20" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {n.title}
                                </h5>
                                {!n.isRead && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                                {n.body}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifMenu(false)}
                          className="text-xs text-brand-600 font-semibold hover:underline"
                        >
                          Barcha bildirishnomalarni ko'rish
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifMenu(false);
                      sound.playClick();
                    }}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 flex items-center justify-center font-bold text-xs">
                        {currentUser.displayName?.charAt(0) || "U"}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {currentUser.displayName}
                        </p>
                        <p className="text-[10px] text-slate-500 capitalize">{currentUser.role} hisobi</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Profil ma'lumotlari
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        <Package className="w-4 h-4 text-amber-500" /> Mening xaridlarim
                      </Link>

                      <Link
                        to="/questions/submit"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-500" /> Savol taklif qilish
                      </Link>

                      {isRootOwner && (
                        <Link
                          to="/root"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-500 font-bold hover:bg-rose-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-rose-500" /> Root Egasi Paneli
                        </Link>
                      )}

                      {isDirector && (
                        <Link
                          to="/director"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-500 font-bold hover:bg-amber-500/10 transition-colors"
                        >
                          <Crown className="w-4 h-4 text-amber-500" /> Direktor Boshqaruvi
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-brand-600 font-semibold hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-brand-500" /> Admin Boshqaruvi
                        </Link>
                      )}

                      {isTeacher && (
                        <Link
                          to="/teacher"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-sky-500 font-semibold hover:bg-sky-500/10 transition-colors"
                        >
                          <Award className="w-4 h-4 text-sky-500" /> Ustoz Portali
                        </Link>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold"
                      >
                        <LogOut className="w-4 h-4" /> Chiqish
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Kirish
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition-all"
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student & General Mobile Sidebar Drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#0E1322] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <FargoniyLogo size="sm" subtitle="LMS & Test" />
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile summary card */}
            {currentUser && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" loading="lazy" decoding="async" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      currentUser.displayName?.charAt(0) || "U"
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold truncate text-slate-900 dark:text-white">
                      {currentUser.displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CoinBadge amount={currentUser.coinBalance || 0} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Role Switcher if Root Owner, Admin, Director, or Teacher */}
                {(isRootOwner || isDirector || isAdmin || isTeacher) && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1.5">
                    {isRootOwner && (
                      <Link
                        to="/root"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Root Egasi Paneli
                        </span>
                        <span className="text-[10px] uppercase font-mono">ROOT</span>
                      </Link>
                    )}
                    {isDirector && (
                      <Link
                        to="/director"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20"
                      >
                        <span className="flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Direktor Paneli
                        </span>
                        <span className="text-[10px] uppercase font-mono">ERP</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-brand-500 bg-brand-500/10 border border-brand-500/20"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Admin Paneli
                        </span>
                        <span className="text-[10px] uppercase font-mono">LMS</span>
                      </Link>
                    )}
                    {isTeacher && (
                      <Link
                        to="/teacher"
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-sky-500 bg-sky-500/10 border border-sky-500/20"
                      >
                        <span className="flex items-center gap-2">
                          <Award className="w-4 h-4" /> Ustoz Portali
                        </span>
                        <span className="text-[10px] uppercase font-mono">LMS</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation links list */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Bo'limlar
              </p>
              {[
                { name: "Bosh sahifa", href: "/dashboard", icon: LayoutDashboard },
                { name: "Testlar (Fanlar)", href: "/subjects", icon: FileCheck },
                { name: "Darslarim", href: "/lessons", icon: GraduationCap },
                { name: "Uy vazifasi", href: "/homework", icon: BookOpen },
                { name: "Ustozga savol", href: "/questions/teacher", icon: MessageSquare },
                { name: "Tillo Do'kon", href: "/shop", icon: ShoppingBag },
                { name: "Yetakchilar Reytingi", href: "/leaderboard", icon: Trophy },
                { name: "Xaridlarim", href: "/orders", icon: Package },
                { name: "Fikrlar & Baholar", href: "/reviews", icon: Award },
                { name: "Savol taklif qilish", href: "/questions/submit", icon: PlusCircle },
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      setShowMobileMenu(false);
                      sound.playClick();
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Logout button at bottom */}
            {currentUser && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-rose-500/20"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
