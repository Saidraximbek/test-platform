import { db, Timestamp } from "../config/firebase";
import { NotificationDoc, NotificationType } from "../types";

export async function sendNotification(
  transactionOrDb: FirebaseFirestore.Transaction | FirebaseFirestore.Firestore,
  params: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, any>;
  }
) {
  const notifRef = db.collection("notifications").doc();
  const notifData: NotificationDoc = {
    notificationId: notifRef.id,
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    data: params.data || {},
    isRead: false,
    createdAt: Timestamp.now(),
  };

  if ("set" in transactionOrDb) {
    transactionOrDb.set(notifRef, notifData);
  } else {
    await notifRef.set(notifData);
  }

  return notifRef.id;
}
