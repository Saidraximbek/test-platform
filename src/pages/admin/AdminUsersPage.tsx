import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  Coins,
  Ban,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  Crown,
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
import { CoinBadge } from "../../components/common/CoinBadge";
import { formatDate, formatCoins } from "../../utils";

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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

  // Role Modal
  const [roleModalUser, setRoleModalUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isAssigningRole, setIsAssigningRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await adminService.getAllUsers(search, statusFilter, 100);
      setUsers(list);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

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
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Holatni o'zgartirishda xatolik");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAdjustCoins = async () => {
    if (!coinModalUser || !coinReason.trim() || coinAmount === 0) {
      toastError("Miqdor va sababni to'g'ri kiriting");
      return;
    }
    setIsAdjustingCoin(true);
    try {
      await coinService.adminCoinAdjust(coinModalUser.uid, coinAmount, coinReason);
      success(`Tillo tangalari muvaffaqiyatli o'zgartirildi!`);
      setCoinModalUser(null);
      setCoinReason("");
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Tangalarni o'zgartirishda xatolik");
    } finally {
      setIsAdjustingCoin(false);
    }
  };

  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setIsAssigningRole(true);
    try {
      await adminService.setUserRole(roleModalUser.uid, selectedRole);
      success(`Foydalanuvchi roli "${selectedRole.toUpperCase()}" ga o'zgartirildi`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (err: any) {
      toastError(err.message || "Rolni o'zgartirishda xatolik");
    } finally {
      setIsAssigningRole(false);
    }
  };

  const statusVariants: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    suspended: "warning",
    blocked: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Foydalanuvchilar Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Foydalanuvchilar ro'yxati, hisob holatlari, Tillo balansi va huquqlar
          </p>
        </div>
      </div>

      {/* Filter and Search */}
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300"
        >
          <option value="all">Barcha holatlar</option>
          <option value="active">Faqat faol (Active)</option>
          <option value="suspended">To'xtatilgan (Suspended)</option>
          <option value="blocked">Bloklangan (Blocked)</option>
        </select>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Foydalanuvchi</th>
                  <th className="p-4">Aloqa / Maktab</th>
                  <th className="p-4">Balans</th>
                  <th className="p-4">Testlar</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u, idx) => {
                  const uidStr = u.uid || `user-${idx}`;
                  const shortUid = uidStr.length > 10 ? `${uidStr.substring(0, 10)}...` : uidStr;
                  return (
                    <tr key={uidStr} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName || "User"} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                              {u.displayName?.charAt(0) || "U"}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-white block">{u.displayName || "Foydalanuvchi"}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{shortUid}</span>
                          </div>
                        </div>
                      </td>

                    <td className="p-4 text-slate-300">
                      <div>{u.phoneNumber || "-"}</div>
                      <div className="text-[10px] text-slate-500">{u.educationPlace || "-"}</div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-amber-400">{formatCoins(u.coinBalance || 0)} Tillo</span>
                    </td>

                    <td className="p-4 text-slate-300">
                      <div>{u.testsCompleted || 0} ta test</div>
                      <div className="text-[10px] text-emerald-400">{u.totalCorrectAnswers || 0} to'g'ri</div>
                    </td>

                    <td className="p-4">
                      <Badge variant={statusVariants[u.status] || "neutral"}>
                        {u.status}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[11px] font-bold ${
                          u.role === "admin" ? "text-brand-400" : "text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
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

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRoleModalUser(u);
                          setSelectedRole(u.role || "user");
                        }}
                        className="text-purple-400 hover:bg-purple-400/10"
                        title="Rolni o'zgartirish (Direktor, Admin, O'qituvchi, O'quvchi)"
                      >
                        <Crown className="w-4 h-4" />
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
                Yangi holat
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-2.5 text-white"
              >
                <option value="active">Active (Faol - to'liq ruxsat)</option>
                <option value="suspended">Suspended (To'xtatilgan - test ishlay olmaydi)</option>
                <option value="blocked">Blocked (Bloklangan - kirish taqiqlangan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                O'zgartirish sababi (Audit jurnaliga yoziladi)
              </label>
              <textarea
                rows={3}
                placeholder="Sababni batafsil yozing..."
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
        title="Tillo tangalarini sozlash"
      >
        {coinModalUser && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Foydalanuvchi: <strong className="text-white">{coinModalUser.displayName}</strong>
              <br />
              Hozirgi balans: <strong className="text-amber-400">{coinModalUser.coinBalance} Tillo</strong>
            </p>

            <Input
              label="O'zgartirish miqdori (Qo'shish: musbat, Ayirish: manfiy)"
              type="number"
              value={coinAmount}
              onChange={(e) => setCoinAmount(Number(e.target.value))}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sabab (Audit va foydalanuvchi bildirishnomasiga yoziladi)
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
                Tangani o'zgartirish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Foydalanuvchi Rolini O'zgartirish"
      >
        {roleModalUser && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <p className="text-xs text-slate-300">
                Foydalanuvchi: <strong className="text-white">{roleModalUser.displayName}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hozirgi roli: <span className="font-bold uppercase text-brand-400">{roleModalUser.role || "user"}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Yangi rol tanlang:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="director">👑 Direktor (ERP, Moliya, Oyliklar, Xarajatlar, To'liq nazorat)</option>
                <option value="admin">🛡️ Administrator (Guruhlar, O'quvchilar, To'lovlar qabul qilish)</option>
                <option value="teacher">👨‍🏫 O'qituvchi (Darslar, Uyga vazifalar, Davomat, Savollar)</option>
                <option value="student">🎓 O'quvchi (LMS darslar, Vazifalar, Baholar, Testlar)</option>
                <option value="user">👤 Oddiy foydalanuvchi (Faqat testlar va Do'kon)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setRoleModalUser(null)}>
                Bekor qilish
              </Button>
              <Button isLoading={isAssigningRole} onClick={handleSaveRole}>
                Rolni Saqlash
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
