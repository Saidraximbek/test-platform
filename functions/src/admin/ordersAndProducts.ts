import * as functions from "firebase-functions";
import { db, Timestamp } from "../config/firebase";
import { requireAdmin, validateInput } from "../middleware/auth";
import { ProductMutationSchema, UpdateOrderStatusSchema } from "../schemas";
import { OrderDoc, ProductDoc } from "../types";
import { createAuditLog } from "../utils/audit";
import { sendNotification } from "../utils/notifications";

export const updateOrderStatus = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const { orderId, status, trackingCode, reason } = validateInput(UpdateOrderStatusSchema, data);

  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Buyurtma topilmadi");
  }

  const order = orderSnap.data() as OrderDoc;
  const now = Timestamp.now();

  await db.runTransaction(async (t) => {
    const updatePayload: Record<string, any> = {
      status,
      updatedAt: now,
    };

    if (trackingCode !== undefined) {
      updatePayload["deliveryInfo.trackingCode"] = trackingCode;
    }

    t.update(orderRef, updatePayload);

    // Audit log
    await createAuditLog(t, {
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
    const statusTitles: Record<string, string> = {
      pending: "Buyurtma ko'rib chiqilmoqda",
      processing: "Buyurtma tayyorlanmoqda ⚙️",
      shipped: "Buyurtma yetkazishga yuborildi 🚚",
      delivered: "Buyurtma yetkazib berildi! ✅",
      cancelled: "Buyurtma bekor qilindi ❌",
    };

    await sendNotification(t, {
      userId: order.userId,
      title: statusTitles[status] || "Buyurtma holati yangilandi",
      body: `Buyurtmangiz (${orderId}) holati "${status}" ga o'zgartirildi.${
        trackingCode ? ` Kuzatuv kodi: ${trackingCode}` : ""
      }`,
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

export const saveProduct = functions.https.onCall(async (data, context) => {
  const adminUser = await requireAdmin(context);
  const productInput = validateInput(ProductMutationSchema, data);

  const productRef = productInput.productId
    ? db.collection("products").doc(productInput.productId)
    : db.collection("products").doc();

  const productId = productRef.id;
  const now = Timestamp.now();

  const productDoc: ProductDoc = {
    productId,
    title: productInput.title,
    slug: productInput.slug,
    description: productInput.description,
    images: productInput.images,
    priceCoins: productInput.priceCoins,
    discountPercent: productInput.discountPercent || 0,
    discountStartAt: productInput.discountStartAt ? Timestamp.fromDate(new Date(productInput.discountStartAt)) : null,
    discountEndAt: productInput.discountEndAt ? Timestamp.fromDate(new Date(productInput.discountEndAt)) : null,
    stock: productInput.stock,
    isActive: productInput.isActive !== undefined ? productInput.isActive : true,
    category: productInput.category,
    createdAt: now,
    updatedAt: now,
  };

  await db.runTransaction(async (t) => {
    t.set(productRef, productDoc, { merge: true });

    await createAuditLog(t, {
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
