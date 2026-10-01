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
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { lessonService } from "../../services/lessonService";
import { subjectService } from "../../services/subjectService";
import { homeworkService } from "../../services/homeworkService";
import { Group, Lesson, LessonStatus, Level, Subject } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";
import { VideoEmbed } from "../../components/common/VideoEmbed";

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

  // Modal: simple lesson creation (only title and videoUrl)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

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
    setVideoUrl("");
    const defaultGroup = groups.length > 0 ? groups[0].groupId : "";
    setGroupId(defaultGroup);
    setIsModalOpen(true);
  };

  const openEditModal = (les: Lesson) => {
    setEditingLesson(les);
    setTitle(les.title || "");
    setVideoUrl(les.videoUrl || "");
    setGroupId(les.groupId || (groups.length > 0 ? groups[0].groupId : ""));
    setIsModalOpen(true);
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

    try {
      setSaving(true);
      const savedLesson = await lessonService.saveLesson({
        lessonId: editingLesson?.lessonId,
        title: title.trim(),
        videoUrl: videoUrl.trim() || null,
        groupId: effectiveGroupId,
        teacherId: user?.uid || selectedGroup?.teacherId || "",
        subjectId: selectedGroup?.subjectId || "",
        lessonNumber:
          editingLesson?.lessonNumber ||
          lessons.filter((l) => l.groupId === effectiveGroupId).length + 1,
        scheduledDate: editingLesson?.scheduledDate || new Date().toISOString().slice(0, 10),
        durationMinutes: editingLesson?.durationMinutes || 80,
        description: editingLesson?.description || "",
        materialsText: editingLesson?.materialsText || null,
        pdfUrl: editingLesson?.pdfUrl || null,
        testId: editingLesson?.testId || null,
        status: "published",
      });

      // Auto-create/sync homework for this lesson so students can immediately see and submit homework
      try {
        await homeworkService.saveHomework({
          homeworkId: editingLesson?.homeworkId || `hw_${savedLesson.lessonId}`,
          lessonId: savedLesson.lessonId,
          groupId: effectiveGroupId,
          teacherId: user?.uid || selectedGroup?.teacherId || "",
          title: `${savedLesson.title} - Uy vazifasi`,
          instructions: savedLesson.description || `${savedLesson.title} mavzusi bo'yicha berilgan topshiriq va mashqlarni bajaring hamda yechimlarini yuboring.`,
          maxScore: 100,
          deadline: savedLesson.scheduledDate || "",
          lessonTitle: savedLesson.title,
        });
      } catch (e) {
        console.warn("Auto save homework warning:", e);
      }

      success(editingLesson ? "Dars muvaffaqiyatli yangilandi!" : "Yangi dars muvaffaqiyatli saqlandi!");
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
            Guruhlar uchun dars rejasi, video darslar, konspektlar va testlarni biriktirish
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
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/30 hover:bg-sky-900/60 hover:text-white transition-colors"
                        title="Videoni ko'rish"
                      >
                        <Video className="w-3 h-3 text-sky-400" /> Video darsni ko'rish
                      </button>
                    )}
                    {les.materialsText && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        <FileText className="w-3 h-3" /> Konspekt / Material
                      </span>
                    )}
                    {les.testId && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        <HelpCircle className="w-3 h-3" /> Test: {level?.name || "Biriktirilgan"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    onClick={() => openEditModal(les)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Tahrirlash"
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

      {/* Modal: Create or Edit Lesson */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLesson ? "Darsni Tahrirlash" : "Yangi Dars Yaratish"}
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <Input
            label="Dars mavzusi (Title)"
            placeholder="Masalan: Chiziqli tenglamalar va formulalar"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Guruh</label>
            {groups.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                Sizga biriktirilgan faol guruh topilmadi. Avval administrator tomonidan guruh biriktirilishi kerak.
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

          {/* Video URL */}
          <div className="space-y-2">
            <Input
              label="Video havolasi (URL)"
              placeholder="Masalan: https://www.youtube.com/watch?v=... yoki https://youtu.be/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
            {videoUrl.trim() && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> Video darsni tekshirish (Oldindan ko'rish):
                </span>
                <VideoEmbed url={videoUrl} title={title || "Video dars"} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingLesson ? "O'zgarishlarni Saqlash" : "Darsni Saqlash"}
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
    </div>
  );
};
