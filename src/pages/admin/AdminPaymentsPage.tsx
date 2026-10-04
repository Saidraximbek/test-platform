import React, { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Users,
  Sparkles,
  Trash2,
  UserCheck,
  X,
  ChevronDown,
  Briefcase,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Group, Payment, PaymentStatus, UserProfile } from "../../types";
import { financeService, StudentPaymentStatusItem } from "../../services/financeService";
import { groupService } from "../../services/groupService";
import { adminService } from "../../services/adminService";
import { teacherService } from "../../services/teacherService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { formatNumber } from "../../utils";
import { PaymentReceiptModal } from "../../components/admin/PaymentReceiptModal";

export const AdminPaymentsPage: React.FC = () => {
  const { user, isDirector } = useAuth();
  const { success, error: toastError } = useToast();

  // Active view tab: "control" (O'quvchilar To'lov Nazorati) or "history" (To'lovlar Tarixi & Kvitansiyalar)
  const [activeTab, setActiveTab] = useState<"control" | "history">("control");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [studentPaymentList, setStudentPaymentList] = useState<StudentPaymentStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // For payment history: PAID, PARTIAL, DEBT
  const [studentStatusFilter, setStudentStatusFilter] = useState<"all" | "PAID" | "DEBT" | "PARTIAL">("all");

  // New payment modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [amount, setAmount] = useState(500000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal student search autocomplete
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Delete payment modal
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allPayments, allUsers, allGroups, allTeachers] = await Promise.all([
        financeService.getPayments().catch(() => []),
        adminService.getAllUsers("", "all", 300).catch(() => []),
        groupService.getGroups().catch(() => []),
        teacherService.getAllTeachers().catch(() => []),
      ]);

      setPayments(allPayments);
      const studentUsers = allUsers.filter(
        (u) => u.role === "student" || u.role === "user" || !u.role
      );
      setStudents(studentUsers);
      setGroups(allGroups.filter((g) => g.status === "active" || !g.status));
      setTeachers(allTeachers);
    } catch (err: any) {
      console.warn("Payments loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load student month payment control list
  const loadStudentPaymentControl = async () => {
    try {
      setControlLoading(true);
      const res = await financeService.getStudentPaymentStatusByMonth(
        selectedMonth,
        selectedTeacherId
      );
      setStudentPaymentList(res.items);
    } catch (err: any) {
      console.warn("loadStudentPaymentControl error:", err);
    } finally {
      setControlLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => {
      loadData();
      loadStudentPaymentControl();
    };
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, []);

  useEffect(() => {
    loadStudentPaymentControl();
  }, [selectedMonth, selectedTeacherId]);

  // Open modal for a specific student from the control table
  const handleOpenPaymentForStudent = (item: StudentPaymentStatusItem) => {
    setSelectedStudentId(item.studentId);
    setSelectedGroupId(item.groupId);
    setAmount(item.debtAmount > 0 ? item.debtAmount : item.monthlyFee);
    setPaymentStatus("PAID");
    setNote(`${selectedMonth} oyi uchun to'lov`);
    setIsModalOpen(true);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedGroupId) {
      toastError("O'quvchi va guruhni tanlang");
      return;
    }

    const student = students.find((s) => s.uid === selectedStudentId);
    const group = groups.find((g) => g.groupId === selectedGroupId);

    try {
      setSaving(true);
      const newPayment = await financeService.recordPayment({
        studentId: selectedStudentId,
        studentName: student?.displayName || "O'quvchi",
        groupId: selectedGroupId,
        groupName: group?.name || "",
        subjectId: group?.subjectId || "",
        amount: Number(amount),
        month: selectedMonth,
        paymentDate,
        adminId: user?.uid || "admin",
        adminName: user?.displayName || "Administrator",
        status: paymentStatus,
        note,
      });

      success("To'lov muvaffaqiyatli qabul qilindi!");
      setIsModalOpen(false);
      setStudentSearchInput("");
      loadData();
      loadStudentPaymentControl();
      // Open receipt automatically
      setReceiptPayment(newPayment);
    } catch (err: any) {
      toastError(err.message || "To'lovni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await financeService.deletePayment(paymentToDelete.paymentId);
      success("To'lov muvaffaqiyatli o'chirildi!");
      setPaymentToDelete(null);
      loadData();
      loadStudentPaymentControl();
    } catch (err: any) {
      toastError(err.message || "To'lovni o'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered payment transactions
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
      const matchSearch =
        !searchQuery ||
        p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMonth = !selectedMonth || pMonth === selectedMonth;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchMonth && matchStatus;
    });
  }, [payments, searchQuery, selectedMonth, statusFilter]);

  // Filtered student payment control items
  const filteredStudentControl = useMemo(() => {
    return studentPaymentList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        (item.studentPhone && item.studentPhone.includes(q)) ||
        item.groupName.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q);

      const matchStatus =
        studentStatusFilter === "all" || item.status === studentStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [studentPaymentList, searchQuery, studentStatusFilter]);

  // Statistics for selected month
  const paidStudentsCount = useMemo(
    () => studentPaymentList.filter((i) => i.status === "PAID").length,
    [studentPaymentList]
  );
  const debtorStudentsCount = useMemo(
    () => studentPaymentList.filter((i) => i.status === "DEBT" || i.status === "PARTIAL").length,
    [studentPaymentList]
  );
  const totalStudentsCount = studentPaymentList.length;

  const totalCollectedMoney = useMemo(() => {
    return filteredPayments
      .filter((p) => p.status === "PAID" && Number(p.amount) > 0)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [filteredPayments]);

  const totalDebtsMoney = useMemo(() => {
    return studentPaymentList.reduce((sum, i) => sum + i.debtAmount, 0);
  }, [studentPaymentList]);

  // Autocomplete matching students in modal
  const modalMatchedStudents = useMemo(() => {
    if (!studentSearchInput.trim()) return students.slice(0, 8);
    const q = studentSearchInput.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.displayName?.toLowerCase().includes(q) ||
        s.phoneNumber?.toLowerCase().includes(q) ||
        s.login?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [students, studentSearchInput]);

  const selectedStudentObj = useMemo(
    () => students.find((s) => s.uid === selectedStudentId),
    [students, selectedStudentId]
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">To'lovlar & Kassa Boshqaruvi</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            O'quvchilar to'lovlarini qabul qilish, to'lov qilgan va qarzdorlarni nazorat qilish hamda cheklar chiqarish
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedStudentId("");
            setSelectedGroupId(groups[0]?.groupId || "");
            setAmount(groups[0]?.monthlyPrice || 500000);
            setStudentSearchInput("");
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Yangi to'lov qabul qilish
        </Button>
      </div>

      {/* Overview Stat Cards */}
      {/* If Admin: show strictly student operational numbers (no center financial balance). If Director: show financial sums too */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: To'lov Qilgan O'quvchilar */}
        <Card className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {isDirector ? `Jami Tushum (${selectedMonth})` : `To'lov Qilgan O'quvchilar (${selectedMonth})`}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              {isDirector ? <DollarSign className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {isDirector ? (
              <>
                {formatNumber(totalCollectedMoney)}{" "}
                <span className="text-xs font-semibold text-emerald-400">UZS</span>
              </>
            ) : (
              <>
                {paidStudentsCount} <span className="text-xs font-semibold text-emerald-400">nafar</span>
              </>
            )}
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isDirector
              ? `${paidStudentsCount} nafar o'quvchi to'liq to'lagan`
              : "To'lovni to'liq bajargan o'quvchilar"}
          </p>
        </Card>

        {/* Card 2: Qarzdor O'quvchilar */}
        <Card className="p-5 bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {isDirector ? `Qarzdorlik Qoldig'i (${selectedMonth})` : `Qarzdor O'quvchilar (${selectedMonth})`}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {isDirector ? (
              <>
                {formatNumber(totalDebtsMoney)}{" "}
                <span className="text-xs font-semibold text-rose-400">UZS</span>
              </>
            ) : (
              <>
                {debtorStudentsCount} <span className="text-xs font-semibold text-rose-400">nafar</span>
              </>
            )}
          </h3>
          <p className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1">
            {isDirector
              ? `${debtorStudentsCount} nafar qarzdor o'quvchi summasi`
              : "Ushbu oy uchun to'lovi kutilayotganlar"}
          </p>
        </Card>

        {/* Card 3: Jami Kvitansiyalar & Guruhlar Qamrovi */}
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              {activeTab === "control" ? "Guruhlardagi Jami O'quvchilar" : "Rasmiylashtirilgan Cheklar"}
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
              {activeTab === "control" ? <Users className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {activeTab === "control" ? (
              <>
                {totalStudentsCount} <span className="text-xs font-semibold text-slate-400">nafar</span>
              </>
            ) : (
              <>
                {filteredPayments.length} <span className="text-xs font-semibold text-slate-400">ta</span>
              </>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeTab === "control"
              ? `To'lov qamrovi: ${totalStudentsCount > 0 ? Math.round((paidStudentsCount / totalStudentsCount) * 100) : 0}%`
              : "Shu oy bo'yicha kvitansiyalar soni"}
          </p>
        </Card>
      </div>

      {/* Navigation Tabs: Student Control vs Transactions History */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("control")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "control"
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>O'quvchilar To'lov Nazorati</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/60 font-black">
            {totalStudentsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>To'lov Cheklari & Kassa Tarixi</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/60 font-black">
            {filteredPayments.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === "control"
                ? "O'quvchi ismi, telefoni, guruh yoki o'qituvchi bo'yicha qidirish..."
                : "O'quvchi ismi yoki kvitansiya raqami (#FM-...) bo'yicha qidirish..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
            />
          </div>

          {/* Teacher filter (Required in user request 4) */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
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

          {/* Status filter */}
          {activeTab === "control" ? (
            <select
              value={studentStatusFilter}
              onChange={(e) => setStudentStatusFilter(e.target.value as any)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="all">Barcha Holatlar</option>
              <option value="PAID">To'lov Qilganlar (To'liq)</option>
              <option value="DEBT">Qarzdorlar (To'lamaganlar)</option>
              <option value="PARTIAL">Qisman To'laganlar</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="all">Barcha holatlar</option>
              <option value="PAID">To'langan (PAID)</option>
              <option value="PARTIAL">Qisman (PARTIAL)</option>
              <option value="DEBT">Qarz (DEBT)</option>
              <option value="CANCELLED">Bekor qilingan</option>
            </select>
          )}
        </div>
      </Card>

      {/* Main Content Area: Tab 1 = Student Control, Tab 2 = Payment History */}
      {activeTab === "control" ? (
        /* ================= TAB 1: O'QUVCHILAR TO'LOV NAZORATI ================= */
        controlLoading || loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-brand-500" />
          </div>
        ) : filteredStudentControl.length === 0 ? (
          <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
            <UserCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">O'quvchilar ro'yxati topilmadi</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tanlangan oy, o'qituvchi yoki qidiruv so'rovi bo'yicha hech qanday o'quvchi ma'lumoti topilmadi.
            </p>
          </Card>
        ) : (
          <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">O'quvchi</th>
                    <th className="p-3.5">Guruh & Fan</th>
                    <th className="p-3.5">O'qituvchi</th>
                    <th className="p-3.5">Oylik To'lov</th>
                    <th className="p-3.5">Shu Oy To'langan</th>
                    <th className="p-3.5">Qarz Qoldig'i</th>
                    <th className="p-3.5">Holat</th>
                    <th className="p-3.5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudentControl.map((item, idx) => {
                    const isPaid = item.status === "PAID";
                    const isDebt = item.status === "DEBT";
                    const isPartial = item.status === "PARTIAL";

                    return (
                      <tr key={`${item.studentId}_${item.groupId}_${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        {/* Student Name & Phone */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs border border-slate-700">
                              {item.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{item.studentName}</p>
                              {item.studentPhone && (
                                <p className="text-[11px] text-slate-400">{item.studentPhone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Group */}
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-200">{item.groupName}</span>
                        </td>

                        {/* Teacher */}
                        <td className="p-3.5">
                          <span className="text-slate-300 font-medium">{item.teacherName}</span>
                        </td>

                        {/* Monthly Fee */}
                        <td className="p-3.5 font-semibold text-white">
                          {formatNumber(item.monthlyFee)} <span className="text-[10px] text-slate-400">so'm</span>
                        </td>

                        {/* Paid Amount */}
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-400">
                            {formatNumber(item.paidAmount)} <span className="text-[10px] text-slate-400">so'm</span>
                          </span>
                        </td>

                        {/* Debt Amount */}
                        <td className="p-3.5">
                          {item.debtAmount > 0 ? (
                            <span className="font-bold text-rose-400">
                              {formatNumber(item.debtAmount)} <span className="text-[10px] text-slate-400">so'm</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">0 so'm</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isPartial
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {isPaid ? "To'langan" : isPartial ? "Qisman" : "Qarzdor"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPaid ? (
                              <button
                                onClick={() => {
                                  const matchingP = payments.find(
                                    (p) =>
                                      p.studentId === item.studentId &&
                                      p.groupId === item.groupId &&
                                      p.status === "PAID"
                                  );
                                  if (matchingP) setReceiptPayment(matchingP);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60"
                                title="Kvitansiyani ko'rish"
                              >
                                <Printer className="w-3.5 h-3.5" /> Chek
                              </button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenPaymentForStudent(item)}
                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                              >
                                To'lov olish
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* ================= TAB 2: TO'LOV CHEKLARI & KASSA TARIXI ================= */
        loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" className="text-brand-500" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
            <CreditCard className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">To'lovlar topilmadi</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tanlangan oy yoki qidiruv so'rovi bo'yicha hech qanday to'lov mavjud emas.
            </p>
          </Card>
        ) : (
          <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Kvitansiya</th>
                    <th className="p-3.5">O'quvchi</th>
                    <th className="p-3.5">Guruh</th>
                    <th className="p-3.5">Oy / Sana</th>
                    <th className="p-3.5">Summa</th>
                    <th className="p-3.5">Holat</th>
                    <th className="p-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-brand-400">
                          {p.receiptNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-white">{p.studentName}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-300 font-medium">{p.groupName || "Guruh"}</span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-white">{p.month}</p>
                        <p className="text-[11px] text-slate-400">{p.paymentDate}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-white text-sm">
                          {formatNumber(p.amount)}{" "}
                          <span className="text-[10px] text-slate-400">so'm</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            p.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : p.status === "PARTIAL"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : p.status === "DEBT"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setReceiptPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60"
                            title="Kvitansiyani chop etish"
                          >
                            <Printer className="w-3.5 h-3.5" /> Chop etish
                          </button>
                          <button
                            onClick={() => setPaymentToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="To'lovni o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Modal: Record New Payment with Searchable Student Picker (Requirement 5) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yangi To'lov Qabul Qilish"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          {/* Searchable Student Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              O'quvchini qidirish va tanlash
            </label>

            {selectedStudentObj ? (
              <div className="flex items-center justify-between p-3 bg-slate-800/90 border border-brand-500/40 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-600/30 text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-500/30">
                    {selectedStudentObj.displayName?.charAt(0) || "O"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{selectedStudentObj.displayName}</p>
                    <p className="text-[11px] text-slate-400">
                      {selectedStudentObj.phoneNumber || "Telefon raqamsiz"} {selectedStudentObj.login ? `(@${selectedStudentObj.login})` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId("");
                    setStudentSearchInput("");
                    setIsStudentDropdownOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs text-brand-400 hover:text-white bg-slate-700/60 hover:bg-brand-600 rounded-lg transition-all"
                >
                  O'zgartirish
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ism, telefon raqami yoki login bo'yicha qidiring..."
                    value={studentSearchInput}
                    onChange={(e) => {
                      setStudentSearchInput(e.target.value);
                      setIsStudentDropdownOpen(true);
                    }}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                  {studentSearchInput && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchInput("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {isStudentDropdownOpen && modalMatchedStudents.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800">
                    {modalMatchedStudents.map((st) => (
                      <button
                        key={st.uid}
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(st.uid);
                          setIsStudentDropdownOpen(false);

                          // Auto-detect student's group
                          const studentGroup = groups.find(
                            (g) =>
                              (Array.isArray(g.studentIds) && g.studentIds.includes(st.uid)) ||
                              (Array.isArray(st.enrolledGroups) &&
                                st.enrolledGroups.some((eg) => eg.groupId === g.groupId))
                          );
                          if (studentGroup) {
                            setSelectedGroupId(studentGroup.groupId);
                            if (studentGroup.monthlyPrice) setAmount(studentGroup.monthlyPrice);
                          }
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs group-hover:bg-brand-600 group-hover:text-white transition-colors">
                            {st.displayName?.charAt(0) || "O"}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{st.displayName}</p>
                            <p className="text-[10px] text-slate-400">{st.phoneNumber || "Raqamsiz"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-brand-400 font-bold group-hover:underline">
                          Tanlash →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Group Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Guruh</label>
            <select
              value={selectedGroupId}
              onChange={(e) => {
                const gId = e.target.value;
                setSelectedGroupId(gId);
                const g = groups.find((grp) => grp.groupId === gId);
                if (g?.monthlyPrice) setAmount(g.monthlyPrice);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Guruhni tanlang</option>
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.name} ({formatNumber(g.monthlyPrice || 500000)} UZS)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="To'lov summasi (UZS)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Qaysi oy uchun"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="To'lov qabul qilingan sana"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                To'lov holati
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="PAID">To'liq to'landi (PAID)</option>
                <option value="PARTIAL">Qisman to'lov (PARTIAL)</option>
                <option value="DEBT">Qarzdorlik (DEBT)</option>
              </select>
            </div>
          </div>

          <Input
            label="Qo'shimcha izoh (ixtiyoriy)"
            placeholder="Masalan: Naqd yoki karta orqali"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saving}>
              To'lovni tasdiqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Printable Official Receipt (58mm Thermal Printer, max 8cm length) */}
      <PaymentReceiptModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
      />

      {/* Modal: Confirm Delete Payment */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="To'lovni O'chirish"
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
            ⚠️ Ushbu to'lov o'chirilgach, markaz tushumlari hisoboti va ustozlar maoshidagi guruh tushumi ham shunga mos yangilanadi.
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
    </div>
  );
};

export default AdminPaymentsPage;
