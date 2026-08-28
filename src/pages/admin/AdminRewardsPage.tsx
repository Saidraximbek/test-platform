import React, { useState } from "react";
import { Award, Gift, Sparkles, Send } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";

export const AdminRewardsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const nowObj = new Date();
  const weekNum = Math.ceil(
    ((nowObj.getTime() - new Date(nowObj.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  );
  const defaultWeekId = `${nowObj.getFullYear()}-W${weekNum < 10 ? `0${weekNum}` : weekNum}`;

  const [weekId, setWeekId] = useState(defaultWeekId);
  const [userId, setUserId] = useState("");
  const [rewardType, setRewardType] = useState<"coins" | "real_gift" | "discount_voucher">("coins");
  const [amount, setAmount] = useState<number>(100);
  const [giftTitle, setGiftTitle] = useState("");
  const [reason, setReason] = useState("Haftalik reytingda 1-o'rin sohibi");
  const [isGranting, setIsGranting] = useState(false);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !weekId.trim() || !reason.trim()) {
      toastError("User ID, hafta va sabab kiritilishi shart");
      return;
    }

    setIsGranting(true);
    try {
      await adminService.grantWeeklyReward({
        weekId,
        userId: userId.trim(),
        rewardType,
        amount: rewardType === "coins" ? Number(amount) : null,
        giftTitle: giftTitle.trim() || null,
        reason: reason.trim(),
      });

      success("Haftalik mukofot foydalanuvchiga muvaffaqiyatli berildi!");
      setUserId("");
      setGiftTitle("");
    } catch (err: any) {
      toastError(err.message || "Mukofot berishda xatolik");
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Haftalik Mukofotlar Boshqaruvi</h2>
        <p className="text-xs text-slate-400 mt-1">
          Haftalik reyting g'oliblarini mukofotlash va Tillo tangalarini taqsimlash
        </p>
      </div>

      <Card className="p-6 bg-slate-900 border-slate-800">
        <form onSubmit={handleGrant} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hafta identifikatori (YYYY-WW)"
              placeholder="2026-W35"
              value={weekId}
              onChange={(e) => setWeekId(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mukofot turi
              </label>
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-2.5 text-white"
              >
                <option value="coins">Tillo tangalari (Coins)</option>
                <option value="real_gift">Haqiqiy sovg'a (Real Gift)</option>
                <option value="discount_voucher">Chegirma vaucheri</option>
              </select>
            </div>
          </div>

          <Input
            label="G'olib foydalanuvchi ID (UID)"
            placeholder="Foydalanuvchi UID sini kiriting..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />

          {rewardType === "coins" ? (
            <Input
              label="Tillo tanga miqdori"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          ) : (
            <Input
              label="Sovg'a nomi / Vaucher kodi"
              placeholder="Masalan: Kitob to'plami yoki PRO vaucher"
              value={giftTitle}
              onChange={(e) => setGiftTitle(e.target.value)}
            />
          )}

          <Input
            label="Mukofot sababi"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <Button
              type="submit"
              variant="amber"
              isLoading={isGranting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Mukofotni topshirish
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
