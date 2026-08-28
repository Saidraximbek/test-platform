import * as functions from "firebase-functions";
import { auth, db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { SetAdminRoleSchema, SetUserStatusSchema } from "../schemas";
import { UserDoc } from "../types";
import { createAuditLog } from "../utils/audit";
import { sendNotification } from "../utils/notifications";

export const setUserStatus = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { userId, status, reason } = validateInput(SetUserStatusSchema, data);

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
  }

  const prevUser = userSnap.data() as UserDoc;
  const now = Timestamp.now();

  await db.runTransaction(async (t) => {
    // 1. Update status
    t.update(userRef, {
      status,
      updatedAt: now,
    });

    // 2. Audit log
    await createAuditLog(t, {
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
    await sendNotification(t, {
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
    const userRecord = await auth.getUser(userId);
    const currentClaims = userRecord.customClaims || {};
    await auth.setCustomUserClaims(userId, {
      ...currentClaims,
      status,
    });
  } catch (err) {
    functions.logger.warn(`Could not set custom claims for user ${userId}:`, err);
  }

  return {
    success: true,
    userId,
    status,
  };
});

export const setAdminRole = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { targetEmailOrUid, isAdmin } = validateInput(SetAdminRoleSchema, data);

  let targetUid = targetEmailOrUid;
  if (targetEmailOrUid.includes("@")) {
    const userRecord = await auth.getUserByEmail(targetEmailOrUid);
    targetUid = userRecord.uid;
  }

  // Update Firebase Custom Claims (authoritative)
  const userRecord = await auth.getUser(targetUid);
  const currentClaims = userRecord.customClaims || {};

  await auth.setCustomUserClaims(targetUid, {
    ...currentClaims,
    admin: isAdmin,
    role: isAdmin ? "admin" : "user",
  });

  // Keep users/{uid}.role in sync for client queries
  const userRef = db.collection("users").doc(targetUid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    await userRef.update({
      role: isAdmin ? "admin" : "user",
      updatedAt: Timestamp.now(),
    });
  }

  await createAuditLog(db, {
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
