export type UserRole = "user" | "admin" | "student" | "teacher" | "director";
export type UserStatus = "active" | "blocked" | "suspended";

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  login?: string;
  age?: number;
  phoneNumber: string;
  educationPlace: string;
  isCenterStudent: boolean;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  coinBalance: number;
  totalCorrectAnswers: number;
  testsCompleted: number;
  // LMS Extended Profile Fields
  school?: string;
  grade?: string;
  groupIds?: string[];
  enrolledGroups?: EnrolledGroupInfo[];
  teachingGroups?: EnrolledGroupInfo[];
  subjectIds?: string[];
  teacherId?: string;
  specialty?: string;
  salaryType?: "fixed" | "percentage" | "mixed";
  salaryValue?: number;
  salaryFixedAmount?: number;
  enrollmentDate?: any;
  publishedLessons?: Lesson[];
  publishedHomeworks?: Homework[];
  submissions?: HomeworkSubmission[];
  studentSubmissions?: HomeworkSubmission[];
  createdAt: any;
  updatedAt: any;
  lastActiveAt: any;
}

export interface EnrolledGroupInfo {
  groupId: string;
  name: string;
  subjectId?: string;
  teacherId?: string;
  teacherName?: string;
  room?: string;
  schedule?: string;
  startTime?: string;
  endTime?: string;
  lessonDuration?: number;
  monthlyPrice?: number;
  enrolledAt?: any;
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
  teacherId?: string;
  teacherName?: string;
  monthlyPrice?: number;
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
  | "ADMIN_ROLE_CHANGE"
  | "STUDENT_ENROLL"
  | "GROUP_MUTATE"
  | "PAYMENT_RECORD"
  | "EXPENSE_RECORD"
  | "SALARY_PROCESS";

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

// ==========================================
// LMS & ERP EXTENSION TYPES (Farg'oniy Maktabi)
// ==========================================

export type GroupStatus = "active" | "archived" | "planned";

export interface Group {
  groupId: string;
  name: string;
  subjectId: string;
  teacherId: string;
  teacherName?: string;
  room: string;
  schedule: string; // e.g. "Dushanba, Chorshanba, Juma"
  startTime: string; // e.g. "14:00"
  endTime?: string; // e.g. "15:20"
  lessonDuration: number; // in minutes e.g. 80
  monthlyPrice?: number; // e.g. 500,000 UZS
  maxStudents: number;
  currentStudentsCount: number;
  studentIds: string[];
  status: GroupStatus;
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Course {
  courseId: string;
  title: string;
  subjectId: string;
  levelNumber?: number;
  description: string;
  isActive: boolean;
  order: number;
  createdAt: any;
  updatedAt: any;
}

export interface CourseModule {
  moduleId: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  createdAt: any;
}

export type LessonStatus = "draft" | "published" | "archived";

export interface LessonMaterial {
  id: string;
  title: string;
  type: "video" | "pdf" | "link" | "text";
  url?: string;
  content?: string;
}

export interface Lesson {
  lessonId: string;
  title: string;
  description: string;
  subjectId: string;
  groupId: string;
  teacherId: string;
  moduleId?: string;
  lessonNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  durationMinutes: number;
  videoUrl?: string | null;
  materialsText?: string | null;
  pdfUrl?: string | null;
  homeworkId?: string | null;
  testId?: string | null; // references levelId or specific test in existing test system
  status: LessonStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Homework {
  homeworkId: string;
  lessonId: string;
  groupId: string;
  teacherId: string;
  title: string;
  instructions: string;
  maxScore: number;
  deadline: string; // ISO string or date
  lessonTitle?: string;
  groupName?: string;
  attachments?: string[];
  createdAt: any;
  updatedAt: any;
}

export type HomeworkSubmissionStatus =
  | "ASSIGNED"
  | "SUBMITTED"
  | "REVIEWING"
  | "COMPLETED"
  | "LATE";

export interface HomeworkSubmission {
  submissionId: string;
  homeworkId: string;
  lessonId: string;
  studentId: string;
  studentName?: string;
  teacherId: string;
  textAnswer: string;
  fileUrls?: string[];
  status: HomeworkSubmissionStatus;
  score?: number | null;
  teacherComment?: string | null;
  submittedAt: any;
  reviewedAt?: any | null;
  updatedAt: any;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  attendanceId: string; // e.g. `${groupId}_${lessonId}_${date}`
  groupId: string;
  lessonId?: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // { studentId: status }
  createdAt: any;
  updatedAt: any;
}

export type TeacherQuestionStatus = "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";

export interface TeacherQuestion {
  questionId: string;
  studentId: string;
  studentName: string;
  studentPhoto?: string | null;
  teacherId: string;
  teacherName?: string;
  groupId?: string;
  groupName?: string;
  lessonId?: string;
  subjectId?: string;
  text: string;
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  status: TeacherQuestionStatus;
  answerText?: string | null;
  videoAnswerUrl?: string | null;
  createdAt: any;
  answeredAt?: any | null;
}

export type PaymentStatus = "PAID" | "PARTIAL" | "DEBT" | "CANCELLED";

export interface Payment {
  paymentId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName?: string;
  subjectId: string;
  amount: number;
  month: string; // e.g. "2026-09" or "Sentyabr 2026"
  paymentDate: string; // YYYY-MM-DD
  adminId: string;
  adminName?: string;
  status: PaymentStatus;
  note?: string;
  receiptNumber: string;
  createdAt: any;
  updatedAt: any;
}

export type ExpenseCategory =
  | "rent"
  | "salary"
  | "advertising"
  | "utilities"
  | "equipment"
  | "other";

export interface Expense {
  expenseId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  createdBy: string;
  createdByName?: string;
  createdAt: any;
}

export type SalaryType = "percentage" | "fixed" | "mixed";
export type SalaryStatus = "PENDING" | "APPROVED" | "PAID";

export interface TeacherSalary {
  salaryId: string;
  teacherId: string;
  teacherName: string;
  month: string; // e.g. "2026-09"
  salaryType: SalaryType;
  percentage?: number; // e.g. 40%
  fixedSalary?: number;
  bonus: number;
  deduction: number;
  collectedPayment: number; // total tuition fees collected from teacher's students
  calculatedSalary: number;
  paidSalary: number;
  remainingSalary: number;
  status: SalaryStatus;
  approvedBy?: string | null;
  approvedAt?: any | null;
  paidAt?: any | null;
  note?: string;
  updatedAt: any;
}

export type AdmissionStatus = "new" | "contacted" | "active" | "cancelled";

export interface AdmissionRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  parentPhone?: string;
  age?: number | string;
  birthDate?: string;
  interestedSubject?: string;
  subjectId?: string;
  preferredTime?: string;
  source?: string;
  notes?: string;
  status: AdmissionStatus;
  assignedStudentUid?: string;
  assignedGroupId?: string;
  assignedGroupName?: string;
  login?: string;
  plainPassword?: string;
  activatedAt?: any;
  activatedBy?: string;
  createdAt: any;
  updatedAt?: any;
}
