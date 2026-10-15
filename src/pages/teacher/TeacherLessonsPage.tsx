import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Play,
  ExternalLink,
  FileCheck,
  ListPlus,
  Sparkles,
  Check,
  X,
  UploadCloud,
  Eye,
  AlertCircle,
  Trophy,
  Medal,
  Crown,
} from "lucide-react";
import { collection, getDocs, doc, setDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { lessonService } from "../../services/lessonService";
import { subjectService } from "../../services/subjectService";
import { homeworkService } from "../../services/homeworkService";
import { leaderboardService } from "../../services/leaderboardService";
import { Group, Lesson, Level, Subject, Question } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";
import { RichTextEditor } from "../../components/common/RichTextEditor";

export interface CustomTestQuestion {
  id?: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
}

// Yordamchi: O'qituvchi kiritgan xom matndan (Word/Telegram) savollarni avtomatik ajratib olish
function parseBulkTestQuestions(raw: string): CustomTestQuestion[] {
  if (!raw || !raw.trim()) return [];

  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // 1. Agar qatorlar CSV / Semicolon / Tab formatida bo'lsa
  const csvLines = normalized.split("\n").filter((l) => l.trim().length > 0);
  const csvQuestions: CustomTestQuestion[] = [];
  let isCsvFormat = true;

  for (let idx = 0; idx < csvLines.length; idx++) {
    const line = csvLines[idx];
    if (idx === 0 && (line.toLowerCase().includes("savol") || line.toLowerCase().includes("variant"))) {
      continue;
    }
    let parts: string[] = [];
    if (line.includes("\t")) {
      parts = line.split("\t");
    } else if (line.includes(";")) {
      parts = line.split(";");
    }
    parts = parts.map((p) => p.trim());

    if (parts.length >= 6) {
      let correct = (parts[5] || "A").toUpperCase();
      if (!["A", "B", "C", "D"].includes(correct)) correct = "A";

      csvQuestions.push({
        text: parts[0],
        options: [
          { id: "A", text: parts[1] || "" },
          { id: "B", text: parts[2] || "" },
          { id: "C", text: parts[3] || "" },
          { id: "D", text: parts[4] || "" },
        ],
        correctOptionId: correct,
        explanation: parts[6] || "",
      });
    } else {
      isCsvFormat = false;
      break;
    }
  }

  if (isCsvFormat && csvQuestions.length > 0) {
    return csvQuestions;
  }

  // 2. Standart blokli format (1. Savol... A) ... B) ... Javob: A)
  let blocks = normalized.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 1 && /\n\s*(?:2[\.\)\-]|2-savol)/i.test(blocks[0])) {
    blocks = blocks[0].split(/\n(?=(?:\d+[\.\)\-]|(?:\d+[\-\s]*savol[\.\:]?))\s*)/i).map((b) => b.trim()).filter(Boolean);
  }

  const result: CustomTestQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let qText = "";
    const options: { id: string; text: string }[] = [];
    let correct = "A";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^[\*\+]?\s*([A-Da-d])[\)\.\:\-]\s*(.+)$/);
      const ansMatch = line.match(/^(?:javob|to'?g'?ri\s*javob|kalit|to'?g'?ri)[\s\:\-]+([A-Da-d])/i);

      if (ansMatch) {
        correct = ansMatch[1].toUpperCase();
      } else if (optMatch) {
        const id = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        if (line.startsWith("*") || line.startsWith("+")) {
          correct = id;
        }
        options.push({ id, text });
      } else if (options.length === 0) {
        // Savol matni (boshidagi 1., 1-savol: kabi belgilarni olib tashlaymiz)
        const clean = line.replace(/^\d+[\.\)\-]?\s*(?:savol[\.\:]?\s*)?/i, "").trim();
        qText += (qText ? " " : "") + clean;
      }
    }

    if (qText && options.length >= 2) {
      // 4 ta variant bo'lishini ta'minlaymiz
      ["A", "B", "C", "D"].forEach((letter) => {
        if (!options.some((o) => o.id === letter)) {
          options.push({ id: letter, text: `Variant ${letter}` });
        }
      });
      options.sort((a, b) => a.id.localeCompare(b.id));
      result.push({
        text: qText,
        options,
        correctOptionId: correct,
      });
    }
  }

  return result;
}

