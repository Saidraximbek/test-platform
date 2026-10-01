import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "./Spinner";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, user, isAdmin, isTeacher, isDirector, loading, isBlocked } = useAuth();
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

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-xl text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Hisob bloklangan</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Sizning hisobingiz qoidabuzarlik sababli tizim administratori tomonidan bloklangan. Qo'shimcha ma'lumot uchun qo'llab-quvvatlash xizmatiga murojaat qiling.
          </p>
        </div>
      </div>
    );
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
  const { firebaseUser, isAdmin, isDirector, loading } = useAuth();
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

  if (!isAdmin && !isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const DirectorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, isDirector, loading } = useAuth();
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

  if (!isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const TeacherRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, isTeacher, isAdmin, isDirector, loading } = useAuth();
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

  if (!isTeacher && !isAdmin && !isDirector) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
