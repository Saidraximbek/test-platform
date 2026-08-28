export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked" | "suspended";

export interface UserProfile {
  uid: string;
  displayName: string;
  age: number;
  phoneNumber: string;
  educationPlace: string;
  isCenterStudent: boolean;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  coinBalance: number;
  totalCorrectAnswers: number;
  testsCompleted: number;
  createdAt: any;
  updatedAt: any;
  lastActiveAt: any;
}

export interface UserProgress {
  progressId: string;
  userId: string;
  subjectId: string;
  levelId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
  attempts: number;
  correctAnswersTotal: number;
  unlockedAt: any;
  lastAttemptAt: any;
}

export interface Subject {
  subjectId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export type LevelDifficulty = "easy" | "medium" | "hard";

export interface Level {
  levelId: string;
  subjectId: string;
  levelNumber: number;
  name: string;
  description: string;
  unlockCostCoins: number | null;
  difficulty: LevelDifficulty;
  questionsRequired: number;
  durationMinutes: number | null;
  isInitialUnlocked: boolean;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SystemSettings {
  questionsPerTest: number;
  testDurationMinutes: number;
  coinsPerCorrectAnswer: number;
  coinsPenaltyOnAbandon: number;
  defaultLevelUnlockCost: number;
  weeklyRewardDefaultCoins: number;
  maxActiveSessionsPerUser: number;
  maintenanceMode: boolean;
  leaderboardWeights: {
    correctAnswersWeight: number;
    testsCompletedWeight: number;
    coinBalanceWeight: number;
  };
  updatedAt: any;
  updatedBy: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionStatus = "approved" | "pending" | "rejected";

export interface Question {
  questionId: string;
  subjectId: string;
  levelId: string;
  text: string;
  imageUrl: string | null;
  options: QuestionOption[];
  correctOptionId?: string;
  explanation?: string;
  difficulty: number;
  randomWeight?: number;
  status: QuestionStatus;
  createdBy?: string;
  approvedBy?: string | null;
  approvedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface SafeTestQuestion {
  questionId: string;
  text: string;
  imageUrl: string | null;
  options: QuestionOption[];
  difficulty: number;
}

export type TestSessionStatus = "in_progress" | "completed" | "abandoned" | "expired";

export interface TestSession {
  sessionId: string;
  userId: string;
  subjectId: string;
  levelId: string;
  questionIds: string[];
  answers: Record<string, string>;
  status: TestSessionStatus;
  startedAt: any;
  expiresAt: any;
  submittedAt: any | null;
  correctCount: number;
  score: number;
  earnedCoins: number;
  penaltyCoins: number;
  configSnapshot: {
    durationMinutes: number;
    coinsPerCorrectAnswer: number;
    penaltyCoins: number;
  };
  createdAt: any;
  updatedAt: any;
}

export interface QuestionReviewItem {
  questionId: string;
  text: string;
  imageUrl: string | null;
  options: QuestionOption[];
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
  difficulty: number;
}

export interface TestSubmitResult {
  sessionId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  earnedCoins: number;
  isCompleted: boolean;
  questionsReview: QuestionReviewItem[];
}

export type CoinTransactionType =
  | "test_reward"
  | "test_abandon_penalty"
  | "level_unlock"
  | "shop_purchase"
  | "weekly_reward"
  | "admin_adjustment"
  | "refund";

export interface CoinTransaction {
  transactionId: string;
  userId: string;
  amount: number;
  type: CoinTransactionType;
  reason: string;
  referenceId: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: any;
  createdBy: "system" | string;
  metadata?: Record<string, any>;
}

export type ProductCategory = "gift" | "discount_voucher" | "course_access" | "merch";

export interface Product {
  productId: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  priceCoins: number;
  discountPercent: number;
  discountStartAt: any | null;
  discountEndAt: any | null;
  stock: number;
  isActive: boolean;
  category: ProductCategory;
  createdAt: any;
  updatedAt: any;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  title: string;
  unitPriceCoins: number;
  quantity: number;
  totalCoins: number;
}

export interface OrderDeliveryInfo {
  fullName: string;
  phone: string;
  region: string;
  address: string;
  targetBranch: string | null;
  trackingCode: string | null;
}

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  subtotalCoins: number;
  discountCoins: number;
  totalCoins: number;
  status: OrderStatus;
  deliveryInfo: OrderDeliveryInfo;
  createdAt: any;
  updatedAt: any;
}

export type SubmissionStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface QuestionSubmission {
  submissionId: string;
  userId: string;
  subjectId: string;
  suggestedLevelNumber: number;
  text: string;
  imageUrl: string | null;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: number;
  status: SubmissionStatus;
  rejectionReason: string | null;
  adminReviewerUid: string | null;
  approvedQuestionId: string | null;
  createdAt: any;
  reviewedAt: any | null;
}

export type RewardType = "coins" | "real_gift" | "discount_voucher";
export type RewardStatus = "granted" | "claimed";

export interface WeeklyReward {
  rewardId: string;
  weekId: string;
  userId: string;
  reason: string;
  rewardType: RewardType;
  amount: number | null;
  giftTitle: string | null;
  status: RewardStatus;
  awardedAt: any;
  awardedBy: string;
}

export type ReviewTargetType = "platform" | "subject";
export type ReviewStatus = "approved" | "pending" | "hidden";

export interface Review {
  reviewId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: any;
  updatedAt: any;
}

export interface LeaderboardRankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  photoURL: string;
  score: number;
  coinBalance: number;
  testsCompleted: number;
}

export interface LeaderboardStats {
  boardType: string;
  lastCalculatedAt: any;
  rankings: LeaderboardRankingEntry[];
}

export type NotificationType =
  | "test_result"
  | "coin_received"
  | "order_status"
  | "question_status"
  | "weekly_reward"
  | "system";

export interface NotificationItem {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, any>;
  isRead: boolean;
  createdAt: any;
}

export type AuditAction =
  | "USER_BLOCK"
  | "USER_SUSPEND"
  | "USER_ACTIVATE"
  | "COIN_ADJUST"
  | "PRODUCT_MUTATE"
  | "QUESTION_APPROVE"
  | "QUESTION_REJECT"
  | "SETTINGS_CHANGE"
  | "REWARD_GRANT"
  | "ORDER_STATUS"
  | "ADMIN_ROLE_CHANGE";

export interface AuditLogItem {
  logId: string;
  adminUid: string;
  action: AuditAction;
  targetCollection: string;
  targetDocumentId: string;
  changes: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: any;
}
