import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireActiveUser, validateInput } from "../middleware/auth";
import { UnlockLevelSchema } from "../schemas";
import { CoinTransactionDoc, LevelDoc, SystemSettingsDoc, UserDoc, UserProgressDoc } from "../types";
import { sendNotification } from "../utils/notifications";

export const unlockLevel = functions.https.onCall(async (data, context) => {
  const user = await requireActiveUser(context);
  const { subjectId, levelId } = validateInput(UnlockLevelSchema, data);
  const userId = user.uid;

  // 1. Read level
  const levelRef = db.collection("levels").doc(levelId);
  const levelSnap = await levelRef.get();

  if (!levelSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Daraja topilmadi");
  }

  const level = levelSnap.data() as LevelDoc;
  if (!level.isActive && user.role !== "admin") {
    throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja ayni paytda faol emas");
  }

  // 2. Read global config for fallback cost
  const configSnap = await db.collection("system_settings").doc("global_config").get();
  const defaultCost = configSnap.exists
    ? (configSnap.data() as SystemSettingsDoc).defaultLevelUnlockCost || 50
    : 50;

  const unlockCost = level.unlockCostCoins !== null && level.unlockCostCoins !== undefined
    ? level.unlockCostCoins
    : defaultCost;

  const progressId = `${userId}_${levelId}`;
  const progressRef = db.collection("user_progress").doc(progressId);
  const userRef = db.collection("users").doc(userId);
  const txId = `tx_unlock_${userId}_${levelId}`;
  const txRef = db.collection("coin_transactions").doc(txId);

  let newBalance = 0;

  await db.runTransaction(async (t) => {
    const userDocSnap = await t.get(userRef);
    if (!userDocSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const userData = userDocSnap.data() as UserDoc;

    const progressDocSnap = await t.get(progressRef);
    if (progressDocSnap.exists) {
      const prog = progressDocSnap.data() as UserProgressDoc;
      if (prog.isUnlocked) {
        throw new functions.https.HttpsError("already-exists", "Ushbu daraja allaqachon ochilgan");
      }
    }

    if (userData.coinBalance < unlockCost) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Yetarli mablag' mavjud emas. Darajani ochish uchun ${unlockCost} Tillo kerak, balansingizda esa ${userData.coinBalance} Tillo bor.`
      );
    }

    const txSnap = await t.get(txRef);
    if (txSnap.exists) {
      return; // Already unlocked
    }

    const currentBalance = userData.coinBalance;
    newBalance = currentBalance - unlockCost;
    const now = Timestamp.now();

    // 1. Deduct balance
    t.update(userRef, {
      coinBalance: newBalance,
      updatedAt: now,
    });

    // 2. Unlock progress
    if (progressDocSnap.exists) {
      t.update(progressRef, {
        isUnlocked: true,
        unlockedAt: now,
      });
    } else {
      const newProgress: UserProgressDoc = {
        progressId,
        userId,
        subjectId,
        levelId,
        isUnlocked: true,
        isCompleted: false,
        bestScore: 0,
        attempts: 0,
        correctAnswersTotal: 0,
        unlockedAt: now,
        lastAttemptAt: null,
      };
      t.set(progressRef, newProgress);
    }

    // 3. Create Transaction
    const coinTx: CoinTransactionDoc = {
      transactionId: txId,
      userId,
      amount: -unlockCost,
      type: "level_unlock",
      reason: `${level.name || `Daraja #${level.levelNumber}`} muvaffaqiyatli ochildi`,
      referenceId: levelId,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: now,
      createdBy: "system",
      metadata: {
        subjectId,
        levelId,
        levelNumber: level.levelNumber,
        unlockCost,
      },
    };
    t.set(txRef, coinTx);

    // 4. Send Notification
    await sendNotification(t, {
      userId,
      title: "Yangi daraja ochildi! 🔓",
      body: `Tabriklaymiz, siz "${level.name}" darajasini ochdingiz. Endi ushbu darajadagi testlarni ishlashingiz mumkin.`,
      type: "coin_received",
      data: {
        levelId,
        subjectId,
        unlockCost,
      },
    });
  });

  return {
    success: true,
    progressId,
    levelId,
    unlockCost,
    remainingBalance: newBalance,
  };
});
