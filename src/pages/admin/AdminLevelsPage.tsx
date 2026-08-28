import React, { useEffect, useState } from "react";
import { Layers, Plus, Edit2, Trash2 } from "lucide-react";
import { levelService } from "../../services/levelService";
import { subjectService } from "../../services/subjectService";
import { useToast } from "../../context/ToastContext";
import { Level, LevelDifficulty, Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { getErrorMessage } from "../../utils";

export const AdminLevelsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Level Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelNumber, setLevelNumber] = useState<number>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unlockCost, setUnlockCost] = useState<string>("50");
  const [difficulty, setDifficulty] = useState<LevelDifficulty>("medium");
  const [questionsRequired, setQuestionsRequired] = useState<number>(20);
  const [durationMinutes, setDurationMinutes] = useState<string>("40");
  const [isInitialUnlocked, setIsInitialUnlocked] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subs = await subjectService.getSubjects(false);
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].subjectId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSubjects();
  }, []);

  const fetchLevels = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const list = await levelService.getLevelsBySubject(selectedSubjectId, false);
      setLevels(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [selectedSubjectId]);

  const openCreateModal = () => {
    setEditingLevel(null);
    setLevelNumber(levels.length + 1);
    setName(`Daraja ${levels.length + 1}`);
    setDescription("");
    setUnlockCost(levels.length === 0 ? "0" : "50");
    setDifficulty("medium");
    setQuestionsRequired(20);
    setDurationMinutes("40");
    setIsInitialUnlocked(levels.length === 0);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (lvl: Level) => {
    setEditingLevel(lvl);
    setLevelNumber(lvl.levelNumber);
    setName(lvl.name);
    setDescription(lvl.description);
    setUnlockCost(lvl.unlockCostCoins !== null && lvl.unlockCostCoins !== undefined ? String(lvl.unlockCostCoins) : "");
    setDifficulty(lvl.difficulty);
    setQuestionsRequired(lvl.questionsRequired);
    setDurationMinutes(lvl.durationMinutes !== null && lvl.durationMinutes !== undefined ? String(lvl.durationMinutes) : "");
    setIsInitialUnlocked(lvl.isInitialUnlocked);
    setIsActive(lvl.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !name.trim()) {
      toastError("Nom va fan kiritilishi shart");
      return;
    }

    setIsSaving(true);
    try {
      await levelService.saveLevel({
        levelId: editingLevel?.levelId,
        subjectId: selectedSubjectId,
        levelNumber: Number(levelNumber),
        name: name.trim(),
        description: description.trim(),
        unlockCostCoins: unlockCost.trim() !== "" ? Number(unlockCost) : null,
        difficulty,
        questionsRequired: Number(questionsRequired),
        durationMinutes: durationMinutes.trim() !== "" ? Number(durationMinutes) : null,
        isInitialUnlocked,
        isActive,
      });

      success("Daraja muvaffaqiyatli saqlandi!");
      setModalOpen(false);
      await fetchLevels();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (levelId: string) => {
    if (!window.confirm("Ushbu darajani o'chirmoqchimisiz?")) return;
    try {
      await levelService.deleteLevel(levelId);
      success("Daraja o'chirildi");
      fetchLevels();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Darajalar (Levels) Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Har bir fan bo'yicha ketma-ket darajalar, ochish narxlari va qiyinlik darajalari
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          disabled={!selectedSubjectId}
          rightIcon={<Plus className="w-4 h-4" />}
        >
          Yangi Daraja Qo'shish
        </Button>
      </div>

      {/* Subject Filter */}
      {subjects.length === 0 ? (
        <Card className="p-6 bg-slate-900 border-slate-800 text-center text-xs text-amber-400">
          Avval "Fanlar" bo'limidan kamida bitta fan qo'shing.
        </Card>
      ) : (
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Fanni tanlang:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-4 py-2 text-white font-bold"
          >
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.subjectId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Levels Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : levels.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Ushbu fan uchun darajalar mavjud emas. Yangi daraja qo'shing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Daraja nomi</th>
                  <th className="p-4">Qiyinlik</th>
                  <th className="p-4">Savollar soni</th>
                  <th className="p-4">Vaqt (Daqiqa)</th>
                  <th className="p-4">Ochish narxi</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {levels.map((lvl) => (
                  <tr key={lvl.levelId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-brand-400">{lvl.levelNumber}</td>
                    <td className="p-4 font-bold text-white">
                      {lvl.name} {lvl.isInitialUnlocked && <span className="text-[10px] text-emerald-400 font-normal">(Boshlang'ich ochiq)</span>}
                    </td>
                    <td className="p-4 capitalize">{lvl.difficulty}</td>
                    <td className="p-4 text-slate-300">{lvl.questionsRequired} ta</td>
                    <td className="p-4 text-slate-300">{lvl.durationMinutes ? `${lvl.durationMinutes} min` : "Standart (40 min)"}</td>
                    <td className="p-4 font-bold text-amber-400">
                      {lvl.unlockCostCoins !== null && lvl.unlockCostCoins !== undefined ? `${lvl.unlockCostCoins} Tillo` : "Standart (50 Tillo)"}
                    </td>
                    <td className="p-4">
                      <Badge variant={lvl.isActive ? "success" : "neutral"}>
                        {lvl.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(lvl)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(lvl.levelId)}
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

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLevel ? "Darajani tahrirlash" : "Yangi daraja yaratish"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Daraja raqami"
              type="number"
              value={levelNumber}
              onChange={(e) => setLevelNumber(Number(e.target.value))}
            />

            <Input
              label="Daraja nomi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tavsif</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Qiyinlik</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as LevelDifficulty)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-2.5 text-white"
              >
                <option value="easy">Easy (Oson)</option>
                <option value="medium">Medium (O'rta)</option>
                <option value="hard">Hard (Qiyin)</option>
              </select>
            </div>

            <Input
              label="Savollar soni"
              type="number"
              value={questionsRequired}
              onChange={(e) => setQuestionsRequired(Number(e.target.value))}
            />

            <Input
              label="Vaqt (Daqiqa)"
              placeholder="Standart: 40"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <Input
            label="Ochish narxi (Tillo tangada, 0 bo'lsa tekin)"
            placeholder="Standart: 50"
            value={unlockCost}
            onChange={(e) => setUnlockCost(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                id="isInitialUnlocked"
                type="checkbox"
                checked={isInitialUnlocked}
                onChange={(e) => setIsInitialUnlocked(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800"
              />
              <label htmlFor="isInitialUnlocked" className="text-xs text-slate-300 cursor-pointer">
                Boshlang'ich ochiq bo'lsin
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isLevelActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800"
              />
              <label htmlFor="isLevelActive" className="text-xs text-slate-300 cursor-pointer">
                Faol daraja
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
