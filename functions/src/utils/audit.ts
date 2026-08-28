import { db, Timestamp } from "../config/firebase";
import { AuditAction, AuditLogDoc } from "../types";

export async function createAuditLog(
  transactionOrDb: FirebaseFirestore.Transaction | FirebaseFirestore.Firestore,
  params: {
    adminUid: string;
    action: AuditAction;
    targetCollection: string;
    targetDocumentId: string;
    changes: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
) {
  const logRef = db.collection("audit_logs").doc();
  const logData: AuditLogDoc = {
    logId: logRef.id,
    adminUid: params.adminUid,
    action: params.action,
    targetCollection: params.targetCollection,
    targetDocumentId: params.targetDocumentId,
    changes: params.changes,
    ipAddress: params.ipAddress || null,
    userAgent: params.userAgent || null,
    createdAt: Timestamp.now(),
  };

  if ("set" in transactionOrDb) {
    transactionOrDb.set(logRef, logData);
  } else {
    await logRef.set(logData);
  }

  return logRef.id;
}
