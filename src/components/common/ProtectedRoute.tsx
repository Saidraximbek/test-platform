import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "./Spinner";
import { ShieldAlert, LogOut, PhoneCall } from "lucide-react";
import { Button } from "./Button";

export const BlockedAccountScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const isSuspended = user?.status === "suspended";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/95 border border-rose-500/30 shadow-2xl shadow-rose-950/50 text-center backdrop-blur-xl">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 mb-3">
          {isSuspended ? "Vaqtincha to'xtatilgan" : "Akkaunt bloklangan"}
        </span>

        <h2 className="text-2xl font-black text-white mb-2">
          {isSuspended ? "Hisobingiz to'xtatildi" : "Hisobingiz bloklandi"}
        </h2>

        <p className="text-slate-400 mb-5 text-xs leading-relaxed">
          Hurmatli <strong className="text-slate-200">{user?.displayName || "Foydalanuvchi"}</strong>, sizning akkauntingiz (roli: <span className="uppercase font-mono text-rose-400 font-bold">{user?.role || "user"}</span>) rahbariyat/direktor qarori bilan tizimda to'xtatilgan.
        </p>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-1.5 mb-6">
          <div className="flex justify-between text-slate-400">
            <span>Foydalanuvchi:</span>
            <span className="font-semibold text-white">{user?.displayName || "—"}</span>
          </div>
          {user?.login && (
            <div className="flex justify-between text-slate-400">
              <span>Login:</span>
              <span className="font-mono text-slate-300">@{user.login}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Holat:</span>
            <span className="font-bold text-rose-400 uppercase">{user?.status || "BLOCKED"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => logout()}
            variant="danger"
            size="md"
            className="w-full"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Tizimdan chiqish
          </Button>

          <p className="text-[11px] text-slate-500 pt-2">
            Agar bu xatolik deb hisoblasangiz, markaz ma'muriyati bilan bog'laning.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user, isAdmin, isTeacher, isDirector, loading, isBlocked, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Account Block / Suspend Check
  if (isBlocked || isSuspended || user?.status === "blocked" || user?.status === "suspended") {
    return <BlockedAccountScreen />;
  }

  // STRICT ROLE ISOLATION:
  // Director only sees Director portal
  if (isDirector || user?.role === "director") {
    return <Navigate to="/director" replace />;
  }

  // Teacher only sees Teacher portal
  if (isTeacher || user?.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }

  // Admin only sees Admin portal
  if (isAdmin || user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // Only student / learner reaches here
  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user, isAdmin, isDirector, loading, isBlocked, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Account Block / Suspend Check for Admins
  if (isBlocked || isSuspended || user?.status === "blocked" || user?.status === "suspended") {
    return <BlockedAccountScreen />;
  }

  // Direktor va Admin ikkalasi ham admin bo'limlariga to'liq kira oladi
  if (!isAdmin && !isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const DirectorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user, isDirector, loading, isBlocked, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Account Block / Suspend Check
  if (isBlocked || isSuspended || user?.status === "blocked" || user?.status === "suspended") {
    return <BlockedAccountScreen />;
  }

  if (!isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user, isTeacher, isAdmin, isDirector, loading, isBlocked, isSuspended } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict Account Block / Suspend Check for Teachers
  if (isBlocked || isSuspended || user?.status === "blocked" || user?.status === "suspended") {
    return <BlockedAccountScreen />;
  }

  if (!isTeacher && !isAdmin && !isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
