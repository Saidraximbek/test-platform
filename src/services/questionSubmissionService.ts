import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db, functions, auth } from "../lib/firebase";
import { QuestionSubmission, Question } from "../types";

export const questionSubmissionService = {
  async submitQuestion(data: {
    userId: string;
    subjectId: string;
    suggestedLevelNumber: number;
    text: string;
    imageUrl?: string | null;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation: string;
    difficulty: number;
  }) {
    const subRef = doc(collection(db, "question_submissions"));
    const submissionId = subRef.id;

    const submission: QuestionSubmission = {
      submissionId,
      userId: data.userId,
      subjectId: data.subjectId,
      suggestedLevelNumber: data.suggestedLevelNumber,
      text: data.text,
      imageUrl: data.imageUrl || null,
      options: data.options,
      correctOptionId: data.correctOptionId,
      explanation: data.explanation,
      difficulty: data.difficulty,
      status: "pending",
      rejectionReason: null,
      adminReviewerUid: null,
      approvedQuestionId: null,
      createdAt: serverTimestamp(),
      reviewedAt: null,
    };

    await setDoc(subRef, submission);
    return submission;
  },

  async getUserSubmissions(userId: string): Promise<QuestionSubmission[]> {
    const q = query(
      collection(db, "question_submissions"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as QuestionSubmission);
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async getAllSubmissions(statusFilter?: string): Promise<QuestionSubmission[]> {
    const snap = await getDocs(query(collection(db, "question_submissions"), limit(100)));
    let list = snap.docs.map((d) => d.data() as QuestionSubmission);

    if (statusFilter && statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async approveSubmission(submissionId: string, rewardCoins = 20) {
    try {
      const fn = httpsCallable<{ submissionId: string; rewardCoins: number }, { success: boolean; questionId: string }>(
        functions,
        "approveQuestionSubmission"
      );
      const res = await fn({ submissionId, rewardCoins });
      return res.data;
    } catch (fnErr) {
      const subRef = doc(db, "question_submissions", submissionId);
      const subSnap = await getDoc(subRef);
      if (!subSnap.exists()) throw new Error("Taklif topilmadi");
      const sub = subSnap.data() as QuestionSubmission;

      const qRef = doc(collection(db, "questions"));
      const newQuestion: Question = {
        questionId: qRef.id,
        subjectId: sub.subjectId,
        levelId: "level_1",
        text: sub.text,
        imageUrl: sub.imageUrl || null,
        options: sub.options,
        correctOptionId: sub.correctOptionId,
        explanation: sub.explanation,
        difficulty: sub.difficulty,
        status: "approved",
        randomWeight: Math.random(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(qRef, newQuestion);

      await updateDoc(subRef, {
        status: "approved",
        approvedQuestionId: qRef.id,
        reviewedAt: serverTimestamp(),
        adminReviewerUid: auth.currentUser?.uid || "admin",
      });

      // Reward user with coins
      await updateDoc(doc(db, "users", sub.userId), {
        coinBalance: increment(rewardCoins),
        updatedAt: serverTimestamp(),
      });

      return { success: true, questionId: qRef.id };
    }
  },

  async rejectSubmission(submissionId: string, rejectionReason: string) {
    try {
      const fn = httpsCallable<{ submissionId: string; rejectionReason: string }, { success: boolean }>(
        functions,
        "rejectQuestionSubmission"
      );
      const res = await fn({ submissionId, rejectionReason });
      return res.data;
    } catch (fnErr) {
      await updateDoc(doc(db, "question_submissions", submissionId), {
        status: "rejected",
        rejectionReason,
        reviewedAt: serverTimestamp(),
        adminReviewerUid: auth.currentUser?.uid || "admin",
      });
      return { success: true };
    }
  },
};
