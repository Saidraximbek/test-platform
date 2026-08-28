import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { ApproveQuestionSubmissionSchema, RejectQuestionSubmissionSchema } from "../schemas";
import { CoinTransactionDoc, LevelDoc, QuestionDoc, QuestionSubmissionDoc, UserDoc } from "../types";
import { createAuditLog } from "../utils/audit";
import { sendNotification } from "../utils/notifications";

export const approveQuestionSubmission = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { submissionId, rewardCoins: inputRewardCoins } = validateInput(ApproveQuestionSubmissionSchema, data);
  const rewardCoins = inputRewardCoins ?? 20;

  const subRef = db.collection("question_submissions").doc(submissionId);
  const subSnap = await subRef.get();

  if (!subSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Taklif qilingan savol topilmadi");
  }

  const submission = subSnap.data() as QuestionSubmissionDoc;

  if (submission.status === "approved") {
    throw new functions.https.HttpsError("already-exists", "Ushbu savol allaqachon tasdiqlangan");
  }

  // Find level by subjectId & suggestedLevelNumber
  let targetLevelId = "";
  const levelsSnap = await db
    .collection("levels")
    .where("subjectId", "==", submission.subjectId)
    .where("levelNumber", "==", submission.suggestedLevelNumber)
    .limit(1)
    .get();

  if (!levelsSnap.empty) {
    targetLevelId = levelsSnap.docs[0].id;
  } else {
    // Look for any level of this subject or fallback to level 1
    const anyLevelSnap = await db
      .collection("levels")
      .where("subjectId", "==", submission.subjectId)
      .limit(1)
      .get();

    if (!anyLevelSnap.empty) {
      targetLevelId = anyLevelSnap.docs[0].id;
    } else {
      // Create a default level 1 for this subject if none exists
      const newLevelRef = db.collection("levels").doc();
      targetLevelId = newLevelRef.id;
      const defaultLevel: LevelDoc = {
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await newLevelRef.set(defaultLevel);
    }
  }

  const newQuestionRef = db.collection("questions").doc();
  const newQuestionId = newQuestionRef.id;
  const authorRef = db.collection("users").doc(submission.userId);
  const txId = `tx_submission_reward_${submissionId}`;
  const txRef = db.collection("coin_transactions").doc(txId);

  await db.runTransaction(async (t) => {
    const authorSnap = await t.get(authorRef);
    const authorData = authorSnap.exists ? (authorSnap.data() as UserDoc) : null;
    const currentBalance = authorData?.coinBalance || 0;
    const newBalance = currentBalance + rewardCoins;
    const now = Timestamp.now();

    // 1. Create Question
    const questionData: QuestionDoc = {
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

      const coinTx: CoinTransactionDoc = {
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
    await createAuditLog(t, {
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
    await sendNotification(t, {
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

export const rejectQuestionSubmission = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { submissionId, rejectionReason } = validateInput(RejectQuestionSubmissionSchema, data);

  const subRef = db.collection("question_submissions").doc(submissionId);
  const subSnap = await subRef.get();

  if (!subSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Taklif qilingan savol topilmadi");
  }

  const now = Timestamp.now();
  const submission = subSnap.data() as QuestionSubmissionDoc;

  await db.runTransaction(async (t) => {
    t.update(subRef, {
      status: "rejected",
      rejectionReason,
      adminReviewerUid: adminUser.uid,
      reviewedAt: now,
    });

    await createAuditLog(t, {
      adminUid: adminUser.uid,
      action: "QUESTION_REJECT",
      targetCollection: "question_submissions",
      targetDocumentId: submissionId,
      changes: {
        rejectionReason,
      },
    });

    await sendNotification(t, {
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
