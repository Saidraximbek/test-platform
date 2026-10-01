import React, { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  DollarSign,
  PieChart,
  Building,
  Megaphone,
  Zap,
  Wrench,
  Award,
} from "lucide-react";
import { Expense, ExpenseCategory } from "../../types";
import { financeService } from "../../services/financeService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const DirectorExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal: Add Expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("rent");
  const [amount, setAmount] = useState(1500000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal: Delete Expense Confirmation
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const list = await financeService.getExpenses({
        month: selectedMonth,
        category: categoryFilter !== "all" ? (categoryFilter as ExpenseCategory) : undefined,
      });
      setExpenses(list);
    } catch (err: any) {
      toastError(err.message || "Xarajatlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedMonth, categoryFilter]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toastError("Xarajat tavsifini kiriting");
      return;
    }

    if (amount <= 0) {
      toastError("Summa 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      setSaving(true);
      await financeService.recordExpense({
        category,
        amount: Number(amount),
        date,
        description: description.trim(),
        createdBy: user?.uid || "director",
        createdByName: user?.displayName || "Direktor",
      });

      success("Xarajat muvaffaqiyatli saqlandi!");
      setIsModalOpen(false);
      setDescription("");
      loadExpenses();
    } catch (err: any) {
      toastError(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setDeleting(true);
      await financeService.deleteExpense(expenseToDelete.expenseId);
      success("Xarajat muvaffaqiyatli o'chirildi");
      setExpenseToDelete(null);
      loadExpenses();
    } catch (err: any) {
      toastError(err.message || "O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) =>
    e.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const rentExpense = expenses.filter((e) => e.category === "rent").reduce((sum, e) => sum + e.amount, 0);
  const adExpense = expenses.filter((e) => e.category === "advertising").reduce((sum, e) => sum + e.amount, 0);
  const salaryExpense = expenses.filter((e) => e.category === "salary").reduce((sum, e) => sum + e.amount, 0);
  const otherExpense = expenses.filter((e) => e.category !== "rent" && e.category !== "advertising" && e.category !== "salary").reduce((sum, e) => sum + e.amount, 0);

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case "rent":
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Ijara</span>;
      case "salary":
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Maosh</span>;
      case "advertising":
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Marketing</span>;
      case "utilities":
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Kommunal</span>;
      case "equipment":
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Jihozlar</span>;
      default:
        return <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Boshqa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-7 h-7 text-rose-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">Markaz Xarajatlari</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ijara, reklama, uskunalar, maoshlar va boshqa barcha operatsion xarajatlar tahlili
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-rose-500"
          />
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Xarajat Kiritish
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-slate-900/80 border-rose-500/30">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Jami Xarajat ({selectedMonth})
          </span>
          <h3 className="text-xl font-black text-rose-400 mt-1">
            {formatNumber(totalExpense)} <span className="text-xs font-semibold">UZS</span>
          </h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{expenses.length} ta operatsiya</span>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Bino Ijarasi (Rent)
          </span>
          <h3 className="text-lg font-black text-blue-400 mt-1">
            {formatNumber(rentExpense)} <span className="text-xs font-semibold">UZS</span>
          </h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Asosiy operatsion chiqim</span>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Marketing & Reklama
          </span>
          <h3 className="text-lg font-black text-amber-400 mt-1">
            {formatNumber(adExpense)} <span className="text-xs font-semibold">UZS</span>
          </h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Target & targ'ibot</span>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Maoshlar / Boshqa
          </span>
          <h3 className="text-lg font-black text-emerald-400 mt-1">
            {formatNumber(salaryExpense + otherExpense)} <span className="text-xs font-semibold">UZS</span>
          </h3>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Xodimlar va kommunal</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Xarajat tavsifi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="all">Barcha kategoriyalar</option>
            <option value="rent">Ijara to'lovi (Rent)</option>
            <option value="salary">Maoshlar (Salary)</option>
            <option value="advertising">Marketing & Reklama</option>
            <option value="utilities">Kommunal to'lovlar</option>
            <option value="equipment">Jihozlar & Texnika</option>
            <option value="other">Boshqa xarajatlar</option>
          </select>
        </div>
      </Card>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-rose-500" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Xarajatlar mavjud emas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedMonth} oyi uchun xarajatlar topilmadi.
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="mt-4">
            Birinchi Xarajatni Kiritish
          </Button>
        </Card>
      ) : (
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Kategoriya</th>
                  <th className="p-3.5">Tavsif</th>
                  <th className="p-3.5">Sana</th>
                  <th className="p-3.5">Summa</th>
                  <th className="p-3.5">Kiritdi</th>
                  <th className="p-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.map((e) => (
                  <tr key={e.expenseId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      {getCategoryBadge(e.category)}
                    </td>
                    <td className="p-3.5">
                      <p className="text-white font-medium">{e.description}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-400">{e.date}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-sm font-bold text-rose-400">
                        {formatNumber(e.amount)} UZS
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-400">{e.createdByName || "Direktor"}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setExpenseToDelete(e)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Xarajatni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Record Expense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yangi Xarajat Kiritish"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Xarajat kategoriyasi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="rent">Ijara to'lovi (Rent)</option>
              <option value="advertising">Reklama va Marketing</option>
              <option value="utilities">Kommunal to'lovlar (Elektr, internet va h.k.)</option>
              <option value="equipment">Jihozlar, partalar, texnika</option>
              <option value="salary">Qo'shimcha maosh to'lovi</option>
              <option value="other">Boshqa xarajatlar</option>
            </select>
          </div>

          <Input
            label="Xarajat summasi (UZS)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />

          <Input
            label="Sana"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Batafsil tavsif / Maqsad
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masalan: Sentabr oyi bino ijarasi yoki Target reklama xarajati..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              required
            />
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
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Delete Expense */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Xarajatni O'chirish"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Rostdan ham <strong className="text-rose-400">{formatNumber(expenseToDelete?.amount || 0)} UZS</strong> summasidagi ("{expenseToDelete?.description}") xarajatni o'chirmoqchimisiz?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>
              Bekor qilish
            </Button>
            <Button variant="danger" onClick={handleDeleteExpense} isLoading={deleting}>
              O'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
