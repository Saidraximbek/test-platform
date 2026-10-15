import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  Shield,
  Coins,
  Crown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Briefcase,
  GraduationCap,
  User,
  Filter,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { coinService } from "../../services/coinService";
import { useToast } from "../../context/ToastContext";
import { UserProfile, UserStatus } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";

export const DirectorUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  // Role Modal (Exclusive Director Privilege)
  const [roleModalUser, setRoleModalUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  // Status Change Modal
  const [statusModalUser, setStatusModalUser] = useState<UserProfile | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>("active");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Coin Adjust Modal
  const [coinModalUser, setCoinModalUser] = useState<UserProfile | null>(null);
  const [coinAmount, setCoinAmount] = useState<number>(50);
  const [coinReason, setCoinReason] = useState("");
  const [isAdjustingCoin, setIsAdjustingCoin] = useState(false);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const list = await adminService.getAllUsers(search, statusFilter, 200);
      setUsers(list);
    } catch (err: any) {
      console.error("Error loading users:", err);
      toastError(err.message || "Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Role change handler (Director only)
  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setIsAssigningRole(true);
    try {
      await adminService.setUserRole(roleModalUser.uid, selectedRole);
      success(`"${roleModalUser.displayName}" foydalanuvchisi roli muvaffaqiyatli "${selectedRole.toUpperCase()}" ga o'zgartirildi!`);
      setRoleModalUser(null);
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Rolni o'zgartirishda xatolik yuz berdi");
    } finally {
      setIsAssigningRole(false);
    }
  };

  // Status change handler
  const handleUpdateStatus = async () => {
    if (!statusModalUser || !statusReason.trim()) {
      toastError("Iltimos, sababni kiriting");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await adminService.setUserStatus(statusModalUser.uid, newStatus, statusReason);
      success(`Foydalanuvchi holati ${newStatus} ga o'zgartirildi`);
      setStatusModalUser(null);
      setStatusReason("");
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Holatni o'zgartirishda xatolik");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Coin adjust handler
  const handleAdjustCoins = async () => {
    if (!coinModalUser || !coinReason.trim() || coinAmount === 0) {
      toastError("Miqdor va sababni to'g'ri kiriting");
      return;
    }
    setIsAdjustingCoin(true);
    try {
      await coinService.adminCoinAdjust(coinModalUser.uid, coinAmount, coinReason);
      success(`Tillo tangalari muvaffaqiyatli saqlandi!`);
      setCoinModalUser(null);
      setCoinReason("");
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Tangalarni o'zgartirishda xatolik");
    } finally {
      setIsAdjustingCoin(false);
    }
  };

  // Filtered users by search & role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole =
        roleFilter === "all" ||
        (roleFilter === "director" && u.role === "director") ||
        (roleFilter === "admin" && u.role === "admin") ||
        (roleFilter === "teacher" && u.role === "teacher") ||
        (roleFilter === "student" && (u.role === "student" || u.role === "user" || !u.role)) ||
        (roleFilter === "user" && (u.role === "user" || !u.role));

      return matchRole;
    });
  }, [users, roleFilter]);

  // Statistics by role
  const stats = useMemo(() => {
    const total = users.length;
    const directors = users.filter((u) => u.role === "director").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const teachers = users.filter((u) => u.role === "teacher").length;
    const students = users.filter((u) => u.role === "student").length;
    const regular = users.filter((u) => u.role === "user" || !u.role).length;
    return { total, directors, admins, teachers, students, regular };
  }, [users]);

  const statusVariants: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    suspended: "warning",
    blocked: "danger",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Foydalanuvchilar & Rollar Boshqaruvi
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Markaz xodimlari, ustozlar, administratorlar va o'quvchilar rollarini belgilash (Eksklyuziv direktor vakolati)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50 self-start sm:self-auto"
          title="Yangilash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-300" : ""}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Role Count KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Users */}
        <button
          onClick={() => setRoleFilter("all")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "all"
              ? "bg-slate-800 border-amber-500/60 shadow-lg shadow-amber-500/10"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Jami A'zolar</span>
          <span className="text-xl font-black text-white mt-1 block">{stats.total}</span>
        </button>

        {/* Directors */}
        <button
          onClick={() => setRoleFilter("director")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "director"
              ? "bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 border-amber-500/20 hover:border-amber-500/40"
          }`}
        >
          <span className="text-[10px] text-amber-400 font-extrabold uppercase block">👑 Direktorlar</span>
          <span className="text-xl font-black text-amber-300 mt-1 block">{stats.directors}</span>
        </button>

        {/* Admins */}
        <button
          onClick={() => setRoleFilter("admin")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "admin"
              ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20"
              : "bg-slate-900/60 border-purple-500/20 hover:border-purple-500/40"
          }`}
        >
          <span className="text-[10px] text-purple-400 font-extrabold uppercase block">🛡️ Adminlar</span>
          <span className="text-xl font-black text-purple-300 mt-1 block">{stats.admins}</span>
        </button>

        {/* Teachers */}
        <button
          onClick={() => setRoleFilter("teacher")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "teacher"
              ? "bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/20"
              : "bg-slate-900/60 border-sky-500/20 hover:border-sky-500/40"
          }`}
        >
          <span className="text-[10px] text-sky-400 font-extrabold uppercase block">👨‍🏫 Ustozlar</span>
          <span className="text-xl font-black text-sky-300 mt-1 block">{stats.teachers}</span>
        </button>

        {/* Students */}
        <button
          onClick={() => setRoleFilter("student")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "student"
              ? "bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20"
              : "bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40"
          }`}
        >
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase block">🎓 O'quvchilar</span>
          <span className="text-xl font-black text-emerald-300 mt-1 block">{stats.students}</span>
        </button>

        {/* Regular Users */}
        <button
          onClick={() => setRoleFilter("user")}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            roleFilter === "user"
              ? "bg-slate-800 border-slate-600 shadow-lg"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">👤 Oddiy</span>
          <span className="text-xl font-black text-slate-200 mt-1 block">{stats.regular}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Ism, telefon yoki o'quv joyi bo'yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-900 border-slate-800 text-white"
          />
          <Button type="submit">Qidirish</Button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">Barcha rollar</option>
          <option value="director">👑 Faqat Direktorlar</option>
          <option value="admin">🛡️ Faqat Administratorlar</option>
          <option value="teacher">👨‍🏫 Faqat O'qituvchilar</option>
          <option value="student">🎓 Faqat O'quvchilar</option>
          <option value="user">👤 Oddiy foydalanuvchilar</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">Barcha holatlar</option>
          <option value="active">Faol (Active)</option>
          <option value="suspended">To'xtatilgan (Suspended)</option>
          <option value="blocked">Bloklangan (Blocked)</option>
        </select>
      </div>

      {/* Users & Staff Table */}
      <Card className="bg-slate-900/90 border-slate-800 overflow-hidden divide-y divide-slate-800 shadow-xl">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Spinner size="lg" className="text-amber-500" />
            <p className="text-xs text-slate-400 font-medium">Foydalanuvchilar ro'yxati yuklanmoqda...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-extrabold">
                <tr>
                  <th className="p-4">Foydalanuvchi</th>
                  <th className="p-4">Login & Parol</th>
                  <th className="p-4">Aloqa & Sana</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4">Tangalar</th>
                  <th className="p-4">Joriy Rol</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-medium">
                {filteredUsers.map((u) => {
                  const loginStr = u.login || u.email?.split("@")[0] || u.email || "-";
                  const passStr = u.plainPassword;
                  const isPassVisible = Boolean(visiblePasswords[u.uid]);

                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-black text-white text-xs border border-slate-700 shadow-sm">
                            {u.displayName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{u.displayName}</p>
                            <p className="text-[11px] text-slate-400">
                              {u.educationPlace || "Ta'lim muassasasi kiritilmagan"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-mono text-white text-[11px] font-bold">
                          <span>{loginStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-amber-400">
                            {isPassVisible ? (passStr || "Belgilanmagan") : "••••••"}
                          </span>
                          {passStr && (
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.uid)}
                              className="text-slate-400 hover:text-white transition-colors"
                              title={isPassVisible ? "Parolni yashirish" : "Parolni ko'rsatish"}
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-slate-300 font-mono text-[11px]">{u.phoneNumber || "Telefon yo'q"}</p>
                        <p className="text-[10px] text-slate-500">{formatDate(u.createdAt)}</p>
                      </td>

                      <td className="p-4">
                        <Badge variant={statusVariants[u.status] || "default"}>
                          {u.status}
                        </Badge>
                      </td>

                      <td className="p-4 font-mono font-bold text-amber-400">
                        {formatCoins(u.coinBalance || 0)} 🪙
                      </td>

                      <td className="p-4">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl inline-flex items-center gap-1.5 border shadow-sm ${
                            u.role === "director"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : u.role === "admin"
                              ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                              : u.role === "teacher"
                              ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                              : u.role === "student"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {u.role === "director"
                            ? "👑 Direktor"
                            : u.role === "admin"
                            ? "🛡️ Admin"
                            : u.role === "teacher"
                            ? "👨‍🏫 O'qituvchi"
                            : u.role === "student"
                            ? "🎓 O'quvchi"
                            : "👤 Foydalanuvchi"}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Change Role Button (Exclusive) */}
                        <Button
                          size="sm"
                          onClick={() => {
                            setRoleModalUser(u);
                            setSelectedRole(u.role || "user");
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold"
                          title="Foydalanuvchi rolini o'zgartirish"
                        >
                          <Crown className="w-3.5 h-3.5 mr-1" />
                          <span>Rol berish</span>
                        </Button>

                        {/* Adjust Coins */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCoinModalUser(u);
                            setCoinAmount(50);
                          }}
                          className="text-amber-400 hover:bg-amber-400/10"
                          title="Tillo tangalarini tahrirlash"
                        >
                          <Coins className="w-4 h-4" />
                        </Button>

                        {/* Adjust Status */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setStatusModalUser(u);
                            setNewStatus(u.status);
                          }}
                          className="text-slate-300 hover:bg-slate-800"
                          title="Hisob holatini o'zgartirish"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Role Change Modal (Exclusive for Director) */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Foydalanuvchi Rolini Belgilash (Direktor)"
      >
        {roleModalUser && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/20">
              <p className="text-xs text-slate-300">
                Foydalanuvchi: <strong className="text-white text-sm">{roleModalUser.displayName}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Telefon: <span className="text-slate-200 font-mono">{roleModalUser.phoneNumber || "Mavjud emas"}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hozirgi roli:{" "}
                <span className="font-black uppercase text-amber-400">
                  {roleModalUser.role || "user"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Yangi tizim rolini tanlang:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="director">👑 Direktor (ERP, Moliya, Oyliklar, Xarajatlar, To'liq nazorat va Rollar)</option>
                <option value="admin">🛡️ Administrator (Guruhlar, O'quvchilar, To'lovlar qabul qilish, Testlar)</option>
                <option value="teacher">👨‍🏫 O'qituvchi (Darslar, Uyga vazifalar, Davomat, Savollar)</option>
                <option value="student">🎓 O'quvchi (LMS darslar, Vazifalar, Baholar, Testlar)</option>
                <option value="user">👤 Oddiy foydalanuvchi (Faqat testlar va Do'kon)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed">
              💡 <strong>Direktor nazorati:</strong> Yangi rol berilgandan so'ng foydalanuvchi tizimga kirganida ushbu roliga mos ruxsatlar va panel ochiladi.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setRoleModalUser(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                isLoading={isAssigningRole}
                onClick={handleSaveRole}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
              >
                Rolni Saqlash
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        title="Foydalanuvchi holatini o'zgartirish"
      >
        {statusModalUser && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Foydalanuvchi: <strong className="text-white">{statusModalUser.displayName}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yangi holat:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none"
              >
                <option value="active">Faol (Active)</option>
                <option value="suspended">Vaqtincha to'xtatilgan (Suspended)</option>
                <option value="blocked">Butunlay bloklangan (Blocked)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sabab (majburiy):
              </label>
              <textarea
                rows={3}
                placeholder="Nega bu holat tanlandi?"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setStatusModalUser(null)}>
                Bekor qilish
              </Button>
              <Button isLoading={isUpdatingStatus} onClick={handleUpdateStatus}>
                Saqlash
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Coin Adjust Modal */}
      <Modal
        isOpen={!!coinModalUser}
        onClose={() => setCoinModalUser(null)}
        title="Tillo Tangalarini Tahrirlash"
      >
        {coinModalUser && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Foydalanuvchi: <strong className="text-white">{coinModalUser.displayName}</strong>{" "}
              (Mavjud balans: {coinModalUser.coinBalance || 0} 🪙)
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanga miqdori (qo'shish uchun musbat, ayirish uchun manfiy):
              </label>
              <Input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sabab:
              </label>
              <textarea
                rows={2}
                placeholder="Masalan: Tanlov g'olibi uchun mukofot"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setCoinModalUser(null)}>
                Bekor qilish
              </Button>
              <Button variant="amber" isLoading={isAdjustingCoin} onClick={handleAdjustCoins}>
                Tangani Saqlash
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
