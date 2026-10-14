import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarCheck,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Briefcase,
  GraduationCap,
  BookOpen,
  DollarSign,
  Download,
  Printer,
  Plus,
  RefreshCw,
  Phone,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Percent,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Group, Payment, PaymentStatus, Subject, UserProfile } from "../../types";
import { financeService, StudentPaymentStatusItem } from "../../services/financeService";
import { groupService } from "../../services/groupService";
import { adminService } from "../../services/adminService";
import { teacherService } from "../../services/teacherService";
import { subjectService } from "../../services/subjectService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { formatNumber } from "../../utils";
import { PaymentReceiptModal } from "../../components/admin/PaymentReceiptModal";

export const AdminMonthlyPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  // Core data states
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState<StudentPaymentStatusItem[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Selected Month (Defaults to current month YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "PAID" | "DEBT" | "PARTIAL">("all");
  const [sortBy, setSortBy] = useState<"name" | "debt_desc" | "paid_desc" | "group">("name");

  // Payment Recording Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payStudent, setPayStudent] = useState<StudentPaymentStatusItem | null>(null);
  const [payGroupId, setPayGroupId] = useState("");
  const [payAmount, setPayAmount] = useState(500000);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState("Naqd");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("PAID");
  const [payNote, setPayNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // SMS / Copy reminder notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Month formatter for human-readable title
  const formattedMonthTitle = useMemo(() => {
    if (!selectedMonth) return "";
    const [y, m] = selectedMonth.split("-");
    const monthNames = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
    ];
    const monthIndex = parseInt(m, 10) - 1;
    return `${monthNames[monthIndex] || m} ${y}-yil`;
  }, [selectedMonth]);

  // Load static filter data (Teachers, Groups, Subjects) once
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [allTeachers, allGroups, allSubjects] = await Promise.all([
          teacherService.getAllTeachers().catch(() => []),
          groupService.getGroups().catch(() => []),
          subjectService.getSubjects().catch(() => []),
        ]);
        setTeachers(allTeachers);
        setGroups(allGroups.filter((g) => g.status === "active" || !g.status));
        setSubjects(allSubjects);
      } catch (err) {
        console.warn("Failed to load filters data", err);
      }
    };
    loadFiltersData();
  }, []);

  // Load student payment data whenever selectedMonth changes
  const loadPaymentData = async () => {
    try {
      setLoading(true);
      const [statusRes, allPayments] = await Promise.all([
        financeService.getStudentPaymentStatusByMonth(selectedMonth),
        financeService.getPayments({ month: selectedMonth }).catch(() => []),
      ]);
      setDataList(statusRes.items);
      setPayments(allPayments);
    } catch (err: any) {
      console.error("loadPaymentData error:", err);
      toastError(err?.message || "To'lov ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, [selectedMonth]);

  // Listen to global finance updates
  useEffect(() => {
    const handleFinanceUpdated = () => {
      loadPaymentData();
    };
    window.addEventListener("finance_updated", handleFinanceUpdated);
    return () => {
      window.removeEventListener("finance_updated", handleFinanceUpdated);
    };
  }, [selectedMonth]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newMonth);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  };

  // Filter available groups based on selected teacher if any
  const availableGroups = useMemo(() => {
    if (selectedTeacherId === "all") return groups;
    return groups.filter((g) => g.teacherId === selectedTeacherId);
  }, [groups, selectedTeacherId]);

  // Filtered and sorted data list
  const filteredList = useMemo(() => {
    let result = [...dataList];

    // Filter by Teacher
    if (selectedTeacherId !== "all") {
      result = result.filter((item) => item.teacherId === selectedTeacherId);
    }

    // Filter by Group
    if (selectedGroupId !== "all") {
      result = result.filter((item) => item.groupId === selectedGroupId);
    }

    // Filter by Subject
    if (selectedSubjectId !== "all") {
      result = result.filter((item) => item.subjectId === selectedSubjectId);
    }

    // Filter by Status
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.studentName.toLowerCase().includes(q) ||
          (item.studentPhone && item.studentPhone.toLowerCase().includes(q)) ||
          (item.studentLogin && item.studentLogin.toLowerCase().includes(q)) ||
          item.groupName.toLowerCase().includes(q) ||
          item.teacherName.toLowerCase().includes(q) ||
          (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
          (item.receiptNumber && item.receiptNumber.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "debt_desc") {
        return b.debtAmount - a.debtAmount;
      }
      if (sortBy === "paid_desc") {
        return b.paidAmount - a.paidAmount;
      }
      if (sortBy === "group") {
        return a.groupName.localeCompare(b.groupName);
      }
      return a.studentName.localeCompare(b.studentName);
    });

    return result;
  }, [
    dataList,
    selectedTeacherId,
    selectedGroupId,
    selectedSubjectId,
    statusFilter,
    searchQuery,
    sortBy,
  ]);

  // Aggregate statistics based on current filtered view
  const stats = useMemo(() => {
    const totalStudents = filteredList.length;
    const paidList = filteredList.filter((i) => i.status === "PAID");
    const debtList = filteredList.filter((i) => i.status === "DEBT");
    const partialList = filteredList.filter((i) => i.status === "PARTIAL");

    const totalCollected = filteredList.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalDebt = filteredList.reduce((sum, i) => sum + i.debtAmount, 0);
    const totalPlanned = filteredList.reduce((sum, i) => sum + i.monthlyFee, 0);

    const paidPercentage = totalStudents > 0 ? Math.round((paidList.length / totalStudents) * 100) : 0;
    const collectedPercentage = totalPlanned > 0 ? Math.round((totalCollected / totalPlanned) * 100) : 0;

    return {
      totalStudents,
      paidCount: paidList.length,
      debtCount: debtList.length,
      partialCount: partialList.length,
      totalCollected,
      totalDebt,
      totalPlanned,
      paidPercentage,
      collectedPercentage,
    };
  }, [filteredList]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTeacherId("all");
    setSelectedGroupId("all");
    setSelectedSubjectId("all");
    setStatusFilter("all");
    setSortBy("name");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedTeacherId !== "all" ||
    selectedGroupId !== "all" ||
    selectedSubjectId !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "name";

  // Open Pay Modal for a specific student row
  const handleOpenPayModal = (item: StudentPaymentStatusItem) => {
    setPayStudent(item);
    setPayGroupId(item.groupId);
    setPayAmount(item.debtAmount > 0 ? item.debtAmount : item.monthlyFee);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod("Naqd");
    setPayStatus("PAID");
    setPayNote(`${item.groupName} guruhi uchun to'lov`);
    setIsPayModalOpen(true);
  };

  // Submit payment from modal
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudent) return;

    if (!payAmount || payAmount <= 0) {
      toastError("To'lov summasi 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      setSavingPayment(true);
      const newPayment = await financeService.recordPayment({
        studentId: payStudent.studentId,
        studentName: payStudent.studentName,
        groupId: payGroupId || payStudent.groupId,
        groupName: payStudent.groupName,
        teacherId: payStudent.teacherId,
        teacherName: payStudent.teacherName,
        subjectId: payStudent.subjectId || "",
        amount: Number(payAmount),
        month: selectedMonth,
        paymentDate: payDate,
        paymentMethod: payMethod,
        adminId: user?.uid || "admin",
        adminName: user?.displayName || "Admin",
        status: payStatus,
        note: payNote,
      });

      success(`${payStudent.studentName} uchun to'lov muvaffaqiyatli qabul qilindi!`);
      setIsPayModalOpen(false);
      setReceiptPayment(newPayment);
      await loadPaymentData();
    } catch (err: any) {
      console.error("Payment save error:", err);
      toastError(err?.message || "To'lovni saqlashda xatolik yuz berdi");
    } finally {
      setSavingPayment(false);
    }
  };

  // Copy debt reminder text to clipboard
  const handleCopyReminder = (item: StudentPaymentStatusItem) => {
    const text = `Assalomu alaykum, hurmatli ${item.studentName}! Sizning "${item.groupName}" kursi bo'yicha ${formattedMonthTitle} oyi uchun ${formatNumber(item.debtAmount)} so'm to'lov qarzdorligingiz mavjud. Iltimos, o'z vaqtida to'lovni amalga oshirishingizni so'raymiz.`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.studentId + item.groupId);
    success("Eslatma matni nusxalandi!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Export filtered table to Excel
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      toastError("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const rows = filteredList.map((item, index) => ({
      "№": index + 1,
      "O'quvchi": item.studentName,
      "Telefon": item.studentPhone || "—",
      "Guruh": item.groupName,
      "Fan": item.subjectName || "—",
      "O'qituvchi": item.teacherName,
      "Oylik to'lov (so'm)": item.monthlyFee,
      "To'langan summa (so'm)": item.paidAmount,
      "Qarz qoldig'i (so'm)": item.debtAmount,
      "Holat": item.status === "PAID" ? "To'langan" : item.status === "PARTIAL" ? "Qisman to'langan" : "Qarzdor",
      "To'lov sanasi": item.lastPaymentDate || "—",
      "Chek raqami": item.receiptNumber || "—",
      "To'lov usuli": item.paymentMethod || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Oylik To'lovlar");

    // Auto-width for columns
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 16 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];

    const fileName = `Oylik_Tolovlar_${selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    success(`Excel fayl yuklab olindi: ${fileName}`);
  };

  // Print filtered table
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Oylik To'lov Nazorati
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {formattedMonthTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tanlangan oy bo'yicha o'quvchilarning to'lov qilgan yoki qarzdorlik holatini nazorat qilish, o'qituvchi va guruhlar bo'yicha tahlil
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Month Navigator */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Month Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              title="Oldingi oy"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextMonth}
              title="Keyingi oy"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="ml-1 px-2 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Joriy oy
            </button>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
            title="Excel formatida yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excelga yuklash</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-all shadow-sm"
            title="Chop etish"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Chop etish</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadPaymentData}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all shadow-sm disabled:opacity-50"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI / Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jami O'quvchilar */}
        <Card className="p-4 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Jami O'quvchilar</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-white">{stats.totalStudents}</h3>
            <span className="text-xs font-semibold text-slate-400">nafar</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Kutilgan reja:</span>
            <span className="font-bold text-slate-300">{formatNumber(stats.totalPlanned)} so'm</span>
          </p>
        </Card>

        {/* Card 2: To'lov Qilganlar */}
        <Card className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">To'lov Qilganlar (To'liq)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-white">{stats.paidCount}</h3>
              <span className="text-xs font-semibold text-emerald-400">nafar</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {stats.paidPercentage}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.paidPercentage)}%` }}
              />
            </div>
            <p className="text-[11px] text-emerald-400/90 mt-1.5 flex items-center justify-between">
              <span>Yig'ilgan summa:</span>
              <span className="font-bold">{formatNumber(stats.totalCollected)} so'm</span>
            </p>
          </div>
        </Card>

        {/* Card 3: Qarzdorlar */}
        <Card className="p-4 bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/20 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300">Qarzdor O'quvchilar</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-rose-400">{stats.debtCount}</h3>
              <span className="text-xs font-semibold text-rose-400">nafar</span>
            </div>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
              {stats.totalStudents > 0 ? Math.round((stats.debtCount / stats.totalStudents) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-rose-300/90 mt-2.5 flex items-center justify-between border-t border-rose-500/20 pt-1.5">
            <span>Umumiy qarz miqdori:</span>
            <span className="font-bold text-rose-400">{formatNumber(stats.totalDebt)} so'm</span>
          </p>
        </Card>

        {/* Card 4: Qisman To'laganlar */}
        <Card className="p-4 bg-gradient-to-br from-amber-950/30 to-slate-900 border-amber-500/20 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">Qisman To'laganlar</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-white">{stats.partialCount}</h3>
              <span className="text-xs font-semibold text-amber-400">nafar</span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {stats.totalStudents > 0 ? Math.round((stats.partialCount / stats.totalStudents) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-amber-300/80 mt-2.5 flex items-center justify-between border-t border-amber-500/20 pt-1.5">
            <span>Kassa qamrovi:</span>
            <span className="font-bold text-white">{stats.collectedPercentage}% to'plandi</span>
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Search Query */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ism, telefon, login..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* 2. Teacher Filter */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                // Reset group filter if teacher changed and group doesn't belong to new teacher
                if (e.target.value !== "all") {
                  const teacherGroupIds = groups
                    .filter((g) => g.teacherId === e.target.value)
                    .map((g) => g.groupId);
                  if (selectedGroupId !== "all" && !teacherGroupIds.includes(selectedGroupId)) {
                    setSelectedGroupId("all");
                  }
                }
              }}
              className="w-full bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                Barcha O'qituvchilar
              </option>
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid} className="bg-slate-900 text-white">
                  {t.displayName || "Ustoz"}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Group Filter */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                Barcha Guruhlar
              </option>
              {availableGroups.map((g) => (
                <option key={g.groupId} value={g.groupId} className="bg-slate-900 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Subject Filter */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                Barcha Fanlar
              </option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Status Filter */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">
                Barcha Holatlar
              </option>
              <option value="PAID" className="bg-slate-900 text-emerald-400">
                To'lov qilganlar (To'liq)
              </option>
              <option value="DEBT" className="bg-slate-900 text-rose-400">
                Qarzdorlar (To'lamagan)
              </option>
              <option value="PARTIAL" className="bg-slate-900 text-amber-400">
                Qisman to'laganlar
              </option>
            </select>
          </div>
        </div>

        {/* Secondary controls: Sort + Clear filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Tartiblash:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="name">O'quvchi ismi (A-Z)</option>
              <option value="debt_desc">Qarz summasi bo'yicha (Ko'pdan kamga)</option>
              <option value="paid_desc">To'langan summa bo'yicha (Ko'pdan kamga)</option>
              <option value="group">Guruh nomi bo'yicha</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Natija: <b className="text-white">{filteredList.length}</b> nafar o'quvchi
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-brand-400 hover:text-brand-300 font-semibold underline text-xs"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" className="text-brand-500" />
          <p className="text-xs text-slate-400 mt-3">{formattedMonthTitle} ma'lumotlari yuklanmoqda...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/50 border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Hech qanday o'quvchi topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tanlangan oy ({formattedMonthTitle}) yoki filtrlash parametrlariga mos keluvchi o'quvchi mavjud emas.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4"
            >
              Filtrlarni bekor qilish
            </Button>
          )}
        </Card>
      ) : (
        <Card className="bg-slate-900/90 border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 w-12 text-center">№</th>
                  <th className="p-3.5">O'quvchi</th>
                  <th className="p-3.5">Guruh & Fan</th>
                  <th className="p-3.5">O'qituvchi</th>
                  <th className="p-3.5">Oylik To'lov</th>
                  <th className="p-3.5">Shu Oy To'langan</th>
                  <th className="p-3.5">Qarz Qoldig'i</th>
                  <th className="p-3.5 text-center">Holat</th>
                  <th className="p-3.5">Oxirgi To'lov / Chek</th>
                  <th className="p-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item, idx) => {
                  const isPaid = item.status === "PAID";
                  const isDebt = item.status === "DEBT";
                  const isPartial = item.status === "PARTIAL";

                  // Find full payment object for receipt modal if payment exists
                  const matchingPayment =
                    (item.paymentId ? payments.find((p) => p.paymentId === item.paymentId) : null) ||
                    payments.find(
                      (p) =>
                        p.studentId === item.studentId &&
                        (p.groupId === item.groupId || !p.groupId) &&
                        (p.month?.slice(0, 7) === selectedMonth || p.paymentDate?.slice(0, 7) === selectedMonth)
                    );

                  return (
                    <tr
                      key={`${item.studentId}_${item.groupId}_${idx}`}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="p-3.5 text-center text-slate-500 font-semibold">{idx + 1}</td>

                      {/* Student Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs border border-slate-700 flex-shrink-0">
                            {item.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{item.studentName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              {item.studentPhone ? (
                                <a
                                  href={`tel:${item.studentPhone}`}
                                  className="hover:text-brand-400 transition-colors flex items-center gap-1"
                                  title="Telefon qilish"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{item.studentPhone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-500">Tel ko'rsatilmagan</span>
                              )}
                              {item.studentLogin && (
                                <span className="text-slate-500">@{item.studentLogin}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group & Subject */}
                      <td className="p-3.5">
                        <div>
                          <p className="font-bold text-slate-200">{item.groupName}</p>
                          {item.subjectName && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60 mt-0.5">
                              {item.subjectName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Teacher */}
                      <td className="p-3.5">
                        <span className="text-slate-300 font-medium">{item.teacherName}</span>
                      </td>

                      {/* Monthly Fee */}
                      <td className="p-3.5 font-semibold text-white">
                        {formatNumber(item.monthlyFee)}{" "}
                        <span className="text-[10px] text-slate-400">so'm</span>
                      </td>

                      {/* Paid Amount */}
                      <td className="p-3.5">
                        {item.paidAmount > 0 ? (
                          <span className="font-bold text-emerald-400">
                            +{formatNumber(item.paidAmount)}{" "}
                            <span className="text-[10px] text-slate-400">so'm</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">0 so'm</span>
                        )}
                      </td>

                      {/* Debt Amount */}
                      <td className="p-3.5">
                        {item.debtAmount > 0 ? (
                          <span className="font-bold text-rose-400">
                            -{formatNumber(item.debtAmount)}{" "}
                            <span className="text-[10px] text-slate-400">so'm</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Qarzi yo'q
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isPartial
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              To'langan
                            </>
                          ) : isPartial ? (
                            <>
                              <Clock className="w-3 h-3" />
                              Qisman
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Qarzdor
                            </>
                          )}
                        </span>
                      </td>

                      {/* Last Payment & Receipt */}
                      <td className="p-3.5">
                        {item.lastPaymentDate ? (
                          <div>
                            <p className="text-slate-200 font-medium">{item.lastPaymentDate}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {item.receiptNumber && (
                                <span className="text-[10px] font-mono text-brand-400">
                                  #{item.receiptNumber}
                                </span>
                              )}
                              {item.paymentMethod && (
                                <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">
                                  {item.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">To'lov qilinmagan</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Receipt button if payment exists */}
                          {matchingPayment && (
                            <button
                              type="button"
                              onClick={() => setReceiptPayment(matchingPayment)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Chekni ko'rish / chiqarish"
                            >
                              <Printer className="w-4 h-4 text-slate-300" />
                            </button>
                          )}

                          {/* Reminder button for debtors */}
                          {(isDebt || isPartial) && (
                            <button
                              type="button"
                              onClick={() => handleCopyReminder(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Qarzdorlik eslatmasini nusxalash"
                            >
                              {copiedId === item.studentId + item.groupId ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Quick Pay Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(item)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              isDebt || isPartial
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                            }`}
                            title="To'lov qabul qilish"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{isDebt || isPartial ? "To'lov olish" : "Yana to'lov"}</span>
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

      {/* Pay Modal */}
      {isPayModalOpen && payStudent && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="O'quvchi to'lovini qabul qilish"
        >
          <form onSubmit={handleSavePayment} className="space-y-4">
            {/* Student info box */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">O'quvchi:</span>
                <span className="text-xs font-bold text-white">{payStudent.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Guruh:</span>
                <span className="text-xs font-semibold text-brand-400">{payStudent.groupName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">O'qituvchi:</span>
                <span className="text-xs text-slate-300">{payStudent.teacherName}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                <span className="text-xs text-slate-400">Qarz qoldig'i:</span>
                <span className="text-xs font-black text-rose-400">
                  {formatNumber(payStudent.debtAmount)} so'm
                </span>
              </div>
            </div>

            {/* Target Month */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                To'lov Oyi
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                To'lov Summasi (UZS)
              </label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                min={1000}
                step={1000}
                required
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPayAmount(payStudent.debtAmount > 0 ? payStudent.debtAmount : payStudent.monthlyFee)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                >
                  Qarz miqdori ({formatNumber(payStudent.debtAmount > 0 ? payStudent.debtAmount : payStudent.monthlyFee)})
                </button>
                <button
                  type="button"
                  onClick={() => setPayAmount(payStudent.monthlyFee)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                >
                  Oylik to'liq ({formatNumber(payStudent.monthlyFee)})
                </button>
              </div>
            </div>

            {/* Payment Date & Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  To'lov Sanasi
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  To'lov Usuli
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Naqd">Naqd pul</option>
                  <option value="Humo / Uzcard">Humo / Uzcard</option>
                  <option value="Click">Click</option>
                  <option value="Payme">Payme</option>
                  <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                To'lov Holati
              </label>
              <select
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="PAID">To'liq to'langan (PAID)</option>
                <option value="PARTIAL">Qisman to'langan (PARTIAL)</option>
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Izoh / Qo'shimcha ma'lumot
              </label>
              <input
                type="text"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="Ixtiyoriy izoh..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
                disabled={savingPayment}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={savingPayment}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                To'lovni tasdiqlash
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Receipt Modal */}
      {receiptPayment && (
        <PaymentReceiptModal
          payment={receiptPayment}
          isOpen={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
        />
      )}
    </div>
  );
};

export default AdminMonthlyPaymentsPage;
