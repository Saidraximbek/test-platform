import * as functions from "firebase-functions";
import { auth, db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput, isCallerRootOwner } from "../middleware/auth";
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
  if (prevUser.role === "root_owner" && !isCallerRootOwner(context, adminUser)) {
    throw new functions.https.HttpsError("permission-denied", "Root Owner hisobini to'xtatish yoki bloklash taqiqlangan");
  }
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

  if ((currentClaims.role === "root_owner" || currentClaims.rootOwner === true) && !isCallerRootOwner(context, adminUser)) {
    throw new functions.https.HttpsError("permission-denied", "Root Owner hisobining rolini o'zgartirish taqiqlangan");
  }

  // Keep users/{uid}.role in sync for client queries
  const userRef = db.collection("users").doc(targetUid);
  const userSnap = await userRef.get();
  const currentRole = userSnap.exists ? (userSnap.data() as UserDoc).role : (currentClaims.role as string || "user");

  let newRole = isAdmin ? "admin" : "user";
  if (!isAdmin && (currentRole === "director" || currentRole === "teacher" || currentRole === "root_owner")) {
    newRole = currentRole;
  }

  await auth.setCustomUserClaims(targetUid, {
    ...currentClaims,
    admin: isAdmin,
    role: newRole,
  });

  if (userSnap.exists) {
    await userRef.update({
      role: newRole,
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
