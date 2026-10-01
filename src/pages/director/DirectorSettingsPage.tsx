import React, { useEffect, useState } from "react";
import {
  Settings,
  Coins,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";

export const DirectorSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings
  const [coinsPerCorrectAnswer, setCoinsPerCorrectAnswer] = useState(1);
  const [coinsPenaltyOnAbandon, setCoinsPenaltyOnAbandon] = useState(5);
  const [defaultLevelUnlockCost, setDefaultLevelUnlockCost] = useState(50);
  const [defaultMonthlyTuition, setDefaultMonthlyTuition] = useState(500000);
  const [defaultGroupCapacity, setDefaultGroupCapacity] = useState(20);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, "system_settings", "global_config"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.coinsPerCorrectAnswer !== undefined) setCoinsPerCorrectAnswer(data.coinsPerCorrectAnswer);
          if (data.coinsPenaltyOnAbandon !== undefined) setCoinsPenaltyOnAbandon(data.coinsPenaltyOnAbandon);
          if (data.defaultLevelUnlockCost !== undefined) setDefaultLevelUnlockCost(data.defaultLevelUnlockCost);
          if (data.defaultMonthlyTuition !== undefined) setDefaultMonthlyTuition(data.defaultMonthlyTuition);
          if (data.defaultGroupCapacity !== undefined) setDefaultGroupCapacity(data.defaultGroupCapacity);
          if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
        }
      } catch (err) {
        console.warn("Could not load system settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await setDoc(
        doc(db, "system_settings", "global_config"),
        {
          coinsPerCorrectAnswer: Number(coinsPerCorrectAnswer),
          coinsPenaltyOnAbandon: Number(coinsPenaltyOnAbandon),
          defaultLevelUnlockCost: Number(defaultLevelUnlockCost),
          defaultMonthlyTuition: Number(defaultMonthlyTuition),
          defaultGroupCapacity: Number(defaultGroupCapacity),
          maintenanceMode,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || "director",
        },
        { merge: true }
      );

      success("Tizim sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      toastError(err.message || "Sozlamalarni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">Platforma Sozlamalari</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Tillo tangalari, to'lov tariflari, guruh sig'imlari va tizim parametrlari
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Tillo Gamification Rules */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Tillo Tizimi Qoidalari</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Har bir to'g'ri javob uchun Tillo"
              type="number"
              value={coinsPerCorrectAnswer}
              onChange={(e) => setCoinsPerCorrectAnswer(Number(e.target.value))}
              required
            />
            <Input
              label="Testdan chiqib ketgandagi jarima (Tillo)"
              type="number"
              value={coinsPenaltyOnAbandon}
              onChange={(e) => setCoinsPenaltyOnAbandon(Number(e.target.value))}
              required
            />
            <Input
              label="Yangi darajani ochish narxi (Tillo)"
              type="number"
              value={defaultLevelUnlockCost}
              onChange={(e) => setDefaultLevelUnlockCost(Number(e.target.value))}
              required
            />
          </div>
        </Card>

        {/* LMS & Tuition Rules */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Shield className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">LMS & Ta'lim Markazi Standartlari</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standart oylik o'quv to'lovi (UZS)"
              type="number"
              value={defaultMonthlyTuition}
              onChange={(e) => setDefaultMonthlyTuition(Number(e.target.value))}
              required
            />
            <Input
              label="Standart guruh sig'imi (o'quvchi soni)"
              type="number"
              value={defaultGroupCapacity}
              onChange={(e) => setDefaultGroupCapacity(Number(e.target.value))}
              required
            />
          </div>
        </Card>

        {/* System Mode */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-white">Texnik ishlar rejimi (Maintenance Mode)</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Yoqilsa, oddiy o'quvchilar uchun platformaga kirish vaqtinchalik cheklanadi
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Sozlamalarni Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
};
