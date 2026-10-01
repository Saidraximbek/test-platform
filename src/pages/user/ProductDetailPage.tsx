import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Info,
} from "lucide-react";
import { shopService } from "../../services/shopService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Product } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { CoinBadge } from "../../components/common/CoinBadge";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { formatCoins } from "../../utils";

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user, isSuspended } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Form fields for Pickup
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (user?.displayName && !fullName) setFullName(user.displayName);
    if (user?.phoneNumber && !phone) setPhone(user.phoneNumber);
  }, [user]);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        const prod = await shopService.getProductById(productId);
        setProduct(prod);
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h3 className="text-base font-bold">Mahsulot topilmadi</h3>
        <Button onClick={() => navigate("/shop")} className="mt-4">
          Do'konga qaytish
        </Button>
      </div>
    );
  }

  const unitPrice = Math.round(
    product.priceCoins * (1 - (product.discountPercent || 0) / 100)
  );
  const totalCost = unitPrice * quantity;
  const userBalance = user?.coinBalance || 0;
  const hasEnoughCoins = userBalance >= totalCost;
  const isOutOfStock = product.stock <= 0;

  const onPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) {
      toastError("Hisobingiz to'xtatilganligi sababli xarid qila olmaysiz");
      return;
    }
    if (!productId) return;
    if (!fullName.trim() || !phone.trim()) {
      toastError("Ism-familiya va telefon raqamingizni kiriting");
      return;
    }

    setIsPurchasing(true);
    // Generate unique 5-digit pickup code
    const pickupCode = `TL-${Math.floor(10000 + Math.random() * 90000)}`;
    const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      await shopService.purchaseProduct(
        productId,
        quantity,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          region: "O'quv markaz",
          address: note.trim() || "O'quv markazdan olib ketish",
          targetBranch: null,
          trackingCode: pickupCode,
        },
        idempotencyKey
      );

      success("Xarid muvaffaqiyatli amalga oshirildi! Qabul qilish kodi yaratildi.");
      setShowPurchaseModal(false);
      navigate("/orders");
    } catch (err: any) {
      toastError(err.message || "Xaridni amalga oshirishda xatolik yuz berdi");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <button
        onClick={() => navigate("/shop")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Do'konga qaytish
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 aspect-square flex items-center justify-center">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-20 h-20 text-slate-400" />
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-3 py-1 rounded-full uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {product.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Zaxirada: <strong className="text-slate-700 dark:text-slate-300">{product.stock} dona</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Mahsulot narxi</span>
              <span className="text-2xl font-black text-amber-500">
                {formatCoins(unitPrice)} Tillo
              </span>
              {product.discountPercent > 0 && (
                <span className="text-xs text-slate-400 line-through ml-2">
                  {formatCoins(product.priceCoins)}
                </span>
              )}
            </div>

            <CoinBadge amount={userBalance} size="sm" />
          </div>

          {/* Pickup Notice */}
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <MapPin className="w-4 h-4 text-sky-500" /> O'quv markazimizdan olib ketish
            </div>
            <p className="text-[11px] leading-relaxed">
              Ushbu mahsulot yetkazib berilmaydi. Xariddan so'ng buyurtma kodini o'quv markazimiz ma'muriyatiga ko'rsatib, sovg'angizni olib ketishingiz mumkin.
            </p>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-200">Mahsulot tavsifi</h4>
            <p>{product.description}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="amber"
              size="lg"
              className="w-full"
              disabled={isOutOfStock}
              onClick={() => setShowPurchaseModal(true)}
              rightIcon={<ShoppingBag className="w-5 h-5" />}
            >
              {isOutOfStock ? "Hozirda tugagan" : "Hozir Xarid Qilish"}
            </Button>
          </div>
        </div>
      </div>

      {/* Purchase / Pickup Modal Form */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => !isPurchasing && setShowPurchaseModal(false)}
        title="Xaridni tasdiqlash"
      >
        <form onSubmit={onPurchaseSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Mahsulot:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {product.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Birlik narxi:</span>
              <span className="font-bold text-amber-500">{formatCoins(unitPrice)} Tillo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jami narx:</span>
              <span className="font-black text-sm text-amber-500">
                {formatCoins(totalCost)} Tillo
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
              <span className="text-slate-500">Sizning balansingiz:</span>
              <span className={`font-bold ${hasEnoughCoins ? "text-emerald-600" : "text-rose-500"}`}>
                {formatCoins(userBalance)} Tillo
              </span>
            </div>
          </div>

          <Input
            label="Miqdor (dona)"
            type="number"
            min="1"
            max={Math.min(10, product.stock)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />

          <Input
            label="O'quvchi ismi va familiyasi"
            placeholder="Ali Valiyev"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Telefon raqami"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Qo'shimcha izoh (Ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: Soat 15:00 da darsdan so'ng olib ketaman"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-2.5 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Xariddan so'ng sizga maxsus <strong>Qabul qilish kodi</strong> beriladi. Uni o'quv markazimiz xodimiga ko'rsatib sovg'angizni olasiz.</span>
          </div>

          {!hasEnoughCoins && (
            <p className="text-xs text-rose-500 font-bold text-center">
              Mablag' yetarli emas! Testlar ishlab Tillo tangalari to'plang.
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={isPurchasing}
              onClick={() => setShowPurchaseModal(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="amber"
              isLoading={isPurchasing}
              disabled={!hasEnoughCoins}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Xaridni tasdiqlash ({formatCoins(totalCost)} Tillo)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
