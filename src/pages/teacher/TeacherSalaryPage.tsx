import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Users,
  Briefcase,
  Sparkles,
  Info,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { financeService } from "../../services/financeService";
import { groupService } from "../../services/groupService";
import { TeacherSalary, Group } from "../../types";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const TeacherSalaryPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [currentSalary, setCurrentSalary] = useState<TeacherSalary | null>(null);
  const [allHistory, setAllHistory] = useState<TeacherSalary[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSalaryData = async (isSilent = false) => {
    if (!user?.uid) return;
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [salariesList, teacherGroups] = await Promise.all([
        financeService.getTeacherSalaries({ teacherId: user.uid }),
        groupService.getTeacherGroups(user.uid).catch(() => []),
      ]);

      setAllHistory(salariesList);
      setGroups(teacherGroups);

      // Find salary for selected month
      let monthSal = salariesList.find((s) => s.month === selectedMonth) || null;
      if (!monthSal) {
        try {
          const recalculated = await financeService.autoRecalculateMonthSalaries(selectedMonth);
          monthSal = recalculated.find((s) => s.teacherId === user.uid) || null;
        } catch {}
      }
      setCurrentSalary(monthSal);
    } catch (err: any) {
      console.warn("loadSalaryData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSalaryData();
    const handleSync = () => loadSalaryData(true);
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, [user?.uid, selectedMonth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-sky-500" />
      </div>
    );
  }

  const isPaid = currentSalary?.status === "PAID";
  const isApproved = currentSalary?.status === "APPROVED";
  const calculatedSalary = currentSalary?.calculatedSalary || 0;
  const paidSalary = currentSalary?.paidSalary || 0;
  const remainingSalary = currentSalary?.remainingSalary || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Mening Oyligim & Daromadlarim
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Shaxsiy hisoblangan maoshingiz, guruhlar tushumi, bonuslar va to'lov holatini kuzating
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-sky-500/30 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-slate-400 font-semibold">Oylik davri:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => loadSalaryData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-slate-700 hover:border-sky-500/40 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-400" : ""}`} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Card 1: Hisoblangan Oylik */}
        <Card className="p-5 bg-gradient-to-br from-sky-950/40 to-slate-900 border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Hisoblangan Oylik</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatNumber(calculatedSalary)} <span className="text-xs font-semibold text-sky-400">UZS</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            {selectedMonth} oyi uchun jami summa
          </p>
        </Card>

        {/* Card 2: To'langan Summa */}
        <Card className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">To'langan (Qabul qilingan)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {formatNumber(paidSalary)} <span className="text-xs font-semibold text-emerald-400">UZS</span>
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            Kassadan berilgan mablag'
          </p>
        </Card>

        {/* Card 3: Qolgan Qoldiq */}
        <Card className="p-5 bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Qolgan Qoldiq</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            {formatNumber(remainingSalary)} <span className="text-xs font-semibold text-amber-400">UZS</span>
          </h3>
          <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
            Kutilayotgan qoldiq maosh
          </p>
        </Card>

        {/* Card 4: To'lov Holati */}
        <Card className="p-5 bg-slate-900 border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">To'lov Holati</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Info className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block text-xs font-black uppercase px-3 py-1 rounded-full border ${
                isPaid
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : isApproved
                  ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              }`}
            >
              {isPaid
                ? "To'liq To'langan"
                : isApproved
                ? "Tasdiqlangan"
                : "Hisoblanmoqda"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {isPaid
              ? "Oylik to'liq berildi"
              : isApproved
              ? "Direktor tomonidan tasdiqlangan"
              : "Oy yakuniga ko'ra yangilanadi"}
          </p>
        </Card>
      </div>

      {/* Salary Breakdown & Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Breakdown */}
        <Card className="lg:col-span-2 p-6 bg-slate-900/90 border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-400" />
              Oylik Hisob-Kitob Tafsilotlari ({selectedMonth})
            </h3>
            <span className="text-xs font-bold text-slate-400">
              O'qituvchi: <span className="text-white">{user?.displayName}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Oylik Tizimi Turi:</span>
              <p className="text-sm font-bold text-white capitalize">
                {currentSalary?.salaryType === "percentage"
                  ? `Foizli (${currentSalary.percentage || 50}%)`
                  : currentSalary?.salaryType === "fixed"
                  ? "Qat'iy Oklad (Fixed)"
                  : "Aralash (Oklad + Foiz)"}
              </p>
              <p className="text-[11px] text-slate-500">
                Guruhlar to'loviga bog'langan oylik tarifi
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Guruhlardan Yig'ilgan To'lov:</span>
              <p className="text-sm font-bold text-emerald-400">
                {formatNumber(currentSalary?.collectedPayment || 0)} UZS
              </p>
              <p className="text-[11px] text-slate-500">
                Shu oy guruhlaringiz o'quvchilari to'lagan summa
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Rag'batlantirish (Bonus):</span>
              <p className="text-sm font-bold text-emerald-400">
                +{formatNumber(currentSalary?.bonus || 0)} UZS
              </p>
              <p className="text-[11px] text-slate-500">Qo'shimcha mukofot yoki bonuslar</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-slate-400 block font-medium">Ushlanmalar (Jarima):</span>
              <p className="text-sm font-bold text-rose-400">
                -{formatNumber(currentSalary?.deduction || 0)} UZS
              </p>
              <p className="text-[11px] text-slate-500">Kechikish yoki boshqa ushlanmalar</p>
            </div>
          </div>

          {/* Note or explanation if available */}
          {currentSalary?.note && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
              <span className="text-slate-400 font-semibold block mb-0.5">Direktor izohi:</span>
              <p className="text-slate-300">{currentSalary.note}</p>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800">
            <span>
              Oxirgi yangilanish:{" "}
              {currentSalary?.updatedAt
                ? new Date(currentSalary.updatedAt).toLocaleDateString("uz-UZ", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Ma'lumot mavjud emas"}
            </span>
            <span className="text-sky-400 font-semibold">Farg'oniy Maktabi LMS ERP</span>
          </div>
        </Card>

        {/* Right 1 Col: Groups List & Student Count */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-sky-400" />
              Sizning Guruhlaringiz ({groups.length} ta)
            </h3>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-400">Biriktirilgan guruhlar topilmadi</p>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => {
                  const studentCount = g.studentIds?.length || g.currentStudentsCount || 0;
                  return (
                    <div
                      key={g.groupId}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{g.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {studentCount} nafar o'quvchi
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-sky-400">
                          {formatNumber(g.monthlyPrice || 500000)} UZS
                        </span>
                        <span className="text-[10px] text-slate-500 block">oylik kurs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            💡 Guruhlaringizdagi o'quvchilar to'lovlari qabul qilinishi bilan oylik daromadingiz real vaqtda avtomatik hisoblab boriladi.
          </div>
        </Card>
      </div>

      {/* History Table: Previous Months */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          O'tgan Oylar Daromadlari Tarixi
        </h3>

        {allHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Hozircha oylik hisoboti yozuvlari mavjud emas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Oylik Davri</th>
                  <th className="p-3">Guruh Tushumi</th>
                  <th className="p-3">Hisoblangan Maosh</th>
                  <th className="p-3">To'langan Summa</th>
                  <th className="p-3">Qoldiq</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allHistory.map((h) => (
                  <tr
                    key={h.salaryId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      h.month === selectedMonth ? "bg-sky-500/5 font-semibold" : ""
                    }`}
                  >
                    <td className="p-3 font-bold text-white">{h.month}</td>
                    <td className="p-3 font-medium text-slate-300">
                      {formatNumber(h.collectedPayment || 0)} UZS
                    </td>
                    <td className="p-3 font-bold text-sky-400">
                      {formatNumber(h.calculatedSalary || 0)} UZS
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      {formatNumber(h.paidSalary || 0)} UZS
                    </td>
                    <td className="p-3 font-medium text-amber-400">
                      {formatNumber(h.remainingSalary || 0)} UZS
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          h.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : h.status === "APPROVED"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {h.status === "PAID"
                          ? "To'langan"
                          : h.status === "APPROVED"
                          ? "Tasdiqlangan"
                          : "Kutilmoqda"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedMonth(h.month)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-600 hover:text-white transition-all border border-slate-700"
                      >
                        Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherSalaryPage;
