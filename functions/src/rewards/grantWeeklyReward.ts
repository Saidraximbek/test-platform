import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { GrantWeeklyRewardSchema } from "../schemas";
import { CoinTransactionDoc, UserDoc, WeeklyRewardDoc } from "../types";
import { createAuditLog } from "../utils/audit";
import { sendNotification } from "../utils/notifications";

export const grantWeeklyReward = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { weekId, userId, rewardType, amount, giftTitle, reason } = validateInput(
    GrantWeeklyRewardSchema,
    data
  );

  const rewardId = `reward_${weekId}_${userId}`;
  const rewardRef = db.collection("weekly_rewards").doc(rewardId);
  const userRef = db.collection("users").doc(userId);
  const txId = `tx_reward_${weekId}_${userId}`;
  const txRef = db.collection("coin_transactions").doc(txId);

  await db.runTransaction(async (t) => {
    const rewardSnap = await t.get(rewardRef);
    if (rewardSnap.exists) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Ushbu foydalanuvchiga mazkur hafta uchun allaqachon mukofot berilgan"
      );
    }

    const userSnap = await t.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const userData = userSnap.data() as UserDoc;
    const now = Timestamp.now();

    // 1. Create Weekly Reward doc
    const rewardDoc: WeeklyRewardDoc = {
      rewardId,
      weekId,
      userId,
      reason,
      rewardType,
      amount: amount || null,
      giftTitle: giftTitle || null,
      status: "granted",
      awardedAt: now,
      awardedBy: adminUser.uid,
    };
    t.set(rewardRef, rewardDoc);

    // 2. If coin reward, update user balance and create coin transaction
    if (rewardType === "coins" && amount && amount > 0) {
      const currentBalance = userData.coinBalance || 0;
      const newBalance = currentBalance + amount;

      t.update(userRef, {
        coinBalance: newBalance,
        updatedAt: now,
      });

      const coinTx: CoinTransactionDoc = {
        transactionId: txId,
        userId,
        amount,
        type: "weekly_reward",
        reason: `Haftalik mukofot (${weekId}): ${reason}`,
        referenceId: rewardId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        createdAt: now,
        createdBy: adminUser.uid,
        metadata: {
          weekId,
          rewardType,
        },
      };
      t.set(txRef, coinTx);
    }

    // 3. Create Audit Log
    await createAuditLog(t, {
      adminUid: adminUser.uid,
      action: "REWARD_GRANT",
      targetCollection: "weekly_rewards",
      targetDocumentId: rewardId,
      changes: {
        weekId,
        userId,
        rewardType,
        amount,
        giftTitle,
        reason,
      },
    });

    // 4. Send Notification
    await sendNotification(t, {
      userId,
      title: "Haftalik mukofot berildi! 🏆",
      body: `Tabriklaymiz! Sizga haftalik faolligingiz uchun mukofot berildi: ${
        rewardType === "coins" ? `${amount} Tillo tanga` : giftTitle || reason
      }`,
      type: "weekly_reward",
      data: {
        rewardId,
        weekId,
        rewardType,
      },
    });
  });

  return {
    success: true,
    rewardId,
  };
});
