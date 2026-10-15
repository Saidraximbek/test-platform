import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { TeacherLayout } from "./components/layout/TeacherLayout";
import { DirectorLayout } from "./components/layout/DirectorLayout";
import { RootOwnerLayout } from "./components/layout/RootOwnerLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import {
  ProtectedRoute,
  AdminRoute,
  TeacherRoute,
  DirectorRoute,
  RootOwnerRoute,
  BlockedAccountScreen,
} from "./components/common/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "./components/common/Spinner";

// Auth Pages
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));

// User & Student Pages
const DashboardPage = lazy(() => import("./pages/user/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const SubjectsPage = lazy(() => import("./pages/user/SubjectsPage").then((m) => ({ default: m.SubjectsPage })));
const LevelsPage = lazy(() => import("./pages/user/LevelsPage").then((m) => ({ default: m.LevelsPage })));
const SubjectDetailPage = lazy(() => import("./pages/user/LevelsPage").then((m) => ({ default: m.SubjectDetailPage })));
const TestPage = lazy(() => import("./pages/user/TestPage").then((m) => ({ default: m.TestPage })));
const TestResultPage = lazy(() => import("./pages/user/TestResultPage").then((m) => ({ default: m.TestResultPage })));
const ProgressPage = lazy(() => import("./pages/user/ProgressPage").then((m) => ({ default: m.ProgressPage })));
const LeaderboardPage = lazy(() => import("./pages/user/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })));
const ShopPage = lazy(() => import("./pages/user/ShopPage").then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import("./pages/user/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const OrdersPage = lazy(() => import("./pages/user/OrdersPage").then((m) => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import("./pages/user/OrdersPage").then((m) => ({ default: m.OrderDetailPage })));
const SubmitQuestionPage = lazy(() => import("./pages/user/SubmitQuestionPage").then((m) => ({ default: m.SubmitQuestionPage })));
const ReviewsPage = lazy(() => import("./pages/user/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));

// Student LMS Pages
const StudentLessonsPage = lazy(() => import("./pages/user/StudentLessonsPage").then((m) => ({ default: m.StudentLessonsPage })));
const StudentLessonDetailPage = lazy(() => import("./pages/user/StudentLessonDetailPage").then((m) => ({ default: m.StudentLessonDetailPage })));
const StudentHomeworkPage = lazy(() => import("./pages/user/StudentHomeworkPage").then((m) => ({ default: m.StudentHomeworkPage })));
const StudentQuestionsPage = lazy(() => import("./pages/user/StudentQuestionsPage").then((m) => ({ default: m.StudentQuestionsPage })));

// Admin Pages
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })));
const AdminSubjectsPage = lazy(() => import("./pages/admin/AdminSubjectsPage").then((m) => ({ default: m.AdminSubjectsPage })));
const AdminLevelsPage = lazy(() => import("./pages/admin/AdminLevelsPage").then((m) => ({ default: m.AdminLevelsPage })));
const AdminQuestionsPage = lazy(() => import("./pages/admin/AdminQuestionsPage").then((m) => ({ default: m.AdminQuestionsPage })));
const AdminTopicTestsPage = lazy(() => import("./pages/admin/AdminTopicTestsPage").then((m) => ({ default: m.AdminTopicTestsPage })));
const AdminQuestionSubmissionsPage = lazy(() => import("./pages/admin/AdminQuestionSubmissionsPage").then((m) => ({ default: m.AdminQuestionSubmissionsPage })));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage").then((m) => ({ default: m.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage").then((m) => ({ default: m.AdminOrdersPage })));
const AdminRewardsPage = lazy(() => import("./pages/admin/AdminRewardsPage").then((m) => ({ default: m.AdminRewardsPage })));
const AdminLeaderboardPage = lazy(() => import("./pages/admin/AdminLeaderboardPage").then((m) => ({ default: m.AdminLeaderboardPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage })));
const AdminAuditLogsPage = lazy(() => import("./pages/admin/AdminAuditLogsPage").then((m) => ({ default: m.AdminAuditLogsPage })));
const AdminGroupsPage = lazy(() => import("./pages/admin/AdminGroupsPage").then((m) => ({ default: m.AdminGroupsPage })));
const AdminTeachersPage = lazy(() => import("./pages/admin/AdminTeachersPage").then((m) => ({ default: m.AdminTeachersPage })));
const AdminStudentsPage = lazy(() => import("./pages/admin/AdminStudentsPage").then((m) => ({ default: m.AdminStudentsPage })));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage").then((m) => ({ default: m.AdminPaymentsPage })));
const AdminMonthlyPaymentsPage = lazy(() => import("./pages/admin/AdminMonthlyPaymentsPage").then((m) => ({ default: m.AdminMonthlyPaymentsPage })));
const AdminAdmissionsPage = lazy(() => import("./pages/admin/AdminAdmissionsPage").then((m) => ({ default: m.AdminAdmissionsPage })));

// Teacher Pages
const TeacherDashboardPage = lazy(() => import("./pages/teacher/TeacherDashboardPage").then((m) => ({ default: m.TeacherDashboardPage })));
const TeacherTodayLessonsPage = lazy(() => import("./pages/teacher/TeacherTodayLessonsPage").then((m) => ({ default: m.TeacherTodayLessonsPage })));
const TeacherGroupsPage = lazy(() => import("./pages/teacher/TeacherGroupsPage").then((m) => ({ default: m.TeacherGroupsPage })));
const TeacherLessonsPage = lazy(() => import("./pages/teacher/TeacherLessonsPage").then((m) => ({ default: m.TeacherLessonsPage })));
const TeacherHomeworkPage = lazy(() => import("./pages/teacher/TeacherHomeworkPage").then((m) => ({ default: m.TeacherHomeworkPage })));
const TeacherAttendancePage = lazy(() => import("./pages/teacher/TeacherAttendancePage").then((m) => ({ default: m.TeacherAttendancePage })));
const TeacherQuestionsPage = lazy(() => import("./pages/teacher/TeacherQuestionsPage").then((m) => ({ default: m.TeacherQuestionsPage })));
const TeacherStudentsPage = lazy(() => import("./pages/teacher/TeacherStudentsPage").then((m) => ({ default: m.TeacherStudentsPage })));
const TeacherSalaryPage = lazy(() => import("./pages/teacher/TeacherSalaryPage").then((m) => ({ default: m.TeacherSalaryPage })));

// Director Pages
const DirectorDashboardPage = lazy(() => import("./pages/director/DirectorDashboardPage").then((m) => ({ default: m.DirectorDashboardPage })));
const DirectorUsersPage = lazy(() => import("./pages/director/DirectorUsersPage").then((m) => ({ default: m.DirectorUsersPage })));
const DirectorFinancePage = lazy(() => import("./pages/director/DirectorFinancePage").then((m) => ({ default: m.DirectorFinancePage })));
const DirectorSalariesPage = lazy(() => import("./pages/director/DirectorSalariesPage").then((m) => ({ default: m.DirectorSalariesPage })));
const DirectorExpensesPage = lazy(() => import("./pages/director/DirectorExpensesPage").then((m) => ({ default: m.DirectorExpensesPage })));
const DirectorAnalyticsPage = lazy(() => import("./pages/director/DirectorAnalyticsPage").then((m) => ({ default: m.DirectorAnalyticsPage })));
const DirectorSettingsPage = lazy(() => import("./pages/director/DirectorSettingsPage").then((m) => ({ default: m.DirectorSettingsPage })));

// Root Owner Pages
const RootDashboardPage = lazy(() => import("./pages/root/RootDashboardPage").then((m) => ({ default: m.RootDashboardPage })));
const RootUsersPage = lazy(() => import("./pages/root/RootUsersPage").then((m) => ({ default: m.RootUsersPage })));
const RootDirectorsPage = lazy(() => import("./pages/root/RootDirectorsPage").then((m) => ({ default: m.RootDirectorsPage })));
const RootFinancePage = lazy(() => import("./pages/root/RootFinancePage").then((m) => ({ default: m.RootFinancePage })));
const RootSystemPage = lazy(() => import("./pages/root/RootSystemPage").then((m) => ({ default: m.RootSystemPage })));
const RootAuditPage = lazy(() => import("./pages/root/RootAuditPage").then((m) => ({ default: m.RootAuditPage })));
const RootSettingsPage = lazy(() => import("./pages/root/RootSettingsPage").then((m) => ({ default: m.RootSettingsPage })));

const RootRedirect: React.FC = () => {
  const { firebaseUser, user, isRootOwner, isAdmin, isTeacher, isDirector, isBlocked, isSuspended, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Spinner size="lg" className="text-brand-500" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // If user account is blocked or suspended, immediately show BlockedAccountScreen
  if (isBlocked || isSuspended || user?.status === "blocked" || user?.status === "suspended") {
    return <BlockedAccountScreen />;
  }

  if (isRootOwner || user?.role === "root_owner") {
    return <Navigate to="/root" replace />;
  }
  if (isDirector || user?.role === "director") {
    return <Navigate to="/director" replace />;
  }
  if (isTeacher || user?.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  if (isAdmin || user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      }
    >
      <Routes>
      {/* Root Entry: Requires login immediately or redirects to role portal */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Application & Student Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/levels/:subjectId" element={<LevelsPage />} />
        <Route path="/test/:sessionId" element={<TestPage />} />
        <Route path="/test/:sessionId/result" element={<TestResultPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:productId" element={<ProductDetailPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/questions/submit" element={<SubmitQuestionPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />

        {/* LMS Student Routes */}
        <Route path="/lessons" element={<StudentLessonsPage />} />
        <Route path="/lessons/:lessonId" element={<StudentLessonDetailPage />} />
        <Route path="/homework" element={<StudentHomeworkPage />} />
        <Route path="/questions/teacher" element={<StudentQuestionsPage />} />
      </Route>

      {/* Teacher Protected Routes */}
      <Route
        path="/teacher"
        element={
          <TeacherRoute>
            <TeacherLayout />
          </TeacherRoute>
        }
      >
        <Route index element={<TeacherDashboardPage />} />
        <Route path="today" element={<TeacherTodayLessonsPage />} />
        <Route path="groups" element={<TeacherGroupsPage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="lessons" element={<TeacherLessonsPage />} />
        <Route path="homework" element={<TeacherHomeworkPage />} />
        <Route path="attendance" element={<TeacherAttendancePage />} />
        <Route path="questions" element={<TeacherQuestionsPage />} />
        <Route path="salary" element={<TeacherSalaryPage />} />
      </Route>

      {/* Director Protected Routes */}
      <Route
        path="/director"
        element={
          <DirectorRoute>
            <DirectorLayout />
          </DirectorRoute>
        }
      >
        <Route index element={<DirectorDashboardPage />} />
        <Route path="users" element={<DirectorUsersPage />} />
        <Route path="finance" element={<DirectorFinancePage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="monthly-payments" element={<AdminMonthlyPaymentsPage />} />
        <Route path="salaries" element={<DirectorSalariesPage />} />
        <Route path="expenses" element={<DirectorExpensesPage />} />
        <Route path="analytics" element={<DirectorAnalyticsPage />} />
        <Route path="groups" element={<DirectorAnalyticsPage />} />
        <Route path="teachers" element={<DirectorSalariesPage />} />
        <Route path="settings" element={<DirectorSettingsPage />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="admissions" element={<AdminAdmissionsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="teachers" element={<AdminTeachersPage />} />
        <Route path="groups" element={<AdminGroupsPage />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="monthly-payments" element={<AdminMonthlyPaymentsPage />} />
        <Route path="subjects" element={<AdminSubjectsPage />} />
        <Route path="levels" element={<AdminLevelsPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="topic-tests" element={<AdminTopicTestsPage />} />
        <Route path="question-submissions" element={<AdminQuestionSubmissionsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="rewards" element={<AdminRewardsPage />} />
        <Route path="leaderboard" element={<AdminLeaderboardPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Root Owner Protected Routes */}
      <Route
        path="/root"
        element={
          <RootOwnerRoute>
            <RootOwnerLayout />
          </RootOwnerRoute>
        }
      >
        <Route index element={<RootDashboardPage />} />
        <Route path="users" element={<RootUsersPage />} />
        <Route path="directors" element={<RootDirectorsPage />} />
        <Route path="finance" element={<RootFinancePage />} />
        <Route path="system" element={<RootSystemPage />} />
        <Route path="audit" element={<RootAuditPage />} />
        <Route path="settings" element={<RootSettingsPage />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default App;
