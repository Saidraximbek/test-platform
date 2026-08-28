import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireActiveUser, validateInput } from "../middleware/auth";
import { PurchaseProductSchema } from "../schemas";
import { CoinTransactionDoc, OrderDoc, ProductDoc, UserDoc } from "../types";
import { sendNotification } from "../utils/notifications";

export const purchaseProduct = functions.https.onCall(async (data, context) => {
  const user = await requireActiveUser(context);
  const { productId, quantity, deliveryInfo, idempotencyKey } = validateInput(
    PurchaseProductSchema,
    data
  );
  const userId = user.uid;

  const productRef = db.collection("products").doc(productId);
  const orderId = `order_${idempotencyKey}`;
  const orderRef = db.collection("orders").doc(orderId);
  const txId = `tx_order_${idempotencyKey}`;
  const txRef = db.collection("coin_transactions").doc(txId);
  const userRef = db.collection("users").doc(userId);

  let finalOrder: OrderDoc | null = null;

  await db.runTransaction(async (t) => {
    // 1. Check idempotency
    const existingOrderSnap = await t.get(orderRef);
    if (existingOrderSnap.exists) {
      finalOrder = existingOrderSnap.data() as OrderDoc;
      return;
    }

    // 2. Read product
    const productSnap = await t.get(productRef);
    if (!productSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Mahsulot topilmadi");
    }
    const product = productSnap.data() as ProductDoc;

    if (!product.isActive) {
      throw new functions.https.HttpsError("failed-precondition", "Ushbu mahsulot ayni paytda sotuvda mavjud emas");
    }

    if (product.stock < quantity) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Yetarli zaxira mavjud emas. Qolgan zaxira: ${product.stock} dona`
      );
    }

    // 3. Read user
    const userDocSnap = await t.get(userRef);
    if (!userDocSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Foydalanuvchi topilmadi");
    }
    const userData = userDocSnap.data() as UserDoc;

    // 4. Calculate prices server-side
    const now = Timestamp.now();
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
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Mablag' yetarli emas. Xarid uchun ${totalCoins} Tillo kerak, sizda esa ${userData.coinBalance} Tillo mavjud.`
      );
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
    const orderData: OrderDoc = {
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
    const coinTx: CoinTransactionDoc = {
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
    await sendNotification(t, {
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
