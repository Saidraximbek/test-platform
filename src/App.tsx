import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

// User Pages
import { DashboardPage } from "./pages/user/DashboardPage";
import { ProfilePage } from "./pages/user/ProfilePage";
import { SubjectsPage } from "./pages/user/SubjectsPage";
import { LevelsPage, SubjectDetailPage } from "./pages/user/LevelsPage";
import { TestPage } from "./pages/user/TestPage";
import { TestResultPage } from "./pages/user/TestResultPage";
import { ProgressPage } from "./pages/user/ProgressPage";
import { LeaderboardPage } from "./pages/user/LeaderboardPage";
import { ShopPage } from "./pages/user/ShopPage";
import { ProductDetailPage } from "./pages/user/ProductDetailPage";
import { OrdersPage, OrderDetailPage } from "./pages/user/OrdersPage";
import { SubmitQuestionPage } from "./pages/user/SubmitQuestionPage";
import { ReviewsPage } from "./pages/user/ReviewsPage";
import { NotificationsPage } from "./pages/user/NotificationsPage";

// Admin Pages
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminSubjectsPage } from "./pages/admin/AdminSubjectsPage";
import { AdminLevelsPage } from "./pages/admin/AdminLevelsPage";
import { AdminQuestionsPage } from "./pages/admin/AdminQuestionsPage";
import { AdminQuestionSubmissionsPage } from "./pages/admin/AdminQuestionSubmissionsPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminRewardsPage } from "./pages/admin/AdminRewardsPage";
import { AdminLeaderboardPage } from "./pages/admin/AdminLeaderboardPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminAuditLogsPage } from "./pages/admin/AdminAuditLogsPage";

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Application Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="subjects" element={<AdminSubjectsPage />} />
        <Route path="levels" element={<AdminLevelsPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="question-submissions" element={<AdminQuestionSubmissionsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="rewards" element={<AdminRewardsPage />} />
        <Route path="leaderboard" element={<AdminLeaderboardPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
