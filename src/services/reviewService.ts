import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Review, ReviewStatus, ReviewTargetType, UserProfile } from "../types";

export const reviewService = {
  async getReviews(targetType: ReviewTargetType, targetId: string, onlyApproved = true): Promise<Review[]> {
    const reviewsRef = collection(db, "reviews");
    let q = query(
      reviewsRef,
      where("targetType", "==", targetType),
      where("targetId", "==", targetId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    if (onlyApproved) {
      q = query(
        reviewsRef,
        where("targetType", "==", targetType),
        where("targetId", "==", targetId),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Review);
  },

  async submitReview(
    targetType: ReviewTargetType,
    targetId: string,
    rating: number,
    comment: string,
    user: UserProfile
  ) {
    const reviewId = `${user.uid}_${targetType}_${targetId}`;
    const reviewRef = doc(db, "reviews", reviewId);

    const reviewDoc: Review = {
      reviewId,
      userId: user.uid,
      userDisplayName: user.displayName || "Foydalanuvchi",
      userPhotoURL: user.photoURL || "",
      targetType,
      targetId,
      rating,
      comment,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(reviewRef, reviewDoc, { merge: true });
    return reviewDoc;
  },

  async getAllReviews(): Promise<Review[]> {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Review);
  },

  async updateReviewStatus(reviewId: string, status: ReviewStatus) {
    await updateDoc(doc(db, "reviews", reviewId), {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteReview(reviewId: string) {
    await deleteDoc(doc(db, "reviews", reviewId));
  },
};
