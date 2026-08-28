import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, functions, auth } from "../lib/firebase";
import { CoinTransaction, Level, UserProfile } from "../types";

export const coinService = {
  async unlockLevel(subjectId: string, levelId: string) {
    try {
      const fn = httpsCallable<{ subjectId: string; levelId: string }, { success: boolean; remainingBalance: number }>(
        functions,
        "unlockLevel"
      );
      const res = await fn({ subjectId, levelId });
      return res.data;
    } catch (fnErr) {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Foydalanuvchi tizimga kirmagan");

      // 1. Fetch user
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Foydalanuvchi topilmadi");
      const userData = userSnap.data() as UserProfile;

      // 2. Fetch level
      const lvlSnap = await getDoc(doc(db, "levels", levelId));
      if (!lvlSnap.exists()) throw new Error("Daraja topilmadi");
      const level = lvlSnap.data() as Level;

      const unlockCost = level.unlockCostCoins !== null && level.unlockCostCoins !== undefined ? level.unlockCostCoins : 50;

      if ((userData.coinBalance || 0) < unlockCost) {
        throw new Error(`Ushbu darajani ochish uchun kamida ${unlockCost} Tillo tangasi kerak`);
      }

      // Deduct coins
      await updateDoc(userRef, {
        coinBalance: increment(-unlockCost),
        updatedAt: serverTimestamp(),
      });

      // Unlock Progress
      const progressId = `${currentUser.uid}_${levelId}`;
      const progRef = doc(db, "user_progress", progressId);
      await setDoc(
        progRef,
        {
          progressId,
          userId: currentUser.uid,
          subjectId,
          levelId,
          isUnlocked: true,
          isCompleted: false,
          bestScorePercent: 0,
          attempts: 0,
          correctAnswersTotal: 0,
          unlockedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Create transaction
      const txId = `tx_unlock_${currentUser.uid}_${levelId}`;
      await setDoc(doc(db, "coin_transactions", txId), {
        transactionId: txId,
        userId: currentUser.uid,
        amount: -unlockCost,
        type: "level_unlock",
        description: `${level.name || "Daraja"} ochildi`,
        metadata: { subjectId, levelId },
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        remainingBalance: (userData.coinBalance || 0) - unlockCost,
      };
    }
  },

  async getUserTransactions(userId: string, limitCount = 30): Promise<CoinTransaction[]> {
    const q = query(
      collection(db, "coin_transactions"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as CoinTransaction);
    return list
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, limitCount);
  },

  async adminCoinAdjust(userId: string, amount: number, reason: string) {
    try {
      const fn = httpsCallable<{ userId: string; amount: number; reason: string }, { success: boolean; balanceAfter: number }>(
        functions,
        "adminCoinAdjust"
      );
      const res = await fn({ userId, amount, reason });
      return res.data;
    } catch (fnErr) {
      console.warn("Cloud function adminCoinAdjust unavailable, using direct update:", fnErr);

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Foydalanuvchi topilmadi");
      const prevBal = (userSnap.data() as UserProfile).coinBalance || 0;
      const newBal = Math.max(0, prevBal + amount);

      await updateDoc(userRef, {
        coinBalance: newBal,
        updatedAt: serverTimestamp(),
      });

      // Create transaction log
      const txId = `tx_adj_${Date.now()}`;
      await setDoc(doc(db, "coin_transactions", txId), {
        transactionId: txId,
        userId,
        amount,
        type: "admin_adjustment",
        description: reason || "Administrator tomonidan tanga o'zgartirildi",
        metadata: { adminUid: auth.currentUser?.uid || "admin", reason },
        createdAt: serverTimestamp(),
      });

      // Send notification to user
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        userId,
        title: amount > 0 ? `+${amount} Tillo tangasi berildi!` : `${amount} Tillo tangasi yechildi`,
        body: reason || "Administrator hisobingiz balansini yangiladi",
        type: "coin_received",
        isRead: false,
        createdAt: serverTimestamp(),
      });

      return { success: true, balanceAfter: newBal };
    }
  },
};
