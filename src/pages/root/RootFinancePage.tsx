import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Coins,
  DollarSign,
  Shield,
  CreditCard,
  Receipt,
  RefreshCw,
  Save,
  CheckCircle,
} from "lucide-react";
import { rootService, RootSystemMetrics } from "../../services/rootService";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { formatCoins } from "../../utils";

export const RootFinancePage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [metrics, setMetrics] = useState<RootSystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Financial config
  const [dailyBonus, setDailyBonus] = useState(15);
  const [testPassReward, setTestPassReward] = useState(25);
  const [tilloExchangeRate, setTilloExchangeRate] = useState(100); // 1 Tillo = 100 UZS
  const [maxWeeklyReward, setMaxWeeklyReward] = useState(1000);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [m, settings] = await Promise.all([
        rootService.getSystemMetrics(),
        rootService.getGlobalSettings(),
      ]);
      setMetrics(m);
      if (settings) {
        if (settings.dailyBonus !== undefined) setDailyBonus(settings.dailyBonus);
        if (settings.testPassReward !== undefined) setTestPassReward(settings.testPassReward);
        if (settings.tilloExchangeRate !== undefined) setTilloExchangeRate(settings.tilloExchangeRate);
        if (settings.maxWeeklyReward !== undefined) setMaxWeeklyReward(settings.maxWeeklyReward);
      }
    } catch (err: any) {
      toastError(err.message || "Moliya ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await rootService.updateGlobalSettings({
        dailyBonus: Number(dailyBonus),
        testPassReward: Number(testPassReward),
        tilloExchangeRate: Number(tilloExchangeRate),
        maxWeeklyReward: Number(maxWeeklyReward),
      });
      success("Moliyaviy va Tillo sozlamalari yangilandi!");
    } catch (err: any) {
      toastError(err.message || "Sozlamalarni saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Global Moliya va Xazina Nazorati
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tillo tangalari emissiyasi, mukofotlar koeffitsiyentlari va markaziy xazina sozlamalari
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadData(true)}
          isLoading={refreshing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          className="bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
        >
          Yangilash
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#0B0F1F]/90 border-emerald-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Muomaladagi Tillo
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-300">
            {formatCoins(metrics?.totalCoins || 0)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Foydalanuvchilar hisoblaridagi jami balans
          </p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-indigo-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tangalarning So'mdagi Qiymati
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-indigo-300">
            {formatCoins((metrics?.totalCoins || 0) * tilloExchangeRate)} UZS
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            1 Tillo = {tilloExchangeRate} so'm kursi bo'yicha
          </p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-purple-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Xazina Holati
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-300">
            BARQAROR
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Cheksiz oliy emissiya ruxsati faol
          </p>
        </Card>
      </div>

      {/* Global Configuration Form */}
      <Card className="bg-[#0B0F1F]/90 border-slate-800 p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Tillo Tangalari va Mukofot Qoidalari
          </h2>
          <p className="text-xs text-slate-400">
            Ushbu qoidalar butun platforma bo'ylab barcha direktorlar va o'quvchilar uchun amal qiladi
          </p>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Kunlik Kirish Bonusi (Tillo)
              </label>
              <Input
                type="number"
                value={dailyBonus}
                onChange={(e) => setDailyBonus(Number(e.target.value))}
              />
              <p className="text-[11px] text-slate-500 mt-1">Har kuni dasturga kirganda beriladigan tanga</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Testdan Muvaffaqiyatli O'tish Mukofoti (Tillo)
              </label>
              <Input
                type="number"
                value={testPassReward}
                onChange={(e) => setTestPassReward(Number(e.target.value))}
              />
              <p className="text-[11px] text-slate-500 mt-1">Har bir yakunlangan daraja uchun mukofot</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                1 Tillo Qiymati (UZS da)
              </label>
              <Input
                type="number"
                value={tilloExchangeRate}
                onChange={(e) => setTilloExchangeRate(Number(e.target.value))}
              />
              <p className="text-[11px] text-slate-500 mt-1">Do'kon mahsulotlari va hisob-kitoblar uchun kurs</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Haftalik Maksimal Mukofot Limiti (Tillo)
              </label>
              <Input
                type="number"
                value={maxWeeklyReward}
                onChange={(e) => setMaxWeeklyReward(Number(e.target.value))}
              />
              <p className="text-[11px] text-slate-500 mt-1">Bir haftada erishish mumkin bo'lgan maksimal bonus</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none font-bold"
            >
              Sozlamalarni Saqlash
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
