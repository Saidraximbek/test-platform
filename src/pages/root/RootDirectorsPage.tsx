import React, { useEffect, useState } from "react";
import {
  Crown,
  Search,
  Shield,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  Lock,
  PauseCircle,
  PlayCircle,
  Settings,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { rootService } from "../../services/rootService";
import { useToast } from "../../context/ToastContext";
import { UserProfile, UserStatus } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";

export const RootDirectorsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [directors, setDirectors] = useState<UserProfile[]>([]);
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Appoint Director Modal
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<UserProfile | null>(null);
  const [isAppointing, setIsAppointing] = useState(false);

  // Demote / Action Modal
  const [actionDirector, setActionDirector] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "demote">("suspend");
  const [actionReason, setActionReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchDirectors = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await rootService.getDirectors();
      setDirectors(list);
    } catch (err: any) {
      toastError(err.message || "Direktorlar ro'yxatini yuklashda xatolik");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCandidates = async () => {
    try {
      const all = await rootService.getAllUsers(candidateSearch, "all", "active", 50);
      setCandidates(all.filter((u) => u.role !== "director" && u.role !== "root_owner"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDirectors();
  }, []);

  useEffect(() => {
    if (isAppointModalOpen) {
      loadCandidates();
    }
  }, [isAppointModalOpen, candidateSearch]);

  const handleAppointDirector = async () => {
    if (!selectedCandidate) return;
    setIsAppointing(true);
    try {
      await rootService.setUserRole(selectedCandidate.uid, "director", "Root Owner tomonidan direktor tayinlandi");
      success(`"${selectedCandidate.displayName}" muvaffaqiyatli DIREKTOR etib tayinlandi!`);
      setIsAppointModalOpen(false);
      setSelectedCandidate(null);
      fetchDirectors(true);
    } catch (err: any) {
      toastError(err.message || "Direktor tayinlashda xatolik yuz berdi");
    } finally {
      setIsAppointing(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionDirector) return;
    setIsProcessingAction(true);
    try {
      if (actionType === "suspend") {
        await rootService.setUserStatus(actionDirector.uid, "suspended", actionReason || "Root qarori bilan to'xtatildi");
        success(`"${actionDirector.displayName}" direktorlik faoliyati vaqtincha to'xtatildi.`);
      } else if (actionType === "activate") {
        await rootService.setUserStatus(actionDirector.uid, "active", actionReason || "Root qarori bilan qayta tiklandi");
        success(`"${actionDirector.displayName}" hisobi faollashtirildi.`);
      } else if (actionType === "demote") {
        await rootService.setUserRole(actionDirector.uid, "admin", actionReason || "Direktorlik vakolati bekor qilindi");
        success(`"${actionDirector.displayName}" direktorlik vakolati bekor qilindi (Admin roliga o'tkazildi).`);
      }
      setActionDirector(null);
      setActionReason("");
      fetchDirectors(true);
    } catch (err: any) {
      toastError(err.message || "Amalni bajarishda xatolik");
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Direktorlar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ta'lim markazlari rahbarlarini tayinlash, nazorat qilish, to'xtatish yoki almashtirish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchDirectors(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
            className="bg-purple-950/40 border-purple-500/30 text-purple-200"
          >
            Yangilash
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAppointModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            Yangi Direktor Tayinlash
          </Button>
        </div>
      </div>

      {/* Directors Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" className="text-amber-500" />
        </div>
      ) : directors.length === 0 ? (
        <Card className="bg-[#0B0F1F]/90 border-slate-800 p-12 text-center text-slate-500 text-xs rounded-2xl">
          Hozirda tizimda tayinlangan direktorlar mavjud emas. Yuqoridagi tugma orqali tayinlang.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {directors.map((dir) => (
            <Card
              key={dir.uid}
              className="bg-[#0B0F1F]/95 border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/60 transition shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-lg shadow-md shadow-amber-500/10">
                      {dir.displayName?.charAt(0) || "D"}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{dir.displayName}</h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        DIREKTOR
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      dir.status === "active"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {dir.status || "active"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-amber-400" /> Email/Login:
                    </span>
                    <span className="text-white truncate max-w-[150px]">{dir.email || dir.login || "—"}</span>
                  </div>
                  {dir.phoneNumber && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-amber-400" /> Telefon:
                      </span>
                      <span className="text-white">{dir.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400">
                    <span>O'quv markaz:</span>
                    <span className="text-slate-300">{dir.educationPlace || "Markaz"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {dir.status === "active" ? (
                  <button
                    onClick={() => {
                      setActionDirector(dir);
                      setActionType("suspend");
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>To'xtatish</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActionDirector(dir);
                      setActionType("activate");
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Faollashtirish</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setActionDirector(dir);
                    setActionType("demote");
                  }}
                  className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition"
                  title="Direktorlik vakolatini bekor qilish"
                >
                  Bekor qilish
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Appoint Director Modal */}
      {isAppointModalOpen && (
        <Modal
          isOpen={isAppointModalOpen}
          onClose={() => setIsAppointModalOpen(false)}
          title="Yangi Direktor Tayinlash"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Mavjud xodimlar yoki foydalanuvchilar orasidan yangi Direktorni tanlang va tasdiqlang.
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Foydalanuvchini qidiring..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-slate-800 custom-scrollbar">
              {candidates.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Nomzodlar topilmadi.
                </div>
              ) : (
                candidates.map((c) => (
                  <div
                    key={c.uid}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                      selectedCandidate?.uid === c.uid
                        ? "bg-amber-500/20 border border-amber-500/40 text-white"
                        : "hover:bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{c.displayName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.email || c.login || c.phoneNumber || "Aloqa yo'q"} (Joriy rol: {c.role})
                      </div>
                    </div>
                    {selectedCandidate?.uid === c.uid && (
                      <span className="text-amber-400 font-bold text-xs">Tanlandi</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setIsAppointModalOpen(false)} disabled={isAppointing}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleAppointDirector}
                disabled={!selectedCandidate}
                isLoading={isAppointing}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none"
              >
                Direktor etib tayinlash
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action / Demote / Suspend Modal */}
      {actionDirector && (
        <Modal
          isOpen={!!actionDirector}
          onClose={() => setActionDirector(null)}
          title={`Direktor Ustidan Amal: ${actionDirector.displayName}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              {actionType === "suspend" && "Direktor hisob faoliyati vaqtincha to'xtatiladi. Tizimga kirish cheklanadi."}
              {actionType === "activate" && "Direktor hisobi qayta tiklanadi va barcha boshqaruv imkoniyatlari ochiladi."}
              {actionType === "demote" && "Direktor roli olib tashlanadi va administrator roliga tushiriladi."}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Amal sababi (Maxfiy auditda qayd etiladi)
              </label>
              <Input
                placeholder="Sababni yozing..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setActionDirector(null)} disabled={isProcessingAction}>
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteAction}
                isLoading={isProcessingAction}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none"
              >
                Tasdiqlash
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
