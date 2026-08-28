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
exports.updateSystemSettings = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
exports.updateSystemSettings = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const settingsData = (0, auth_1.validateInput)(schemas_1.UpdateSystemSettingsSchema, data);
    const settingsRef = firebase_1.db.collection("system_settings").doc("global_config");
    const currentSnap = await settingsRef.get();
    const prevSettings = currentSnap.exists ? currentSnap.data() : null;
    const now = firebase_1.Timestamp.now();
    const updatedDoc = {
        ...settingsData,
        updatedAt: now,
        updatedBy: adminUser.uid,
    };
    await firebase_1.db.runTransaction(async (t) => {
        t.set(settingsRef, updatedDoc, { merge: true });
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: "SETTINGS_CHANGE",
            targetCollection: "system_settings",
            targetDocumentId: "global_config",
            changes: {
                previous: prevSettings,
                current: updatedDoc,
            },
        });
    });
    return {
        success: true,
        settings: updatedDoc,
    };
});
//# sourceMappingURL=systemSettings.js.map