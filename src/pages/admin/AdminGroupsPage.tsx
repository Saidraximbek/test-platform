import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Plus,
  Users,
  Clock,
  MapPin,
  Calendar,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertCircle,
  UserPlus,
  X,
  Sparkles,
  DollarSign,
  BookOpen,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { groupService } from "../../services/groupService";
import { subjectService } from "../../services/subjectService";
import { teacherService, CreateTeacherInput } from "../../services/teacherService";
import { adminService } from "../../services/adminService";
import { Group, GroupStatus, Subject, UserProfile } from "../../types";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { Modal } from "../../components/common/Modal";
import { formatNumber } from "../../utils";

export const AdminGroupsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create / Edit group modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room, setRoom] = useState("101-xona");
  const [schedule, setSchedule] = useState("Dushanba, Chorshanba, Juma");
  const [startTime, setStartTime] = useState("14:00");
  const [lessonDuration, setLessonDuration] = useState(80);
  const [monthlyPrice, setMonthlyPrice] = useState<number>(450000);
  const [maxStudents, setMaxStudents] = useState<number>(20);
  const [description, setDescription] = useState("");
  const [groupStatus, setGroupStatus] = useState<GroupStatus>("active");
  const [saving, setSaving] = useState(false);

  // Quick Teacher Creation Modal state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [quickTeacherName, setQuickTeacherName] = useState("");
  const [quickTeacherPhone, setQuickTeacherPhone] = useState("+998 ");
  const [quickTeacherLogin, setQuickTeacherLogin] = useState("");
  const [quickTeacherSpecialty, setQuickTeacherSpecialty] = useState("");

  // Group details modal state
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<UserProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [candidateStudentId, setCandidateStudentId] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  // Delete confirmation modal state
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allGroups, allSubs, allTeachers, usersList] = await Promise.all([
        groupService.getGroups().catch(() => []),
        subjectService.getSubjects(false).catch(() => []),
        teacherService.getAllTeachers().catch(() => []),
        adminService.getAllUsers("", "all", 200).catch(() => []),
      ]);

      setGroups(allGroups);
      setSubjects(allSubs);
      setTeachers(allTeachers);
      setAllStudents(
        usersList.filter((u) => u.role === "student" || u.role === "user" || !u.role)
      );
    } catch (err: any) {
      console.warn("Groups loadData error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingGroup(null);
    setGroupName("");
    setSubjectId(subjects[0]?.subjectId || "");
    setTeacherId(teachers[0]?.uid || "");
    setRoom("101-xona");
    setSchedule("Dushanba, Chorshanba, Juma");
    setStartTime("14:00");
    setLessonDuration(80);
    setMonthlyPrice(450000);
    setMaxStudents(20);
    setDescription("");
    setGroupStatus("active");
    setIsModalOpen(true);
  };

  const openEditModal = (grp: Group) => {
    setEditingGroup(grp);
    setGroupName(grp.name);
    setSubjectId(grp.subjectId);
    setTeacherId(grp.teacherId);
    setRoom(grp.room || "101-xona");
    setSchedule(grp.schedule || "Dushanba, Chorshanba, Juma");
    setStartTime(grp.startTime || "14:00");
    setLessonDuration(grp.lessonDuration || 80);
    setMonthlyPrice(grp.monthlyPrice || 450000);
    setMaxStudents(grp.maxStudents || 20);
    setDescription(grp.description || "");
    setGroupStatus(grp.status || "active");
    setIsModalOpen(true);
  };

  // Calculate approximate end time
  const calculateEndTime = (start: string, duration: number) => {
    try {
      const [h, m] = start.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return "";
      const totalMinutes = h * 60 + m + duration;
      const endH = Math.floor((totalMinutes / 60) % 24);
      const endM = totalMinutes % 60;
      return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toastError("Guruh nomini kiriting");
      return;
    }
    if (!teacherId) {
      toastError("Iltimos, guruh o'qituvchisini tanlang yoki yangi o'qituvchi qo'shing");
      return;
    }

    const selectedTeacher = teachers.find((t) => t.uid === teacherId);
    const teacherName = selectedTeacher?.displayName || "";
    const endTime = calculateEndTime(startTime, lessonDuration);

    try {
      setSaving(true);
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.groupId, {
          name: groupName.trim(),
          subjectId,
          teacherId,
          teacherName,
          room: room.trim(),
          schedule,
          startTime,
          endTime,
          lessonDuration: Number(lessonDuration),
          monthlyPrice: Number(monthlyPrice),
          maxStudents: Number(maxStudents),
          status: groupStatus,
          description: description.trim(),
        });
        success("Guruh ma'lumotlari yangilandi!");
      } else {
        await groupService.createGroup({
          name: groupName.trim(),
          subjectId,
          teacherId,
          teacherName,
          room: room.trim(),
          schedule,
          startTime,
          endTime,
          lessonDuration: Number(lessonDuration),
          monthlyPrice: Number(monthlyPrice),
          maxStudents: Number(maxStudents),
          status: groupStatus,
          description: description.trim(),
        });
        success("Yangi guruh to'liq ma'lumotlari bilan muvaffaqiyatli yaratildi!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  // Quick Teacher Creation handler
  const handleQuickCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTeacherName.trim() || !quickTeacherLogin.trim()) {
      toastError("O'qituvchi ismi va logini kiritilishi shart");
      return;
    }

    try {
      setCreatingTeacher(true);
      const newT = await teacherService.createTeacher({
        displayName: quickTeacherName.trim(),
        loginOrEmail: quickTeacherLogin.trim(),
        phoneNumber: quickTeacherPhone.trim(),
        specialty: quickTeacherSpecialty || subjects.find((s) => s.subjectId === subjectId)?.name || "Fan o'qituvchisi",
        password: "teacher123",
        salaryType: "percentage",
        salaryValue: 50,
      });

      success(`Ustoz ${newT.displayName} qo'shildi va tanlandi!`);
      const updatedTeachers = await teacherService.getAllTeachers();
      setTeachers(updatedTeachers);
      setTeacherId(newT.uid);
      setIsTeacherModalOpen(false);
      setQuickTeacherName("");
      setQuickTeacherLogin("");
    } catch (err: any) {
      toastError(err.message || "O'qituvchini qo'shishda xatolik");
    } finally {
      setCreatingTeacher(false);
    }
  };

  const openGroupDetails = async (grp: Group) => {
    setSelectedGroup(grp);
    setLoadingStudents(true);
    try {
      const students = await groupService.getGroupStudents(grp.groupId);
      setGroupStudents(students);
    } catch (err: any) {
      toastError("O'quvchilar ro'yxatini yuklab bo'lmadi");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    if (!window.confirm("Rostdan ham ushbu o'quvchini guruhdan chiqarmoqchimisiz?")) return;

    try {
      await groupService.removeStudentFromGroup(selectedGroup.groupId, studentId);
      success("O'quvchi guruhdan chiqarildi");
      setGroupStudents((prev) => prev.filter((s) => s.uid !== studentId));
      loadData();
    } catch (err: any) {
      toastError(err.message || "Xatolik");
    }
  };

  const handleAddStudentToSelectedGroup = async () => {
    if (!selectedGroup || !candidateStudentId) return;
    try {
      setAddingStudent(true);
      await groupService.addStudentToGroup(selectedGroup.groupId, candidateStudentId);
      const studentObj = allStudents.find((s) => s.uid === candidateStudentId);
      if (studentObj) {
        setGroupStudents((prev) => [...prev, studentObj]);
      }
      setCandidateStudentId("");
      success("O'quvchi guruhga biriktirildi!");
      loadData();
    } catch (err: any) {
      toastError(err.message || "Biriktirishda xatolik");
    } finally {
      setAddingStudent(false);
    }
  };

  const openDeleteModal = (group: Group) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      setDeleting(true);
      await groupService.deleteGroup(groupToDelete.groupId);
      success(`"${groupToDelete.name}" guruhi muvaffaqiyatli o'chirildi!`);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      if (selectedGroup?.groupId === groupToDelete.groupId) {
        setSelectedGroup(null);
        setGroupStudents([]);
      }
      if (isModalOpen && editingGroup?.groupId === groupToDelete.groupId) {
        setIsModalOpen(false);
        setEditingGroup(null);
      }
      loadData();
    } catch (err: any) {
      toastError(err.message || "Guruhni o'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.teacherName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-brand-500" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Guruhlar Boshqaruvi
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            O'quv guruhlari, biriktirilgan o'qituvchi, dars vaqti, xonasi, oylik to'lovi va sig'im nazorati
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              setQuickTeacherSpecialty(subjects[0]?.name || "Matematika");
              setIsTeacherModalOpen(true);
            }}
            variant="secondary"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            + O'qituvchi Qo'shish
          </Button>
          <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Yangi Guruh Ochish
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Guruh nomi, o'qituvchi yoki xona bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha guruhlar</option>
            <option value="active">Faol guruhlar</option>
            <option value="planned">Qabul ochiq (Rejalashtirilgan)</option>
            <option value="archived">Arxivlangan</option>
          </select>
        </div>
      </Card>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <GraduationCap className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Guruhlar mavjud emas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha faol guruhlar yaratilmagan. Yuqoridagi "Yangi Guruh Ochish" tugmasini bosing.
          </p>
          <Button onClick={openCreateModal} size="sm" className="mt-4">
            Birinchi Guruhni Ochish
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((grp) => {
            const count = grp.studentIds?.length || grp.currentStudentsCount || 0;
            const max = grp.maxStudents || 20;
            const isFull = count >= max;
            const sub = subjects.find((s) => s.subjectId === grp.subjectId);
            const teacher = teachers.find((t) => t.uid === grp.teacherId);
            const teacherDisplayName = grp.teacherName || teacher?.displayName || "O'qituvchi biriktirilmagan";

            return (
              <Card
                key={grp.groupId}
                className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block mb-0.5">
                        {sub?.name || "Fan"}
                      </span>
                      <h3 className="text-base font-black text-white">{grp.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(grp)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openDeleteModal(grp)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Guruhni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isFull
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : grp.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {isFull ? "Guruh To'lgan" : grp.status === "active" ? "Faol" : "Yig'ilmoqda"}
                      </span>
                    </div>
                  </div>

                  {/* Informational details block */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-sky-400" /> Ustoz:
                      </span>
                      <span className="font-bold text-white truncate max-w-[170px]">
                        {teacherDisplayName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Dars xonasi:
                      </span>
                      <span className="font-semibold text-emerald-300">{grp.room || "101-xona"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> Kunlar:
                      </span>
                      <span className="font-medium text-slate-200 truncate max-w-[170px]">
                        {grp.schedule}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> Vaqti:
                      </span>
                      <span className="font-semibold text-white">
                        {grp.startTime} {grp.endTime ? `– ${grp.endTime}` : `(${grp.lessonDuration || 80} daq)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Oylik to'lov:
                      </span>
                      <span className="font-bold text-amber-400">
                        {formatNumber(grp.monthlyPrice || 450000)} UZS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Limit Bar & Student List trigger */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Guruh Sig'imi:</span>
                    <span className="font-bold text-white">
                      {count} / {max} o'quvchi
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull
                          ? "bg-rose-500"
                          : count / max > 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => openGroupDetails(grp)}
                  >
                    O'quvchilar ro'yxati ({count})
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Group with ALL Informational Details */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? "Guruhni Tahrirlash" : "Yangi Guruh Ochish"}
      >
        <form onSubmit={handleSaveGroup} className="space-y-4">
          <Input
            label="Guruh nomi"
            placeholder="Masalan: Matematika Pro #1 yoki IELTS 7.0 Intensiv"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Fan</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                required
              >
                <option value="">Fanni tanlang</option>
                {subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">O'qituvchi</label>
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(true)}
                  className="text-[11px] text-sky-400 hover:underline font-bold"
                >
                  + Yangi ustoz
                </button>
              </div>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                required
              >
                <option value="">O'qituvchini tanlang</option>
                {teachers.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.displayName} ({t.specialty || "Fan ustozi"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Dars xonasi (Auditoriya)"
              placeholder="Masalan: 101-xona yoki IT-laboratoriya"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />

            <Input
              label="Oylik to'lov narxi (UZS)"
              type="number"
              placeholder="450000"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(Number(e.target.value))}
              required
            />
          </div>

          {/* Schedule & Timing */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <span className="text-xs font-bold text-sky-400 block">Dars Jadvali va Vaqti</span>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Dushanba, Chorshanba, Juma",
                "Seshanba, Payshanba, Shanba",
                "Shanba, Yakshanba",
                "Har kuni (Dush-Juma)",
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSchedule(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    schedule === p
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Input
              label="Dars kunlari matni"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Boshlanish vaqti"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />

              <Input
                label="Davomiyligi (daqiqa)"
                type="number"
                value={lessonDuration}
                onChange={(e) => setLessonDuration(Number(e.target.value))}
                required
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Yakunlanish vaqti taxminan:{" "}
              <strong className="text-white font-mono">
                {calculateEndTime(startTime, lessonDuration)}
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Maksimal o'quvchi sig'imi (Limit)"
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Guruh holati</label>
              <select
                value={groupStatus}
                onChange={(e: any) => setGroupStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="active">Faol (Darslar ketmoqda)</option>
                <option value="planned">Qabul ochiq (Rejalashtirilmoqda)</option>
                <option value="archived">Arxivlangan</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
            {editingGroup ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => openDeleteModal(editingGroup)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Guruhni o'chirish
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={saving}>
                {editingGroup ? "O'zgarishlarni Saqlash" : "Guruhni Yaratish"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Quick Teacher Modal */}
      <Modal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title="Tezkor O'qituvchi Qo'shish"
      >
        <form onSubmit={handleQuickCreateTeacher} className="space-y-4">
          <Input
            label="O'qituvchi F.I.Sh"
            placeholder="Alisher Qodirov"
            value={quickTeacherName}
            onChange={(e) => setQuickTeacherName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mutaxassislik fani"
              placeholder="Masalan: Matematika"
              value={quickTeacherSpecialty}
              onChange={(e) => setQuickTeacherSpecialty(e.target.value)}
              required
            />

            <Input
              label="Telefon raqami"
              placeholder="+998 90 123 45 67"
              value={quickTeacherPhone}
              onChange={(e) => setQuickTeacherPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Kirish logini yoki email"
            placeholder="ustoz_alisher"
            value={quickTeacherLogin}
            onChange={(e) => setQuickTeacherLogin(e.target.value)}
            helperText="Parol avtomatik ravishda 'teacher123' qilib belgilanadi"
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsTeacherModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={creatingTeacher}>
              O'qituvchini Saqlash va Tanlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Group Students Details */}
      <Modal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        title={selectedGroup ? `${selectedGroup.name} — O'quvchilar` : ""}
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Jami o'quvchilar:</span>
            <span className="font-bold text-white">
              {groupStudents.length} / {selectedGroup?.maxStudents || 20} nafar
            </span>
          </div>

          {/* Quick Add Student */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              + Ushbu guruhga o'quvchi biriktirish:
            </label>
            <div className="flex gap-2">
              <select
                value={candidateStudentId}
                onChange={(e) => setCandidateStudentId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">O'quvchini tanlang...</option>
                {allStudents
                  .filter((s) => !groupStudents.some((gs) => gs.uid === s.uid))
                  .map((st) => (
                    <option key={st.uid} value={st.uid}>
                      {st.displayName} ({st.phoneNumber || "Telefon yo'q"})
                    </option>
                  ))}
              </select>
              <Button
                size="sm"
                onClick={handleAddStudentToSelectedGroup}
                disabled={!candidateStudentId || addingStudent}
                isLoading={addingStudent}
              >
                Qo'shish
              </Button>
            </div>
          </div>

          {loadingStudents ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" className="text-brand-500" />
            </div>
          ) : groupStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Ushbu guruhga hali o'quvchilar biriktirilmagan. "O'quvchilar & Guruhlar" bo'limidan biriktirishingiz mumkin.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto pr-1">
              {groupStudents.map((st, idx) => (
                <div key={st.uid} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-4">{idx + 1}.</span>
                    <div>
                      <p className="font-bold text-white">{st.displayName}</p>
                      <p className="text-[11px] text-slate-400">{st.phoneNumber || "Telefon yo'q"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStudent(st.uid)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Guruhdan chiqarish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Delete Group Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setIsDeleteModalOpen(false);
            setGroupToDelete(null);
          }
        }}
        title="Guruhni o'chirishni tasdiqlash"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3.5">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">
                Rostdan ham ushbu guruhni o'chirib tashlamoqchimisiz?
              </h4>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                Ushbu amalni ortga qaytarib bo'lmaydi. Guruh o'chirilgach, unga biriktirilgan barcha o'quvchilar va o'qituvchi profilidan ushbu guruh avtomatik olib tashlanadi.
              </p>
            </div>
          </div>

          {groupToDelete && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Guruh nomi:</span>
                <span className="font-bold text-white text-sm">{groupToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">O'qituvchi:</span>
                <span className="font-medium text-slate-200">{groupToDelete.teacherName || "Biriktirilmagan"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Biriktirilgan o'quvchilar:</span>
                <span className="font-bold text-amber-400">
                  {groupToDelete.studentIds?.length || groupToDelete.currentStudentsCount || 0} nafar
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Dars xonasi va vaqti:</span>
                <span className="font-medium text-slate-300">
                  {groupToDelete.room || "101-xona"}, {groupToDelete.startTime}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={deleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setGroupToDelete(null);
              }}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deleting}
              onClick={handleConfirmDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Ha, guruhni o'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminGroupsPage;
