import React, { useEffect, useState } from "react";
import {
  BookOpen,
  HelpCircle,
  Search,
  Filter,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Download,
  Users,
  Trophy,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  GraduationCap,
  Calendar,
  Check,
  ChevronDown,
} from "lucide-react";
import { collection, getDocs, doc, query, where, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";
import { subjectService } from "../../services/subjectService";
import { levelService } from "../../services/levelService";
import { leaderboardService } from "../../services/leaderboardService";
import { Subject, Level, Question, Lesson, Group } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";

export interface TopicTestItem {
  id: string; // levelId or testId or lessonId
  testId: string;
  lessonId?: string;
  title: string;
  subjectId: string;
  subjectName: string;
  groupId?: string;
  groupName?: string;
  teacherId?: string;
  teacherName?: string;
  durationMinutes: number;
  questionCount: number;
  questions: Question[];
  createdAt: any;
  source: "lesson" | "level" | "homework";
}

export const AdminTopicTestsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [topicTests, setTopicTests] = useState<TopicTestItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Preview Modal
  const [previewTest, setPreviewTest] = useState<TopicTestItem | null>(null);

  // Import to Question Bank Modal
  const [importTargetTest, setImportTargetTest] = useState<TopicTestItem | null>(null);
  const [targetSubjectId, setTargetSubjectId] = useState<string>("");
  const [targetLevelId, setTargetLevelId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Test Leaderboard Modal
  const [selectedTestForLeaderboard, setSelectedTestForLeaderboard] = useState<TopicTestItem | null>(null);
  const [testLeaderboardData, setTestLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Load All Topic Tests
  const loadData = async () => {
    try {
      setLoading(true);

      const [subsList, lvlsSnap, groupsSnap, lessonsSnap, questionsSnap] = await Promise.all([
        subjectService.getSubjects(false).catch(() => []),
        getDocs(collection(db, "levels")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "groups")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "lessons")).catch(() => ({ docs: [] })),
        getDocs(collection(db, "questions")).catch(() => ({ docs: [] })),
      ]);

      setSubjects(subsList);

      const loadedLevels: Level[] = (lvlsSnap as any).docs.map((d: any) => ({
        levelId: d.id,
        ...d.data(),
      }));
      setLevels(loadedLevels);

      const loadedGroups: Group[] = (groupsSnap as any).docs.map((d: any) => ({
        groupId: d.id,
        ...d.data(),
      }));
      setGroups(loadedGroups);

      const groupMap = new Map<string, Group>();
      loadedGroups.forEach((g) => groupMap.set(g.groupId, g));

      const subjectMap = new Map<string, Subject>();
      subsList.forEach((s) => subjectMap.set(s.subjectId, s));

      const allQuestions: Question[] = (questionsSnap as any).docs.map((d: any) => ({
        questionId: d.id,
        ...d.data(),
      }));

      // Group questions by levelId
      const questionsByLevel = new Map<string, Question[]>();
      allQuestions.forEach((q) => {
        if (q.levelId) {
          const list = questionsByLevel.get(q.levelId) || [];
          list.push(q);
          questionsByLevel.set(q.levelId, list);
        }
      });

      const items: TopicTestItem[] = [];
      const processedTestIds = new Set<string>();

      // 1. Darslarga biriktirilgan mavzuli testlar
      const loadedLessons: Lesson[] = (lessonsSnap as any).docs.map((d: any) => ({
        lessonId: d.id,
        ...d.data(),
      }));

      loadedLessons.forEach((les) => {
        if (les.testId) {
          processedTestIds.add(les.testId);
          const relatedQs = questionsByLevel.get(les.testId) || [];
          const matchedLvl = loadedLevels.find((l) => l.levelId === les.testId);
          const grp = les.groupId ? groupMap.get(les.groupId) : undefined;
          const sub = les.subjectId ? subjectMap.get(les.subjectId) : grp ? subjectMap.get(grp.subjectId) : undefined;

          items.push({
            id: les.lessonId,
            testId: les.testId,
            lessonId: les.lessonId,
            title: les.title ? `${les.title} testi` : matchedLvl?.name || "Mavzuli Test",
            subjectId: les.subjectId || grp?.subjectId || "general",
            subjectName: sub?.name || "Umumiy",
            groupId: les.groupId,
            groupName: grp?.name || "Barcha guruhlar",
            teacherId: les.teacherId,
            teacherName: grp?.teacherName || "O'qituvchi",
            durationMinutes: matchedLvl?.durationMinutes || 15,
            questionCount: relatedQs.length || matchedLvl?.questionsRequired || 0,
            questions: relatedQs,
            createdAt: les.createdAt,
            source: "lesson",
          });
        }
      });

      // 2. Darajalar (levels) to'plamidagi o'qituvchi tuzgan yoki mavzuli testlar
      loadedLevels.forEach((lvl) => {
        if (!processedTestIds.has(lvl.levelId)) {
          const relatedQs = questionsByLevel.get(lvl.levelId) || [];
          const sub = subjectMap.get(lvl.subjectId);

          items.push({
            id: lvl.levelId,
            testId: lvl.levelId,
            title: lvl.name || `Daraja ${lvl.levelNumber} testi`,
            subjectId: lvl.subjectId,
            subjectName: sub?.name || "Noma'lum fan",
            durationMinutes: lvl.durationMinutes || 20,
            questionCount: relatedQs.length || lvl.questionsRequired || 0,
            questions: relatedQs,
            createdAt: lvl.createdAt,
            source: "level",
          });
        }
      });

      setTopicTests(items);
    } catch (err: any) {
      console.error("Failed to load topic tests:", err);
      toastError("Mavzuli testlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Topic Tests
  const filteredTests = topicTests.filter((test) => {
    const matchSubject = selectedSubjectId === "all" || test.subjectId === selectedSubjectId;
    const matchGroup = selectedGroupId === "all" || test.groupId === selectedGroupId;
    const matchSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.groupName && test.groupName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (test.teacherName && test.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchGroup && matchSearch;
  });

  // Open Import Modal
  const openImportModal = (test: TopicTestItem) => {
    setImportTargetTest(test);
    setTargetSubjectId(test.subjectId || (subjects.length > 0 ? subjects[0].subjectId : ""));
    const matchingLvl = levels.find((l) => l.subjectId === test.subjectId);
    setTargetLevelId(matchingLvl?.levelId || "");
  };

  // Perform Import / Sync to Questions Database
  const handleImportToDatabase = async () => {
    if (!importTargetTest) return;
    if (importTargetTest.questions.length === 0) {
      toastError("Ushbu testda yuklash uchun savollar topilmadi");
      return;
    }

    try {
      setIsImporting(true);
      const effectiveSubjectId = targetSubjectId || importTargetTest.subjectId;
      const effectiveLevelId = targetLevelId || importTargetTest.testId;

      const batch = writeBatch(db);
      let count = 0;

      for (const q of importTargetTest.questions) {
        // Yangi yoki mavjud savol hujjati
        const qId = q.questionId && !q.questionId.startsWith("q_temp_") ? q.questionId : `q_${Date.now()}_${count + 1}`;
        const qRef = doc(db, "questions", qId);

        batch.set(
          qRef,
          {
            questionId: qId,
            subjectId: effectiveSubjectId,
            levelId: effectiveLevelId,
            text: q.text,
            imageUrl: q.imageUrl || null,
            options: q.options || [],
            correctOptionId: q.correctOptionId || "A",
            explanation: q.explanation || "",
            difficulty: q.difficulty || 2,
            status: "approved", // Savollar bazasida tasdiqlangan holatda
            randomWeight: Math.random(),
            updatedAt: serverTimestamp(),
            importedAt: serverTimestamp(),
          },
          { merge: true }
        );
        count++;
      }

      await batch.commit();

      success(`${count} ta savol Savollar bazasiga muvaffaqiyatli yuklandi va tasdiqlandi!`);
      setImportTargetTest(null);
      loadData();
    } catch (err: any) {
      console.error("Import error:", err);
      toastError(err.message || "Savollar bazasiga yuklashda xatolik yuz berdi");
    } finally {
      setIsImporting(false);
    }
  };

  // Open Leaderboard Modal for Test
  const handleOpenLeaderboard = async (test: TopicTestItem) => {
    setSelectedTestForLeaderboard(test);
    try {
      setLoadingLeaderboard(true);
      const ranking = await leaderboardService.getTestLeaderboard(test.testId);
      setTestLeaderboardData(ranking);
    } catch (err) {
      console.error("Leaderboard load error:", err);
      toastError("Reyting ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Export questions to CSV
  const handleExportCSV = (test: TopicTestItem) => {
    if (test.questions.length === 0) {
      toastError("Eksport qilish uchun savollar mavjud emas");
      return;
    }

    const headers = ["Savol matni", "Variant A", "Variant B", "Variant C", "Variant D", "To'g'ri javob", "Tushuntirish"];
    const rows = test.questions.map((q) => {
      const optA = q.options.find((o) => o.id === "A")?.text || "";
      const optB = q.options.find((o) => o.id === "B")?.text || "";
      const optC = q.options.find((o) => o.id === "C")?.text || "";
      const optD = q.options.find((o) => o.id === "D")?.text || "";
      return [
        `"${(q.text || "").replace(/"/g, '""')}"`,
        `"${optA.replace(/"/g, '""')}"`,
        `"${optB.replace(/"/g, '""')}"`,
        `"${optC.replace(/"/g, '""')}"`,
        `"${optD.replace(/"/g, '""')}"`,
        `"${q.correctOptionId || "A"}"`,
        `"${(q.explanation || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${test.title.replace(/[^a-zA-Z0-9]/g, "_")}_savollari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Test savollari CSV fayl ko'rinishida yuklab olindi!");
  };

  // KPI Calculations
  const totalQuestionsSum = topicTests.reduce((acc, t) => acc + (t.questionCount || 0), 0);
  const totalSubjectsCovered = new Set(topicTests.map((t) => t.subjectId)).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Barcha Fanlardan Mavzuli Testlar
                <Badge variant="success">Yangi Bo'lim</Badge>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                O'qituvchilar tomonidan dars va vazifalarga berilgan mavzuli testlar banki
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Yangilash
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Mavzuli Testlar Soni</span>
            <span className="text-2xl font-black text-white">{topicTests.length} ta</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Jami Savollar Jamg'armasi</span>
            <span className="text-2xl font-black text-white">
              {topicTests.reduce((acc, t) => acc + (t.questions?.length || t.questionCount || 0), 0)} ta
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Qamrab Olingan Fanlar</span>
            <span className="text-2xl font-black text-white">{totalSubjectsCovered} ta fan</span>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/80 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Mavzu nomi, o'qituvchi yoki guruh bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Barcha Fanlar</option>
              {subjects.map((sub) => (
                <option key={sub.subjectId} value={sub.subjectId} className="bg-slate-900">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Barcha Guruhlar</option>
              {groups.map((grp) => (
                <option key={grp.groupId} value={grp.groupId} className="bg-slate-900">
                  {grp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Tests Table / List */}
      {loading ? (
        <div className="flex justify-center items-center py-28">
          <Spinner size="lg" className="text-brand-500" />
        </div>
      ) : filteredTests.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">Mavzuli testlar topilmadi</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Hozircha o'qituvchilar tomonidan yaratilgan mavzuli testlar mavjud emas yoki tanlangan filtr bo'yicha ma'lumot yo'q.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTests.map((test, index) => {
            const hasQuestions = test.questions && test.questions.length > 0;
            const qCount = test.questions?.length || test.questionCount || 0;

            return (
              <Card
                key={`${test.id}_${index}`}
                className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Test Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-brand-400 font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-sm sm:text-base text-white truncate">
                        {test.title}
                      </span>
                      <Badge variant="info">
                        {test.subjectName}
                      </Badge>
                      {test.groupName && (
                        <Badge variant="neutral">
                          {test.groupName}
                        </Badge>
                      )}
                      {test.source === "lesson" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          Darsga biriktirilgan
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      {test.teacherName && (
                        <span>
                          Ustoz: <strong className="text-slate-300 font-medium">{test.teacherName}</strong>
                        </span>
                      )}
                      <span>
                        Savollar: <strong className="text-brand-400 font-bold">{qCount} ta</strong>
                      </span>
                      <span>
                        Vaqt: <strong className="text-slate-300 font-medium">{test.durationMinutes} daqiqa</strong>
                      </span>
                      <span className="text-slate-500">
                        ID: <code className="text-[11px] bg-slate-800 px-1 py-0.5 rounded">{test.testId}</code>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Savollarni ko'rish */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTest(test)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    className="text-xs"
                    disabled={!hasQuestions}
                    title="Test savollari va variantlarini ko'rish"
                  >
                    Savollar ({qCount})
                  </Button>

                  {/* Test Reytingi / Liderboard */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenLeaderboard(test)}
                    leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
                    className="text-xs border border-amber-500/20 hover:border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                    title="Ushbu testni bajargan o'quvchilar reytingini ko'rish"
                  >
                    Reyting
                  </Button>

                  {/* Savollar bazasiga yuklash */}
                  <Button
                    size="sm"
                    onClick={() => openImportModal(test)}
                    leftIcon={<UploadCloud className="w-3.5 h-3.5" />}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    disabled={!hasQuestions}
                    title="Asosiy savollar bazasiga yuklash / tasdiqlash"
                  >
                    Bazasiga Yuklash
                  </Button>

                  {/* CSV Export */}
                  {hasQuestions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportCSV(test)}
                      className="p-2 text-slate-400 hover:text-white"
                      title="CSV faylga yuklab olish"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Preview Test Questions */}
      <Modal
        isOpen={!!previewTest}
        onClose={() => setPreviewTest(null)}
        title={previewTest ? `${previewTest.title} - Savollar Ro'yxati (${previewTest.questions?.length || 0} ta)` : ""}
      >
        {previewTest && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span>Fan: <strong className="text-white">{previewTest.subjectName}</strong></span>
              <span>Davomiyligi: <strong className="text-white">{previewTest.durationMinutes} daqiqa</strong></span>
              <span>Guruh: <strong className="text-white">{previewTest.groupName || "Umumiy"}</strong></span>
            </div>

            {(!previewTest.questions || previewTest.questions.length === 0) ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-xl text-slate-400 text-xs">
                Savollar yuklanmadi yoki topilmadi.
              </div>
            ) : (
              <div className="space-y-3">
                {previewTest.questions.map((q, idx) => (
                  <div
                    key={q.questionId || idx}
                    className="p-4 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-white leading-snug flex-1">
                        {q.text}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                      {q.options?.map((opt) => {
                        const isCorrect = opt.id === q.correctOptionId;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg text-xs border flex items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold"
                                : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                isCorrect
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="truncate flex-1">{opt.text}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="pl-8 pt-1 text-[11px] text-slate-400 italic">
                        Izoh: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewTest && handleExportCSV(previewTest)}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                CSV yuklab olish
              </Button>
              <Button size="sm" onClick={() => setPreviewTest(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Import to Main Question Bank */}
      <Modal
        isOpen={!!importTargetTest}
        onClose={() => setImportTargetTest(null)}
        title="Savollar Bazasiga Yuklash va Tasdiqlash"
      >
        {importTargetTest && (
          <div className="space-y-4">
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs text-brand-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <div>
                Ushbu testdagi <strong>{importTargetTest.questions?.length || 0} ta</strong> savol
                asosiy Savollar Bazasiga (Questions) tasdiqlangan holatda yuklanadi va barcha o'quvchilar uchun
                testlarda taqdim etiladi.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mavzu Nomi
                </label>
                <input
                  type="text"
                  disabled
                  value={importTargetTest.title}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-300 opacity-80"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Savollar Biriktiriladigan Fan:
                </label>
                <select
                  value={targetSubjectId}
                  onChange={(e) => setTargetSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Mavzu / Daraja ID (LevelId):
                </label>
                <input
                  type="text"
                  value={targetLevelId}
                  onChange={(e) => setTargetLevelId(e.target.value)}
                  placeholder="Masalan: lvl_12345 yoki math_level_1"
                  className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Savollar aynan ushbu daraja yoki mavzu kodi ostida bazaga kiritiladi.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportTargetTest(null)}
                disabled={isImporting}
              >
                Bekor qilish
              </Button>
              <Button
                size="sm"
                onClick={handleImportToDatabase}
                isLoading={isImporting}
                leftIcon={<UploadCloud className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Bazasiga Yuklash
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Test Leaderboard (Kim yaxshiroq natija ko'rsatgan) */}
      <Modal
        isOpen={!!selectedTestForLeaderboard}
        onClose={() => setSelectedTestForLeaderboard(null)}
        title={selectedTestForLeaderboard ? `🏆 ${selectedTestForLeaderboard.title} - O'quvchilar Reytingi` : ""}
      >
        {selectedTestForLeaderboard && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>Fan: <strong className="text-white">{selectedTestForLeaderboard.subjectName}</strong></span>
              <span>Guruh: <strong className="text-white">{selectedTestForLeaderboard.groupName || "Umumiy"}</strong></span>
              <span>Topshirganlar: <strong className="text-brand-400 font-bold">{testLeaderboardData.length} nafar</strong></span>
            </div>

            {loadingLeaderboard ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" className="text-amber-500" />
              </div>
            ) : testLeaderboardData.length === 0 ? (
              <div className="p-10 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs text-slate-400">
                <Trophy className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                Hozircha ushbu testni hech kim topshirmagan. Natijalar o'quvchilar testni yechib tugatganda paydo bo'ladi.
              </div>
            ) : (
              <div className="space-y-2">
                {testLeaderboardData.map((item, idx) => {
                  const isTop1 = idx === 0;
                  const isTop2 = idx === 1;
                  const isTop3 = idx === 2;

                  return (
                    <div
                      key={item.sessionId || idx}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isTop1
                          ? "bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/5"
                          : isTop2
                          ? "bg-slate-700/40 border-slate-600/50"
                          : isTop3
                          ? "bg-amber-700/10 border-amber-700/30"
                          : "bg-slate-800/60 border-slate-700/50"
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
                          {idx + 1}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm">
                            {item.studentName}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {item.submittedAt ? new Date(item.submittedAt.seconds ? item.submittedAt.seconds * 1000 : item.submittedAt).toLocaleDateString("uz-UZ") : "Sana ko'rsatilmagan"}
                            {item.timeSpentSeconds > 0 && ` • ${Math.floor(item.timeSpentSeconds / 60)} daq ${item.timeSpentSeconds % 60} soniya`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">
                          {item.score}% ({item.correctCount}/{item.totalQuestions})
                        </div>
                        {item.earnedCoins > 0 && (
                          <span className="text-[11px] text-amber-400 font-bold block">
                            +{item.earnedCoins} Tillo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
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
