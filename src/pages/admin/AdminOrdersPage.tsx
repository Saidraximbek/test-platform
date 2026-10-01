import React, { useEffect, useState } from "react";
import { Package, CheckCircle2, Search, Check, XCircle } from "lucide-react";
import { shopService } from "../../services/shopService";
import { useToast } from "../../context/ToastContext";
import { Order, OrderStatus } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins, getErrorMessage } from "../../utils";

export const AdminOrdersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const list = await shopService.getAllOrders(statusFilter);
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleMarkAsDelivered = async (orderId: string) => {
    if (!window.confirm("Ushbu sovg'a o'quvchiga topshirilganini tasdiqlaysizmi?")) return;
    setIsUpdating(orderId);
    try {
      await shopService.updateOrderStatus(
        orderId,
        "delivered",
        null,
        "Markaz xodimi tomonidan topshirildi"
      );
      success("Buyurtma holati 'Topshirildi' ga o'zgartirildi!");
      fetchOrders();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Buyurtmani bekor qilmoqchimisiz?")) return;
    setIsUpdating(orderId);
    try {
      await shopService.updateOrderStatus(
        orderId,
        "cancelled",
        null,
        "Admin tomonidan bekor qilindi"
      );
      success("Buyurtma bekor qilindi!");
      fetchOrders();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const s = searchTerm.toLowerCase();
    const code = (ord.deliveryInfo?.trackingCode || "").toLowerCase();
    const name = (ord.deliveryInfo?.fullName || "").toLowerCase();
    const phone = (ord.deliveryInfo?.phone || "").toLowerCase();
    return code.includes(s) || name.includes(s) || phone.includes(s);
  });

  const statusVariants: Record<string, "warning" | "success" | "danger"> = {
    pending: "warning",
    processing: "warning",
    shipped: "warning",
    delivered: "success",
    cancelled: "danger",
  };

  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda (Olib ketilmagan)",
    processing: "Kutilmoqda",
    shipped: "Kutilmoqda",
    delivered: "Topshirildi ✅",
    cancelled: "Bekor qilindi",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Do'kon Xaridlari (Markazdan Olib Ketish)</h2>
          <p className="text-xs text-slate-400 mt-1">
            O'quvchilar tomonidan Tillo tangalariga olingan sovg'alar va ularni topshirish kodi
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300"
        >
          <option value="all">Barcha xaridlar</option>
          <option value="pending">Kutilmoqda (Topshirilmagan)</option>
          <option value="delivered">Topshirilgan</option>
          <option value="cancelled">Bekor qilingan</option>
        </select>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          placeholder="Qabul qilish kodi (TL-...) yoki o'quvchi ismi bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          className="bg-slate-900 border-slate-800 text-white"
        />
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Xaridlar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Qabul kodi</th>
                  <th className="p-4">O'quvchi / Telefon</th>
                  <th className="p-4">Mahsulotlar</th>
                  <th className="p-4">Jami summa</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Topshirish amali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((ord) => {
                  const pickupCode =
                    ord.deliveryInfo?.trackingCode || (ord.orderId ? `TL-${ord.orderId.substring(6, 11)}` : "TL-ORDER");
                  const isDelivered = ord.status === "delivered";

                  return (
                    <tr key={ord.orderId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm font-black text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          {pickupCode}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300">
                        <div className="font-bold text-white">{ord.deliveryInfo?.fullName}</div>
                        <div className="text-[11px] text-slate-400">{ord.deliveryInfo?.phone}</div>
                      </td>

                      <td className="p-4 text-slate-300">
                        {ord.items.map((i, idx) => (
                          <div key={idx} className="font-semibold text-white">
                            {i.title} <span className="text-slate-400 font-normal">x{i.quantity} dona</span>
                          </div>
                        ))}
                      </td>

                      <td className="p-4 font-bold text-amber-400">
                        {formatCoins(ord.totalCoins)} Tillo
                      </td>

                      <td className="p-4 text-slate-400">{formatDate(ord.createdAt)}</td>

                      <td className="p-4">
                        <Badge variant={statusVariants[ord.status] || "neutral"}>
                          {statusLabels[ord.status] || ord.status}
                        </Badge>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {!isDelivered && ord.status !== "cancelled" ? (
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={isUpdating === ord.orderId}
                            onClick={() => handleMarkAsDelivered(ord.orderId)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Topshirildi
                          </Button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Amal bajarilgan</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
