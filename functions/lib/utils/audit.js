"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const firebase_1 = require("../config/firebase");
async function createAuditLog(transactionOrDb, params) {
    const logRef = firebase_1.db.collection("audit_logs").doc();
    const logData = {
        logId: logRef.id,
        adminUid: params.adminUid,
        action: params.action,
        targetCollection: params.targetCollection,
        targetDocumentId: params.targetDocumentId,
        changes: params.changes,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        createdAt: firebase_1.Timestamp.now(),
    };
    if ("set" in transactionOrDb) {
        transactionOrDb.set(logRef, logData);
    }
    else {
        await logRef.set(logData);
    }
    return logRef.id;
}
//# sourceMappingURL=audit.js.map