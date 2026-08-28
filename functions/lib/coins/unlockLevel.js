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
exports.unlockLevel = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const notifications_1 = require("../utils/notifications");
exports.unlockLevel = functions.https.onCall(async (data, context) => {
    const user = await (0, auth_1.requireActiveUser)(context);
    const { subjectId, levelId } = (0, auth_1.validateInput)(schemas_1.UnlockLevelSchema, data);
    const userId = user.uid;
    // 1. Read level
    const levelRef = firebase_1.db.collection("levels").doc(levelId);
    const levelSnap = await levelRef.get();
    if (!levelSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Daraja topilmadi");
    }
    const level = levelSnap.data();
    if (!level.isActive && user.role !== "admin") {
        throw new functions.https.HttpsError("failed-precondition", "Ushbu daraja ayni paytda faol emas");
    }
    // 2. Read global config for fallback cost
    const configSnap = await firebase_1.db.collection("system_settings").doc("global_config").get();
    const defaultCost = configSnap.exists
        ? configSnap.data().defaultLevelUnlockCost || 50
        : 50;
    const unlockCost = level.unlockCostCoins !== null && level.unlockCostCoins !== undefined
        ? level.unlockCostCoins
        : defaultCost;
    const progressId = `${userId}_${levelId}`;
    const progressRef = firebase_1.db.collection("user_progress").doc(progressId);
    const userRef = firebase_1.db.collection("users").doc(userId);
    const txId = `tx_unlock_${userId}_${levelId}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    let newBalance = 0;
    await firebase_1.db.runTransaction(async (t) => {
        const userDocSnap = await t.get(userRef);
        if (!userDocSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
        }
        const userData = userDocSnap.data();
        const progressDocSnap = await t.get(progressRef);
        if (progressDocSnap.exists) {
            const prog = progressDocSnap.data();
            if (prog.isUnlocked) {
                throw new functions.https.HttpsError("already-exists", "Ushbu daraja allaqachon ochilgan");
            }
        }
        if (userData.coinBalance < unlockCost) {
            throw new functions.https.HttpsError("failed-precondition", `Yetarli mablag' mavjud emas. Darajani ochish uchun ${unlockCost} Tillo kerak, balansingizda esa ${userData.coinBalance} Tillo bor.`);
        }
        const txSnap = await t.get(txRef);
        if (txSnap.exists) {
            return; // Already unlocked
        }
        const currentBalance = userData.coinBalance;
        newBalance = currentBalance - unlockCost;
        const now = firebase_1.Timestamp.now();
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
        }
        else {
            const newProgress = {
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
        const coinTx = {
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
        await (0, notifications_1.sendNotification)(t, {
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
//# sourceMappingURL=unlockLevel.js.map