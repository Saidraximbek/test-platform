import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { subjectService } from "../../services/subjectService";
import { useToast } from "../../context/ToastContext";
import { Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";

export const AdminSubjectsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const list = await subjectService.getSubjects(false);
      setSubjects(list);
    } catch (err) {
      console.error("Error loading subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setEditingSubject(null);
    setName("");
    setSlug("");
    setDescription("");
    setOrder(subjects.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setSlug(sub.slug);
    setDescription(sub.description);
    setOrder(sub.order);
    setIsActive(sub.isActive);
    setModalOpen(true);
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
        name,
        slug,
        description,
        order: Number(order),
        isActive,
      });

      success("Fan muvaffaqiyatli saqlandi!");
      setModalOpen(false);
      fetchSubjects();
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
      fetchSubjects();
    } catch (err: any) {
      toastError(err.message || "O'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Fanlar Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Platformadagi barcha fanlarni yaratish, tahrirlash va tartiblash
          </p>
        </div>

        <Button onClick={openCreateModal} rightIcon={<Plus className="w-4 h-4" />}>
          Yangi Fan Qo'shish
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Hozircha fanlar mavjud emas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Tartib</th>
                  <th className="p-4">Fan nomi</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Tavsif</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subjects.map((sub) => (
                  <tr key={sub.subjectId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-400">{sub.order}</td>
                    <td className="p-4 font-bold text-white">{sub.name}</td>
                    <td className="p-4 text-slate-400 font-mono">{sub.slug}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{sub.description}</td>
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
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? "Fanni tahrirlash" : "Yangi fan qo'shish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Fan nomi"
            placeholder="Matematika, Fizika, Ona tili..."
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tavsif</label>
            <textarea
              rows={3}
              placeholder="Fan haqida qisqacha ma'lumot..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
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
    </div>
  );
};
