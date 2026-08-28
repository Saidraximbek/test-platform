import React, { useEffect, useState } from "react";
import { Settings, Save, ShieldAlert } from "lucide-react";
import { adminService } from "../../services/adminService";
import { useToast } from "../../context/ToastContext";
import { SystemSettings } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";

export const AdminSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<SystemSettings>({
    questionsPerTest: 20,
    testDurationMinutes: 40,
    coinsPerCorrectAnswer: 1,
    coinsPenaltyOnAbandon: 5,
    defaultLevelUnlockCost: 50,
    weeklyRewardDefaultCoins: 100,
    maxActiveSessionsPerUser: 1,
    maintenanceMode: false,
    leaderboardWeights: {
      correctAnswersWeight: 10,
      testsCompletedWeight: 2,
      coinBalanceWeight: 1,
    },
    updatedAt: null,
    updatedBy: "system",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const config = await adminService.getSystemSettings();
        if (config) {
          setSettings(config);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminService.updateSystemSettings(settings);
      success("Tizim sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      toastError(err.message || "Sozlamalarni saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-white">Tizim Sozlamalari (Global Config)</h2>
        <p className="text-xs text-slate-400 mt-1">
          Test davomiyligi, Tillo mukofotlari, jarimalar va reyting og'irliklarini sozlash
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Test Rules */}
        <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Test Qoidalari va Vaqtlar</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standart test savollari soni"
              type="number"
              value={settings.questionsPerTest}
              onChange={(e) => setSettings({ ...settings, questionsPerTest: Number(e.target.value) })}
            />

            <Input
              label="Standart test davomiyligi (Daqiqa)"
              type="number"
              value={settings.testDurationMinutes}
              onChange={(e) => setSettings({ ...settings, testDurationMinutes: Number(e.target.value) })}
            />
          </div>
        </Card>

        {/* Tillo Coin Economics */}
        <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Tillo Tangalari Iqtisodiyoti</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Har bir to'g'ri javob uchun (Tillo)"
              type="number"
              value={settings.coinsPerCorrectAnswer}
              onChange={(e) => setSettings({ ...settings, coinsPerCorrectAnswer: Number(e.target.value) })}
            />

            <Input
              label="Testni tark etish jarimasi (Tillo)"
              type="number"
              value={settings.coinsPenaltyOnAbandon}
              onChange={(e) => setSettings({ ...settings, coinsPenaltyOnAbandon: Number(e.target.value) })}
            />

            <Input
              label="Standart daraja ochish narxi (Tillo)"
              type="number"
              value={settings.defaultLevelUnlockCost}
              onChange={(e) => setSettings({ ...settings, defaultLevelUnlockCost: Number(e.target.value) })}
            />
          </div>
        </Card>

        {/* Leaderboard Formula Weights */}
        <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Reyting Ballini Hisoblash Koeffitsientlari</h3>
          <p className="text-xs text-slate-400">
            Formula: (To'g'ri javoblar * A) + (Testlar soni * B) + (Tillo balansi * C)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="To'g'ri javob og'irligi (A)"
              type="number"
              value={settings.leaderboardWeights.correctAnswersWeight}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  leaderboardWeights: {
                    ...settings.leaderboardWeights,
                    correctAnswersWeight: Number(e.target.value),
                  },
                })
              }
            />

            <Input
              label="Testlar soni og'irligi (B)"
              type="number"
              value={settings.leaderboardWeights.testsCompletedWeight}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  leaderboardWeights: {
                    ...settings.leaderboardWeights,
                    testsCompletedWeight: Number(e.target.value),
                  },
                })
              }
            />

            <Input
              label="Tillo balansi og'irligi (C)"
              type="number"
              value={settings.leaderboardWeights.coinBalanceWeight}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  leaderboardWeights: {
                    ...settings.leaderboardWeights,
                    coinBalanceWeight: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card className="p-6 bg-slate-900 border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white">Texnik ishlar rejimi (Maintenance Mode)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Yoqilsa, oddiy foydalanuvchilar test boshlay olmaydi
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="w-5 h-5 rounded text-brand-600 border-slate-700 bg-slate-800"
          />
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" isLoading={isSaving} rightIcon={<Save className="w-4 h-4" />}>
            Sozlamalarni Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
};
