"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const firebase_1 = require("../config/firebase");
async function sendNotification(transactionOrDb, params) {
    const notifRef = firebase_1.db.collection("notifications").doc();
    const notifData = {
        notificationId: notifRef.id,
        userId: params.userId,
        title: params.title,
        body: params.body,
        type: params.type,
        data: params.data || {},
        isRead: false,
        createdAt: firebase_1.Timestamp.now(),
    };
    if ("set" in transactionOrDb) {
        transactionOrDb.set(notifRef, notifData);
    }
    else {
        await notifRef.set(notifData);
    }
    return notifRef.id;
}
//# sourceMappingURL=notifications.js.map