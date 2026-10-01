import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, MapPin, CheckCircle2, Copy, Check } from "lucide-react";
import { shopService } from "../../services/shopService";
import { useAuth } from "../../context/AuthContext";
import { Order } from "../../types";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return;
      try {
        const list = await shopService.getUserOrders(user.uid);
        setOrders(list);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.uid]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  const statusVariants: Record<string, "warning" | "success" | "danger"> = {
    pending: "warning",
    processing: "warning",
    shipped: "warning",
    delivered: "success",
    cancelled: "danger",
  };

  const statusLabels: Record<string, string> = {
    pending: "Markazdan olib ketishingiz mumkin 🎁",
    processing: "Tayyorlanmoqda",
    shipped: "Olib ketishga tayyor",
    delivered: "Olib ketildi / Topshirildi ✅",
    cancelled: "Bekor qilindi",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Mening Xaridlarim
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tillo do'konidan xarid qilingan sovg'alar va ularni o'quv markazdan qabul qilish kodlari
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-16 text-center text-xs text-slate-500 space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <p>Sizda hali birorta xarid mavjud emas</p>
          <Link to="/shop">
            <button className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs">
              Do'konga o'tish
            </button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const pickupCode =
              order.deliveryInfo?.trackingCode || (order.orderId ? `TL-${order.orderId.substring(6, 11)}` : "TL-ORDER");
            const isDelivered = order.status === "delivered";

            return (
              <Card key={order.orderId} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Xarid #{order.orderId ? order.orderId.substring(6, 12) : "N/A"}
                      </span>
                      <Badge variant={statusVariants[order.status] || "neutral"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Jami to'lov:</span>
                    <span className="text-base font-black text-amber-500">
                      {formatCoins(order.totalCoins)} Tillo
                    </span>
                  </div>
                </div>

                {/* Pickup Code Banner */}
                {!isDelivered && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
                        📍 Qabul Qilish Kodi (Markaz xodimiga ko'rsating):
                      </span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-widest mt-0.5 block">
                        {pickupCode}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        O'quv markazimiz ma'muriyatiga ushbu kodni aytib mahsulotingizni qabul qiling.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyCode(pickupCode)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                    >
                      {copiedCode === pickupCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" /> Nusxalandi!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-400" /> Koddan nusxa olish
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">Mahsulotlar:</span>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {item.title} <span className="text-slate-400 font-normal">x{item.quantity} dona</span>
                      </span>
                      <span className="font-bold text-amber-500">
                        {formatCoins(item.totalCoins)} Tillo
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pickup receiver info */}
                <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                  <span>
                    Qabul qiluvchi: <strong className="text-slate-700 dark:text-slate-300">{order.deliveryInfo?.fullName}</strong> ({order.deliveryInfo?.phone})
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Joylashuv: O'quv markaz binosi
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const OrderDetailPage = OrdersPage;
