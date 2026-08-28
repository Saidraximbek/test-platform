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
exports.abandonTest = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const notifications_1 = require("../utils/notifications");
exports.abandonTest = functions.https.onCall(async (data, context) => {
    (0, auth_1.requireAuth)(context);
    const { sessionId } = (0, auth_1.validateInput)(schemas_1.AbandonTestSchema, data);
    const userId = context.auth.uid;
    const sessionRef = firebase_1.db.collection("test_sessions").doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Test sessiyasi topilmadi");
    }
    const session = sessionSnap.data();
    if (session.userId !== userId) {
        throw new functions.https.HttpsError("permission-denied", "Ushbu test sizga tegishli emas");
    }
    if (session.status !== "in_progress") {
        throw new functions.https.HttpsError("failed-precondition", `Ushbu test ayni paytda faol emas (${session.status})`);
    }
    const penaltyCoins = session.configSnapshot.penaltyCoins || 5;
    const txId = `tx_abandon_${sessionId}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    const userRef = firebase_1.db.collection("users").doc(userId);
    await firebase_1.db.runTransaction(async (t) => {
        const userDocSnap = await t.get(userRef);
        if (!userDocSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
        }
        const userData = userDocSnap.data();
        const txSnap = await t.get(txRef);
        if (txSnap.exists) {
            return;
        }
        const currentBalance = userData.coinBalance || 0;
        const actualDeduction = Math.min(currentBalance, penaltyCoins);
        const newBalance = Math.max(0, currentBalance - penaltyCoins);
        const now = firebase_1.Timestamp.now();
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
            const coinTx = {
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
        await (0, notifications_1.sendNotification)(t, {
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
//# sourceMappingURL=abandonTest.js.map