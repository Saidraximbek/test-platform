import React, { useState } from "react";
import { Trophy, RefreshCw, CheckCircle2 } from "lucide-react";
import { leaderboardService } from "../../services/leaderboardService";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";

export const AdminLeaderboardPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await leaderboardService.recalculateLeaderboards();
      success("Barcha yetakchilar jadvali muvaffaqiyatli qayta hisoblandi!");
    } catch (err: any) {
      toastError(err.message || "Hisoblashda xatolik");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reyting Boshqaruvi</h2>
        <p className="text-xs text-slate-400 mt-1">
          Foydalanuvchilar natijalarini to'g'ri javoblar, testlar soni va tangalar balansi asosida hisoblash
        </p>
      </div>

      <Card className="p-8 bg-slate-900 border-slate-800 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Reytingni Majburiy Yangilash</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Yetakchilar jadvali har soatda avtomatik Cloud Function orqali hisoblanadi. Agar natijalarni darhol yangilashni istasangiz quyidagi tugmani bosing.
          </p>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            isLoading={isRecalculating}
            onClick={handleRecalculate}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Reytingni Hozir Qayta Hisoblash
          </Button>
        </div>
      </Card>
    </div>
  );
};