export const TeacherLessonsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal: Lesson state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  // Modal: Test Attachment State
  // "none" -> test yo'q, "new" -> yangi test yuklash/tuzish, "existing" -> mavjud testni tanlash
  const [testMode, setTestMode] = useState<"none" | "new" | "existing">("none");
  const [selectedExistingLevelId, setSelectedExistingLevelId] = useState<string>("");
  const [testTitle, setTestTitle] = useState("");
  const [testDuration, setTestDuration] = useState<number>(15);
  const [testQuestions, setTestQuestions] = useState<CustomTestQuestion[]>([]);

  // Test savollarini kiritish usuli: "manual" (bittalab form) yoki "bulk" (matndan nusxalash)
  const [questionInputMethod, setQuestionInputMethod] = useState<"manual" | "bulk">("manual");

  // Bittalab kiritish formasi
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrect, setQCorrect] = useState<string>("A");

  // Tezkor matn orqali kiritish maydoni
  const [bulkText, setBulkText] = useState("");

  // Testni ko'rish modal
  const [previewTestModal, setPreviewTestModal] = useState<{
    testName: string;
    questions: Question[];
    duration?: number;
  } | null>(null);
  const [loadingTestPreview, setLoadingTestPreview] = useState(false);

  // Test Liderboardi (O'quvchilar natijasi va reytingi)
  const [selectedTestForLeaderboard, setSelectedTestForLeaderboard] = useState<{
    testId: string;
    testTitle: string;
    lessonTitle: string;
  } | null>(null);
  const [testLeaderboardData, setTestLeaderboardData] = useState<any[]>([]);
  const [loadingTestLeaderboard, setLoadingTestLeaderboard] = useState(false);

  const handleOpenTestLeaderboard = async (testId: string, testTitle: string, lessonTitle: string) => {
    setSelectedTestForLeaderboard({ testId, testTitle, lessonTitle });
    try {
      setLoadingTestLeaderboard(true);
      const data = await leaderboardService.getTestLeaderboard(testId);
      setTestLeaderboardData(data);
    } catch (err: any) {
      toastError(err.message || "Test natijalarini yuklab bo'lmadi");
    } finally {
      setLoadingTestLeaderboard(false);
    }
  };

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [allTeacherGroups, teacherLessons, allSubs, levelsSnap] = await Promise.all([
        groupService.getTeacherGroups(user.uid).catch(() => []),
        lessonService.getTeacherLessons(user.uid).catch(() => []),
        subjectService.getSubjects(true).catch(() => []),
        getDocs(collection(db, "levels")).catch(() => ({ docs: [] })),
      ]);

      const finalGroups = allTeacherGroups;
      const activeGroupIds = new Set(finalGroups.map((g) => g.groupId));
      const activeLessons = teacherLessons.filter((l) => !l.groupId || activeGroupIds.has(l.groupId));

      setGroups(finalGroups);
      setLessons(activeLessons);
      setSubjects(allSubs);
      setLevels((levelsSnap as any).docs ? (levelsSnap as any).docs.map((d: any) => d.data() as Level) : []);
    } catch (err: any) {
      console.warn("Darslarni yuklashda ogohlantirish:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    const defaultGroup = groups.length > 0 ? groups[0].groupId : "";
    setGroupId(defaultGroup);

    // Test holatini tozalash
    setTestMode("none");
    setSelectedExistingLevelId("");
    setTestTitle("");
    setTestDuration(15);
    setTestQuestions([]);
    setQuestionInputMethod("manual");
    resetManualQuestionForm();
    setBulkText("");

    setIsModalOpen(true);
  };

  const openEditModal = async (les: Lesson) => {
    setEditingLesson(les);
    setTitle(les.title || "");
    setDescription(les.description || "");
    setVideoUrl(les.videoUrl || "");
    setGroupId(les.groupId || (groups.length > 0 ? groups[0].groupId : ""));
    resetManualQuestionForm();
    setBulkText("");
    setQuestionInputMethod("manual");

    if (les.testId) {
      const existingLvl = levels.find((l) => l.levelId === les.testId);
      setSelectedExistingLevelId(les.testId);
      setTestTitle(existingLvl?.name || `${les.title} testi`);
      setTestDuration(existingLvl?.durationMinutes || 15);

      // Agar ushbu levelId bo'yicha savollar mavjud bo'lsa, ularni yuklab olamiz
      try {
        const qSnap = await getDocs(
          query(collection(db, "questions"), where("levelId", "==", les.testId))
        );
        if (!qSnap.empty) {
          const loadedQuestions: CustomTestQuestion[] = qSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              text: data.text || "",
              options: data.options || [
                { id: "A", text: "" },
                { id: "B", text: "" },
                { id: "C", text: "" },
                { id: "D", text: "" },
              ],
              correctOptionId: data.correctOptionId || "A",
              explanation: data.explanation || "",
            };
          });
          setTestQuestions(loadedQuestions);
          setTestMode("new");
        } else {
          setTestQuestions([]);
          setTestMode("existing");
        }
      } catch (e) {
        setTestQuestions([]);
        setTestMode("existing");
      }
    } else {
      setTestMode("none");
      setSelectedExistingLevelId("");
      setTestTitle("");
      setTestDuration(15);
      setTestQuestions([]);
    }

    setIsModalOpen(true);
  };

  const resetManualQuestionForm = () => {
    setQText("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrect("A");
  };

  const handleAddManualQuestion = () => {
    if (!qText.trim()) {
      toastError("Savol matnini kiriting");
      return;
    }
    if (!qOptA.trim() || !qOptB.trim()) {
      toastError("Kamida A va B variantlarini kiriting");
      return;
    }

    const newQ: CustomTestQuestion = {
      id: `q_temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: qText.trim(),
      options: [
        { id: "A", text: qOptA.trim() },
        { id: "B", text: qOptB.trim() },
        { id: "C", text: qOptC.trim() || "Variant C" },
        { id: "D", text: qOptD.trim() || "Variant D" },
      ],
      correctOptionId: qCorrect,
    };

    setTestQuestions((prev) => [...prev, newQ]);
    resetManualQuestionForm();
    success("Savol muvaffaqiyatli qo'shildi!");
  };

  const handleParseAndAddBulk = () => {
    if (!bulkText.trim()) {
      toastError("Test matnini kiriting yoki nusxalab qo'ying");
      return;
    }

    const parsed = parseBulkTestQuestions(bulkText);
    if (parsed.length === 0) {
      toastError("Matndan savollar aniqlanmadi. Iltimos, namunadagi formatda kiriting.");
      return;
    }

    setTestQuestions((prev) => [...prev, ...parsed]);
    setBulkText("");
    setQuestionInputMethod("manual");
    success(`${parsed.length} ta savol testga muvaffaqiyatli qo'shildi!`);
  };

  const handleRemoveQuestion = (index: number) => {
    setTestQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewAttachedTest = async (testId: string, testName: string) => {
    try {
      setLoadingTestPreview(true);
      const lvl = levels.find((l) => l.levelId === testId);
      const qSnap = await getDocs(
        query(collection(db, "questions"), where("levelId", "==", testId))
      );
      const qList: Question[] = qSnap.docs.map((d) => ({ questionId: d.id, ...d.data() } as Question));
      setPreviewTestModal({
        testName: testName || lvl?.name || "Biriktirilgan Test",
        questions: qList,
        duration: lvl?.durationMinutes || 15,
      });
    } catch (e: any) {
      toastError(e.message || "Test savollarini yuklab bo'lmadi");
    } finally {
      setLoadingTestPreview(false);
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError("Dars mavzusini kiriting");
      return;
    }

    const effectiveGroupId = groupId || groups[0]?.groupId;
    if (!effectiveGroupId) {
      toastError("Iltimos, guruhni tanlang");
      return;
    }

    const selectedGroup = groups.find((g) => g.groupId === effectiveGroupId);
    const effectiveSubjectId =
      selectedGroup?.subjectId ||
      editingLesson?.subjectId ||
      (subjects.length > 0 ? subjects[0].subjectId : "general");

    // Test validatsiyasi
    if (testMode === "new" && testQuestions.length === 0) {
      toastError("Siz yangi test rejimini tanladingiz. Iltimos, kamida 1 ta test savoli qo'shing yoki 'Test biriktirilmasin' rejimini tanlang.");
      return;
    }
    if (testMode === "existing" && !selectedExistingLevelId) {
      toastError("Iltimos, mavjud testlardan birini tanlang yoki 'Test biriktirilmasin' rejimini tanlang.");
      return;
    }

    try {
      setSaving(true);
      let effectiveTestId: string | null = null;

      // 1. Yangi test yaratilayotgan bo'lsa
      if (testMode === "new" && testQuestions.length > 0) {
        const levelId =
          editingLesson?.testId && editingLesson.testId.startsWith("lvl_")
            ? editingLesson.testId
            : `lvl_${Date.now()}`;

        const levelRef = doc(db, "levels", levelId);
        const levelNumber =
          levels.filter((l) => l.subjectId === effectiveSubjectId).length + 1;

        const levelData: Level = {
          levelId,
          subjectId: effectiveSubjectId,
          levelNumber,
          name: testTitle.trim() || `${title.trim()} testi`,
          description: `${title.trim()} mavzusi yuzasidan mustahkamlovchi test`,
          unlockCostCoins: 0,
          difficulty: "easy",
          questionsRequired: testQuestions.length,
          durationMinutes: Number(testDuration) || 15,
          isInitialUnlocked: true,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Darajani saqlaymiz
        await setDoc(levelRef, levelData, { merge: true });

        // Savollarni "questions" kolleksiyasiga saqlaymiz
        for (let i = 0; i < testQuestions.length; i++) {
          const q = testQuestions[i];
          const qId = q.id && !q.id.startsWith("q_temp_") ? q.id : `q_${levelId}_${i + 1}`;
          const qDocRef = doc(db, "questions", qId);

          await setDoc(
            qDocRef,
            {
              questionId: qId,
              subjectId: effectiveSubjectId,
              levelId,
              text: q.text,
              imageUrl: null,
              options: q.options,
              correctOptionId: q.correctOptionId || "A",
              explanation: q.explanation || "",
              difficulty: 1,
              status: "approved",
              createdBy: user?.uid || "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        effectiveTestId = levelId;
      } else if (testMode === "existing") {
        effectiveTestId = selectedExistingLevelId || null;
      } else {
        effectiveTestId = null;
      }

      // 2. Darsni saqlaymiz
      const savedLesson = await lessonService.saveLesson({
        lessonId: editingLesson?.lessonId,
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim() || null,
        groupId: effectiveGroupId,
        teacherId: user?.uid || selectedGroup?.teacherId || "",
        subjectId: effectiveSubjectId,
        lessonNumber:
          editingLesson?.lessonNumber ||
          lessons.filter((l) => l.groupId === effectiveGroupId).length + 1,
        scheduledDate: editingLesson?.scheduledDate || new Date().toISOString().slice(0, 10),
        durationMinutes: editingLesson?.durationMinutes || 80,
        materialsText: editingLesson?.materialsText || null,
        pdfUrl: editingLesson?.pdfUrl || null,
        testId: effectiveTestId,
        status: "published",
      });

      // 3. Uy vazifasini avtomatik bog'lash
      try {
        await homeworkService.saveHomework({
          homeworkId: editingLesson?.homeworkId || `hw_${savedLesson.lessonId}`,
          lessonId: savedLesson.lessonId,
          groupId: effectiveGroupId,
          teacherId: user?.uid || selectedGroup?.teacherId || "",
          title: `${savedLesson.title} - Uy vazifasi`,
          instructions:
            savedLesson.description ||
            `${savedLesson.title} mavzusi bo'yicha berilgan topshiriq va mashqlarni bajaring hamda yechimlarini yuboring.`,
          maxScore: 100,
          deadline: savedLesson.scheduledDate || "",
          lessonTitle: savedLesson.title,
        });
      } catch (e) {
        console.warn("Auto save homework warning:", e);
      }

      success(
        editingLesson
          ? "Dars va test ma'lumotlari muvaffaqiyatli yangilandi!"
          : "Yangi dars va test muvaffaqiyatli saqlandi!"
      );
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Haqiqatan ham ushbu darsni o'chirmoqchimisiz?")) return;
    try {
      await lessonService.deleteLesson(lessonId);
      success("Dars o'chirildi");
      loadData();
    } catch (err: any) {
      toastError(err.message || "O'chirishda xatolik");
    }
  };

  const filteredLessons = lessons.filter((les) => {
    const matchGroup = selectedGroupFilter === "all" || les.groupId === selectedGroupFilter;
    const matchSearch =
      les.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      les.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGroup && matchSearch;
  });

  const selectedGroup = groups.find((g) => g.groupId === (groupId || groups[0]?.groupId));
  const availableLevelsForGroup = levels.filter(
    (l) => !selectedGroup?.subjectId || l.subjectId === selectedGroup.subjectId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-sky-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">Darslar & Rejalar</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Guruhlar uchun dars rejasi, video darslar, konspektlar va o'quvchilar uchun testlarni biriktirish
          </p>
        </div>

        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Yangi Dars Kiritish
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Dars mavzusi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha guruhlarim</option>
            {groups.map((g) => (
              <option key={g.groupId} value={g.groupId}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Lessons List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-sky-500" />
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Darslar mavjud emas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha hech qanday dars rejalashtirilmagan. "Yangi Dars Kiritish" tugmasi orqali dars qo'shing.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((les) => {
            const group = groups.find((g) => g.groupId === les.groupId);
            const level = levels.find((l) => l.levelId === les.testId);

            return (
              <Card
                key={les.lessonId}
                className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {group?.name || "Guruh"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      #{les.lessonNumber}-Dars
                    </span>
                    <span className="text-xs text-slate-500">• {les.scheduledDate}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{les.title}</h3>
                  {les.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {les.description}
                    </p>
                  )}

                  {/* Badges for attached items */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {les.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewVideo({ url: les.videoUrl!, title: les.title })}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-500/30 hover:bg-sky-900/60 hover:text-white transition-colors"
                        title="Videoni ko'rish"
                      >
                        <Video className="w-3.5 h-3.5 text-sky-400" /> Video darsni ko'rish
                      </button>
                    )}
                    {les.materialsText && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <FileText className="w-3.5 h-3.5" /> Konspekt / Material
                      </span>
                    )}
                    {les.testId ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreviewAttachedTest(les.testId!, level?.name || "Test")}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/40 hover:bg-amber-500/25 transition-all"
                          title="Testni ko'rish"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Test: {level?.name || "Biriktirilgan test"}</span>
                          <Eye className="w-3 h-3 text-amber-400 opacity-70" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenTestLeaderboard(les.testId!, level?.name || `${les.title} testi`, les.title)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/50 hover:bg-amber-500/30 transition-all shadow-sm"
                          title="Ushbu testni bajargan o'quvchilar natijasi va reytingi (Liderboard)"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Test Reytingi</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/40">
                        Test biriktirilmagan
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    onClick={() => openEditModal(les)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Tahrirlash va test yuklash"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(les.lessonId)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Lesson (with Test Uploading section) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLesson ? "Darsni Tahrirlash" : "Yangi Dars Kiritish"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveLesson} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
          {/* Asosiy Dars Ma'lumotlari */}
          <div className="space-y-4">
            <Input
              label="Dars mavzusi (Title)"
              placeholder="Masalan: Chiziqli tenglamalar va formulalar"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!testTitle) {
                  setTestTitle(`${e.target.value} testi`);
                }
              }}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Guruh</label>
                {groups.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                    Sizga biriktirilgan faol guruh topilmadi.
                  </div>
                ) : (
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    required
                  >
                    <option value="">Guruhni tanlang</option>
                    {groups.map((g) => (
                      <option key={g.groupId} value={g.groupId}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video havolasi (URL - YouTube / havola)
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Video preview */}
            {videoUrl.trim() && (
              <div className="space-y-1 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Video darsni tekshirish:
                </span>
                <VideoEmbed url={videoUrl} title={title || "Video dars"} />
              </div>
            )}

            {/* Dars tavsifi / konspekti / Uy vazifasi */}
            <RichTextEditor
              label="Dars tavsifi / konspekti / Uy vazifasi sharti (Dizayn berib yozish mumkin):"
              value={description}
              onChange={setDescription}
              placeholder="Ushbu darsda o'rganiladigan asosiy qoidalar, vazifa shartlari yoki eslatmalar..."
              rows={3}
            />
          </div>

          {/* ============================================================== */}
          {/* 🧪 O'QUVCHILAR UCHUN TEST YUKLASH VA BIRIKTIRISH BO'LIMI */}
          {/* ============================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    O'quvchilar uchun Test
                    {testQuestions.length > 0 && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        {testQuestions.length} ta savol
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    O'quvchilar ushbu darsni o'zlashtirganligini tekshirish uchun test biriktiring
                  </p>
                </div>
              </div>

              {/* Rejimni tanlash tugmalari */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTestMode("none")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    testMode === "none"
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Test yo'q
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTestMode("new");
                    if (!testTitle) setTestTitle(`${title || "Dars"} testi`);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    testMode === "new"
                      ? "bg-amber-500 text-slate-950 shadow"
                      : "text-amber-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Yangi test tuzish / yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode("existing")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    testMode === "existing"
                      ? "bg-sky-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mavjud testni tanlash
                </button>
              </div>
            </div>

            {/* 1. MAVJUD TESTNI TANLASH */}
            {testMode === "existing" && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-300">
                  Mavjud testlar (bosqichlar) ro'yxatidan tanlang:
                </label>
                {availableLevelsForGroup.length === 0 ? (
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Ushbu fanga tegishli mavjud testlar topilmadi. "Yangi test tuzish / yuklash" tugmasi orqali yangi test yarating.</span>
                  </div>
                ) : (
                  <select
                    value={selectedExistingLevelId}
                    onChange={(e) => setSelectedExistingLevelId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Testni tanlang...</option>
                    {availableLevelsForGroup.map((lvl) => (
                      <option key={lvl.levelId} value={lvl.levelId}>
                        {lvl.name} ({lvl.durationMinutes || 15} daqiqa, {lvl.questionsRequired || 10} ta savol)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 2. YANGI TEST YARATISH / YUKLASH */}
            {testMode === "new" && (
              <div className="space-y-4 pt-1 animate-in fade-in">
                {/* Test sozlamalari */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Test nomi
                    </label>
                    <input
                      type="text"
                      placeholder="Masalan: Chiziqli tenglamalar testi"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vaqt (daqiqa)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={testDuration}
                      onChange={(e) => setTestDuration(Number(e.target.value) || 15)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Savol kiritish usuli (Tab) */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setQuestionInputMethod("manual")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      questionInputMethod === "manual"
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Bittalab savol kiritish
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionInputMethod("bulk")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      questionInputMethod === "bulk"
                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Matndan tezkor yuklash (Import)
                  </button>
                </div>

                {/* A. Bittalab savol kiritish formasi */}
                {questionInputMethod === "manual" && (
                  <div className="space-y-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Savol matni:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Masalan: 3x + 9 = 24 tenglamadagi x ning qiymatini toping."
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] font-black text-emerald-400 block mb-0.5">A varianti:</span>
                        <input
                          type="text"
                          placeholder="Variant A matni"
                          value={qOptA}
                          onChange={(e) => setQOptA(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-sky-400 block mb-0.5">B varianti:</span>
                        <input
                          type="text"
                          placeholder="Variant B matni"
                          value={qOptB}
                          onChange={(e) => setQOptB(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-violet-400 block mb-0.5">C varianti:</span>
                        <input
                          type="text"
                          placeholder="Variant C matni"
                          value={qOptC}
                          onChange={(e) => setQOptC(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-amber-400 block mb-0.5">D varianti:</span>
                        <input
                          type="text"
                          placeholder="Variant D matni"
                          value={qOptD}
                          onChange={(e) => setQOptD(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* To'g'ri javobni tanlash */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-300">To'g'ri javob:</span>
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setQCorrect(opt)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                              qCorrect === opt
                                ? "bg-emerald-500 text-slate-950 shadow-md scale-105"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddManualQuestion}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
                      >
                        Savolni Qo'shish
                      </Button>
                    </div>
                  </div>
                )}

                {/* B. Tezkor matn orqali kiritish */}
                {questionInputMethod === "bulk" && (
                  <div className="space-y-2 p-3.5 bg-indigo-950/20 rounded-xl border border-indigo-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Testlarni matn shaklida nusxalab qo'ying:
                      </span>
                    </div>

                    <textarea
                      rows={6}
                      placeholder={`1. 2 + 2 nechiga teng?\nA) 4\nB) 3\nC) 5\nD) 6\nJavob: A\n\n2. O'zbekiston poytaxti qaysi shahar?\nA) Samarqand\nB) Buxoro\nC) Toshkent\nD) Xiva\nJavob: C`}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-[10px] text-slate-400">
                        *Har bir savoldan keyin bitta bo'sh qator tashlang yoki Javob: A deb yozing.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleParseAndAddBulk}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        Matndan Aniqlash va Qo'shish
                      </Button>
                    </div>
                  </div>
                )}

                {/* Kiritilgan savollar ro'yxati (Review List) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ListPlus className="w-4 h-4 text-amber-400" />
                      Testdagi savollar ro'yxati ({testQuestions.length} ta):
                    </span>
                    {testQuestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Barcha kiritilgan savollarni o'chirmoqchimisiz?")) {
                            setTestQuestions([]);
                          }
                        }}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Barchasini tozalash
                      </button>
                    )}
                  </div>

                  {testQuestions.length === 0 ? (
                    <div className="p-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                      Hozircha savollar qo'shilmagan. Yuqoridagi formadan savol yozing yoki tayyor test matnini nusxalab qo'ying.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {testQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="font-bold text-white">
                              <span className="text-amber-400 font-mono">#{idx + 1}.</span> {q.text}
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-300 pt-1">
                              {q.options.map((opt) => (
                                <span
                                  key={opt.id}
                                  className={
                                    opt.id === q.correctOptionId
                                      ? "text-emerald-400 font-bold"
                                      : "text-slate-400"
                                  }
                                >
                                  {opt.id}) {opt.text}
                                  {opt.id === q.correctOptionId && " ✓"}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                            title="Savolni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingLesson ? "O'zgarishlarni Saqlash" : "Dars va Testni Saqlash"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Preview Video */}
      <Modal
        isOpen={Boolean(previewVideo)}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo?.title ? `Video: ${previewVideo.title}` : "Video Dars"}
      >
        <div className="space-y-4">
          {previewVideo && (
            <VideoEmbed url={previewVideo.url} title={previewVideo.title} />
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewVideo(null)}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Preview Attached Test */}
      <Modal
        isOpen={Boolean(previewTestModal)}
        onClose={() => setPreviewTestModal(null)}
        title={previewTestModal?.testName || "Biriktirilgan Test"}
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {loadingTestPreview ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" className="text-amber-500" />
            </div>
          ) : !previewTestModal || previewTestModal.questions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Ushbu test uchun savollar topilmadi.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Jami savollar: <strong className="text-white">{previewTestModal.questions.length} ta</strong></span>
                <span>Vaqt: <strong className="text-white">{previewTestModal.duration || 15} daqiqa</strong></span>
              </div>

              {previewTestModal.questions.map((q, idx) => (
                <div key={q.questionId || idx} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white">
                    <span className="text-amber-400 font-mono">#{idx + 1}.</span> {q.text}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border ${
                          opt.id === q.correctOptionId
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold"
                            : "bg-slate-950/60 border-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="font-mono mr-1.5">{opt.id})</span> {opt.text}
                        {opt.id === q.correctOptionId && " (To'g'ri javob)"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="outline" onClick={() => setPreviewTestModal(null)}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Test Leaderboard (O'quvchilar reytingi va natijalari) */}
      <Modal
        isOpen={Boolean(selectedTestForLeaderboard)}
        onClose={() => setSelectedTestForLeaderboard(null)}
        title={selectedTestForLeaderboard ? `🏆 Test Liderboardi: ${selectedTestForLeaderboard.testTitle}` : ""}
        maxWidth="2xl"
      >
        {selectedTestForLeaderboard && (
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">
                Dars: <strong className="text-white">{selectedTestForLeaderboard.lessonTitle}</strong>
              </span>
              <span className="text-slate-300">
                Topshirgan o'quvchilar:{" "}
                <strong className="text-amber-400 font-bold">{testLeaderboardData.length} nafar</strong>
              </span>
            </div>

            {loadingTestLeaderboard ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" className="text-amber-500" />
              </div>
            ) : testLeaderboardData.length === 0 ? (
              <div className="p-10 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-400">
                <Trophy className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <h4 className="font-bold text-white text-sm mb-1">Hozircha natijalar yo'q</h4>
                Ushbu dars testini hali hech bir o'quvchi topshirmagan. O'quvchilar testni yechgach, ularning reytingi
                va natijalari bu yerda avtomatik paydo bo'ladi.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 3 Podium (agar 2 yoki undan ortiq o'quvchi bo'lsa) */}
                {testLeaderboardData.length >= 2 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {/* Rank 2 (Silver) */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center flex flex-col items-center justify-end translate-y-2">
                      <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center mb-1 shadow">
                        2
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-full">
                        {testLeaderboardData[1]?.studentName}
                      </span>
                      <span className="text-xs font-black text-emerald-400 mt-0.5">
                        {testLeaderboardData[1]?.score}%
                      </span>
                      <span className="text-[10px] text-amber-300">
                        +{testLeaderboardData[1]?.earnedCoins} Tillo
                      </span>
                    </div>

                    {/* Rank 1 (Gold) */}
                    <div className="p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-400/60 text-center flex flex-col items-center justify-end shadow-lg shadow-amber-500/10">
                      <Crown className="w-5 h-5 text-amber-400 mb-0.5 animate-bounce" />
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center mb-1 shadow">
                        1
                      </div>
                      <span className="text-xs font-extrabold text-white truncate max-w-full">
                        {testLeaderboardData[0]?.studentName}
                      </span>
                      <span className="text-sm font-black text-emerald-400 mt-0.5">
                        {testLeaderboardData[0]?.score}%
                      </span>
                      <span className="text-[11px] font-bold text-amber-300">
                        +{testLeaderboardData[0]?.earnedCoins} Tillo
                      </span>
                    </div>

                    {/* Rank 3 (Bronze) */}
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-center flex flex-col items-center justify-end translate-y-3">
                      <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mb-1 shadow">
                        3
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-full">
                        {testLeaderboardData[2]?.studentName || "-"}
                      </span>
                      <span className="text-xs font-black text-emerald-400 mt-0.5">
                        {testLeaderboardData[2]?.score ? `${testLeaderboardData[2].score}%` : "-"}
                      </span>
                      {testLeaderboardData[2]?.earnedCoins > 0 && (
                        <span className="text-[10px] text-amber-300">
                          +{testLeaderboardData[2].earnedCoins} Tillo
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* To'liq jadval */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Barcha O'quvchilar Reytingi
                  </h5>
                  {testLeaderboardData.map((res, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <div
                        key={res.sessionId || index}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          isTop1
                            ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                            : isTop2
                            ? "bg-slate-800/80 border-slate-700"
                            : isTop3
                            ? "bg-amber-950/20 border-amber-900/40"
                            : "bg-slate-900/60 border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isTop1
                                ? "bg-amber-500 text-slate-950 shadow"
                                : isTop2
                                ? "bg-slate-300 text-slate-900"
                                : isTop3
                                ? "bg-amber-700 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div>
                            <h6 className="font-bold text-white text-xs sm:text-sm">
                              {res.studentName}
                            </h6>
                            <span className="text-[11px] text-slate-400">
                              {res.submittedAt
                                ? new Date(
                                    res.submittedAt.seconds
                                      ? res.submittedAt.seconds * 1000
                                      : res.submittedAt
                                  ).toLocaleString("uz-UZ")
                                : "Topshirilgan"}
                              {res.timeSpentSeconds > 0 &&
                                ` • ${Math.floor(res.timeSpentSeconds / 60)} daq ${
                                  res.timeSpentSeconds % 60
                                } soniya`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400">
                            {res.score}% ({res.correctCount}/{res.totalQuestions})
                          </div>
                          {res.earnedCoins > 0 && (
                            <span className="text-[11px] text-amber-400 font-bold block">
                              +{res.earnedCoins} Tillo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setSelectedTestForLeaderboard(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
