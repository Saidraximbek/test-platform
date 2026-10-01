import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  Edit2,
  Trash2,
  Phone,
  BookOpen,
  Calendar,
  Sparkles,
  Users,
  AlertCircle,
  GraduationCap,
  Key,
} from "lucide-react";
import {
  admissionService,
  generateSuggestedCredentials,
} from "../../services/admissionService";
import { groupService } from "../../services/groupService";
import { subjectService } from "../../services/subjectService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { AdmissionRecord, AdmissionStatus, Group, Subject } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Badge } from "../../components/common/Badge";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";
import { AdmissionPrintCard } from "../../components/admin/AdmissionPrintCard";

export const AdminAdmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create Admission Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("+998");
  const [formParentPhone, setFormParentPhone] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formPreferredTime, setFormPreferredTime] = useState("farqi_yoq");
  const [formSource, setFormSource] = useState("boshqa");
  const [formNotes, setFormNotes] = useState("");

  // Activate & Create Account Modal
  const [activateModalAdmission, setActivateModalAdmission] = useState<AdmissionRecord | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateLogin, setActivateLogin] = useState("");
  const [activatePassword, setActivatePassword] = useState("");
  const [activateGroupId, setActivateGroupId] = useState("");

  // Print Card Modal
  const [printModalAdmission, setPrintModalAdmission] = useState<AdmissionRecord | null>(null);

  // Edit Modal
  const [editModalAdmission, setEditModalAdmission] = useState<AdmissionRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete Confirm Modal
  const [deleteModalAdmission, setDeleteModalAdmission] = useState<AdmissionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copy state helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allAdmissions, allGroups, allSubs] = await Promise.all([
        admissionService.getAdmissions(statusFilter, searchQuery),
        groupService.getGroups().catch(() => []),
        subjectService.getSubjects(false).catch(() => []),
      ]);
      setAdmissions(allAdmissions);
      setGroups(allGroups);
      setSubjects(allSubs);
    } catch (err: any) {
      console.error("Admissions load error:", err);
      toastError("Qabul ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormFullName("");
    setFormPhone("+998");
    setFormParentPhone("");
    setFormAge("");
    setFormSubject(subjects[0]?.name || "");
    setFormPreferredTime("farqi_yoq");
    setFormSource("boshqa");
    setFormNotes("");
    setCreateModalOpen(true);
  };

  // Submit Create Admission
  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) {
      toastError("O'quvchining F.I.Sh ni kiriting");
      return;
    }
    if (!formPhone.trim() || formPhone.length < 9) {
      toastError("To'g'ri telefon raqam kiriting");
      return;
    }

    try {
      setCreating(true);
      const newRec = await admissionService.createAdmission({
        fullName: formFullName,
        phoneNumber: formPhone,
        parentPhone: formParentPhone,
        age: formAge,
        interestedSubject: formSubject,
        preferredTime: formPreferredTime,
        source: formSource,
        notes: formNotes,
        status: "new",
      });

      success("Yangi o'quvchi qabulga muvaffaqiyatli qo'shildi!");
      setCreateModalOpen(false);
      setAdmissions((prev) => [newRec, ...prev]);
    } catch (err: any) {
      toastError(err.message || "Qo'shishda xatolik yuz berdi");
    } finally {
      setCreating(false);
    }
  };

  // Open Activate Modal
  const handleOpenActivate = (adm: AdmissionRecord) => {
    const creds = generateSuggestedCredentials(adm.fullName);
    setActivateModalAdmission(adm);
    setActivateLogin(adm.login || creds.login);
    setActivatePassword(adm.plainPassword || creds.password);
    setActivateGroupId(adm.assignedGroupId || "");
  };

  // Submit Activate (Darsga keldi -> Status active, generate credentials, link group)
  const handleActivateSubmit = async () => {
    if (!activateModalAdmission) return;
    if (!activateLogin.trim()) {
      toastError("Loginni kiriting");
      return;
    }
    if (!activatePassword.trim() || activatePassword.length < 6) {
      toastError("Parol kamida 6 ta belgi bo'lishi kerak");
      return;
    }

    try {
      setActivating(true);
      const selectedGroup = groups.find((g) => g.groupId === activateGroupId);

      const result = await admissionService.activateAdmission(activateModalAdmission.id, {
        login: activateLogin,
        password: activatePassword,
        groupId: activateGroupId || "",
        groupName: selectedGroup?.name || "",
        currentAdminUid: user?.uid,
      });

      const updatedRecord: AdmissionRecord = {
        ...activateModalAdmission,
        status: "active",
        login: result.login,
        plainPassword: result.password,
        assignedStudentUid: result.studentUid,
        assignedGroupId: activateGroupId || "",
        assignedGroupName: selectedGroup?.name || "",
        activatedAt: new Date().toISOString(),
      };

      setAdmissions((prev) =>
        prev.map((a) => (a.id === activateModalAdmission.id ? updatedRecord : a))
      );

      success("O'quvchi faollashtirildi, login va parol biriktirildi!");
      setActivateModalAdmission(null);

      // Open print voucher immediately so admin can hand the printed pass to the student!
      setPrintModalAdmission(updatedRecord);
    } catch (err: any) {
      toastError(err.message || "Faollashtirishda xatolik yuz berdi");
    } finally {
      setActivating(false);
    }
  };

  // Quick Status Change (e.g. to 'contacted' or 'cancelled')
  const handleQuickStatusChange = async (adm: AdmissionRecord, newStatus: AdmissionStatus) => {
    if (newStatus === "active") {
      handleOpenActivate(adm);
      return;
    }

    try {
      await admissionService.updateStatus(adm.id, newStatus, user?.uid);
      setAdmissions((prev) =>
        prev.map((a) => (a.id === adm.id ? { ...a, status: newStatus } : a))
      );
      success(`Holat "${getStatusLabel(newStatus)}" ga o'zgartirildi`);
    } catch (err: any) {
      toastError("Holatni o'zgartirishda xatolik");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (adm: AdmissionRecord) => {
    setEditModalAdmission(adm);
    setEditFullName(adm.fullName);
    setEditPhone(adm.phoneNumber);
    setEditParentPhone(adm.parentPhone || "");
    setEditSubject(adm.interestedSubject || "");
    setEditNotes(adm.notes || "");
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAdmission) return;

    try {
      setEditing(true);
      await admissionService.updateAdmission(editModalAdmission.id, {
        fullName: editFullName.trim(),
        phoneNumber: editPhone.trim(),
        parentPhone: editParentPhone.trim(),
        interestedSubject: editSubject.trim(),
        notes: editNotes.trim(),
      });

      setAdmissions((prev) =>
        prev.map((a) =>
          a.id === editModalAdmission.id
            ? {
                ...a,
                fullName: editFullName.trim(),
                phoneNumber: editPhone.trim(),
                parentPhone: editParentPhone.trim(),
                interestedSubject: editSubject.trim(),
                notes: editNotes.trim(),
              }
            : a
        )
      );

      success("Ma'lumotlar muvaffaqiyatli saqlandi");
      setEditModalAdmission(null);
    } catch (err: any) {
      toastError("Saqlashda xatolik yuz berdi");
    } finally {
      setEditing(false);
    }
  };

  // Delete Admission
  const handleDeleteAdmission = async () => {
    if (!deleteModalAdmission) return;
    try {
      setDeleting(true);
      await admissionService.deleteAdmission(deleteModalAdmission.id);
      setAdmissions((prev) => prev.filter((a) => a.id !== deleteModalAdmission.id));
      success("Ariza o'chirildi");
      setDeleteModalAdmission(null);
    } catch (err: any) {
      toastError("O'chirishda xatolik");
    } finally {
      setDeleting(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusLabel = (st: AdmissionStatus) => {
    switch (st) {
      case "new":
        return "Yangi (Kutilmoqda)";
      case "contacted":
        return "Bog'lanildi";
      case "active":
        return "Aktiv (Darsga kelgan)";
      case "cancelled":
        return "Rad etildi";
      default:
        return st;
    }
  };

  const getStatusBadgeVariant = (st: AdmissionStatus): "warning" | "info" | "success" | "neutral" => {
    switch (st) {
      case "new":
        return "warning";
      case "contacted":
        return "info";
      case "active":
        return "success";
      case "cancelled":
        return "neutral";
      default:
        return "neutral";
    }
  };

  // Summary counts
  const totalCount = admissions.length;
  const newCount = admissions.filter((a) => a.status === "new").length;
  const activeCount = admissions.filter((a) => a.status === "active").length;
  const contactedCount = admissions.filter((a) => a.status === "contacted").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Qabul Bo'limi (LMS Qabul & Lidlar)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Yangi Oqim
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Yangi kelgan o'quvchilarni ro'yxatga olish, darsga kelganda holatini Aktivlashtirish, login/parol berish va guvohnomani chop etish
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Yangi O'quvchi Qabuli
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Jami Arizalar</span>
            <Users className="w-5 h-5 text-brand-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Barcha qabul ro'yxati</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Yangi / Kutilmoqda</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{newCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Darsga kelishi kutilmoqda</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Aktiv (Darsga kelgan)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{activeCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Login/parol berilganlar</p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400">Bog'lanilganlar</span>
            <Phone className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 mt-2">{contactedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Suhbatlashilgan o'quvchilar</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="F.I.Sh, telefon yoki qiziqqan fan bo'yicha qidiruv..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="bg-slate-900 border-slate-800 text-white"
          />
          <Button type="submit">Qidirish</Button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="all">Barcha holatlar ({totalCount})</option>
          <option value="new">Faqat yangi (Kutilmoqda)</option>
          <option value="contacted">Bog'lanilgan</option>
          <option value="active">Aktiv (Darsga kelgan / Login berilgan)</option>
          <option value="cancelled">Rad etilgan</option>
        </select>
      </div>

      {/* Admissions Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-500" />
          </div>
        ) : admissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <p>Hozircha qabul qilingan o'quvchilar topilmadi</p>
            <Button size="sm" onClick={handleOpenCreateModal} className="mt-2">
              Birinchi o'quvchini qo'shish
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">O'quvchi (F.I.Sh)</th>
                  <th className="p-4">Aloqa</th>
                  <th className="p-4">Fan & Vaqt</th>
                  <th className="p-4">Holat (Status)</th>
                  <th className="p-4">Tizim Kirishi (Login / Parol)</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {admissions.map((adm) => {
                  const isActive = adm.status === "active";
                  return (
                    <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Full Name & Admission Date */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-sm">
                            {adm.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {adm.fullName}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{adm.id.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-500">•</span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(adm.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-200">
                          <Phone className="w-3.5 h-3.5 text-brand-400" />
                          {adm.phoneNumber}
                        </div>
                        {adm.parentPhone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Ota-ona: <span className="font-mono">{adm.parentPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Subject & Preferred Time */}
                      <td className="p-4 text-slate-300">
                        <div className="font-bold text-white flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-amber-400" />
                          {adm.interestedSubject || "Umumiy"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {adm.preferredTime === "ertalab"
                            ? "Ertalab"
                            : adm.preferredTime === "tushdan_keyin"
                            ? "Tushdan keyin"
                            : adm.preferredTime === "kechki"
                            ? "Kechki"
                            : "Ixtiyoriy vaqt"}
                          {adm.notes ? ` • ${adm.notes}` : ""}
                        </div>
                      </td>

                      {/* Status Dropdown / Badge */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(adm.status)}>
                            {getStatusLabel(adm.status)}
                          </Badge>
                          <select
                            value={adm.status}
                            onChange={(e) =>
                              handleQuickStatusChange(adm, e.target.value as AdmissionStatus)
                            }
                            className="bg-slate-800 border border-slate-700 rounded-lg text-[10px] px-1.5 py-1 text-slate-300 hover:text-white"
                          >
                            <option value="new">Yangi</option>
                            <option value="contacted">Bog'lanildi</option>
                            <option value="active">Aktiv (Darsga keldi)</option>
                            <option value="cancelled">Rad etildi</option>
                          </select>
                        </div>
                        {adm.assignedGroupName && (
                          <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {adm.assignedGroupName}
                          </div>
                        )}
                      </td>

                      {/* Login / Password Credential Box */}
                      <td className="p-4">
                        {isActive && adm.login ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit">
                              <span className="text-[10px] text-slate-400 font-medium">Login:</span>
                              <span className="text-xs font-mono font-bold text-amber-300">
                                {adm.login}
                              </span>
                              <button
                                onClick={() => handleCopyText(adm.login!, `log_${adm.id}`)}
                                className="text-slate-400 hover:text-white ml-1"
                                title="Loginni nusxalash"
                              >
                                {copiedId === `log_${adm.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit">
                              <span className="text-[10px] text-slate-400 font-medium">Parol:</span>
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {adm.plainPassword || "********"}
                              </span>
                              {adm.plainPassword && (
                                <button
                                  onClick={() =>
                                    handleCopyText(adm.plainPassword!, `pass_${adm.id}`)
                                  }
                                  className="text-slate-400 hover:text-white ml-1"
                                  title="Parolni nusxalash"
                                >
                                  {copiedId === `pass_${adm.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Darsga kelgach beriladi
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Activate Button (if not yet active) */}
                        {!isActive ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenActivate(adm)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            title="O'quvchi darsga keldi - Aktivlashtirish va login/parol berish"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Darsga keldi
                          </Button>
                        ) : (
                          /* Print Button (if active) */
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrintModalAdmission(adm)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30"
                            title="Printerdan chop etish"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            Chop etish
                          </Button>
                        )}

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(adm)}
                          className="text-slate-400 hover:text-white"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteModalAdmission(adm)}
                          className="text-rose-400 hover:bg-rose-500/10"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CREATE ADMISSION MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Yangi O'quvchini Qabul Qilish (Lid qo'shish)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAdmission} className="space-y-4">
          <Input
            label="O'quvchining F.I.Sh (To'liq ism-familiyasi) *"
            placeholder="Masalan: Saidov Saidraximbek"
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Telefon raqami *"
              placeholder="+998901234567"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              required
            />
            <Input
              label="Ota-onasi telefon raqami"
              placeholder="+998912345678"
              value={formParentPhone}
              onChange={(e) => setFormParentPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Qiziqqan fan / Kurs
              </label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                {subjects.length > 0 ? (
                  <>
                    <option value="">Fanni tanlang...</option>
                    {subjects.map((sub) => (
                      <option key={sub.subjectId} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="" disabled>
                    Mavjud fanlar topilmadi
                  </option>
                )}
              </select>
              {subjects.length === 0 && (
                <p className="text-[10px] text-amber-400 mt-1">
                  * Tizimda hali fanlar mavjud emas ("Fanlar Boshqaruvi" bo'limidan qo'shishingiz mumkin)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ma'qul keladigan vaqt
              </label>
              <select
                value={formPreferredTime}
                onChange={(e) => setFormPreferredTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="farqi_yoq">Farqi yo'q (Ixtiyoriy)</option>
                <option value="ertalab">Ertalab (08:00 - 12:00)</option>
                <option value="tushdan_keyin">Tushdan keyin (13:00 - 17:00)</option>
                <option value="kechki">Kechki (17:00 - 20:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Yoshi yoki Maktab/Sinfi"
              placeholder="Masalan: 15 yosh yoki 9-sinf"
              value={formAge}
              onChange={(e) => setFormAge(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Qayerdan bildi (Manba)
              </label>
              <select
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="telegram">Telegram kanali</option>
                <option value="instagram">Instagram</option>
                <option value="tavsiya">Tanish / Do'st tavsiyasi</option>
                <option value="banner">Tashqi reklama / Banner</option>
                <option value="boshqa">Boshqa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Qo'shimcha izoh / Ma'lumot
            </label>
            <textarea
              rows={2}
              placeholder="Qo'shimcha istaklar, bilim darajasi yoki eslatmalar..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setCreateModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button isLoading={creating} type="submit" className="bg-brand-600 hover:bg-brand-500">
              Qabulga Qo'shish
            </Button>
          </div>
        </form>
      </Modal>

      {/* ACTIVATE STUDENT MODAL (Darsga kelganda login-parol berish) */}
      <Modal
        isOpen={!!activateModalAdmission}
        onClose={() => setActivateModalAdmission(null)}
        title="O'quvchini Aktivlashtirish & Login-Parol Berish"
        maxWidth="lg"
      >
        {activateModalAdmission && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>O'quvchi darsga keldi!</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Foydalanuvchi: <strong className="text-white">{activateModalAdmission.fullName}</strong> ({activateModalAdmission.phoneNumber})
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quyidagi login va parol orqali o'quvchi platformaga kira oladi. Saqlangandan so'ng darhol chop etish varaqasi ochiladi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Biriktiriladigan Login *
                </label>
                <input
                  type="text"
                  value={activateLogin}
                  onChange={(e) => setActivateLogin(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="masalan: alisher_4821"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Email: {activateLogin || "login"}@fargoniy.uz
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  Birinchi kirish paroli *
                </label>
                <input
                  type="text"
                  value={activatePassword}
                  onChange={(e) => setActivatePassword(e.target.value)}
                  placeholder="kamida 6 ta belgi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  O'quvchi o'z profilida parolni o'zgartira oladi
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-brand-400" />
                Guruhga biriktirish (Ixtiyoriy)
              </label>
              <select
                value={activateGroupId}
                onChange={(e) => setActivateGroupId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">Hozircha guruhsiz (Keyinroq biriktirish)</option>
                {groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.name} ({g.teacherName || g.subjectId || "Guruh"}) [{g.currentStudentsCount || 0} o'quvchi]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setActivateModalAdmission(null)}>
                Bekor qilish
              </Button>
              <Button
                isLoading={activating}
                onClick={handleActivateSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Aktivlashtirish va Login Berish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* PRINT ADMISSION VOUCHER MODAL */}
      <Modal
        isOpen={!!printModalAdmission}
        onClose={() => setPrintModalAdmission(null)}
        title="O'quvchi Qabul Cheki (Login & Parol)"
        maxWidth="lg"
      >
        {printModalAdmission && (
          <AdmissionPrintCard
            admission={printModalAdmission}
            onClose={() => setPrintModalAdmission(null)}
          />
        )}
      </Modal>

      {/* EDIT ADMISSION MODAL */}
      <Modal
        isOpen={!!editModalAdmission}
        onClose={() => setEditModalAdmission(null)}
        title="Ariza Ma'lumotlarini Tahrirlash"
      >
        {editModalAdmission && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="O'quvchining F.I.Sh"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telefon"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
              />
              <Input
                label="Ota-ona telefoni"
                value={editParentPhone}
                onChange={(e) => setEditParentPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fan / Yo'nalish
              </label>
              <select
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              >
                {subjects.length > 0 ? (
                  <>
                    <option value="">Fanni tanlang...</option>
                    {subjects.map((sub) => (
                      <option key={sub.subjectId} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="" disabled>
                    Mavjud fanlar topilmadi
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Izoh</label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" type="button" onClick={() => setEditModalAdmission(null)}>
                Bekor qilish
              </Button>
              <Button isLoading={editing} type="submit">
                Saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deleteModalAdmission}
        onClose={() => setDeleteModalAdmission(null)}
        title="Arizani O'chirish"
      >
        {deleteModalAdmission && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Haqiqatan ham <strong className="text-white">{deleteModalAdmission.fullName}</strong> nomli qabul arizasini o'chirmoqchimisiz?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setDeleteModalAdmission(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                isLoading={deleting}
                onClick={handleDeleteAdmission}
              >
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAdmissionsPage;
