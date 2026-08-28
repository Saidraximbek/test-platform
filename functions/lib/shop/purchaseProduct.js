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
exports.purchaseProduct = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const schemas_1 = require("../schemas");
const notifications_1 = require("../utils/notifications");
exports.purchaseProduct = functions.https.onCall(async (data, context) => {
    const user = await (0, auth_1.requireActiveUser)(context);
    const { productId, quantity, deliveryInfo, idempotencyKey } = (0, auth_1.validateInput)(schemas_1.PurchaseProductSchema, data);
    const userId = user.uid;
    const productRef = firebase_1.db.collection("products").doc(productId);
    const orderId = `order_${idempotencyKey}`;
    const orderRef = firebase_1.db.collection("orders").doc(orderId);
    const txId = `tx_order_${idempotencyKey}`;
    const txRef = firebase_1.db.collection("coin_transactions").doc(txId);
    const userRef = firebase_1.db.collection("users").doc(userId);
    let finalOrder = null;
    await firebase_1.db.runTransaction(async (t) => {
        // 1. Check idempotency
        const existingOrderSnap = await t.get(orderRef);
        if (existingOrderSnap.exists) {
            finalOrder = existingOrderSnap.data();
            return;
        }
        // 2. Read product
        const productSnap = await t.get(productRef);
        if (!productSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Mahsulot topilmadi");
        }
        const product = productSnap.data();
        if (!product.isActive) {
            throw new functions.https.HttpsError("failed-precondition", "Ushbu mahsulot ayni paytda sotuvda mavjud emas");
        }
        if (product.stock < quantity) {
            throw new functions.https.HttpsError("failed-precondition", `Yetarli zaxira mavjud emas. Qolgan zaxira: ${product.stock} dona`);
        }
        // 3. Read user
        const userDocSnap = await t.get(userRef);
        if (!userDocSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
        }
        const userData = userDocSnap.data();
        // 4. Calculate prices server-side
        const now = firebase_1.Timestamp.now();
        const nowMs = now.toMillis();
        let isDiscountActive = product.discountPercent > 0;
        if (product.discountStartAt && product.discountStartAt.toMillis() > nowMs) {
            isDiscountActive = false;
        }
        if (product.discountEndAt && product.discountEndAt.toMillis() < nowMs) {
            isDiscountActive = false;
        }
        const discountPercent = isDiscountActive ? product.discountPercent : 0;
        const unitPriceCoins = Math.max(0, Math.round(product.priceCoins * (1 - discountPercent / 100)));
        const totalCoins = unitPriceCoins * quantity;
        const subtotalCoins = product.priceCoins * quantity;
        const discountCoins = subtotalCoins - totalCoins;
        if (userData.coinBalance < totalCoins) {
            throw new functions.https.HttpsError("failed-precondition", `Mablag' yetarli emas. Xarid uchun ${totalCoins} Tillo kerak, sizda esa ${userData.coinBalance} Tillo mavjud.`);
        }
        const newStock = product.stock - quantity;
        const currentBalance = userData.coinBalance;
        const newBalance = currentBalance - totalCoins;
        // 5. Update Product Stock
        t.update(productRef, {
            stock: newStock,
            updatedAt: now,
        });
        // 6. Update User Balance
        t.update(userRef, {
            coinBalance: newBalance,
            updatedAt: now,
        });
        // 7. Create Order Document
        const orderData = {
            orderId,
            userId,
            items: [
                {
                    productId: product.productId,
                    title: product.title,
                    unitPriceCoins,
                    quantity,
                    totalCoins,
                },
            ],
            subtotalCoins,
            discountCoins,
            totalCoins,
            status: "pending",
            deliveryInfo: {
                fullName: deliveryInfo.fullName,
                phone: deliveryInfo.phone,
                region: deliveryInfo.region,
                address: deliveryInfo.address,
                targetBranch: deliveryInfo.targetBranch || null,
                trackingCode: null,
            },
            createdAt: now,
            updatedAt: now,
        };
        t.set(orderRef, orderData);
        finalOrder = orderData;
        // 8. Create Coin Transaction
        const coinTx = {
            transactionId: txId,
            userId,
            amount: -totalCoins,
            type: "shop_purchase",
            reason: `Mahsulot xaridi: ${product.title} (x${quantity})`,
            referenceId: orderId,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            createdAt: now,
            createdBy: "system",
            metadata: {
                orderId,
                productId,
                quantity,
                totalCoins,
            },
        };
        t.set(txRef, coinTx);
        // 9. Send Notification
        await (0, notifications_1.sendNotification)(t, {
            userId,
            title: "Buyurtmangiz qabul qilindi! 📦",
            body: `"${product.title}" mahsuloti uchun buyurtmangiz muvaffaqiyatli rasmiylashtirildi. Buyurtma holatini "Buyurtmalarim" bo'limida kuzatishingiz mumkin.`,
            type: "order_status",
            data: {
                orderId,
                productId,
                totalCoins,
            },
        });
    });
    return {
        success: true,
        order: finalOrder,
    };
});
//# sourceMappingURL=purchaseProduct.js.map