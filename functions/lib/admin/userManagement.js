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
exports.setAdminRole = exports.setUserStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
const notifications_1 = require("../utils/notifications");
exports.setUserStatus = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { userId, status, reason } = (0, auth_1.validateInput)(schemas_1.SetUserStatusSchema, data);
    const userRef = firebase_1.db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const prevUser = userSnap.data();
    const now = firebase_1.Timestamp.now();
    await firebase_1.db.runTransaction(async (t) => {
        // 1. Update status
        t.update(userRef, {
            status,
            updatedAt: now,
        });
        // 2. Audit log
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: status === "blocked" ? "USER_BLOCK" : status === "suspended" ? "USER_SUSPEND" : "USER_ACTIVATE",
            targetCollection: "users",
            targetDocumentId: userId,
            changes: {
                previousStatus: prevUser.status,
                newStatus: status,
                reason,
            },
        });
        // 3. Notification
        await (0, notifications_1.sendNotification)(t, {
            userId,
            title: `Hisob holati o'zgardi: ${status.toUpperCase()}`,
            body: `Sizning hisobingiz holati "${status}" holatiga o'tkazildi. Sabab: ${reason}`,
            type: "system",
            data: {
                status,
                reason,
            },
        });
    });
    // Also update custom claims status if needed
    try {
        const userRecord = await firebase_1.auth.getUser(userId);
        const currentClaims = userRecord.customClaims || {};
        await firebase_1.auth.setCustomUserClaims(userId, {
            ...currentClaims,
            status,
        });
    }
    catch (err) {
        functions.logger.warn(`Could not set custom claims for user ${userId}:`, err);
    }
    return {
        success: true,
        userId,
        status,
    };
});
exports.setAdminRole = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { targetEmailOrUid, isAdmin } = (0, auth_1.validateInput)(schemas_1.SetAdminRoleSchema, data);
    let targetUid = targetEmailOrUid;
    if (targetEmailOrUid.includes("@")) {
        const userRecord = await firebase_1.auth.getUserByEmail(targetEmailOrUid);
        targetUid = userRecord.uid;
    }
    // Update Firebase Custom Claims (authoritative)
    const userRecord = await firebase_1.auth.getUser(targetUid);
    const currentClaims = userRecord.customClaims || {};
    await firebase_1.auth.setCustomUserClaims(targetUid, {
        ...currentClaims,
        admin: isAdmin,
        role: isAdmin ? "admin" : "user",
    });
    // Keep users/{uid}.role in sync for client queries
    const userRef = firebase_1.db.collection("users").doc(targetUid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
        await userRef.update({
            role: isAdmin ? "admin" : "user",
            updatedAt: firebase_1.Timestamp.now(),
        });
    }
    await (0, audit_1.createAuditLog)(firebase_1.db, {
        adminUid: adminUser.uid,
        action: "ADMIN_ROLE_CHANGE",
        targetCollection: "users",
        targetDocumentId: targetUid,
        changes: {
            targetEmailOrUid,
            isAdmin,
        },
    });
    return {
        success: true,
        uid: targetUid,
        role: isAdmin ? "admin" : "user",
    };
});
//# sourceMappingURL=userManagement.js.map