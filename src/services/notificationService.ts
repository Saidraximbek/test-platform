import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { NotificationItem } from "../types";

export const notificationService = {
  listenToUserNotifications(userId: string, cb: (notifications: NotificationItem[]) => void) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    return onSnapshot(q, (snap) => {
      const notifs = snap.docs.map((d) => d.data() as NotificationItem);
      cb(notifs);
    });
  },

  async markAsRead(notificationId: string) {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
    });
  },

  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  },

  async deleteNotification(notificationId: string) {
    await deleteDoc(doc(db, "notifications", notificationId));
  },
};
