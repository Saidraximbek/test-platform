import { startTest } from "./tests/startTest";
import { submitTest } from "./tests/submitTest";
import { abandonTest } from "./tests/abandonTest";
import { unlockLevel } from "./coins/unlockLevel";
import { adminCoinAdjust } from "./coins/adminCoinAdjust";
import { purchaseProduct } from "./shop/purchaseProduct";
import {
  approveQuestionSubmission,
  rejectQuestionSubmission,
} from "./questions/approveQuestionSubmission";
import { grantWeeklyReward } from "./rewards/grantWeeklyReward";
import {
  recalculateLeaderboardStats,
  scheduledLeaderboardRecalculation,
} from "./leaderboard/recalculateLeaderboards";
import { setUserStatus, setAdminRole } from "./admin/userManagement";
import { updateSystemSettings } from "./admin/systemSettings";
import { updateOrderStatus, saveProduct } from "./admin/ordersAndProducts";

export {
  // Test Lifecycle
  startTest,
  submitTest,
  abandonTest,

  // Tillo Coins & Levels
  unlockLevel,
  adminCoinAdjust,

  // Shop & Orders
  purchaseProduct,
  updateOrderStatus,
  saveProduct,

  // Question Submissions & Moderation
  approveQuestionSubmission,
  rejectQuestionSubmission,

  // Rewards & Leaderboards
  grantWeeklyReward,
  recalculateLeaderboardStats,
  scheduledLeaderboardRecalculation,

  // User & Settings Management
  setUserStatus,
  setAdminRole,
  updateSystemSettings,
};
