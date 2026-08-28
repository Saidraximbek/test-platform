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
import { Order, OrderDeliveryInfo, Product, ProductCategory, UserProfile } from "../types";

export const shopService = {
  async getProducts(category?: ProductCategory, onlyActive = true): Promise<Product[]> {
    const productsRef = collection(db, "products");
    const snap = await getDocs(productsRef);
    let list = snap.docs.map((d) => d.data() as Product);

    if (onlyActive) {
      list = list.filter((p) => p.isActive !== false);
    }
    if (category) {
      list = list.filter((p) => p.category === category);
    }

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async getProductById(productId: string): Promise<Product | null> {
    const snap = await getDoc(doc(db, "products", productId));
    if (!snap.exists()) return null;
    return snap.data() as Product;
  },

  async purchaseProduct(
    productId: string,
    quantity: number,
    deliveryInfo: OrderDeliveryInfo,
    idempotencyKey: string
  ): Promise<{ success: boolean; order: Order }> {
    try {
      const fn = httpsCallable<
        { productId: string; quantity: number; deliveryInfo: OrderDeliveryInfo; idempotencyKey: string },
        { success: boolean; order: Order }
      >(functions, "purchaseProduct");
      const res = await fn({ productId, quantity, deliveryInfo, idempotencyKey });
      return res.data;
    } catch (fnErr) {
      console.warn("Cloud function purchaseProduct unavailable, using direct checkout:", fnErr);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Foydalanuvchi tizimga kirmagan");

      // 1. Fetch product
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) throw new Error("Mahsulot topilmadi");
      const product = productSnap.data() as Product;

      if (!product.isActive) throw new Error("Mahsulot ayni paytda faol emas");
      if (product.stock < quantity) throw new Error("Zaxirada yetarli mahsulot qolmagan");

      // Calculate price
      const discount = product.discountPercent || 0;
      const originalSubtotal = product.priceCoins * quantity;
      const unitPrice = Math.round(product.priceCoins * (1 - discount / 100));
      const totalCoins = unitPrice * quantity;
      const discountCoins = originalSubtotal - totalCoins;

      // 2. Fetch User balance
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Foydalanuvchi topilmadi");
      const userData = userSnap.data() as UserProfile;

      if ((userData.coinBalance || 0) < totalCoins) {
        throw new Error(`Hisobingizda mablag' yetarli emas. Kerak: ${totalCoins} Tillo`);
      }

      // Deduct balance & stock
      await updateDoc(userRef, {
        coinBalance: increment(-totalCoins),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(productRef, {
        stock: increment(-quantity),
        updatedAt: serverTimestamp(),
      });

      const orderId = `order_${idempotencyKey || Date.now()}`;
      const newOrder: Order = {
        orderId,
        userId: currentUser.uid,
        items: [
          {
            productId: product.productId,
            title: product.title,
            unitPriceCoins: unitPrice,
            quantity,
            totalCoins,
          },
        ],
        subtotalCoins: originalSubtotal,
        discountCoins,
        totalCoins,
        deliveryInfo: {
          ...deliveryInfo,
          trackingCode: null,
        },
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "orders", orderId), newOrder);

      // Create transaction
      const txId = `tx_order_${orderId}`;
      await setDoc(doc(db, "coin_transactions", txId), {
        transactionId: txId,
        userId: currentUser.uid,
        amount: -totalCoins,
        type: "shop_purchase",
        description: `Do'kondan xarid: ${product.title}`,
        metadata: { orderId, productId },
        createdAt: serverTimestamp(),
      });

      return { success: true, order: newOrder };
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(
      collection(db, "orders"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Order);
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, "orders", orderId));
    if (!snap.exists()) return null;
    return snap.data() as Order;
  },

  async getAllOrders(statusFilter?: string): Promise<Order[]> {
    const ordersRef = collection(db, "orders");
    const snap = await getDocs(query(ordersRef, limit(100)));
    let list = snap.docs.map((d) => d.data() as Order);

    if (statusFilter && statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  },

  async updateOrderStatus(orderId: string, status: string, trackingCode?: string | null, reason?: string) {
    try {
      const fn = httpsCallable<
        { orderId: string; status: string; trackingCode?: string | null; reason?: string },
        { success: boolean }
      >(functions, "updateOrderStatus");
      const res = await fn({ orderId, status, trackingCode, reason });
      return res.data;
    } catch (fnErr) {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        "deliveryInfo.trackingCode": trackingCode || null,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    }
  },

  async saveProduct(productData: any) {
    try {
      const fn = httpsCallable<any, { success: boolean; product: Product }>(functions, "saveProduct");
      const res = await fn(productData);
      return res.data;
    } catch (fnErr) {
      const productRef = productData.productId
        ? doc(db, "products", productData.productId)
        : doc(collection(db, "products"));

      const productId = productRef.id;
      const docData: Product = {
        productId,
        title: productData.title,
        slug: productData.slug,
        description: productData.description || "",
        images: productData.images || [],
        priceCoins: Number(productData.priceCoins) || 0,
        discountPercent: Number(productData.discountPercent) || 0,
        discountStartAt: null,
        discountEndAt: null,
        stock: Number(productData.stock) || 0,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        category: productData.category || "gift",
        createdAt: productData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(productRef, docData, { merge: true });
      return { success: true, product: docData };
    }
  },
};
