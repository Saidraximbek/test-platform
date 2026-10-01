import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Users,
  CreditCard,
  Search,
  UserPlus,
  DollarSign,
} from "lucide-react";
import { subjectService } from "../../services/subjectService";
import { teacherService } from "../../services/teacherService";
import { useToast } from "../../context/ToastContext";
import { Subject, UserProfile } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { formatNumber } from "../../utils";

export const AdminSubjectsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Subject Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState<number>(450000);
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Teacher Modal State
  const [quickTeacherModalOpen, setQuickTeacherModalOpen] = useState(false);
  const [creatingTeacher, setCreatingTeacher] = useState(false);
  const [quickTeacherName, setQuickTeacherName] = useState("");
  const [quickTeacherLogin, setQuickTeacherLogin] = useState("");
  const [quickTeacherPassword, setQuickTeacherPassword] = useState("teacher123");
  const [quickTeacherPhone, setQuickTeacherPhone] = useState("+998");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsList, teachersList] = await Promise.all([
        subjectService.getSubjects(false),
        teacherService.getAllTeachers(),
      ]);
      setSubjects(subjectsList);
      setTeachers(teachersList);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setName("");
    setSlug("");
    setDescription("");
    setTeacherId("");
    setTeacherName("");
    setMonthlyPrice(450000);
    setOrder(subjects.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setSlug(sub.slug);
    setDescription(sub.description || "");
    setTeacherId(sub.teacherId || "");
    setTeacherName(sub.teacherName || "");
    setMonthlyPrice(sub.monthlyPrice || 450000);
    setOrder(sub.order || 1);
    setIsActive(sub.isActive !== false);
    setModalOpen(true);
  };

  const handleTeacherChange = (id: string) => {
    setTeacherId(id);
    const selected = teachers.find((t) => t.uid === id);
    setTeacherName(selected ? selected.displayName : "");
  };

  const handleQuickCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTeacherName.trim() || !quickTeacherLogin.trim()) {
      toastError("Ism va login kiritilishi shart");
      return;
    }

    setCreatingTeacher(true);
    try {
      const newTeacher = await teacherService.createTeacher({
        displayName: quickTeacherName.trim(),
        login: quickTeacherLogin.trim(),
        password: quickTeacherPassword.trim(),
        phoneNumber: quickTeacherPhone.trim(),
        specialty: name.trim() || "O'qituvchi",
        salaryType: "percentage",
        salaryValue: 50,
      });

      success(`Ustoz ${newTeacher.displayName} muvaffaqiyatli qo'shildi!`);
      const updatedTeachers = await teacherService.getAllTeachers();
      setTeachers(updatedTeachers);

      // Automatically select newly created teacher for this subject
      setTeacherId(newTeacher.uid);
      setTeacherName(newTeacher.displayName);
      setQuickTeacherModalOpen(false);
    } catch (err: any) {
      toastError(err.message || "O'qituvchini qo'shishda xatolik");
    } finally {
      setCreatingTeacher(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toastError("Nom va slug kiritilishi shart");
      return;
    }

    setIsSaving(true);
    try {
      await subjectService.saveSubject({
        subjectId: editingSubject?.subjectId,
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        teacherId,
        teacherName,
        monthlyPrice: Number(monthlyPrice) || 0,
        order: Number(order),
        isActive,
      });

      success("Fan muvaffaqiyatli saqlandi!");
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError(err.message || "Fanni saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu fanni o'chirmoqchimisiz?")) return;
    try {
      await subjectService.deleteSubject(subjectId);
      success("Fan o'chirildi");
      fetchData();
    } catch (err: any) {
      toastError(err.message || "O'chirishda xatolik");
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchSlug = s.slug.toLowerCase().includes(q);
    const matchTeacher = s.teacherName?.toLowerCase().includes(q) || false;
    return matchName || matchSlug || matchTeacher;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">Fanlar Boshqaruvi</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Platformadagi barcha fanlar, ularning mas'ul o'qituvchilari va oylik kurs narxlari
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="w-full sm:w-auto shadow-lg shadow-brand-500/20"
          rightIcon={<Plus className="w-4 h-4" />}
        >
          Yangi Fan Qo'shish
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jami Fanlar</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{subjects.length}</p>
        </Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faol Fanlar</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {subjects.filter((s) => s.isActive !== false).length}
          </p>
        </Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ustozlar Bazasi</p>
          <p className="text-xl sm:text-2xl font-black text-brand-400 mt-1">{teachers.length}</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Fan nomi, slug yoki mas'ul o'qituvchi bo'yicha qidiruv..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Subjects Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" className="text-brand-600" />
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/60 border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">Hech qanday fan topilmadi</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? "Qidiruv so'roviga mos fan mavjud emas" : "Yangi fan qo'shish tugmasini bosing"}
          </p>
        </Card>
      ) : (
        <>
          {/* Mobile Card List (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSubjects.map((sub) => (
              <Card
                key={sub.subjectId}
                className="p-4 bg-slate-900 border-slate-800/90 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-black text-xs shrink-0">
                      {sub.order}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{sub.name}</h4>
                      <p className="text-[11px] font-mono text-slate-500 truncate">/{sub.slug}</p>
                    </div>
                  </div>
                  <Badge variant={sub.isActive ? "success" : "neutral"}>
                    {sub.isActive ? "Faol" : "Nofaol"}
                  </Badge>
                </div>

                {/* Teacher and Price Information */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300 truncate">
                    <Users className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="truncate">
                      {sub.teacherName || <span className="text-slate-500">Biriktirilmagan</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 justify-end font-bold">
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatNumber(sub.monthlyPrice || 450000)} so'm</span>
                  </div>
                </div>

                {sub.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/40 p-2 rounded-lg">
                    {sub.description}
                  </p>
                )}

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(sub)}
                    className="text-xs h-8 px-3"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Tahrirlash
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(sub.subjectId)}
                    className="text-rose-400 hover:bg-rose-500/10 text-xs h-8 px-2.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <Card className="hidden md:block bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="p-4">Tartib</th>
                    <th className="p-4">Fan nomi</th>
                    <th className="p-4">Mas'ul O'qituvchi</th>
                    <th className="p-4">Oylik To'lov</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Holat</th>
                    <th className="p-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-400">{sub.order}</td>
                      <td className="p-4 font-bold text-white">
                        <div>{sub.name}</div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-400 font-normal max-w-xs truncate">
                            {sub.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-slate-200">
                        {sub.teacherName ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-brand-400" />
                            <span className="font-semibold">{sub.teacherName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Biriktirilmagan</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 font-mono">
                        {formatNumber(sub.monthlyPrice || 450000)} so'm
                      </td>
                      <td className="p-4 text-slate-400 font-mono">/{sub.slug}</td>
                      <td className="p-4">
                        <Badge variant={sub.isActive ? "success" : "neutral"}>
                          {sub.isActive ? "Faol" : "Nofaol"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(sub)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(sub.subjectId)}
                          className="text-rose-400 hover:bg-rose-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Create / Edit Subject Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? "Fanni tahrirlash" : "Yangi fan qo'shish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Fan nomi"
            placeholder="Matematika, Fizika, Ingliz tili..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!editingSubject) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "")
                );
              }
            }}
          />

          <Input
            label="Slug (URL identifikator)"
            placeholder="matematika"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          {/* Teacher Selection with Quick Add Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Mas'ul / Asosiy O'qituvchi
              </label>
              <button
                type="button"
                onClick={() => setQuickTeacherModalOpen(true)}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" /> + Yangi ustoz
              </button>
            </div>
            <select
              value={teacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Biriktirilmagan (keyinroq tanlash) --</option>
              {teachers.map((t) => (
                <option key={t.uid} value={t.uid}>
                  {t.displayName} ({t.specialty || "O'qituvchi"})
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Tuition Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Standart Oylik Kurs To'lovi (so'm)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step={10000}
                placeholder="450000"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatNumber(monthlyPrice || 0)} so'm / oy
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Fan haqida ma'lumot</label>
            <textarea
              rows={3}
              placeholder="Fan kursi haqida qisqacha ma'lumot va yo'nalish..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tartib raqami"
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />

            <div className="flex items-center gap-2 pt-6">
              <input
                id="subjectActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800"
              />
              <label htmlFor="subjectActive" className="text-xs text-slate-300 select-none cursor-pointer">
                Faol fan sifatida ko'rsatish
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Teacher Creation Modal */}
      <Modal
        isOpen={quickTeacherModalOpen}
        onClose={() => setQuickTeacherModalOpen(false)}
        title="Yangi O'qituvchi Qo'shish"
      >
        <form onSubmit={handleQuickCreateTeacher} className="space-y-4">
          <p className="text-xs text-slate-400">
            O'qituvchi uchun login va parol yarating. U darhol tizimga kirib darslarni boshqara oladi.
          </p>

          <Input
            label="O'qituvchi Ism Familiyasi"
            placeholder="masalan: Alisher Navoiy"
            value={quickTeacherName}
            onChange={(e) => setQuickTeacherName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Login yoki Email"
              placeholder="ustoz_alisher"
              value={quickTeacherLogin}
              onChange={(e) => setQuickTeacherLogin(e.target.value)}
              required
            />
            <Input
              label="Parol"
              type="text"
              value={quickTeacherPassword}
              onChange={(e) => setQuickTeacherPassword(e.target.value)}
              required
            />
          </div>

          <Input
            label="Telefon raqam"
            placeholder="+998901234567"
            value={quickTeacherPhone}
            onChange={(e) => setQuickTeacherPhone(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setQuickTeacherModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={creatingTeacher}>
              O'qituvchini Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSubjectsPage;
