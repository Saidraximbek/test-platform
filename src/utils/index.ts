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

export function numberToWordsUzbek(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "nol so'm";

  const ones = ["", "bir", "ikki", "uch", "to'rt", "besh", "olti", "yetti", "sakkiz", "to'qqiz"];
  const tens = ["", "o'n", "yigirma", "o'ttiz", "qirq", "ellik", "oltmish", "yetmish", "sakson", "to'qson"];

  function convertGroup(n: number): string {
    const parts: string[] = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const ten = Math.floor(rest / 10);
    const one = rest % 10;

    if (hundreds > 0) {
      if (hundreds === 1) parts.push("bir yuz");
      else parts.push(`${ones[hundreds]} yuz`);
    }
    if (ten > 0) {
      parts.push(tens[ten]);
    }
    if (one > 0) {
      parts.push(ones[one]);
    }
    return parts.join(" ");
  }

  const rounded = Math.round(num);
  const billions = Math.floor(rounded / 1000000000);
  const millions = Math.floor((rounded % 1000000000) / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const remainder = rounded % 1000;

  const resultParts: string[] = [];

  if (billions > 0) {
    resultParts.push(`${convertGroup(billions)} milliard`);
  }
  if (millions > 0) {
    resultParts.push(`${convertGroup(millions)} million`);
  }
  if (thousands > 0) {
    resultParts.push(`${convertGroup(thousands)} ming`);
  }
  if (remainder > 0) {
    resultParts.push(convertGroup(remainder));
  }

  return (resultParts.join(" ") + " so'm").trim();
}
