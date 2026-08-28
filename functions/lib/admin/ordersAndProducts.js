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
exports.saveProduct = exports.updateOrderStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const audit_1 = require("../utils/audit");
const notifications_1 = require("../utils/notifications");
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const { orderId, status, trackingCode, reason } = (0, auth_1.validateInput)(schemas_1.UpdateOrderStatusSchema, data);
    const orderRef = firebase_1.db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Buyurtma topilmadi");
    }
    const order = orderSnap.data();
    const now = firebase_1.Timestamp.now();
    await firebase_1.db.runTransaction(async (t) => {
        const updatePayload = {
            status,
            updatedAt: now,
        };
        if (trackingCode !== undefined) {
            updatePayload["deliveryInfo.trackingCode"] = trackingCode;
        }
        t.update(orderRef, updatePayload);
        // Audit log
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: "ORDER_STATUS",
            targetCollection: "orders",
            targetDocumentId: orderId,
            changes: {
                prevStatus: order.status,
                newStatus: status,
                trackingCode,
                reason,
            },
        });
        // Notification to user
        const statusTitles = {
            pending: "Buyurtma ko'rib chiqilmoqda",
            processing: "Buyurtma tayyorlanmoqda ⚙️",
            shipped: "Buyurtma yetkazishga yuborildi 🚚",
            delivered: "Buyurtma yetkazib berildi! ✅",
            cancelled: "Buyurtma bekor qilindi ❌",
        };
        await (0, notifications_1.sendNotification)(t, {
            userId: order.userId,
            title: statusTitles[status] || "Buyurtma holati yangilandi",
            body: `Buyurtmangiz (${orderId}) holati "${status}" ga o'zgartirildi.${trackingCode ? ` Kuzatuv kodi: ${trackingCode}` : ""}`,
            type: "order_status",
            data: {
                orderId,
                status,
                trackingCode,
            },
        });
    });
    return {
        success: true,
        orderId,
        status,
    };
});
exports.saveProduct = functions.https.onCall(async (data, context) => {
    const adminUser = await (0, auth_1.requireAdmin)(context);
    const productInput = (0, auth_1.validateInput)(schemas_1.ProductMutationSchema, data);
    const productRef = productInput.productId
        ? firebase_1.db.collection("products").doc(productInput.productId)
        : firebase_1.db.collection("products").doc();
    const productId = productRef.id;
    const now = firebase_1.Timestamp.now();
    const productDoc = {
        productId,
        title: productInput.title,
        slug: productInput.slug,
        description: productInput.description,
        images: productInput.images,
        priceCoins: productInput.priceCoins,
        discountPercent: productInput.discountPercent || 0,
        discountStartAt: productInput.discountStartAt ? firebase_1.Timestamp.fromDate(new Date(productInput.discountStartAt)) : null,
        discountEndAt: productInput.discountEndAt ? firebase_1.Timestamp.fromDate(new Date(productInput.discountEndAt)) : null,
        stock: productInput.stock,
        isActive: productInput.isActive !== undefined ? productInput.isActive : true,
        category: productInput.category,
        createdAt: now,
        updatedAt: now,
    };
    await firebase_1.db.runTransaction(async (t) => {
        t.set(productRef, productDoc, { merge: true });
        await (0, audit_1.createAuditLog)(t, {
            adminUid: adminUser.uid,
            action: "PRODUCT_MUTATE",
            targetCollection: "products",
            targetDocumentId: productId,
            changes: productDoc,
        });
    });
    return {
        success: true,
        product: productDoc,
    };
});
//# sourceMappingURL=ordersAndProducts.js.map