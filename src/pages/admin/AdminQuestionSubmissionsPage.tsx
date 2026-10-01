import React, { useEffect, useState } from "react";
import { FileQuestion, CheckCircle2, XCircle, Eye, Sparkles } from "lucide-react";
import { questionSubmissionService } from "../../services/questionSubmissionService";
import { useToast } from "../../context/ToastContext";
import { QuestionSubmission } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { formatDate } from "../../utils";

export const AdminQuestionSubmissionsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [submissions, setSubmissions] = useState<QuestionSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [selectedSub, setSelectedSub] = useState<QuestionSubmission | null>(null);
  const [rewardCoins, setRewardCoins] = useState<number>(20);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const list = await questionSubmissionService.getAllSubmissions(statusFilter);
      setSubmissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedSub) return;
    setIsApproving(true);
    try {
      await questionSubmissionService.approveSubmission(selectedSub.submissionId, rewardCoins);
      success("Savol tasdiqlandi va bazaga qo'shildi! Foydalanuvchiga tangalar berildi.");
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err: any) {
      toastError(err.message || "Tasdiqlashda xatolik");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSub || !rejectionReason.trim()) {
      toastError("Rad etish sababini kiriting");
      return;
    }
    setIsRejecting(true);
    try {
      await questionSubmissionService.rejectSubmission(selectedSub.submissionId, rejectionReason);
      success("Savol rad etildi");
      setSelectedSub(null);
      setRejectionReason("");
      fetchSubmissions();
    } catch (err: any) {
      toastError(err.message || "Rad etishda xatolik");
    } finally {
      setIsRejecting(false);
    }
  };

  const statusBadges: Record<string, "warning" | "info" | "success" | "danger"> = {
    pending: "warning",
    reviewing: "info",
    approved: "success",
    rejected: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Taklif Qilingan Savollar Moderatsiyasi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Foydalanuvchilar tomonidan yuborilgan test savollarini ko'rib chiqish va tasdiqlash
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300"
        >
          <option value="pending">Kutilmoqda (Pending)</option>
          <option value="approved">Tasdiqlangan (Approved)</option>
          <option value="rejected">Rad etilgan (Rejected)</option>
          <option value="all">Barchasi</option>
        </select>
      </div>

      {/* Submissions List */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Hozircha ko'rib chiqilishi kerak bo'lgan savollar yo'q
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Yuboruvchi</th>
                  <th className="p-4">Savol matni</th>
                  <th className="p-4">Fan / Daraja</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Ko'rish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {submissions.map((sub) => (
                  <tr key={sub.submissionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-slate-400">
                      {sub.userId ? `${sub.userId.substring(0, 8)}...` : "-"}
                    </td>
                    <td className="p-4 font-semibold text-white max-w-sm truncate">{sub.text}</td>
                    <td className="p-4 text-slate-300">
                      {sub.subjectId} (Level {sub.suggestedLevelNumber})
                    </td>
                    <td className="p-4 text-slate-400">{formatDate(sub.createdAt)}</td>
                    <td className="p-4">
                      <Badge variant={statusBadges[sub.status] || "neutral"}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSub(sub)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title="Savolni ko'rib chiqish va tasdiqlash"
        maxWidth="lg"
      >
        {selectedSub && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-800 space-y-2">
              <span className="font-bold text-slate-400 block">Savol matni:</span>
              <p className="text-sm font-semibold text-white">{selectedSub.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <span className="font-bold text-slate-400">Variantlar:</span>
              {selectedSub.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    selectedSub.correctOptionId === opt.id
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold"
                      : "bg-slate-800/50 border-slate-700 text-slate-300"
                  }`}
                >
                  <span>
                    <strong>{opt.id}:</strong> {opt.text}
                  </span>
                  {selectedSub.correctOptionId === opt.id && (
                    <span className="text-[10px] uppercase font-bold text-emerald-400">
                      To'g'ri javob
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <strong className="text-brand-400 block mb-1">Tushuntirish:</strong>
              <p className="text-slate-300">{selectedSub.explanation}</p>
            </div>

            {selectedSub.status === "pending" && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-slate-400">Mukofot miqdori (Tillo):</label>
                  <input
                    type="number"
                    value={rewardCoins}
                    onChange={(e) => setRewardCoins(Number(e.target.value))}
                    className="w-24 rounded-lg bg-slate-800 border border-slate-700 text-white p-1.5 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Rad etish sababi (agar rad qilinsa):</label>
                  <input
                    type="text"
                    placeholder="Masalan: Savolda xatolik bor yoki duplicate"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 text-white p-2.5"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="danger"
                    isLoading={isRejecting}
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Rad etish
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isApproving}
                    onClick={handleApprove}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Tasdiqlash (+{rewardCoins} Tillo)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
