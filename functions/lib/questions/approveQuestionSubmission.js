"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectQuestionSubmission = exports.approveQuestionSubmission = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
const notifications_1 = require("../utils/notifications");
exports.approveQuestionSubmission = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { submissionId, rewardCoins: inputRewardCoins } = (0, auth_1.validateInput)(schemas_1.ApproveQuestionSubmissionSchema, data);
    const rewardCoins = inputRewardCoins ?? 20;
    const subRef = firebase_1.db.collection("question_submissions").doc(submissionId);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Taklif qilingan savol topilmadi");
    }
    const submission = subSnap.data();
    if (submission.status === "approved") {
        throw new functions.https.HttpsError("already-exists", "Ushbu savol allaqachon tasdiqlangan");
    }
    // Find level by subjectId & suggestedLevelNumber
    let targetLevelId = "";
    const levelsSnap = await firebase_1.db
        .collection("levels")
        .where("subjectId", "==", submission.subjectId)
        .where("levelNumber", "==", submission.suggestedLevelNumber)
        .limit(1)
        .get();
    if (!levelsSnap.empty) {
        targetLevelId = levelsSnap.docs[0].id;
    }
    else {
        // Look for any level of this subject or fallback to level 1
        const anyLevelSnap = await firebase_1.db
            .collection("levels")
            .where("subjectId", "==", submission.subjectId)
            .limit(1)
            .get();
        if (!anyLevelSnap.empty) {
            targetLevelId = anyLevelSnap.docs[0].id;
        }
        else {
            // Create a default level 1 for this subject if none exists
            const newLevelRef = firebase_1.db.collection("levels").doc();
            targetLevelId = newLevelRef.id;
            const defaultLevel = {
                levelId: targetLevelId,
                subjectId: submission.subjectId,
                levelNumber: submission.suggestedLevelNumber || 1,
                name: `Daraja ${submission.suggestedLevelNumber || 1}`,
                description: "Boshlang'ich daraja",
                unlockCostCoins: 0,
                difficulty: "medium",
                questionsRequired: 20,
                durationMinutes: 40,
                isInitialUnlocked: true,
                isActive: true,
                createdAt: firebase_1.Timestamp.now(),
                updatedAt: firebase_1.Timestamp.now(),
            };
            await newLevelRef.set(defaultLevel);
        }
    }
    const newQuestionRef = firebase_1.db.collection("questions").doc();
    const newQuestionId = newQuestionRef.id;
    const authorRef = firebase_1.db.collection("users").doc(submission.userId);
    const txId = `tx_submission_reward_${submissionId}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    await firebase_1.db.runTransaction(async (t) => {
        const authorSnap = await t.get(authorRef);
        const authorData = authorSnap.exists ? authorSnap.data() : null;
        const currentBalance = authorData?.coinBalance || 0;
        const newBalance = currentBalance + rewardCoins;
        const now = firebase_1.Timestamp.now();
        // 1. Create Question
        const questionData = {
            questionId: newQuestionId,
            subjectId: submission.subjectId,
            levelId: targetLevelId,
            text: submission.text,
            imageUrl: submission.imageUrl,
            options: submission.options,
            correctOptionId: submission.correctOptionId,
            explanation: submission.explanation,
            difficulty: submission.difficulty,
            randomWeight: Math.random(),
            status: "approved",
            createdBy: submission.userId,
            approvedBy: adminUser.uid,
            approvedAt: now,
            createdAt: now,
            updatedAt: now,
        };
        t.set(newQuestionRef, questionData);
        // 2. Update Submission
        t.update(subRef, {
            status: "approved",
            approvedQuestionId: newQuestionId,
            adminReviewerUid: adminUser.uid,
            reviewedAt: now,
        });
        // 3. Reward Author
        if (authorSnap.exists && rewardCoins > 0) {
            t.update(authorRef, {
                coinBalance: newBalance,
                updatedAt: now,
            });
            const coinTx = {
                transactionId: txId,
                userId: submission.userId,
                amount: rewardCoins,
                type: "weekly_reward",
                reason: "Foydalanuvchi tomonidan yuborilgan savol tasdiqlandi va mukofotlandi",
                referenceId: submissionId,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                createdAt: now,
                createdBy: adminUser.uid,
                metadata: {
                    submissionId,
                    approvedQuestionId: newQuestionId,
                    rewardCoins,
                },
            };
            t.set(txRef, coinTx);
        }
        // 4. Audit Log
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: "QUESTION_APPROVE",
            targetCollection: "question_submissions",
            targetDocumentId: submissionId,
            changes: {
                newQuestionId,
                rewardCoins,
                subjectId: submission.subjectId,
            },
        });
        // 5. Notification to Author
        await (0, notifications_1.sendNotification)(t, {
            userId: submission.userId,
            title: "Savolingiz tasdiqlandi! 🌟",
            body: `Siz yuborgan savol moderatorlar tomonidan tasdiqlandi va bazaga qo'shildi. Sizga +${rewardCoins} Tillo tanga berildi!`,
            type: "question_status",
            data: {
                submissionId,
                newQuestionId,
                rewardCoins,
            },
        });
    });
    return {
        success: true,
        questionId: newQuestionId,
    };
});
exports.rejectQuestionSubmission = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { submissionId, rejectionReason } = (0, auth_1.validateInput)(schemas_1.RejectQuestionSubmissionSchema, data);
    const subRef = firebase_1.db.collection("question_submissions").doc(submissionId);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Taklif qilingan savol topilmadi");
    }
    const now = firebase_1.Timestamp.now();
    const submission = subSnap.data();
    await firebase_1.db.runTransaction(async (t) => {
        t.update(subRef, {
            status: "rejected",
            rejectionReason,
            adminReviewerUid: adminUser.uid,
            reviewedAt: now,
        });
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: "QUESTION_REJECT",
            targetCollection: "question_submissions",
            targetDocumentId: submissionId,
            changes: {
                rejectionReason,
            },
        });
        await (0, notifications_1.sendNotification)(t, {
            userId: submission.userId,
            title: "Savol rad etildi",
            body: `Siz yuborgan savol tekshiruvdan o'tmadi. Sabab: ${rejectionReason}`,
            type: "question_status",
            data: {
                submissionId,
                rejectionReason,
            },
        });
    });
    return {
        success: true,
        submissionId,
    };
});
//# sourceMappingURL=approveQuestionSubmission.js.map