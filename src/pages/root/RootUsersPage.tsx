import React, { useEffect, useState } from "react";
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
  Lock,
  Trash2,
  Edit,
  Key,
} from "lucide-react";
import { rootService } from "../../services/rootService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { UserProfile, UserRole, UserStatus } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { formatDate, formatCoins } from "../../utils";

export const RootUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role Modal
  const [roleModalUser, setRoleModalUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  // Status Modal
  const [statusModalUser, setStatusModalUser] = useState<UserProfile | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>("active");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEducation, setEditEducation] = useState("");
  const [editCoins, setEditCoins] = useState(0);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete User Modal
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfile | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await rootService.getAllUsers(search, roleFilter, statusFilter, 250);
      setUsers(list);
    } catch (err: any) {
      toastError(err.message || "Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setIsAssigningRole(true);
    try {
      await rootService.setUserRole(roleModalUser.uid, selectedRole);
      success(`"${roleModalUser.displayName}" roli "${selectedRole.toUpperCase()}" ga o'zgartirildi!`);
      setRoleModalUser(null);
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Rolni o'zgartirishda xatolik");
    } finally {
      setIsAssigningRole(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!statusModalUser) return;
    if (!statusReason.trim()) {
      toastError("Iltimos, holat o'zgarishi sababini kiriting");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await rootService.setUserStatus(statusModalUser.uid, newStatus, statusReason);
      success(`"${statusModalUser.displayName}" hisob holati "${newStatus.toUpperCase()}" ga o'tkazildi!`);
      setStatusModalUser(null);
      setStatusReason("");
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Holatni yangilashda xatolik");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setIsSavingEdit(true);
    try {
      await rootService.updateUserDetails(editUser.uid, {
        displayName: editName,
        phoneNumber: editPhone,
        educationPlace: editEducation,
        coinBalance: Number(editCoins) || 0,
      });
      success("Foydalanuvchi ma'lumotlari yangilandi!");
      setEditUser(null);
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Ma'lumotlarni saqlashda xatolik");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      await rootService.deleteUser(deleteModalUser.uid, deleteReason);
      success(`"${deleteModalUser.displayName}" tizimdan butunlay o'chirildi!`);
      setDeleteModalUser(null);
      setDeleteReason("");
      fetchUsers(true);
    } catch (err: any) {
      toastError(err.message || "Foydalanuvchini o'chirishda xatolik");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "root_owner":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
            ROOT OWNER
          </span>
        );
      case "director":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            DIREKTOR
          </span>
        );
      case "admin":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
            ADMIN
          </span>
        );
      case "teacher":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            USTOZ
          </span>
        );
      case "student":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            O'QUVCHI
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
            USER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Barcha Foydalanuvchilar va Rollar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Root darajasidagi foydalanuvchilar ro'yxati (Direktorlar va Adminlar ham ko'rinadi)
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchUsers(true)}
          isLoading={refreshing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          className="bg-purple-950/40 border-purple-500/30 text-purple-200"
        >
          Yangilash
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="bg-[#0B0F1F]/90 border-slate-800 p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ism, login, email yoki telefon raqami bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Barcha rollar</option>
              <option value="root_owner">⚡ Root Owner</option>
              <option value="director">👑 Faqat Direktorlar</option>
              <option value="admin">🛡️ Faqat Adminlar</option>
              <option value="teacher">👨‍🏫 O'qituvchilar</option>
              <option value="student">🎓 O'quvchilar</option>
              <option value="user">👤 Oddiy Foydalanuvchilar</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">Faol (Active)</option>
              <option value="suspended">To'xtatilgan (Suspended)</option>
              <option value="blocked">Bloklangan (Blocked)</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700">
              Qidirish
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="bg-[#0B0F1F]/90 border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" className="text-purple-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Foydalanuvchilar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Tangalar</th>
                  <th className="py-3 px-4">Aloqa</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {users.map((u) => {
                  const isCurrentRoot = u.role === "root_owner" || u.email === "hacker@sm.sm";
                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-slate-900/40 transition ${
                        isCurrentRoot ? "bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300">
                            {u.displayName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.displayName}</span>
                              {isCurrentRoot && (
                                <span title="Himoyalangan Root">
                                  <Lock className="w-3 h-3 text-purple-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              UID: {u.uid.slice(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.status === "active"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {formatCoins(u.coinBalance || 0)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        <div>{u.email || u.login || "—"}</div>
                        {u.phoneNumber && <div>{u.phoneNumber}</div>}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setSelectedRole(u.role);
                            }}
                            title="Rolni o'zgartirish"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-purple-950/50 text-slate-300 hover:text-purple-300 border border-slate-800 transition"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setStatusModalUser(u);
                              setNewStatus(u.status);
                            }}
                            title="Holatni o'zgartirish (Blok / To'xtatish)"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300 border border-slate-800 transition"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditUser(u);
                              setEditName(u.displayName);
                              setEditPhone(u.phoneNumber || "");
                              setEditEducation(u.educationPlace || "");
                              setEditCoins(u.coinBalance || 0);
                            }}
                            title="Tahrirlash"
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-indigo-950/50 text-slate-300 hover:text-indigo-300 border border-slate-800 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrentRoot && (
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              title="O'chirish"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Role Change Modal */}
      {roleModalUser && (
        <Modal
          isOpen={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          title={`Rolni O'zgartirish: ${roleModalUser.displayName}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Root Owner ruxsati bilan istalgan foydalanuvchiga Direktor, Admin yoki boshqa rollarni tayinlashingiz mumkin.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Yangi Rolni Tanlang
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="director">👑 Direktor (Markaz ERP, Moliya, Oyliklar, To'liq nazorat)</option>
                <option value="admin">🛡️ Administrator (Guruhlar, O'quvchilar, To'lovlar, Testlar)</option>
                <option value="teacher">👨‍🏫 O'qituvchi (Darslar, Uyga vazifalar, Davomat)</option>
                <option value="student">🎓 O'quvchi (LMS darslar, Vazifalar, Testlar)</option>
                <option value="user">👤 Oddiy Foydalanuvchi</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setRoleModalUser(null)} disabled={isAssigningRole}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveRole}
                isLoading={isAssigningRole}
                className="bg-purple-600 hover:bg-purple-700 border-none"
              >
                Rolni Saqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Modal */}
      {statusModalUser && (
        <Modal
          isOpen={!!statusModalUser}
          onClose={() => setStatusModalUser(null)}
          title={`Hisob Holati: ${statusModalUser.displayName}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Yangi Holat
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="active">Faol (Active) — Tizimga to'liq kirish</option>
                <option value="suspended">To'xtatilgan (Suspended) — Vaqtincha cheklash</option>
                <option value="blocked">Bloklangan (Blocked) — Butunlay taqiqlash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sabab (Auditorlik uchun)
              </label>
              <Input
                placeholder="Holat o'zgartirish sababini yozing..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setStatusModalUser(null)} disabled={isUpdatingStatus}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveStatus}
                isLoading={isUpdatingStatus}
                className="bg-purple-600 hover:bg-purple-700 border-none"
              >
                Tasdiqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Details Modal */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title={`Foydalanuvchini Tahrirlash: ${editUser.displayName}`}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">F.I.O</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Telefon</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">O'qish joyi / Markaz</label>
              <Input value={editEducation} onChange={(e) => setEditEducation(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tillo Tangalari Balansi</label>
              <Input
                type="number"
                value={editCoins}
                onChange={(e) => setEditCoins(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setEditUser(null)} disabled={isSavingEdit}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                isLoading={isSavingEdit}
                className="bg-purple-600 hover:bg-purple-700 border-none"
              >
                Saqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete User Modal */}
      {deleteModalUser && (
        <Modal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          title="Foydalanuvchini Butunlay O'chirish"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <strong>Diqqat:</strong> Ushbu amal qaytarib bo'lmaydi. "{deleteModalUser.displayName}" foydalanuvchisi va uning barcha ma'lumotlari tizimdan butunlay o'chiriladi.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                O'chirish sababi
              </label>
              <Input
                placeholder="O'chirish sababini kiriting..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setDeleteModalUser(null)} disabled={isDeleting}>
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                O'chirishni Tasdiqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
