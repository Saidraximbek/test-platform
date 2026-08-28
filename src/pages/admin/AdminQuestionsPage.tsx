import React, { useEffect, useState, useRef } from "react";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { adminService, BulkQuestionInput } from "../../services/adminService";
import { subjectService } from "../../services/subjectService";
import { levelService } from "../../services/levelService";
import { useToast } from "../../context/ToastContext";
import { Question, Subject, Level } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { getErrorMessage } from "../../utils";

export const AdminQuestionsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Question Modal Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk Import State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<BulkQuestionInput[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!selectedSubjectId) return;
    levelService.getLevelsBySubject(selectedSubjectId, false).then((lvls) => {
      setLevels(lvls);
      if (lvls.length > 0) {
        setSelectedLevelId(lvls[0].levelId);
      } else {
        setSelectedLevelId("");
      }
    });
  }, [selectedSubjectId]);

  const fetchQuestions = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const list = await adminService.getAdminQuestions(
        selectedSubjectId,
        selectedLevelId || undefined
      );
      setQuestions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubjectId, selectedLevelId]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setText("");
    setOptions([
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" },
    ]);
    setCorrectOptionId("A");
    setExplanation("");
    setDifficulty(2);
    setModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setText(q.text);
    setOptions(q.options || []);
    setCorrectOptionId(q.correctOptionId || "A");
    setExplanation(q.explanation || "");
    setDifficulty(q.difficulty);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedLevelId || !text.trim()) {
      toastError("Fan, daraja va savol matni kiritilishi shart");
      return;
    }

    setIsSaving(true);
    try {
      await adminService.saveQuestion({
        questionId: editingQuestion?.questionId,
        subjectId: selectedSubjectId,
        levelId: selectedLevelId,
        text,
        options,
        correctOptionId,
        explanation,
        difficulty,
      });

      success("Savol muvaffaqiyatli saqlandi!");
      setModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (qId: string) => {
    if (!window.confirm("Ushbu savolni o'chirmoqchimisiz?")) return;
    try {
      await adminService.deleteQuestion(qId);
      success("Savol o'chirildi");
      fetchQuestions();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    }
  };

  // --- CSV / Excel Bulk Import Logic ---
  const downloadTemplate = () => {
    const csvContent =
      "savol_matni,variant_a,variant_b,variant_c,variant_d,togri_javob,tushuntirish,qiyinlik\n" +
      "\"2 + 2 nechiga teng?\",\"3\",\"4\",\"5\",\"6\",\"B\",\"Oddiy qo'shish amali\",\"1\"\n" +
      "\"O'zbekiston poytaxti qaysi shahar?\",\"Samarqand\",\"Buxoro\",\"Toshkent\",\"Xiva\",\"C\",\"Toshkent O'zbekistonning poytaxti\",\"1\"\n" +
      "\"Quyosh sistemasidagi eng katta sayyora?\",\"Mars\",\"Yupiter\",\"Saturn\",\"Venera\",\"B\",\"Yupiter eng katta gaz gigantidir\",\"2\"";

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tillo_savollar_shabloni.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseInputText = (rawText: string) => {
    setBulkText(rawText);
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const result: BulkQuestionInput[] = [];

    lines.forEach((line, index) => {
      // Skip header if it matches header keywords
      if (index === 0 && (line.toLowerCase().includes("savol") || line.toLowerCase().includes("variant"))) {
        return;
      }

      // Check delimiters: Tab (\t), Semicolon (;), or Comma (,)
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else {
        // Regex CSV parser to handle quotes
        const match = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g);
        if (match) {
          parts = match.map((m) =>
            m.replace(/^,/, "").replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim()
          );
        }
      }

      parts = parts.map((p) => p.trim());

      if (parts.length >= 6) {
        const qText = parts[0];
        const optA = parts[1] || "";
        const optB = parts[2] || "";
        const optC = parts[3] || "";
        const optD = parts[4] || "";
        let correct = (parts[5] || "A").toUpperCase();
        if (!["A", "B", "C", "D"].includes(correct)) {
          correct = "A";
        }
        const expl = parts[6] || "";
        const diff = Number(parts[7]) || 2;

        if (qText && optA && optB) {
          result.push({
            text: qText,
            options: [
              { id: "A", text: optA },
              { id: "B", text: optB },
              { id: "C", text: optC || "Variant C" },
              { id: "D", text: optD || "Variant D" },
            ],
            correctOptionId: correct,
            explanation: expl,
            difficulty: Math.min(Math.max(diff, 1), 5),
          });
        }
      }
    });

    setParsedQuestions(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        parseInputText(content);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleExecuteBulkImport = async () => {
    if (!selectedSubjectId || !selectedLevelId) {
      toastError("Iltimos, avval Fan va Darajani tanlang");
      return;
    }
    if (parsedQuestions.length === 0) {
      toastError("Yuklash uchun yaroqli savollar topilmadi");
      return;
    }

    setIsImporting(true);
    try {
      const count = await adminService.bulkImportQuestions(
        selectedSubjectId,
        selectedLevelId,
        parsedQuestions
      );
      success(`${count} ta savol muvaffaqiyatli yuklandi!`);
      setBulkModalOpen(false);
      setBulkText("");
      setParsedQuestions([]);
      fetchQuestions();
    } catch (err: any) {
      toastError(getErrorMessage(err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Savollar Bazasi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fan va darajalar bo'yicha maxfiy test savollarini boshqarish va ommaviy yuklash
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkModalOpen(true)}
            disabled={!selectedLevelId}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
          >
            Excel / CSV Ommaviy Yuklash
          </Button>

          <Button
            onClick={openCreateModal}
            disabled={!selectedLevelId}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            Yangi Savol
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Fan:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-white font-bold"
          >
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.subjectId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold">Daraja:</label>
          <select
            value={selectedLevelId}
            onChange={(e) => setSelectedLevelId(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-white font-bold"
          >
            {levels.map((l) => (
              <option key={l.levelId} value={l.levelId}>
                {l.name} (#{l.levelNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-400">
          Jami savollar: <strong className="text-brand-400">{questions.length} ta</strong>
        </div>
      </div>

      {/* Questions Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <p>Ushbu daraja uchun hozircha savollar mavjud emas.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkModalOpen(true)}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Excel/CSV orqali ommaviy yuklash
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Savol matni</th>
                  <th className="p-4">To'g'ri javob</th>
                  <th className="p-4">Qiyinlik</th>
                  <th className="p-4">Tushuntirish</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {questions.map((q) => (
                  <tr key={q.questionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white max-w-sm">{q.text}</td>
                    <td className="p-4 font-bold text-emerald-400">
                      Variant {q.correctOptionId}:{" "}
                      <span className="font-normal text-slate-300">
                        {q.options?.find((o) => o.id === q.correctOptionId)?.text}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{q.difficulty}/5</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{q.explanation || "-"}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(q)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(q.questionId)}
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

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => !isImporting && setBulkModalOpen(false)}
        title="Excel / CSV orqali savollarni ommaviy yuklash"
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Header Action / Download template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
            <div>
              <h4 className="font-bold text-white text-sm">Savollar Shablon Fayli</h4>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Excelda to'ldirish uchun namunaviy CSV shablonini yuklab oling.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadTemplate}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Shablonni yuklab olish (.csv)
            </Button>
          </div>

          {/* File input & Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                1. Exceldan to'g'ridan-to'g'ri nusxa olib tashlang (Ctrl+V) yoki CSV fayl tanlang:
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Fayl tanlash
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <textarea
              rows={5}
              placeholder="Excel jadvalidan katakchalarni nusxalab (Ctrl+C) shu yerga tashlang (Ctrl+V)..."
              value={bulkText}
              onChange={(e) => parseInputText(e.target.value)}
              className="w-full font-mono text-[11px] rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Parsed Result Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {parsedQuestions.length} ta savol
                  aniqlandi
                </span>
                <span className="text-[11px] text-slate-400">
                  Tanlangan:{" "}
                  <strong className="text-white">
                    {subjects.find((s) => s.subjectId === selectedSubjectId)?.name} (Level{" "}
                    {levels.find((l) => l.levelId === selectedLevelId)?.levelNumber})
                  </strong>
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 divide-y divide-slate-800 bg-slate-950 p-2">
                {parsedQuestions.map((pq, idx) => (
                  <div key={idx} className="p-2 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>
                        #{idx + 1}. {pq.text}
                      </span>
                      <span className="text-emerald-400 text-[10px]">
                        To'g'ri: {pq.correctOptionId}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 grid grid-cols-2 gap-1">
                      <span>A: {pq.options[0]?.text}</span>
                      <span>B: {pq.options[1]?.text}</span>
                      <span>C: {pq.options[2]?.text}</span>
                      <span>D: {pq.options[3]?.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              disabled={isImporting}
              onClick={() => setBulkModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              isLoading={isImporting}
              disabled={parsedQuestions.length === 0}
              onClick={handleExecuteBulkImport}
              rightIcon={<Upload className="w-4 h-4" />}
            >
              {parsedQuestions.length > 0
                ? `${parsedQuestions.length} ta savolni yuklash`
                : "Yuklash"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? "Savolni tahrirlash" : "Yangi savol qo'shish"}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Savol matni</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
              placeholder="Savolni kiriting..."
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">4 ta javob varianti:</label>
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectOptionId(opt.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    correctOptionId === opt.id
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {opt.id}
                </button>
                <input
                  type="text"
                  placeholder={`Variant ${opt.id} matni`}
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx].text = e.target.value;
                    setOptions(newOpts);
                  }}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-xs py-2 px-3 text-white"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              To'g'ri javob tushuntirishi (Test tugagach ko'rinadi)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white"
            />
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
