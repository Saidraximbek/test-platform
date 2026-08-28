import { z } from "zod";

export const StartTestSchema = z.object({
  subjectId: z.string().min(1, "Subject ID kiritilishi shart"),
  levelId: z.string().min(1, "Level ID kiritilishi shart"),
});

export const SubmitTestSchema = z.object({
  sessionId: z.string().min(1, "Session ID kiritilishi shart"),
  answers: z.record(z.string(), z.string()).default({}),
});

export const AbandonTestSchema = z.object({
  sessionId: z.string().min(1, "Session ID kiritilishi shart"),
});

export const UnlockLevelSchema = z.object({
  subjectId: z.string().min(1, "Subject ID kiritilishi shart"),
  levelId: z.string().min(1, "Level ID kiritilishi shart"),
});

export const PurchaseProductSchema = z.object({
  productId: z.string().min(1, "Product ID kiritilishi shart"),
  quantity: z.number().int().min(1, "Minimal miqdor 1 ta").max(10, "Maksimal miqdor 10 ta"),
  deliveryInfo: z.object({
    fullName: z.string().min(3, "Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak"),
    phone: z.string().min(7, "Telefon raqam to'g'ri kiritilishi kerak"),
    region: z.string().min(2, "Viloyat/shahar kiritilishi kerak"),
    address: z.string().min(5, "Manzil to'liq kiritilishi kerak"),
    targetBranch: z.string().nullable().optional().default(null),
    trackingCode: z.string().nullable().optional().default(null),
  }),
  idempotencyKey: z.string().min(8, "Idempotency key talab qilinadi"),
});

export const QuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Variant matni bo'sh bo'lishi mumkin emas"),
});

export const QuestionSubmissionSchema = z.object({
  subjectId: z.string().min(1, "Fan tanlanishi shart"),
  suggestedLevelNumber: z.number().int().min(1, "Daraja raqami kamida 1 bo'lishi kerak"),
  text: z.string().min(10, "Savol matni kamida 10 ta belgidan iborat bo'lishi kerak"),
  imageUrl: z.string().url().nullable().optional().default(null),
  options: z.array(QuestionOptionSchema).length(4, "Aynan 4 ta javob varianti kiritilishi shart"),
  correctOptionId: z.string().min(1, "To'g'ri javob belgilanmagan"),
  explanation: z.string().min(5, "Tushuntirish kamida 5 ta belgidan iborat bo'lishi kerak"),
  difficulty: z.number().int().min(1).max(5).default(2),
}).refine((data) => data.options.some((opt) => opt.id === data.correctOptionId), {
  message: "To'g'ri javob kiritilgan 4 ta variantdan biri bo'lishi kerak",
  path: ["correctOptionId"],
});

export const ApproveQuestionSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID talab qilinadi"),
  rewardCoins: z.number().int().min(0).max(500).default(20),
});

export const RejectQuestionSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID talab qilinadi"),
  rejectionReason: z.string().min(3, "Rad etish sababi ko'rsatilishi kerak"),
});

export const AdminCoinAdjustSchema = z.object({
  userId: z.string().min(1, "User ID talab qilinadi"),
  amount: z.number().int().refine((val) => val !== 0, "Qiymat 0 bo'lishi mumkin emas"),
  reason: z.string().min(3, "Tahrirlash sababi ko'rsatilishi shart"),
});

export const GrantWeeklyRewardSchema = z.object({
  weekId: z.string().regex(/^\d{4}-W\d{1,2}$/, "Format: YYYY-WW (masalan, 2026-W35)"),
  userId: z.string().min(1, "User ID talab qilinadi"),
  rewardType: z.enum(["coins", "real_gift", "discount_voucher"]),
  amount: z.number().int().min(1).nullable().optional(),
  giftTitle: z.string().nullable().optional(),
  reason: z.string().min(3, "Mukofot sababi ko'rsatilishi kerak"),
});

export const UpdateSystemSettingsSchema = z.object({
  questionsPerTest: z.number().int().min(5).max(100),
  testDurationMinutes: z.number().int().min(5).max(180),
  coinsPerCorrectAnswer: z.number().int().min(0).max(100),
  coinsPenaltyOnAbandon: z.number().int().min(0).max(100),
  defaultLevelUnlockCost: z.number().int().min(0).max(1000),
  weeklyRewardDefaultCoins: z.number().int().min(0).max(10000),
  maxActiveSessionsPerUser: z.number().int().min(1).max(5),
  maintenanceMode: z.boolean(),
  leaderboardWeights: z.object({
    correctAnswersWeight: z.number().min(0).max(100),
    testsCompletedWeight: z.number().min(0).max(100),
    coinBalanceWeight: z.number().min(0).max(100),
  }),
});

export const SetUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID talab qilinadi"),
  status: z.enum(["active", "suspended", "blocked"]),
  reason: z.string().min(3, "Sabab kiritilishi shart"),
});

export const SetAdminRoleSchema = z.object({
  targetEmailOrUid: z.string().min(3, "Email yoki UID talab qilinadi"),
  isAdmin: z.boolean(),
});

export const ProductMutationSchema = z.object({
  productId: z.string().optional(),
  title: z.string().min(3, "Sarlavha kamida 3 belgidan iborat bo'lishi kerak"),
  slug: z.string().min(2, "Slug kiritilishi kerak"),
  description: z.string().min(5, "Tavsif kamida 5 ta belgi bo'lishi kerak"),
  images: z.array(z.string().url()).min(1, "Kamida bitta rasm URL kiritilishi kerak"),
  priceCoins: z.number().int().min(0, "Narx 0 yoki undan katta bo'lishi kerak"),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountStartAt: z.string().nullable().optional(),
  discountEndAt: z.string().nullable().optional(),
  stock: z.number().int().min(0, "Zaxira 0 dan kam bo'lmasligi kerak"),
  isActive: z.boolean().default(true),
  category: z.enum(["gift", "discount_voucher", "course_access", "merch"]),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID kiritilishi shart"),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  trackingCode: z.string().nullable().optional(),
  reason: z.string().optional(),
});

export const SubmitReviewSchema = z.object({
  targetType: z.enum(["platform", "subject"]),
  targetId: z.string().min(1, "Target ID kiritilishi kerak"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, "Fikr kamida 5 ta belgidan iborat bo'lishi kerak").max(500),
});
