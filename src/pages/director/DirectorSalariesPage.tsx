import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileCheck,
  CreditCard,
  User,
  Sparkles,
  Trash2,
  Filter,
  Receipt,
  ArrowUpRight,
  TrendingUp,
  Edit3,
} from "lucide-react";
import { Group, Payment, SalaryStatus, SalaryType, TeacherSalary, UserProfile } from "../../types";
import { financeService } from "../../services/financeService";
import { teacherService } from "../../services/teacherService";
import { groupService } from "../../services/groupService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const DirectorSalariesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [monthPayments, setMonthPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [autoCalculating, setAutoCalculating] = useState(false);

  // Modal: Calculate Salary
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType>("percentage");
  const [percentage, setPercentage] = useState(40);
  const [fixedSalary, setFixedSalary] = useState(2500000);
  const [collectedPayment, setCollectedPayment] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoCollectedInfo, setAutoCollectedInfo] = useState<string | null>(null);

  // Modal: Pay Salary
  const [payModalSalary, setPayModalSalary] = useState<TeacherSalary | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  // Modal: Delete Salary Confirmation
  const [salaryToDelete, setSalaryToDelete] = useState<TeacherSalary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salList, teacherList, allGroups, paymentsList] = await Promise.all([
        financeService.getTeacherSalaries({ month: selectedMonth }),
        teacherService.getAllTeachers().catch(() => []),
        groupService.getGroups().catch(() => []),
        financeService.getPayments({ month: selectedMonth }).catch(() => []),
      ]);

      setTeachers(teacherList);
      setGroups(allGroups);
      setMonthPayments(paymentsList);

      // Always synchronize salaries with current collected payments and percentage rates
      let finalSalList: TeacherSalary[] = [];
      if (teacherList.length > 0) {
        finalSalList = await financeService.autoCalculateAllTeacherSalaries(
          selectedMonth,
          teacherList,
          allGroups
        );
      } else {
        finalSalList = salList;
      }
      setSalaries(finalSalList);
    } catch (err: any) {
      toastError(err.message || "Maoshlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCalculateAll = async () => {
    try {
      setAutoCalculating(true);
      const computed = await financeService.autoCalculateAllTeacherSalaries(
        selectedMonth,
        teachers,
        groups
      );
      setSalaries(computed);
      success("Barcha o'qituvchilar oyligi to'plangan tushum va foiz stavkasi asosida avtomatik hisoblandi!");
    } catch (err: any) {
      toastError(err.message || "Avtomatik hisoblashda xatolik");
    } finally {
      setAutoCalculating(false);
    }
  };

  const openEditModal = (sal: TeacherSalary) => {
    setTeacherId(sal.teacherId);
    setSalaryType(sal.salaryType);
    setPercentage(sal.percentage ?? 50);
    setFixedSalary(sal.fixedSalary ?? 0);
    setCollectedPayment(sal.collectedPayment);
    setBonus(sal.bonus ?? 0);
    setDeduction(sal.deduction ?? 0);
    setNote(sal.note ?? "");
    setAutoCollectedInfo(
      `${sal.teacherName} uchun ${selectedMonth} oyida o'quvchilardan yig'ilgan to'lov: ${formatNumber(sal.collectedPayment)} UZS`
    );
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, [selectedMonth]);

  // When teacher is selected in calculate modal, auto-calculate collected tuition & load default rates
  const applyTeacherDefaults = (tId: string) => {
    setTeacherId(tId);
    const t = teachers.find((u) => u.uid === tId);
    if (!t) return;

    // 1. Find teacher's groups
    const teacherGroups = groups.filter(
      (g) =>
        g.teacherId === tId ||
        (Array.isArray(t.groupIds) && t.groupIds.includes(g.groupId)) ||
        (Array.isArray(t.teachingGroups) && t.teachingGroups.some((tg) => tg && tg.groupId === g.groupId))
    );
    const teacherGroupIds = new Set(teacherGroups.map((g) => g.groupId));

    // 2. Sum paid tuition fees for this teacher's groups (strictly PAID status)
    const totalCollected = monthPayments
      .filter(
        (p) =>
          teacherGroupIds.has(p.groupId) &&
          p.status === "PAID" &&
          Number(p.amount) > 0
      )
      .reduce((sum, p) => sum + Number(p.amount), 0);

    setCollectedPayment(totalCollected);

    // 3. Set salary type and rates from teacher's profile
    const defaultType = (t.salaryType as SalaryType) || "percentage";
    setSalaryType(defaultType);

    if (defaultType === "percentage") {
      setPercentage(t.salaryValue || 40);
    } else if (defaultType === "fixed") {
      setFixedSalary(t.salaryFixedAmount || t.salaryValue || 3000000);
    } else {
      setPercentage(t.salaryValue || 30);
      setFixedSalary(t.salaryFixedAmount || 1500000);
    }

    if (teacherGroups.length > 0) {
      setAutoCollectedInfo(
        `${t.displayName}ning ${teacherGroups.length} ta guruhidan (${teacherGroups.map((g) => g.name).join(", ")}) ${selectedMonth} oyida yig'ilgan to'lov: ${formatNumber(totalCollected)} UZS`
      );
    } else {
      setAutoCollectedInfo(
        `${t.displayName}ga hozircha guruhlar biriktirilmagan. To'lov summasini qo'lda kiritishingiz mumkin.`
      );
    }
  };

  const openCalculateModal = () => {
    const firstTeacher = teachers[0]?.uid || "";
    setBonus(0);
    setDeduction(0);
    setNote("");
    setIsModalOpen(true);
    if (firstTeacher) {
      applyTeacherDefaults(firstTeacher);
    } else {
      setTeacherId("");
      setCollectedPayment(0);
      setAutoCollectedInfo(null);
    }
  };

  const handleCalculateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      toastError("O'qituvchini tanlang");
      return;
    }

    const t = teachers.find((u) => u.uid === teacherId);

    try {
      setSaving(true);
      await financeService.calculateAndSaveTeacherSalary({
        teacherId,
        teacherName: t?.displayName || "O'qituvchi",
        month: selectedMonth,
        salaryType,
        percentage: Number(percentage),
        fixedSalary: Number(fixedSalary),
        bonus: Number(bonus),
        deduction: Number(deduction),
        collectedPayment: Number(collectedPayment),
        note,
      });

      success("O'qituvchi maoshi hisoblandi va saqlandi!");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (salaryId: string) => {
    if (!user?.uid) return;
    try {
      await financeService.approveSalary(salaryId, user.uid);
      success("Oylik maosh muvaffaqiyatli tasdiqlandi!");
      loadData();
    } catch (err: any) {
      toastError(err.message || "Tasdiqlashda xatolik");
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSalary) return;

    if (payAmount <= 0) {
      toastError("To'lov summasi 0 dan katta bo'lishi kerak");
      return;
    }

    if (payAmount > payModalSalary.remainingSalary) {
      toastError(`To'lov summasi qoldiqdan (${formatNumber(payModalSalary.remainingSalary)} UZS) oshmasligi kerak`);
      return;
    }

    try {
      setPaying(true);
      await financeService.paySalary(payModalSalary.salaryId, Number(payAmount), payNote);
      success("Maosh to'lovi muvaffaqiyatli qayd etildi va xarajatlarga yozildi!");
      setPayModalSalary(null);
      setPayNote("");
      loadData();
    } catch (err: any) {
      toastError(err.message || "To'lovni qayd etishda xatolik");
    } finally {
      setPaying(false);
    }
  };

  const handleDeleteSalary = async () => {
    if (!salaryToDelete) return;
    try {
      setDeleting(true);
      await financeService.deleteSalary(salaryToDelete.salaryId);
      success("Maosh yozuvi muvaffaqiyatli o'chirildi");
      setSalaryToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  // Live preview formula in Calculate modal
  let calculatedPreview = 0;
  if (salaryType === "percentage") {
    calculatedPreview = Math.round(collectedPayment * (percentage / 100));
  } else if (salaryType === "fixed") {
    calculatedPreview = Number(fixedSalary || 0);
  } else {
    calculatedPreview = Math.round(Number(fixedSalary || 0) + collectedPayment * (percentage / 100));
  }
  const finalPreview = Math.max(0, calculatedPreview + Number(bonus) - Number(deduction));

  // Filtered salaries list
  const filteredSalaries = salaries.filter((sal) => {
    const matchSearch = sal.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || sal.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary figures
  const totalCalculated = salaries.reduce((acc, s) => acc + (s.calculatedSalary || 0), 0);
  const totalPaid = salaries.reduce((acc, s) => acc + (s.paidSalary || 0), 0);
  const totalRemaining = salaries.reduce((acc, s) => acc + (s.remainingSalary || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              O'qituvchilar Oylik Maoshi
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ustozlar oylik maoshini hisoblash (foiz, fiks, bonus, ushlanma), tasdiqlash, qisman/to'liq to'lash va qoldiq nazorati
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-amber-500"
          />

          <Button
            onClick={handleAutoCalculateAll}
            isLoading={autoCalculating}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-xs"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            ⚡ Barcha Oyliklarni Avtomatik Hisoblash
          </Button>

          <Button onClick={openCalculateModal} variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Qo'lda Kiritish
          </Button>
        </div>
      </div>

      {/* Top Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Jami Hisoblangan Oyliklar */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/20 border border-amber-500/30 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Jami Hisoblangan Oyliklar
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">
              {formatNumber(totalCalculated)}{" "}
              <span className="text-xs font-bold text-amber-400">UZS</span>
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Oylik fondi ({selectedMonth})</span>
              <span className="text-amber-300 font-semibold">{salaries.length} nafar o'qituvchi</span>
            </div>
          </div>
        </Card>

        {/* 2. Berilgan / To'langan Oyliklar */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/20 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Berilgan Oyliklar (Chiqim)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400">
              {formatNumber(totalPaid)}{" "}
              <span className="text-xs font-bold">UZS</span>
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Kassadan to'lab berilgan</span>
              <span className="text-emerald-400 font-semibold">{salaries.filter(s => (s.paidSalary || 0) > 0).length} ta to'lov</span>
            </div>
          </div>
        </Card>

        {/* 3. To'lanishi Kerak Qoldiq Oylik */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/95 to-rose-950/20 border border-rose-500/30 shadow-lg shadow-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> To'lanishi Kerak Qoldiq Oylik
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-400">
              {formatNumber(totalRemaining)}{" "}
              <span className="text-xs font-bold">UZS</span>
            </h3>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Ustozlarga to'lanmagan qarz</span>
              <span className="text-rose-400 font-semibold">{salaries.filter(s => (s.remainingSalary || 0) > 0).length} nafarida qoldiq</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'qituvchi ismi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="PENDING">Kutilmoqda (Tasdiqlanmagan)</option>
            <option value="APPROVED">Tasdiqlangan (To'lovga tayyor)</option>
            <option value="PAID">To'liq to'langan</option>
          </select>
        </div>
      </Card>

      {/* Salaries Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-amber-500" />
        </div>
      ) : filteredSalaries.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <DollarSign className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Maoshlar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedMonth} oyi uchun maosh hisoblanmagan yoki qidiruv bo'yicha ma'lumot chiqmadi.
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <Button
              onClick={handleAutoCalculateAll}
              isLoading={autoCalculating}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              ⚡ Barcha Oyliklarni Avtomatik Hisoblash
            </Button>
            <Button onClick={openCalculateModal} variant="outline" size="sm">
              Qo'lda Kiritish
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">O'qituvchi va Guruhlar</th>
                  <th className="p-3.5">O'quvchilardan Tushum</th>
                  <th className="p-3.5">Foiz Stavkasi</th>
                  <th className="p-3.5">Jami Hisoblangan Oylik</th>
                  <th className="p-3.5">Berilgan Oylik</th>
                  <th className="p-3.5">To'lanishi Kerak Qoldiq</th>
                  <th className="p-3.5">Holat</th>
                  <th className="p-3.5 text-right">Direktor Qarori / To'lov</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSalaries.map((sal) => {
                  const teacherObj = teachers.find((t) => t.uid === sal.teacherId);
                  const teacherGroups = groups.filter(
                    (g) =>
                      g.teacherId === sal.teacherId ||
                      (Array.isArray(teacherObj?.groupIds) && teacherObj.groupIds.includes(g.groupId)) ||
                      (Array.isArray(teacherObj?.teachingGroups) &&
                        teacherObj.teachingGroups.some((tg) => tg && tg.groupId === g.groupId))
                  );

                  return (
                    <tr key={sal.salaryId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-white text-sm">{sal.teacherName}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacherGroups.length > 0 ? (
                            teacherGroups.map((g) => (
                              <span
                                key={g.groupId}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300/90 border border-amber-500/20 font-medium"
                              >
                                {g.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Guruh biriktirilmagan
                            </span>
                          )}
                        </div>
                        {sal.note && (
                          <p className="text-[10px] text-amber-300/80 italic mt-1 truncate max-w-[180px]">
                            {sal.note}
                          </p>
                        )}
                      </td>

                      <td className="p-3.5">
                        <p className="text-white font-bold text-sm">
                          {formatNumber(sal.collectedPayment)} UZS
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {selectedMonth} oyi to'lovlari
                        </span>
                      </td>

                      <td className="p-3.5">
                        {sal.salaryType === "percentage" ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-block">
                              {sal.percentage}% ulush
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {formatNumber(sal.collectedPayment)} × {sal.percentage}%
                            </p>
                          </div>
                        ) : sal.salaryType === "fixed" ? (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 inline-block">
                            Fiks: {formatNumber(sal.fixedSalary || 0)} UZS
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 inline-block">
                              Fiks + {sal.percentage}%
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {formatNumber(sal.fixedSalary || 0)} + ({sal.percentage}%)
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="text-base font-black text-amber-400 block">
                          {formatNumber(sal.calculatedSalary)} UZS
                        </span>
                        {(sal.bonus > 0 || sal.deduction > 0) && (
                          <div className="text-[10px] mt-0.5">
                            {sal.bonus > 0 && <span className="text-emerald-400">+{formatNumber(sal.bonus)} </span>}
                            {sal.deduction > 0 && <span className="text-rose-400">-{formatNumber(sal.deduction)}</span>}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <p className="text-emerald-400 font-black text-sm">
                          {formatNumber(sal.paidSalary || 0)} UZS
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {sal.paidSalary > 0 ? "Kassadan to'langan" : "To'lanmagan"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {sal.remainingSalary > 0 ? (
                          <span className="text-sm font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 rounded-lg inline-block">
                            {formatNumber(sal.remainingSalary)} UZS
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg inline-block">
                            Qoldiq yo'q (0 UZS)
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            sal.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : sal.status === "APPROVED"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {sal.status === "PAID"
                            ? "To'liq to'landi"
                            : sal.status === "APPROVED"
                            ? "Tasdiqlangan"
                            : "Kutilmoqda"}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sal.status === "PENDING" && (
                            <Button
                              size="sm"
                              className="bg-sky-600 hover:bg-sky-700 text-xs font-bold"
                              onClick={() => handleApprove(sal.salaryId)}
                            >
                              Tasdiqlash
                            </Button>
                          )}

                          {sal.remainingSalary > 0 && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                              onClick={() => {
                                setPayModalSalary(sal);
                                setPayAmount(sal.remainingSalary);
                                setPayNote("Oylik to'lovi");
                              }}
                            >
                              💳 Oylik Berish
                            </Button>
                          )}

                          {sal.remainingSalary === 0 && (
                            <span className="text-[11px] text-emerald-400 font-bold px-2 py-1">
                              ✓ To'langan
                            </span>
                          )}

                          {/* Edit / Bonus button */}
                          <button
                            onClick={() => openEditModal(sal)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                            title="Tahrirlash / Bonus qo'shish"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => setSalaryToDelete(sal)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Maoshni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Calculate Teacher Salary */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="O'qituvchi Maoshini Hisoblash"
      >
        <form onSubmit={handleCalculateSalary} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              O'qituvchini tanlang
            </label>
            <select
              value={teacherId}
              onChange={(e) => applyTeacherDefaults(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">O'qituvchini tanlang...</option>
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.displayName} ({t.specialty || "Fan o'qituvchisi"})
                </option>
              ))}
            </select>
            {autoCollectedInfo && (
              <p className="text-[11px] text-amber-400/90 mt-1.5 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                💡 {autoCollectedInfo}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Maosh To'lash Tizimi
            </label>
            <select
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value as SalaryType)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="percentage">Foiz stavkasi (Masalan: 40% o'quvchilar to'lovidan)</option>
              <option value="fixed">Fiks bazaviy oylik (Masalan: 3,000,000 UZS)</option>
              <option value="mixed">Aralash tizim (Fiks bazaviy summa + Foiz stavkasi)</option>
            </select>
          </div>

          <Input
            label="O'quvchilardan yig'ilgan to'lov summasi (UZS)"
            type="number"
            value={collectedPayment}
            onChange={(e) => setCollectedPayment(Number(e.target.value))}
            helperText="Guruh o'quvchilarining joriy oyda to'lagan jami summasi"
            required
          />

          {salaryType !== "fixed" && (
            <Input
              label="O'qituvchi ulush foizi (%)"
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              required
            />
          )}

          {salaryType !== "percentage" && (
            <Input
              label="Fiks bazaviy summa (UZS)"
              type="number"
              value={fixedSalary}
              onChange={(e) => setFixedSalary(Number(e.target.value))}
              required
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bonus (Rag'batlantirish)"
              type="number"
              value={bonus}
              onChange={(e) => setBonus(Number(e.target.value))}
            />
            <Input
              label="Ushlanma / Jarima"
              type="number"
              value={deduction}
              onChange={(e) => setDeduction(Number(e.target.value))}
            />
          </div>

          <Input
            label="Izoh / Eslatma (Ixtiyoriy)"
            placeholder="Masalan: Yaxshi natijalar uchun 200 ming bonus qo'shildi"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* Formula calculation preview box */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-500/30 text-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-amber-400 block tracking-wider">
              Hisoblash Formulalari Natijasi:
            </span>
            <div className="flex items-center justify-between text-slate-300">
              <span>Bazaviy ulush:</span>
              <strong className="text-white">{formatNumber(calculatedPreview)} UZS</strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Bonus / Ushlanma:</span>
              <strong className="text-emerald-400">
                +{formatNumber(bonus)} / -{formatNumber(deduction)} UZS
              </strong>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-black text-sm">
              <span className="text-white">Yakuniy Hisoblangan Oylik:</span>
              <span className="text-amber-400">{formatNumber(finalPreview)} UZS</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saving}>
              Maoshni Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pay Salary */}
      <Modal
        isOpen={!!payModalSalary}
        onClose={() => setPayModalSalary(null)}
        title="Maosh To'lovini Qayd Etish"
      >
        <form onSubmit={handlePay} className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">O'qituvchi:</span>
              <span className="font-bold text-white text-sm">{payModalSalary?.teacherName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Oylik hisob davri:</span>
              <span className="font-semibold text-slate-200">{payModalSalary?.month}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Jami hisoblangan:</span>
              <span className="font-bold text-white">{formatNumber(payModalSalary?.calculatedSalary || 0)} UZS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Oldin to'langan:</span>
              <span className="font-semibold text-emerald-400">{formatNumber(payModalSalary?.paidSalary || 0)} UZS</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-amber-400 font-bold">To'lanishi kerak qoldiq:</span>
              <span className="font-black text-rose-400 text-sm">{formatNumber(payModalSalary?.remainingSalary || 0)} UZS</span>
            </div>
          </div>

          <Input
            label="To'lanayotgan summa (UZS)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            max={payModalSalary?.remainingSalary}
            helperText={`Qisman yoki to'liq to'lashingiz mumkin. Maksimal: ${formatNumber(payModalSalary?.remainingSalary || 0)} UZS`}
            required
          />

          <Input
            label="To'lov usuli / Izoh"
            placeholder="Masalan: Karta orqali o'tkazildi yoki Naqd berildi"
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayModalSalary(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={paying}>
              To'lovni Tasdiqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete Salary */}
      <Modal
        isOpen={!!salaryToDelete}
        onClose={() => setSalaryToDelete(null)}
        title="Maoshni O'chirish"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Rostdan ham <strong className="text-white">{salaryToDelete?.teacherName}</strong> uchun{" "}
            <strong className="text-white">{salaryToDelete?.month}</strong> oylik maosh hisob-kitobini o'chirmoqchimisiz?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSalaryToDelete(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleDeleteSalary} isLoading={deleting}>
              O'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
