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
exports.grantWeeklyReward = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
const notifications_1 = require("../utils/notifications");
exports.grantWeeklyReward = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { weekId, userId, rewardType, amount, giftTitle, reason } = (0, auth_1.validateInput)(schemas_1.GrantWeeklyRewardSchema, data);
    const rewardId = `reward_${weekId}_${userId}`;
    const rewardRef = firebase_1.db.collection("weekly_rewards").doc(rewardId);
    const userRef = firebase_1.db.collection("users").doc(userId);
    const txId = `tx_reward_${weekId}_${userId}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    await firebase_1.db.runTransaction(async (t) => {
        const rewardSnap = await t.get(rewardRef);
        if (rewardSnap.exists) {
            throw new functions.https.HttpsError("already-exists", "Ushbu foydalanuvchiga mazkur hafta uchun allaqachon mukofot berilgan");
        }
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
        }
        const userData = userSnap.data();
        const now = firebase_1.Timestamp.now();
        // 1. Create Weekly Reward doc
        const rewardDoc = {
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
            const coinTx = {
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
        await (0, audit_1.createAuditLog)(t, {
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
        await (0, notifications_1.sendNotification)(t, {
            userId,
            title: "Haftalik mukofot berildi! 🏆",
            body: `Tabriklaymiz! Sizga haftalik faolligingiz uchun mukofot berildi: ${rewardType === "coins" ? `${amount} Tillo tanga` : giftTitle || reason}`,
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
//# sourceMappingURL=grantWeeklyReward.js.map