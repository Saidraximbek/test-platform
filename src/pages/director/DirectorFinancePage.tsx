import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Award,
  Calendar,
  Filter,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building,
  CreditCard,
  Plus,
  Trash2,
  Printer,
} from "lucide-react";
import { financeService, FinancialSummary } from "../../services/financeService";
import { Payment, Expense, TeacherSalary } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { PaymentReceiptModal } from "../../components/admin/PaymentReceiptModal";
import { useToast } from "../../context/ToastContext";
import { formatNumber } from "../../utils";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

interface CashTransaction {
  id: string;
  originalId: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "SALARY";
  title: string;
  subtitle?: string;
  categoryOrMethod: string;
  amount: number;
  recordedBy?: string;
  paymentObj?: Payment;
  expenseObj?: Expense;
}

export const DirectorFinancePage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals for deleting payment/expense & viewing receipt
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Ledger Filter & Search
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE" | "SALARY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [sum, payList, expList, salList] = await Promise.all([
        financeService.getFinancialSummary(selectedMonth),
        financeService.getPayments({ month: selectedMonth }).catch(() => []),
        financeService.getExpenses({ month: selectedMonth }).catch(() => []),
        financeService.getTeacherSalaries({ month: selectedMonth }).catch(() => []),
      ]);

      setSummary(sum);
      setPayments(payList);
      setExpenses(expList);
      setSalaries(salList);
    } catch (err: any) {
      console.error("Error loading financial balance page:", err);
      setError(err?.message || "Moliyaviy ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData(true);
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, [selectedMonth]);

  // Delete Handlers
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await financeService.deletePayment(paymentToDelete.paymentId);
      success("To'lov muvaffaqiyatli o'chirildi! Kassa balansi va oyliklar qayta hisoblandi.");
      setPaymentToDelete(null);
      await loadData(true);
    } catch (err: any) {
      toastError(err.message || "To'lovni o'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setDeleting(true);
      await financeService.deleteExpense(expenseToDelete.expenseId);
      success("Xarajat muvaffaqiyatli o'chirildi!");
      setExpenseToDelete(null);
      await loadData(true);
    } catch (err: any) {
      toastError(err.message || "Xarajatni o'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  // Build unified transactions ledger
  const transactions: CashTransaction[] = useMemo(() => {
    const list: CashTransaction[] = [];

    // 1. Payments (Tushumlar)
    payments
      .filter((p) => p.status === "PAID" && Number(p.amount) > 0)
      .forEach((p) => {
        list.push({
          id: `pay_${p.paymentId}`,
          originalId: p.paymentId,
          date: p.paymentDate || p.createdAt?.slice(0, 10) || selectedMonth + "-01",
          type: "INCOME",
          title: p.studentName || "O'quvchi to'lovi",
          subtitle: p.groupName ? `${p.groupName} guruhi` : "O'quv kursi to'lovi",
          categoryOrMethod: p.receiptNumber || "To'lov",
          amount: Number(p.amount),
          recordedBy: p.adminName || "Admin",
          paymentObj: p,
        });
      });

    // 2. Operational Expenses (category !== 'salary' to avoid double display)
    expenses
      .filter((e) => e.category !== "salary" && Number(e.amount) > 0)
      .forEach((e) => {
        const catMap: Record<string, string> = {
          rent: "Ijara to'lovi",
          marketing: "Marketing / Reklama",
          utilities: "Kommunal xizmatlar",
          equipment: "Jihozlar / Ta'mir",
          software: "Dasturiy ta'minot",
          tax: "Soliqlar",
          other: "Boshqa xarajat",
        };
        list.push({
          id: `exp_${e.expenseId}`,
          originalId: e.expenseId,
          date: e.date || e.createdAt?.slice(0, 10) || selectedMonth + "-01",
          type: "EXPENSE",
          title: e.description || "Markaz xarajati",
          subtitle: catMap[e.category] || e.category,
          categoryOrMethod: catMap[e.category] || "Xarajat",
          amount: Number(e.amount),
          recordedBy: e.createdByName || "Direktor",
          expenseObj: e,
        });
      });

    // 3. Paid Teacher Salaries
    salaries
      .filter((s) => (s.paidSalary || 0) > 0)
      .forEach((s) => {
        list.push({
          id: `sal_${s.salaryId}`,
          originalId: s.salaryId,
          date: s.paidAt?.slice(0, 10) || selectedMonth + "-01",
          type: "SALARY",
          title: `${s.teacherName} (Maosh)`,
          subtitle: `${s.month} oyi uchun to'langan oylik`,
          categoryOrMethod: "O'qituvchi maoshi",
          amount: Number(s.paidSalary),
          recordedBy: "Direktor",
        });
      });

    // Sort newest to oldest
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, expenses, salaries, selectedMonth]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        t.title.toLowerCase().includes(query) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(query)) ||
        t.categoryOrMethod.toLowerCase().includes(query);
      return matchType && matchQuery;
    });
  }, [transactions, typeFilter, searchQuery]);

  // Total filtered summary
  const filteredIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );
  const filteredOutflow = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type !== "INCOME")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Sana", "Turi", "Tavsif / Ism", "Toifa", "Summa (UZS)", "Mas'ul"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type === "INCOME" ? "Tushum (Kirim)" : t.type === "SALARY" ? "Maosh (Chiqim)" : "Operatsion (Chiqim)",
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.categoryOrMethod.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.recordedBy || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Moliyaviy_Balans_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-28 gap-3">
        <Spinner size="lg" className="text-amber-500" />
        <p className="text-xs text-slate-400 font-medium">Moliyaviy balans va kassa hisoboti yuklanmoqda...</p>
      </div>
    );
  }

  const netIncome = summary?.netIncome || 0;
  const isProfitable = netIncome >= 0;
  const totalOutflow = (summary?.totalExpenses || 0) + (summary?.totalSalariesPaid || 0);
  const profitMargin =
    (summary?.totalRevenue || 0) > 0
      ? Math.round((netIncome / (summary?.totalRevenue || 1)) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Page Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Moliyaviy Balans & Kassa Tahlili
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Ta'lim markazining real kassa qoldig'i, daromad-xarajatlar hisoboti, kesh-oqimi va majburiyatlari
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400 font-semibold">Tahlil oyi:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-300" : ""}`} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="CSV / Excel ga yuklab olish"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eksport CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg font-bold"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Main Treasury Balances Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Selected Month Cash Treasury Balance */}
        <Card className="p-6 bg-gradient-to-br from-[#0D1424] via-slate-900 to-[#161F38] border-2 border-amber-500/40 shadow-xl shadow-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-400 pointer-events-none">
            <Wallet className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Kassa Qoldig'i (Tanlangan Oy)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
              {selectedMonth} oyi
            </span>
          </div>

          <div className="mt-4 relative z-10">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatNumber(summary?.totalTreasuryBalance || 0)}{" "}
              <span className="text-sm font-bold text-amber-400">UZS</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Oylik tushum - (oylik operatsion xarajatlar + to'langan maoshlar)
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
            <span className="text-slate-400 font-medium">{selectedMonth} oyi tushumi:</span>
            <span className="text-emerald-400 font-bold">
              +{formatNumber(summary?.totalRevenue || 0)} UZS
            </span>
          </div>
        </Card>

        {/* Selected Month Net Income (Sof Oylik Foyda) */}
        <Card
          className={`p-6 bg-slate-900/90 border-2 flex flex-col justify-between ${
            isProfitable ? "border-emerald-500/40 shadow-xl shadow-emerald-500/5" : "border-rose-500/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {selectedMonth} Oylik Sof Foyda
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isProfitable ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                Rentabellik: {profitMargin}%
              </span>
            </div>

            <div className="mt-4">
              <div
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  isProfitable ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatNumber(netIncome)}{" "}
                <span className="text-sm font-bold text-slate-400">UZS</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                {isProfitable ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                )}
                Oylik tushum - (operatsion xarajat + to'langan maoshlar)
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Oylik sof marja:</span>
            <span className={`font-bold ${isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
              {isProfitable ? "Ijobiy (Foydada)" : "Zararda"}
            </span>
          </div>
        </Card>

        {/* Debts & Liabilities Summary (Qarzdorliklar va Majburiyatlar) */}
        <Card className="p-6 bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Majburiyatlar & Kutilayotgan ({selectedMonth})
              </span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>

            <div className="mt-4 space-y-3">
              {/* Student Unpaid Debt */}
              <div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Debitorlik (O'quvchilar qarzi):</span>
                  <span className="text-rose-400 font-black">
                    {formatNumber(summary?.totalDebtsAmount || 0)} UZS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {summary?.debtorsCount || 0} nafar to'lanmagan talaba
                </span>
              </div>

              {/* Teacher Remaining Salary */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Kreditorlik (To'lanmagan maosh):</span>
                  <span className="text-amber-400 font-black">
                    {formatNumber(summary?.totalSalariesRemaining || 0)} UZS
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Ustozlarga berilishi lozim bo'lgan qoldiq
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
            <Link to="/director/payments" className="text-emerald-400 hover:underline font-bold">
              Qarzlarni undirish →
            </Link>
            <Link to="/director/salaries" className="text-amber-400 hover:underline font-bold">
              Maoshlarni to'lash →
            </Link>
          </div>
        </Card>
      </div>

      {/* 4 Monthly KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Monthly Revenue */}
        <Link to="/director/payments" className="block group">
          <Card className="p-4 bg-slate-900/60 border-emerald-500/20 group-hover:border-emerald-500/50 transition-all flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                Oylik Tushum (Kirim)
              </span>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(summary?.totalRevenue || 0)}{" "}
                <span className="text-xs text-emerald-400 font-bold">UZS</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="w-3 h-3" /> {payments.filter((p) => p.status === "PAID").length} ta to'lov
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </Card>
        </Link>

        {/* 2. Monthly Expenses */}
        <Link to="/director/expenses" className="block group">
          <Card className="p-4 bg-slate-900/60 border-rose-500/20 group-hover:border-rose-500/50 transition-all flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                Operatsion Xarajatlar
              </span>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(summary?.totalExpenses || 0)}{" "}
                <span className="text-xs text-rose-400 font-bold">UZS</span>
              </div>
              <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                <ArrowDownRight className="w-3 h-3" /> Ijara, reklama va boshqa
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </Card>
        </Link>

        {/* 3. Teacher Salaries Paid */}
        <Link to="/director/salaries" className="block group">
          <Card className="p-4 bg-slate-900/60 border-sky-500/20 group-hover:border-sky-500/50 transition-all flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                To'langan Maoshlar
              </span>
              <div className="text-xl font-black text-white mt-1">
                {formatNumber(summary?.totalSalariesPaid || 0)}{" "}
                <span className="text-xs text-sky-400 font-bold">UZS</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Qoldiq: {formatNumber(summary?.totalSalariesRemaining || 0)} UZS
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </Card>
        </Link>

        {/* 4. Total Monthly Cash Outflow */}
        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
              Jami Oylik Chiqim
            </span>
            <div className="text-xl font-black text-white mt-1">
              {formatNumber(totalOutflow)}{" "}
              <span className="text-xs text-amber-400 font-bold">UZS</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Xarajatlar + To'langan Maoshlar
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
            <Building className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Visual Analysis Grid: 6 Months Dynamics & Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Monthly Revenue vs Expense History */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" /> Oylik Moliyaviy Dinamika
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">So'nggi 6 oylik tushum va operatsion xarajatlar tahlili</p>
            </div>
          </div>

          <div className="space-y-4">
            {(!summary?.monthlyRevenueHistory || summary.monthlyRevenueHistory.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-500">Moliyaviy ma'lumotlar mavjud emas</div>
            ) : (
              summary.monthlyRevenueHistory.map((item, idx) => {
                const expItem = summary.monthlyExpenseHistory?.[idx];
                const maxVal = Math.max(
                  ...(summary.monthlyRevenueHistory || []).map((h) => h.amount),
                  1000000
                );
                const revPercent = Math.min(100, Math.round((item.amount / maxVal) * 100));
                const expPercent = Math.min(100, Math.round(((expItem?.amount || 0) / maxVal) * 100));

                return (
                  <div key={item.month} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-300">{item.month}</span>
                      <span className="text-emerald-400">
                        Tushum: {formatNumber(item.amount)} UZS
                      </span>
                    </div>

                    {/* Revenue Bar */}
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, revPercent)}%` }}
                      />
                    </div>

                    {/* Expense Bar */}
                    <div className="w-full h-1.5 bg-slate-800/60 rounded-full overflow-hidden flex gap-1">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(3, expPercent)}%` }}
                        title={`Xarajat: ${formatNumber(expItem?.amount || 0)} UZS`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Tushum (Daromad)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-400">Operatsion Xarajat</span>
            </div>
          </div>
        </Card>

        {/* Expenses Category Breakdown */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-rose-400" /> Xarajatlar Taqsimoti ({selectedMonth})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tanlangan oy bo'yicha toifalar taqsimoti</p>
            </div>
            <Link to="/director/expenses" className="text-xs text-amber-400 hover:underline font-bold">
              Barcha xarajatlar →
            </Link>
          </div>

          {Object.keys(summary?.expensesByCategory || {}).length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Bu oy uchun xarajatlar mavjud emas
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(summary?.expensesByCategory || {}).map(([cat, amount]) => {
                const catNames: Record<string, string> = {
                  rent: "Ijara to'lovi",
                  marketing: "Marketing & Reklama",
                  utilities: "Kommunal to'lovlar",
                  equipment: "Jihozlar & Ta'mir",
                  software: "Dasturiy ta'minot",
                  tax: "Soliqlar",
                  salary: "O'qituvchilar maoshi",
                  other: "Boshqa operatsion",
                };
                const totalCatExp = summary?.totalExpenses || 1;
                const percent = Math.min(100, Math.round((amount / totalCatExp) * 100));

                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{catNames[cat] || cat}</span>
                      <span className="text-white font-bold">
                        {formatNumber(amount)} UZS ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Cash Flow Ledger & Transaction Feed (Kassa Kitobi) */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" /> Kassa Kitobi & Operatsiyalar Jurnali
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tanlangan oydagi barcha tushumlar, chiqimlar va maosh berish tranzaksiyalari ro'yxati
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "ALL"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Barchasi ({transactions.length})
            </button>
            <button
              onClick={() => setTypeFilter("INCOME")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "INCOME"
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "bg-slate-800 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              Tushumlar (+)
            </button>
            <button
              onClick={() => setTypeFilter("EXPENSE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "EXPENSE"
                  ? "bg-rose-500 text-white shadow-md font-black"
                  : "bg-slate-800 text-rose-400 hover:bg-rose-500/20"
              }`}
            >
              Xarajatlar (-)
            </button>
            <button
              onClick={() => setTypeFilter("SALARY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === "SALARY"
                  ? "bg-sky-500 text-slate-950 shadow-md font-black"
                  : "bg-slate-800 text-sky-400 hover:bg-sky-500/20"
              }`}
            >
              Maoshlar (-)
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish: ism, tavsif yoki kvitansiya..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="text-emerald-400">
              Kirim: +{formatNumber(filteredIncome)} UZS
            </div>
            <div className="text-rose-400">
              Chiqim: -{formatNumber(filteredOutflow)} UZS
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-extrabold">
              <tr>
                <th className="p-3.5">Sana</th>
                <th className="p-3.5">Turi</th>
                <th className="p-3.5">Tavsif / Ism</th>
                <th className="p-3.5">Toifa / Kvitansiya</th>
                <th className="p-3.5 text-right">Summa</th>
                <th className="p-3.5 text-center">Mas'ul</th>
                <th className="p-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Operatsiyalar topilmadi
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">{t.date}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      {t.type === "INCOME" && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                          + Kirim
                        </span>
                      )}
                      {t.type === "EXPENSE" && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                          - Chiqim
                        </span>
                      )}
                      {t.type === "SALARY" && (
                        <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[10px]">
                          - Maosh
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{t.title}</div>
                      {t.subtitle && <div className="text-[10px] text-slate-500">{t.subtitle}</div>}
                    </td>
                    <td className="p-3.5 text-slate-400">{t.categoryOrMethod}</td>
                    <td className="p-3.5 text-right font-black whitespace-nowrap">
                      {t.type === "INCOME" ? (
                        <span className="text-emerald-400">+{formatNumber(t.amount)} UZS</span>
                      ) : (
                        <span className="text-rose-400">-{formatNumber(t.amount)} UZS</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center text-slate-400 text-[11px] whitespace-nowrap">
                      {t.recordedBy}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.type === "INCOME" && t.paymentObj && (
                          <>
                            <button
                              onClick={() => setReceiptPayment(t.paymentObj!)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60"
                              title="Chekni chop etish"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chek</span>
                            </button>
                            <button
                              onClick={() => setPaymentToDelete(t.paymentObj!)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="To'lovni o'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {t.type === "EXPENSE" && t.expenseObj && (
                          <button
                            onClick={() => setExpenseToDelete(t.expenseObj!)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Xarajatni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/director/payments">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                  To'lovlar Boshqaruvi
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">O'quvchilar to'lovlari va o'chirish</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>

        <Link to="/director/expenses">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-rose-500/40 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors">
                  Yangi Xarajat Qo'shish
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Ijara, reklama yoki jihoz xarajatlari</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>

        <Link to="/director/salaries">
          <Card className="p-4 bg-slate-900/60 border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-sky-400 transition-colors">
                  Ustozlar Maoshini To'lash
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Oyliklarni hisoblash va to'lash</p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
          </Card>
        </Link>
      </div>

      {/* Modal: Printable Official Receipt */}
      <PaymentReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Modal: Confirm Delete Payment */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="To'lovni O'chirish (Direktor)"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Rostdan ham ushbu to'lov yozuvini o'chirmoqchimisiz?
          </p>
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">O'quvchi:</span>
              <span className="font-bold text-white text-sm">{paymentToDelete?.studentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Guruh:</span>
              <span className="font-semibold text-slate-200">{paymentToDelete?.groupName || "Guruh"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Summa:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatNumber(paymentToDelete?.amount || 0)} UZS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kvitansiya raqami:</span>
              <span className="font-mono text-brand-400 font-bold">{paymentToDelete?.receiptNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sana / Oy:</span>
              <span className="text-slate-300">{paymentToDelete?.paymentDate} ({paymentToDelete?.month})</span>
            </div>
          </div>

          <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
            ⚠️ Ushbu to'lov o'chirilgach, markaz tushumlari, kassa qoldig'i va biriktirilgan ustozning maoshidagi guruh tushumi ham avtomatik qayta hisoblanadi.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPaymentToDelete(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleDeletePayment} isLoading={deleting}>
              To'lovni O'chirish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Confirm Delete Expense */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Xarajatni O'chirish"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Rostdan ham ushbu xarajatni o'chirmoqchimisiz?
          </p>
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tavsif:</span>
              <span className="font-bold text-white">{expenseToDelete?.description}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Toifa:</span>
              <span className="font-semibold text-slate-300">{expenseToDelete?.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Summa:</span>
              <span className="font-bold text-rose-400">
                {formatNumber(expenseToDelete?.amount || 0)} UZS
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleDeleteExpense} isLoading={deleting}>
              Xarajatni O'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
