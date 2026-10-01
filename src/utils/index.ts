import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("uz-UZ").format(num || 0);
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return "-";
}

export function getErrorMessage(error: any): string {
  if (typeof error === "string") return error;
  if (error?.message) {
    const msg = error.message;
    if (msg.includes("auth/api-key-not-valid") || msg.includes("api-key-not-valid")) {
      return "Firebase API kaliti yaroqsiz yoki to'liq ko'chirilmagan. Iltimos, Firebase Console dan to'liq kalitni oling.";
    }
    if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
      return "Email yoki parol noto'g'ri";
    }
    if (msg.includes("auth/email-already-in-use")) {
      return "Bu email manzilidan allaqachon ro'yxatdan o'tilgan";
    }
    if (msg.includes("auth/weak-password")) {
      return "Parol juda oddiy. Kamida 6 ta belgi kiriting";
    }
    if (msg.includes("auth/invalid-email")) {
      return "Email manzili formati noto'g'ri";
    }
    if (msg.includes("auth/operation-not-allowed")) {
      return "Firebase Console da Email/Password autentifikatsiyasi yoqilmagan";
    }
    if (msg.includes("permission-denied")) {
      return "Ushbu amalni bajarish uchun ruxsatingiz yetarli emas";
    }
    if (msg.includes("failed-precondition")) {
      return msg.replace(/FirebaseError: /g, "").replace(/\[.*?\]/g, "").trim();
    }
    return msg.replace(/FirebaseError: /g, "").replace(/\[.*?\]/g, "").trim();
  }
  return "Noma'lum xatolik yuz berdi";
}
