"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitReviewSchema = exports.UpdateOrderStatusSchema = exports.ProductMutationSchema = exports.SetAdminRoleSchema = exports.SetUserStatusSchema = exports.UpdateSystemSettingsSchema = exports.GrantWeeklyRewardSchema = exports.AdminCoinAdjustSchema = exports.RejectQuestionSubmissionSchema = exports.ApproveQuestionSubmissionSchema = exports.QuestionSubmissionSchema = exports.QuestionOptionSchema = exports.PurchaseProductSchema = exports.UnlockLevelSchema = exports.AbandonTestSchema = exports.SubmitTestSchema = exports.StartTestSchema = void 0;
const zod_1 = require("zod");
exports.StartTestSchema = zod_1.z.object({
    subjectId: zod_1.z.string().min(1, "Subject ID kiritilishi shart"),
    levelId: zod_1.z.string().min(1, "Level ID kiritilishi shart"),
});
exports.SubmitTestSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID kiritilishi shart"),
    answers: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).default({}),
});
exports.AbandonTestSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1, "Session ID kiritilishi shart"),
});
exports.UnlockLevelSchema = zod_1.z.object({
    subjectId: zod_1.z.string().min(1, "Subject ID kiritilishi shart"),
    levelId: zod_1.z.string().min(1, "Level ID kiritilishi shart"),
});
exports.PurchaseProductSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, "Product ID kiritilishi shart"),
    quantity: zod_1.z.number().int().min(1, "Minimal miqdor 1 ta").max(10, "Maksimal miqdor 10 ta"),
    deliveryInfo: zod_1.z.object({
        fullName: zod_1.z.string().min(3, "Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak"),
        phone: zod_1.z.string().min(7, "Telefon raqam to'g'ri kiritilishi kerak"),
        region: zod_1.z.string().min(2, "Viloyat/shahar kiritilishi kerak"),
        address: zod_1.z.string().min(5, "Manzil to'liq kiritilishi kerak"),
        targetBranch: zod_1.z.string().nullable().optional().default(null),
        trackingCode: zod_1.z.string().nullable().optional().default(null),
    }),
    idempotencyKey: zod_1.z.string().min(8, "Idempotency key talab qilinadi"),
});
exports.QuestionOptionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    text: zod_1.z.string().min(1, "Variant matni bo'sh bo'lishi mumkin emas"),
});
exports.QuestionSubmissionSchema = zod_1.z.object({
    subjectId: zod_1.z.string().min(1, "Fan tanlanishi shart"),
    suggestedLevelNumber: zod_1.z.number().int().min(1, "Daraja raqami kamida 1 bo'lishi kerak"),
    text: zod_1.z.string().min(10, "Savol matni kamida 10 ta belgidan iborat bo'lishi kerak"),
    imageUrl: zod_1.z.string().url().nullable().optional().default(null),
    options: zod_1.z.array(exports.QuestionOptionSchema).length(4, "Aynan 4 ta javob varianti kiritilishi shart"),
    correctOptionId: zod_1.z.string().min(1, "To'g'ri javob belgilanmagan"),
    explanation: zod_1.z.string().min(5, "Tushuntirish kamida 5 ta belgidan iborat bo'lishi kerak"),
    difficulty: zod_1.z.number().int().min(1).max(5).default(2),
}).refine((data) => data.options.some((opt) => opt.id === data.correctOptionId), {
    message: "To'g'ri javob kiritilgan 4 ta variantdan biri bo'lishi kerak",
    path: ["correctOptionId"],
});
exports.ApproveQuestionSubmissionSchema = zod_1.z.object({
    submissionId: zod_1.z.string().min(1, "Submission ID talab qilinadi"),
    rewardCoins: zod_1.z.number().int().min(0).max(500).default(20),
});
exports.RejectQuestionSubmissionSchema = zod_1.z.object({
    submissionId: zod_1.z.string().min(1, "Submission ID talab qilinadi"),
    rejectionReason: zod_1.z.string().min(3, "Rad etish sababi ko'rsatilishi kerak"),
});
exports.AdminCoinAdjustSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID talab qilinadi"),
    amount: zod_1.z.number().int().refine((val) => val !== 0, "Qiymat 0 bo'lishi mumkin emas"),
    reason: zod_1.z.string().min(3, "Tahrirlash sababi ko'rsatilishi shart"),
});
exports.GrantWeeklyRewardSchema = zod_1.z.object({
    weekId: zod_1.z.string().regex(/^\d{4}-W\d{1,2}$/, "Format: YYYY-WW (masalan, 2026-W35)"),
    userId: zod_1.z.string().min(1, "User ID talab qilinadi"),
    rewardType: zod_1.z.enum(["coins", "real_gift", "discount_voucher"]),
    amount: zod_1.z.number().int().min(1).nullable().optional(),
    giftTitle: zod_1.z.string().nullable().optional(),
    reason: zod_1.z.string().min(3, "Mukofot sababi ko'rsatilishi kerak"),
});
exports.UpdateSystemSettingsSchema = zod_1.z.object({
    questionsPerTest: zod_1.z.number().int().min(5).max(100),
    testDurationMinutes: zod_1.z.number().int().min(5).max(180),
    coinsPerCorrectAnswer: zod_1.z.number().int().min(0).max(100),
    coinsPenaltyOnAbandon: zod_1.z.number().int().min(0).max(100),
    defaultLevelUnlockCost: zod_1.z.number().int().min(0).max(1000),
    weeklyRewardDefaultCoins: zod_1.z.number().int().min(0).max(10000),
    maxActiveSessionsPerUser: zod_1.z.number().int().min(1).max(5),
    maintenanceMode: zod_1.z.boolean(),
    leaderboardWeights: zod_1.z.object({
        correctAnswersWeight: zod_1.z.number().min(0).max(100),
        testsCompletedWeight: zod_1.z.number().min(0).max(100),
        coinBalanceWeight: zod_1.z.number().min(0).max(100),
    }),
});
exports.SetUserStatusSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID talab qilinadi"),
    status: zod_1.z.enum(["active", "suspended", "blocked"]),
    reason: zod_1.z.string().min(3, "Sabab kiritilishi shart"),
});
exports.SetAdminRoleSchema = zod_1.z.object({
    targetEmailOrUid: zod_1.z.string().min(3, "Email yoki UID talab qilinadi"),
    isAdmin: zod_1.z.boolean(),
});
exports.ProductMutationSchema = zod_1.z.object({
    productId: zod_1.z.string().optional(),
    title: zod_1.z.string().min(3, "Sarlavha kamida 3 belgidan iborat bo'lishi kerak"),
    slug: zod_1.z.string().min(2, "Slug kiritilishi kerak"),
    description: zod_1.z.string().min(5, "Tavsif kamida 5 ta belgi bo'lishi kerak"),
    images: zod_1.z.array(zod_1.z.string().url()).min(1, "Kamida bitta rasm URL kiritilishi kerak"),
    priceCoins: zod_1.z.number().int().min(0, "Narx 0 yoki undan katta bo'lishi kerak"),
    discountPercent: zod_1.z.number().int().min(0).max(100).default(0),
    discountStartAt: zod_1.z.string().nullable().optional(),
    discountEndAt: zod_1.z.string().nullable().optional(),
    stock: zod_1.z.number().int().min(0, "Zaxira 0 dan kam bo'lmasligi kerak"),
    isActive: zod_1.z.boolean().default(true),
    category: zod_1.z.enum(["gift", "discount_voucher", "course_access", "merch"]),
});
exports.UpdateOrderStatusSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, "Order ID kiritilishi shart"),
    status: zod_1.z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
    trackingCode: zod_1.z.string().nullable().optional(),
    reason: zod_1.z.string().optional(),
});
exports.SubmitReviewSchema = zod_1.z.object({
    targetType: zod_1.z.enum(["platform", "subject"]),
    targetId: zod_1.z.string().min(1, "Target ID kiritilishi kerak"),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(5, "Fikr kamida 5 ta belgidan iborat bo'lishi kerak").max(500),
});
//# sourceMappingURL=index.js.map