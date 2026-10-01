import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { attendanceService } from "../../services/attendanceService";
import { AttendanceStatus, Group, UserProfile } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";

export const TeacherAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const gList = await groupService.getTeacherGroups(user.uid).catch(() => []);
        setGroups(gList);
        if (gList.length > 0) {
          setSelectedGroupId((prev) => (gList.some((g) => g.groupId === prev) ? prev : gList[0].groupId));
        } else {
          setSelectedGroupId("");
          setStudents([]);
        }
      } catch (err: any) {
        toastError(err.message || "Guruhlarni yuklashda xatolik");
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, [user?.uid]);

  useEffect(() => {
    const loadGroupAttendance = async () => {
      if (!selectedGroupId) return;
      try {
        setLoadingStudents(true);
        const [stList, existingAtt] = await Promise.all([
          groupService.getGroupStudents(selectedGroupId).catch(() => []),
          attendanceService.getAttendance(selectedGroupId, selectedDate).catch(() => null),
        ]);

        setStudents(stList);

        if (existingAtt && existingAtt.records) {
          setRecords(existingAtt.records);
        } else {
          // Default: mark everyone present initially
          const initial: Record<string, AttendanceStatus> = {};
          stList.forEach((s) => {
            initial[s.uid] = "present";
          });
          setRecords(initial);
        }
      } catch (err: any) {
        toastError("O'quvchilar ro'yxatini yuklashda xatolik");
      } finally {
        setLoadingStudents(false);
      }
    };

    loadGroupAttendance();
  }, [selectedGroupId, selectedDate]);

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.uid] = "present";
    });
    setRecords(updated);
    success("Barcha o'quvchilar 'Keldi' deb belgilandi");
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId || !user?.uid) return;

    try {
      setSaving(true);
      await attendanceService.saveAttendance({
        groupId: selectedGroupId,
        teacherId: user.uid,
        date: selectedDate,
        records,
      });
      success("Davomat muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      toastError(err.message || "Davomatni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-sky-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">Kunlik Davomat</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Guruh o'quvchilarining darsga qatnashishini belgilang (Keldi, Kelmadi, Kechikdi)
          </p>
        </div>

        {students.length > 0 && (
          <Button
            onClick={handleSaveAttendance}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Davomatni Saqlash
          </Button>
        )}
      </div>

      {/* Selector Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Guruhni tanlang</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
            >
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Sana</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {students.length > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllPresent}>
            Barchasini "Keldi" qilish
          </Button>
        )}
      </Card>

      {/* Attendance Sheet */}
      {loading || loadingStudents ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-sky-500" />
        </div>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">O'quvchilar yo'q</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tanlangan guruhda hali biriktirilgan o'quvchilar mavjud emas.
          </p>
        </Card>
      ) : (
        <Card className="bg-slate-900/80 border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {students.map((st, idx) => {
              const currentStatus = records[st.uid] || "present";

              return (
                <div
                  key={st.uid}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono w-5">{idx + 1}.</span>
                    {st.photoURL ? (
                      <img
                        src={st.photoURL}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                        {st.displayName?.charAt(0) || "S"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-white">{st.displayName}</h4>
                      <p className="text-[11px] text-slate-400">{st.phoneNumber || "Telefon yo'q"}</p>
                    </div>
                  </div>

                  {/* Toggle buttons: Present / Late / Absent - Mobile Thumb Friendly */}
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setStudentStatus(st.uid, "present")}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === "present"
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-102"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Keldi
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentStatus(st.uid, "late")}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === "late"
                          ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25 scale-102"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" /> Kechikdi
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentStatus(st.uid, "absent")}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 sm:py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === "absent"
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25 scale-102"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" /> Kelmadi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
