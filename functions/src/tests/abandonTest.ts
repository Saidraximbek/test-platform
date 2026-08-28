import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAuth, validateInput } from "../middleware/auth";
import { AbandonTestSchema } from "../schemas";
import { CoinTransactionDoc, TestSessionDoc, UserDoc } from "../types";
import { sendNotification } from "../utils/notifications";

export const abandonTest = functions.https.onCall(async (data, context) => {
  requireAuth(context);
  const { sessionId } = validateInput(AbandonTestSchema, data);
  const userId = context.auth.uid;

  const sessionRef = db.collection("test_sessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();

  if (!sessionSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Test sessiyasi topilmadi");
  }

  const session = sessionSnap.data() as TestSessionDoc;

  if (session.userId !== userId) {
    throw new functions.https.HttpsError("permission-denied", "Ushbu test sizga tegishli emas");
  }

  if (session.status !== "in_progress") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Ushbu test ayni paytda faol emas (${session.status})`
    );
  }

  const penaltyCoins = session.configSnapshot.penaltyCoins || 5;
  const txId = `tx_abandon_${sessionId}`;
  const txRef = db.collection("coin_transactions").doc(txId);
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (t) => {
    const userDocSnap = await t.get(userRef);
    if (!userDocSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const userData = userDocSnap.data() as UserDoc;

    const txSnap = await t.get(txRef);
    if (txSnap.exists) {
      return;
    }

    const currentBalance = userData.coinBalance || 0;
    const actualDeduction = Math.min(currentBalance, penaltyCoins);
    const newBalance = Math.max(0, currentBalance - penaltyCoins);
    const now = Timestamp.now();

    // 1. Update Session status
    t.update(sessionRef, {
      status: "abandoned",
      penaltyCoins,
      updatedAt: now,
    });

    // 2. Deduct coins from user
    t.update(userRef, {
      coinBalance: newBalance,
      updatedAt: now,
    });

    // 3. Create Coin Transaction
    if (penaltyCoins > 0) {
      const coinTx: CoinTransactionDoc = {
        transactionId: txId,
        userId,
        amount: -actualDeduction,
        type: "test_abandon_penalty",
        reason: "Testni o'rtasida tark etish jarimasi",
        referenceId: sessionId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        createdAt: now,
        createdBy: "system",
        metadata: {
          sessionId,
          penaltyConfigured: penaltyCoins,
        },
      };
      t.set(txRef, coinTx);
    }

    // 4. Send Notification
    await sendNotification(t, {
      userId,
      title: "Test tark etildi",
      body: `Testni yakunlamasdan tark etganingiz sababli ${actualDeduction} Tillo jarima sifatida ushlab qolindi.`,
      type: "coin_received",
      data: {
        sessionId,
        penaltyCoins: actualDeduction,
      },
    });
  });

  return {
    success: true,
    sessionId,
    penaltyCoins,
  };
});
