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
exports.adminCoinAdjust = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
const notifications_1 = require("../utils/notifications");
exports.adminCoinAdjust = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { userId, amount, reason } = (0, auth_1.validateInput)(schemas_1.AdminCoinAdjustSchema, data);
    const userRef = firebase_1.db.collection("users").doc(userId);
    const txId = `tx_admin_adj_${Date.now()}_${userId}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    let newBalance = 0;
    let currentBalance = 0;
    await firebase_1.db.runTransaction(async (t) => {
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
        }
        const userData = userSnap.data();
        currentBalance = userData.coinBalance || 0;
        newBalance = Math.max(0, currentBalance + amount);
        const now = firebase_1.Timestamp.now();
        // 1. Update User Balance
        t.update(userRef, {
            coinBalance: newBalance,
            updatedAt: now,
        });
        // 2. Create Coin Transaction
        const coinTx = {
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
        await (0, audit_1.createAuditLog)(t, {
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
            ipAddress: context.rawRequest ? context.rawRequest.headers["x-forwarded-for"] : null,
            userAgent: context.rawRequest ? context.rawRequest.headers["user-agent"] : null,
        });
        // 4. Send Notification to User
        await (0, notifications_1.sendNotification)(t, {
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
//# sourceMappingURL=adminCoinAdjust.js.map