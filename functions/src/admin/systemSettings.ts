import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { UpdateSystemSettingsSchema } from "../schemas";
import { SystemSettingsDoc } from "../types";
import { createAuditLog } from "../utils/audit";

export const updateSystemSettings = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const settingsData = validateInput(UpdateSystemSettingsSchema, data);

  const settingsRef = db.collection("system_settings").doc("global_config");
  const currentSnap = await settingsRef.get();
  const prevSettings = currentSnap.exists ? currentSnap.data() : null;

  const now = Timestamp.now();
  const updatedDoc: SystemSettingsDoc = {
    ...settingsData,
    updatedAt: now,
    updatedBy: adminUser.uid,
  };

  await db.runTransaction(async (t) => {
    t.set(settingsRef, updatedDoc, { merge: true });

    await createAuditLog(t, {
      adminUid: adminUser.uid,
      action: "SETTINGS_CHANGE",
      targetCollection: "system_settings",
      targetDocumentId: "global_config",
      changes: {
        previous: prevSettings,
        current: updatedDoc,
      },
    });
  });

  return {
    success: true,
    settings: updatedDoc,
  };
});
