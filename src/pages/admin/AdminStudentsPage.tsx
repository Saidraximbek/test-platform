import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  GraduationCap,
  Phone,
  Shield,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Group, UserProfile, UserStatus } from "../../types";
import { groupService } from "../../services/groupService";
import { adminService } from "../../services/adminService";
import { attendanceService, StudentAttendanceSummary } from "../../services/attendanceService";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { CoinBadge } from "../../components/common/CoinBadge";

export const AdminStudentsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Assign to group modal
  const [assignStudent, setAssignStudent] = useState<UserProfile | null>(null);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Student Profile Detail modal
  const [detailStudent, setDetailStudent] = useState<UserProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<StudentAttendanceSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Edit status modal
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>("active");
  const [editSchool, setEditSchool] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, allGroups] = await Promise.all([
        adminService.getAllUsers("", "all", 200).catch(() => []),
        groupService.getGroups().catch(() => []),
      ]);

      // Filter students (exclude admins, directors, teachers)
      const stList = allUsers.filter(
        (u) => u.role === "student" || u.role === "user" || !u.role
      );

      setStudents(stList);
      setGroups(allGroups);
    } catch (err: any) {
      console.warn("Students loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignStudent || !targetGroupId) return;

    try {
      setAssigning(true);
      await groupService.addStudentToGroup(targetGroupId, assignStudent.uid);
      success("O'quvchi muvaffaqiyatli guruhga biriktirildi!");

      // Update state in memory immediately
      setStudents((prev) =>
        prev.map((s) =>
          s.uid === assignStudent.uid
            ? {
                ...s,
                groupIds: [...(s.groupIds || []).filter((id) => id !== targetGroupId), targetGroupId],
                isCenterStudent: true,
              }
            : s
        )
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === targetGroupId
            ? {
                ...g,
                studentIds: [...(g.studentIds || []).filter((id) => id !== assignStudent.uid), assignStudent.uid],
                currentStudentsCount: (g.currentStudentsCount || 0) + 1,
              }
            : g
        )
      );

      setAssignStudent(null);
      setTargetGroupId("");
      loadData();
    } catch (err: any) {
      toastError(err.message || "Guruhga biriktirishda xatolik");
    } finally {
      setAssigning(false);
    }
  };

  const openStudentDetail = async (st: UserProfile) => {
    setDetailStudent(st);
    setLoadingStats(true);
    try {
      const stats = await attendanceService.getStudentAttendanceStats(st.uid);
      setAttendanceStats(stats);
    } catch (err) {
      setAttendanceStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const openEditModal = (st: UserProfile) => {
    setEditingStudent(st);
    setNewStatus(st.status || "active");
    setEditSchool(st.school || st.educationPlace || "");
    setEditGrade(st.grade || "");
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setUpdating(true);
      const userRef = doc(db, "users", editingStudent.uid);
      await updateDoc(userRef, {
        status: newStatus,
        school: editSchool,
        educationPlace: editSchool,
        grade: editGrade,
        updatedAt: serverTimestamp(),
      });

      success("O'quvchi ma'lumotlari yangilandi!");
      setEditingStudent(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || "Xatolik yuz berdi");
    } finally {
      setUpdating(false);
    }
  };

  const filteredStudents = students.filter((st) => {
    const matchSearch =
      st.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.phoneNumber?.includes(searchQuery);

    const matchGroup =
      selectedGroupFilter === "all" ||
      (Array.isArray(st.groupIds) && st.groupIds.includes(selectedGroupFilter)) ||
      (Array.isArray((st as any).enrolledGroups) &&
        (st as any).enrolledGroups.some((eg: any) => eg && eg.groupId === selectedGroupFilter)) ||
      groups.some(
        (g) =>
          g.groupId === selectedGroupFilter &&
          Array.isArray(g.studentIds) &&
          g.studentIds.includes(st.uid)
      );

    const matchStatus = statusFilter === "all" || st.status === statusFilter;

    return matchSearch && matchGroup && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-brand-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              O'quvchilar Boshqaruvi
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Markaz o'quvchilari ro'yxati, guruhlarga biriktirish va o'zlashtirish tahlili
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi ismi yoki telefon raqami bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.groupId} value={g.groupId}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="suspended">To'xtatilgan</option>
            <option value="blocked">Bloklangan</option>
          </select>
        </div>
      </Card>

      {/* Students Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <UserCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">O'quvchilar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Qidiruv so'rovi bo'yicha hech qanday o'quvchi ma'lumoti chiqmadi.
          </p>
        </Card>
      ) : (
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5">O'quvchi</th>
                  <th className="p-3.5">Telefon / Maktab</th>
                  <th className="p-3.5">Guruhlari</th>
                  <th className="p-3.5">Tillo Tangalari</th>
                  <th className="p-3.5">Holat</th>
                  <th className="p-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((st) => {
                  const studentGroups = groups.filter(
                    (g) =>
                      (Array.isArray(st.groupIds) && st.groupIds.includes(g.groupId)) ||
                      (Array.isArray(g.studentIds) && g.studentIds.includes(st.uid)) ||
                      (Array.isArray((st as any).enrolledGroups) &&
                        (st as any).enrolledGroups.some((eg: any) => eg && eg.groupId === g.groupId))
                  );

                  return (
                    <tr key={st.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div
                          onClick={() => openStudentDetail(st)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {st.photoURL ? (
                            <img
                              src={st.photoURL}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                              {st.displayName?.charAt(0) || "S"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white group-hover:text-brand-400 transition-colors">
                              {st.displayName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Yoshi: {st.age || 16} da
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="text-white font-medium">{st.phoneNumber || "Kiritilmagan"}</p>
                        <p className="text-[11px] text-slate-400">
                          {st.school || st.educationPlace || "Maktab kiritilmagan"}
                        </p>
                      </td>

                      <td className="p-3.5">
                        {studentGroups.length === 0 ? (
                          <span className="text-[11px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            Guruhga biriktirilmagan
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {studentGroups.map((g) => (
                              <span
                                key={g.groupId}
                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700"
                              >
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <CoinBadge amount={st.coinBalance || 0} size="sm" />
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            st.status === "active" || !st.status
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : st.status === "suspended"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {st.status || "active"}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAssignStudent(st)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600/20 text-brand-400 hover:bg-brand-600 hover:text-white transition-all"
                            title="Guruhga biriktirish"
                          >
                            + Guruh
                          </button>
                          <button
                            onClick={() => openEditModal(st)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      {/* Modal: Assign Student to Group */}
      <Modal
        isOpen={!!assignStudent}
        onClose={() => setAssignStudent(null)}
        title={assignStudent ? `${assignStudent.displayName}ni guruhga biriktirish` : ""}
      >
        <form onSubmit={handleAssignToGroup} className="space-y-4">
          <p className="text-xs text-slate-400">
            O'quvchini biriktirish uchun quyidagi faol guruhlardan birini tanlang. Guruh sig'imi
            avtomatik tekshiriladi:
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Guruh</label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Guruhni tanlang</option>
              {groups.length === 0 ? (
                <option value="" disabled>Hozircha guruhlar mavjud emas</option>
              ) : (
                groups.map((g) => {
                  const count = g.studentIds ? g.studentIds.length : g.currentStudentsCount || 0;
                  const isFull = count >= (g.maxStudents || 20);
                  const isAlreadyIn =
                    (Array.isArray(assignStudent?.groupIds) && assignStudent.groupIds.includes(g.groupId)) ||
                    (Array.isArray(g.studentIds) && assignStudent?.uid && g.studentIds.includes(assignStudent.uid)) ||
                    (Array.isArray((assignStudent as any)?.enrolledGroups) &&
                      (assignStudent as any).enrolledGroups.some((eg: any) => eg && eg.groupId === g.groupId));
                  return (
                    <option key={g.groupId} value={g.groupId} disabled={isFull || isAlreadyIn}>
                      {g.name} ({count}/{g.maxStudents || 20} o'quvchi) {isAlreadyIn ? "- [ALLAQACHON BIRIKTIRILGAN]" : isFull ? "- [TO'LGAN]" : ""}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignStudent(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={assigning}>
              Biriktirish
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Student Detailed Profile Overview */}
      <Modal
        isOpen={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        title={detailStudent ? `${detailStudent.displayName} — Shaxsiy Profil` : ""}
      >
        {detailStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              {detailStudent.photoURL ? (
                <img
                  src={detailStudent.photoURL}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-14 h-14 rounded-2xl object-cover border border-brand-500/50"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xl">
                  {detailStudent.displayName?.charAt(0) || "S"}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-white">{detailStudent.displayName}</h3>
                <p className="text-slate-400 mt-0.5">
                  Telefon: {detailStudent.phoneNumber || "kiritilmagan"}
                </p>
                <p className="text-slate-400">
                  Ta'lim joyi: {detailStudent.educationPlace || detailStudent.school || "Kiritilmagan"}
                </p>
              </div>
            </div>

            {/* Attendance & Stats Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Davomat</span>
                <span className="text-base font-black text-emerald-400 mt-1 block">
                  {loadingStats ? "..." : `${attendanceStats?.percentage || 100}%`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tillo Balansi</span>
                <span className="text-base font-black text-amber-400 mt-1 block">
                  {detailStudent.coinBalance || 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Testlar</span>
                <span className="text-base font-black text-sky-400 mt-1 block">
                  {detailStudent.testsCompleted || 0} ta
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">To'g'ri Javob</span>
                <span className="text-base font-black text-indigo-400 mt-1 block">
                  {detailStudent.totalCorrectAnswers || 0} ta
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailStudent(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Student Profile & Status */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="O'quvchi ma'lumotlarini tahrirlash"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <Input
            label="Maktab / Ta'lim muassasasi"
            value={editSchool}
            onChange={(e) => setEditSchool(e.target.value)}
          />

          <Input
            label="Sinfi / Kursi"
            placeholder="Masalan: 8-sinf"
            value={editGrade}
            onChange={(e) => setEditGrade(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hisob holati (Status)
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as UserStatus)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="active">Faol (Active)</option>
              <option value="suspended">Vaqtincha to'xtatilgan (Suspended)</option>
              <option value="blocked">Bloklangan (Blocked)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingStudent(null)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={updating}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
