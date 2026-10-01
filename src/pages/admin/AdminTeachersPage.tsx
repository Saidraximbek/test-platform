import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  DollarSign,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { teacherService, CreateTeacherInput } from "../../services/teacherService";
import { subjectService } from "../../services/subjectService";
import { UserProfile, Subject } from "../../types";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { formatNumber } from "../../utils";

export const AdminTeachersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLogin, setFormLogin] = useState("");
  const [formPassword, setFormPassword] = useState("teacher123");
  const [formPhone, setFormPhone] = useState("+998");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formSalaryType, setFormSalaryType] = useState<"percentage" | "fixed" | "mixed">("percentage");
  const [formSalaryValue, setFormSalaryValue] = useState<number>(50);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTeachers, allSubs] = await Promise.all([
        teacherService.getAllTeachers(),
        subjectService.getSubjects(false),
      ]);
      setTeachers(allTeachers);
      setSubjects(allSubs);
      if (allSubs.length > 0 && !formSpecialty) {
        setFormSpecialty(allSubs[0].name);
      }
    } catch (err: any) {
      toastError(err.message || "O'qituvchilarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormName("");
    setFormLogin("");
    setFormPassword("teacher123");
    setFormPhone("+998 ");
    setFormSpecialty(subjects[0]?.name || "Matematika");
    setFormSalaryType("percentage");
    setFormSalaryValue(50);
    setCreateModalOpen(true);
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formLogin.trim()) {
      toastError("Ism va login kiritilishi shart");
      return;
    }

    try {
      setCreating(true);
      const input: CreateTeacherInput = {
        displayName: formName,
        loginOrEmail: formLogin,
        password: formPassword,
        phoneNumber: formPhone,
        specialty: formSpecialty,
        salaryType: formSalaryType,
        salaryValue: Number(formSalaryValue),
      };

      await teacherService.createTeacher(input);
      success("Yangi o'qituvchi muvaffaqiyatli qo'shildi!");
      setCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || "O'qituvchi qo'shishda xatolik yuz berdi");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (t: UserProfile) => {
    setEditingTeacher(t);
    setFormName(t.displayName || "");
    setFormPhone(t.phoneNumber || "");
    setFormSpecialty(t.specialty || subjects[0]?.name || "Matematika");
    setFormSalaryType(t.salaryType || "percentage");
    setFormSalaryValue(t.salaryValue || 50);
    setEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    try {
      setUpdating(true);
      await teacherService.updateTeacher(editingTeacher.uid, {
        displayName: formName.trim(),
        phoneNumber: formPhone.trim(),
        specialty: formSpecialty.trim(),
        salaryType: formSalaryType,
        salaryValue: Number(formSalaryValue),
      });

      success("O'qituvchi ma'lumotlari yangilandi!");
      setEditModalOpen(false);
      setEditingTeacher(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || "Yangilashda xatolik");
    } finally {
      setUpdating(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSpecialty = specialtyFilter === "all" || t.specialty === specialtyFilter;
    return matchSearch && matchSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-7 h-7 text-sky-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              O'qituvchilar Boshqaruvi
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Markaz o'qituvchilari, ularning mutaxassisligi, login ma'lumotlari va maosh stavkalari
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-lg shadow-brand-500/20"
        >
          Yangi O'qituvchi Qo'shish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Jami O'qituvchilar</span>
            <span className="text-xl font-black text-white">{teachers.length} nafar</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Faol Ustozlar</span>
            <span className="text-xl font-black text-emerald-400">
              {teachers.filter((t) => t.status === "active" || !t.status).length} nafar
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Mavjud Fanlar</span>
            <span className="text-xl font-black text-amber-400">{subjects.length} ta fan</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'qituvchi ismi, fani yoki telefon raqami bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {subjects.length > 0 && (
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha fanlar</option>
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Teachers List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">O'qituvchilar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha tizimga o'qituvchilar kiritilmagan. Yuqoridagi "Yangi O'qituvchi Qo'shish" tugmasi orqali ustozlarni qo'shing.
          </p>
          <Button onClick={openCreateModal} size="sm" className="mt-4">
            Birinchi O'qituvchini Qo'shish
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => {
            const isPercentage = t.salaryType === "percentage";

            return (
              <Card
                key={t.uid}
                className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {t.photoURL ? (
                        <img
                          src={t.photoURL}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                          {t.displayName?.charAt(0) || "T"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-white">{t.displayName}</h4>
                        <span className="text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {t.specialty || "Umumiy fan"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        t.status === "active" || !t.status
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {t.status === "active" || !t.status ? "Faol" : "To'xtatilgan"}
                    </span>
                  </div>

                  {/* Informational Details */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Telefon:
                      </span>
                      <span className="font-semibold text-white">{t.phoneNumber || "Kiritilmagan"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Login / Email:
                      </span>
                      <span className="font-mono text-slate-300 truncate max-w-[150px]">
                        {t.email || t.uid}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-amber-400" /> Maosh stavkasi:
                      </span>
                      <span className="font-bold text-amber-400">
                        {isPercentage
                          ? `${t.salaryValue || 50}% (Foiz)`
                          : `${formatNumber(t.salaryValue || 4000000)} UZS`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditModal(t)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Tahrirlash
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create Teacher */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yangi O'qituvchi Qo'shish"
      >
        <form onSubmit={handleCreateTeacher} className="space-y-4">
          <Input
            label="O'qituvchi F.I.Sh (To'liq ism)"
            type="text"
            placeholder="Alisher Qodirov"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mutaxassislik fani
              </label>
              <select
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-brand-500"
              >
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="Boshqa fan">Boshqa fan</option>
              </select>
            </div>

            <Input
              label="Telefon raqami"
              type="text"
              placeholder="+998 90 123 45 67"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tizimga kirish logini yoki email"
              type="text"
              placeholder="ustoz_alisher yoki alisher@fargoniy.uz"
              value={formLogin}
              onChange={(e) => setFormLogin(e.target.value)}
              helperText="O'qituvchi shu login orqali platformaga kiradi"
              required
            />

            <Input
              label="Boshlang'ich parol"
              type="text"
              placeholder="teacher123"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              helperText="Kamida 6 ta belgi"
              required
            />
          </div>

          {/* Salary Type & Value */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <span className="text-xs font-bold text-amber-400 block">Maosh Hisoblash Tizimi</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  To'lov turi
                </label>
                <select
                  value={formSalaryType}
                  onChange={(e: any) => setFormSalaryType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
                >
                  <option value="percentage">Guruhdan foiz (%)</option>
                  <option value="fixed">Qat'iy oylik (UZS)</option>
                  <option value="mixed">Aralash formula</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {formSalaryType === "percentage" ? "Foiz stavkasi (%)" : "Oylik maosh (UZS)"}
                </label>
                <input
                  type="number"
                  value={formSalaryValue}
                  onChange={(e) => setFormSalaryValue(Number(e.target.value))}
                  placeholder={formSalaryType === "percentage" ? "50" : "4000000"}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={creating}>
              O'qituvchini Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Teacher */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingTeacher ? `${editingTeacher.displayName} ma'lumotlarini tahrirlash` : ""}
      >
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <Input
            label="O'qituvchi F.I.Sh"
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mutaxassislik fani
              </label>
              <select
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-brand-500"
              >
                {subjects.map((s) => (
                  <option key={s.subjectId} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="Boshqa fan">Boshqa fan</option>
              </select>
            </div>

            <Input
              label="Telefon raqami"
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              required
            />
          </div>

          {/* Salary settings */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <span className="text-xs font-bold text-amber-400 block">Maosh Hisoblash Tizimi</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  To'lov turi
                </label>
                <select
                  value={formSalaryType}
                  onChange={(e: any) => setFormSalaryType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
                >
                  <option value="percentage">Guruhdan foiz (%)</option>
                  <option value="fixed">Qat'iy oylik (UZS)</option>
                  <option value="mixed">Aralash formula</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {formSalaryType === "percentage" ? "Foiz stavkasi (%)" : "Oylik maosh (UZS)"}
                </label>
                <input
                  type="number"
                  value={formSalaryValue}
                  onChange={(e) => setFormSalaryValue(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={updating}>
              O'zgarishlarni Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTeachersPage;
