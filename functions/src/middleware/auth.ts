import * as functions from "firebase-functions";
import { ZodSchema, ZodError } from "zod";
import { db } from "../config/firebase";
import { UserDoc } from "../types";

export type CallableContextWithAuth = functions.https.CallableContext & {
  auth: NonNullable<functions.https.CallableContext["auth"]>;
};

export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      throw new functions.https.HttpsError("invalid-argument", `Ma'lumotlar xato: ${messages}`);
    }
    throw new functions.https.HttpsError("invalid-argument", "Yuborilgan ma'lumotlar yaroqsiz");
  }
}

export function requireAuth(context: functions.https.CallableContext): asserts context is CallableContextWithAuth {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Foydalanuvchi tizimga kirmagan");
  }
}

export function requireAppCheck(context: functions.https.CallableContext): void {
  if (process.env.NODE_ENV === "production" && !context.app) {
    throw new functions.https.HttpsError("failed-precondition", "App Check tekshiruvidan o'tilmadi");
  }
}

export async function getUser(uid: string): Promise<UserDoc> {
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Foydalanuvchi profili topilmadi");
  }
  return userSnap.data() as UserDoc;
}

export async function requireActiveUser(context: functions.https.CallableContext): Promise<UserDoc> {
  requireAuth(context);
  requireAppCheck(context);

  const user = await getUser(context.auth.uid);

  if (user.status === "blocked") {
    throw new functions.https.HttpsError("permission-denied", "Sizning hisobingiz bloklangan");
  }

  if (user.status === "suspended") {
    throw new functions.https.HttpsError("permission-denied", "Sizning hisobingiz vaqtincha to'xtatilgan");
  }

  return user;
}

export function isCallerRootOwner(context: functions.https.CallableContext, user?: UserDoc): boolean {
  if (!context.auth) return false;
  const token = context.auth.token as Record<string, any>;
  return token.role === "root_owner" || token.rootOwner === true || user?.role === "root_owner";
}

export async function requireAdmin(context: functions.https.CallableContext): Promise<UserDoc> {
  requireAuth(context);

  const token = context.auth.token as Record<string, any>;
  const user = await getUser(context.auth.uid);
  const isRoot = isCallerRootOwner(context, user);
  const isDirector = token.role === "director" || user.role === "director" || isRoot;
  const isAdminClaim = token.admin === true || token.role === "admin" || isDirector;

  if (!isAdminClaim && user.role !== "admin" && user.role !== "director" && user.role !== "root_owner") {
    throw new functions.https.HttpsError("permission-denied", "Faqat administratorlar uchun ruxsat etilgan");
  }

  return user;
}
