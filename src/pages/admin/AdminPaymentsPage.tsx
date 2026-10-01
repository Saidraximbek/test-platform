import React, { useEffect, useState } from "react";
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
  Building,
  User,
  Sparkles,
  Trash2,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Group, Payment, PaymentStatus, Subject, UserProfile } from "../../types";
import { financeService } from "../../services/financeService";
import { groupService } from "../../services/groupService";
import { adminService } from "../../services/adminService";
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
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState("all");

  // New payment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [amount, setAmount] = useState(500000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PAID");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Delete payment modal
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await financeService.deletePayment(paymentToDelete.paymentId);
      success("To'lov muvaffaqiyatli o'chirildi!");
      setPaymentToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || "To'lovni o'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [allPayments, allUsers, allGroups] = await Promise.all([
        financeService.getPayments().catch(() => []),
        adminService.getAllUsers("", "all", 200).catch(() => []),
        groupService.getGroups().catch(() => []),
      ]);

      setPayments(allPayments);
      setStudents(
        allUsers.filter((u) => u.role === "student" || u.role === "user" || !u.role)
      );
      setGroups(allGroups);
    } catch (err: any) {
      console.warn("Payments loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener("finance_updated", handleSync);
    return () => window.removeEventListener("finance_updated", handleSync);
  }, []);

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
      loadData();
      // Open receipt automatically
      setReceiptPayment(newPayment);
    } catch (err: any) {
      toastError(err.message || "To'lovni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
    const matchSearch =
      p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMonth = !selectedMonth || pMonth === selectedMonth;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchMonth && matchStatus;
  });

  const totalCollected = filteredPayments
    .filter((p) => p.status === "PAID" && Number(p.amount) > 0)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalDebts = filteredPayments
    .filter((p) => (p.status === "DEBT" || p.status === "PARTIAL") && Number(p.amount) > 0)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">To'lovlar Boshqaruvi</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            O'quvchilar to'lovlarini qabul qilish, kvitansiya chiqarish va qarzdorlik nazorati
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedStudentId(students[0]?.uid || "");
            setSelectedGroupId(groups[0]?.groupId || "");
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Yangi to'lov qabul qilish
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Jami Tushum ({selectedMonth})</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatNumber(totalCollected)} <span className="text-xs font-semibold text-emerald-400">UZS</span>
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Muvaffaqiyatli qabul qilingan to'lovlar
          </p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Qarzdorlik / Qoldiq</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {formatNumber(totalDebts)} <span className="text-xs font-semibold text-rose-400">UZS</span>
          </h3>
          <p className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1">
            Kutilayotgan yoki to'lanmagan mablag'lar
          </p>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tranzaksiyalar Soni</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mt-2">
            {filteredPayments.length} <span className="text-xs font-semibold text-slate-400">ta</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Ko'rsatilayotgan to'lovlar soni</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi ismi yoki kvitansiya raqami (#FM-...) bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Month picker */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          />

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="PAID">To'langan (PAID)</option>
            <option value="PARTIAL">Qisman (PARTIAL)</option>
            <option value="DEBT">Qarz (DEBT)</option>
            <option value="CANCELLED">Bekor qilingan</option>
          </select>
        </div>
      </Card>

      {/* Payments Table */}
      {loading ? (
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
      )}

      {/* Modal: Record New Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yangi To'lov Qabul Qilish"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">O'quvchi</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">O'quvchini tanlang</option>
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.displayName} ({st.phoneNumber || "raqamsiz"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Guruh</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Guruhni tanlang</option>
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.name}
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
            ⚠️ Ushbu to'lov o'chirilgach, markazning umumiy tushumlar hisoboti va ustozlar maoshidagi guruh tushumi ham shunga mos yangilanadi.
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
