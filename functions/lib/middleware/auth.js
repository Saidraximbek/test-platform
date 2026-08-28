"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
exports.requireAuth = requireAuth;
exports.requireAppCheck = requireAppCheck;
exports.getUser = getUser;
exports.requireActiveUser = requireActiveUser;
exports.requireAdmin = requireAdmin;
const functions = __importStar(require("firebase-functions"));
const zod_1 = require("zod");
const firebase_1 = require("../config/firebase");
function validateInput(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
            throw new functions.https.HttpsError("invalid-argument", `Ma'lumotlar xato: ${messages}`);
        }
        throw new functions.https.HttpsError("invalid-argument", "Yuborilgan ma'lumotlar yaroqsiz");
    }
}
function requireAuth(context) {
    if (!context.auth || !context.auth.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Foydalanuvchi tizimga kirmagan");
    }
}
function requireAppCheck(context) {
    if (process.env.NODE_ENV === "production" && !context.app) {
        throw new functions.https.HttpsError("failed-precondition", "App Check tekshiruvidan o'tilmadi");
    }
}
async function getUser(uid) {
    const userSnap = await firebase_1.db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Foydalanuvchi profili topilmadi");
    }
    return userSnap.data();
}
async function requireActiveUser(context) {
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
async function requireAdmin(context) {
    requireAuth(context);
    const token = context.auth.token;
    const isAdminClaim = token.admin === true || token.role === "admin";
    const user = await getUser(context.auth.uid);
    if (!isAdminClaim && user.role !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Faqat administratorlar uchun ruxsat etilgan");
    }
    return user;
}
//# sourceMappingURL=auth.js.map