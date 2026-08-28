import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { AdminCoinAdjustSchema } from "../schemas";
import { CoinTransactionDoc, UserDoc } from "../types";
import { createAuditLog } from "../utils/audit";
import { sendNotification } from "../utils/notifications";

export const adminCoinAdjust = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { userId, amount, reason } = validateInput(AdminCoinAdjustSchema, data);

  const userRef = db.collection("users").doc(userId);
  const txId = `tx_admin_adj_${Date.now()}_${userId}`;
  const txRef = db.collection("coin_transactions").doc(txId);

  let newBalance = 0;
  let currentBalance = 0;

  await db.runTransaction(async (t) => {
    const userSnap = await t.get(userRef);
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const userData = userSnap.data() as UserDoc;
    currentBalance = userData.coinBalance || 0;
    newBalance = Math.max(0, currentBalance + amount);
    const now = Timestamp.now();

    // 1. Update User Balance
    t.update(userRef, {
      coinBalance: newBalance,
      updatedAt: now,
    });

    // 2. Create Coin Transaction
    const coinTx: CoinTransactionDoc = {
      transactionId: txId,
      userId,
      amount,
      type: "admin_adjustment",
      reason: `Admin o'zgarishi: ${reason}`,
      referenceId: adminUser.uid,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: now,
      createdBy: adminUser.uid,
      metadata: {
        adminUid: adminUser.uid,
        adminDisplayName: adminUser.displayName,
        reason,
      },
    };
    t.set(txRef, coinTx);

    // 3. Create Audit Log
    await createAuditLog(t, {
      adminUid: adminUser.uid,
      action: "COIN_ADJUST",
      targetCollection: "users",
      targetDocumentId: userId,
      changes: {
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        adjustmentAmount: amount,
        reason,
      },
      ipAddress: context.rawRequest ? (context.rawRequest.headers["x-forwarded-for"] as string) : null,
      userAgent: context.rawRequest ? context.rawRequest.headers["user-agent"] : null,
    });

    // 4. Send Notification to User
    await sendNotification(t, {
      userId,
      title: amount > 0 ? "Tillo tangalari qo'shildi 💰" : "Tillo tangalari kamaytirildi 📉",
      body: `Administrator tomonidan balansingiz ${amount > 0 ? `+${amount}` : amount} Tilloga o'zgartirildi. Sabab: ${reason}`,
      type: "coin_received",
      data: {
        amount,
        reason,
      },
    });
  });

  return {
    success: true,
    userId,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    amount,
  };
});
