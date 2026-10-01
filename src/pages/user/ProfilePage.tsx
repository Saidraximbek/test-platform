import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Phone,
  School,
  Camera,
  Save,
  Shield,
  CreditCard,
  ClipboardList,
  GraduationCap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  DoorOpen,
} from "lucide-react";
import { ProfileUpdateSchema } from "../../schemas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { storageService } from "../../services/storageService";
import { groupService } from "../../services/groupService";
import { attendanceService, StudentAttendanceSummary } from "../../services/attendanceService";
import { financeService } from "../../services/financeService";
import { Group } from "../../types";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { CoinBadge } from "../../components/common/CoinBadge";
import { formatNumber } from "../../utils";
import { z } from "zod";

type ProfileFormData = z.infer<typeof ProfileUpdateSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [studentGroups, setStudentGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [debtStatus, setDebtStatus] = useState<{
    paidAmount: number;
    debtAmount: number;
    nextPaymentDate: string;
    hasDebt: boolean;
  } | null>(null);

  useEffect(() => {
    const loadStudentLMSData = async () => {
      if (!user?.uid) return;
      try {
        const [grps, att, debt] = await Promise.all([
          groupService.getStudentGroups(user.uid),
          attendanceService.getStudentAttendanceStats(user.uid),
          financeService.getStudentDebtStatus(user.uid),
        ]);

        let finalGroups = grps;
        const deletedGroupIds = groupService.getDeletedGroupIds ? groupService.getDeletedGroupIds() : new Set();
        if (finalGroups.length === 0 && Array.isArray(user?.enrolledGroups) && user.enrolledGroups.length > 0) {
          const validEnrolled = user.enrolledGroups.filter((eg) => eg && eg.groupId && !deletedGroupIds.has(eg.groupId));
          if (validEnrolled.length > 0) {
            finalGroups = validEnrolled.map((eg) => ({
              groupId: eg.groupId,
              name: eg.name || "Guruh",
              subjectId: eg.subjectId || "",
              teacherId: eg.teacherId || "",
              teacherName: eg.teacherName || "",
              room: eg.room || "",
              schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
              startTime: eg.startTime || "14:00",
              endTime: eg.endTime || "",
              lessonDuration: eg.lessonDuration || 80,
              monthlyPrice: eg.monthlyPrice || 0,
              maxStudents: 20,
              currentStudentsCount: 1,
              studentIds: [user.uid],
              status: "active" as const,
              createdAt: eg.enrolledAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
          }
        }

        setStudentGroups(finalGroups);
        setAttendance(att);
        setDebtStatus(debt);
      } catch (err) {
        console.warn("Could not load LMS profile data:", err);
      }
    };
    loadStudentLMSData();
  }, [user?.uid]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      age: user?.age || 16,
      phoneNumber: user?.phoneNumber || "",
      educationPlace: user?.educationPlace || "",
      isCenterStudent: user?.isCenterStudent || false,
      photoURL: user?.photoURL || null,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
      success("Profilingiz ma'lumotlari yangilandi!");
    } catch (err: any) {
      toastError(err.message || "Profilni saqlashda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    if (file.size > 2 * 1024 * 1024) {
      toastError("Rasm hajmi 2MB dan oshmasligi kerak");
      return;
    }

    setIsUploading(true);
    try {
      const url = await storageService.uploadAvatar(user.uid, file);
      await updateProfile({ photoURL: url });
      setValue("photoURL", url);
      success("Profil rasmi yangilandi!");
    } catch (err: any) {
      toastError(err.message || "Rasm yuklashda xatolik");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mening Profilim</h1>
        <p className="text-xs text-slate-500 mt-1">
          Shaxsiy ma'lumotlaringizni tahrirlang va hisobingiz holatini kuzating
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Badge Profile Overview */}
        <Card className="p-6 text-center flex flex-col items-center">
          <div className="relative mb-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                loading="lazy"
                decoding="async"
                className="w-24 h-24 rounded-full object-cover border-2 border-brand-500 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 flex items-center justify-center text-3xl font-bold">
                {user?.displayName?.charAt(0) || "U"}
              </div>
            )}

            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-600 text-white cursor-pointer hover:bg-brand-700 shadow-md transition-colors">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
            </label>
          </div>

          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {user?.displayName}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{user?.educationPlace || "O'quvchi"}</p>

          <div className="mt-4 w-full pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Tillo Balansi:</span>
              <CoinBadge amount={user?.coinBalance || 0} size="sm" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Hisob turi:</span>
              <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                {user?.role}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Holat:</span>
              <span className="font-semibold text-emerald-600 uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10">
                {user?.status}
              </span>
            </div>
          </div>
        </Card>

        {/* Profile Edit Form */}
        <Card className="md:col-span-2 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Shaxsiy ma'lumotlar
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="To'liq ismingiz"
              placeholder="Ali Valiyev"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.displayName?.message}
              {...register("displayName")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Yoshingiz"
                type="number"
                placeholder="16"
                error={errors.age?.message}
                {...register("age")}
              />
              <Input
                label="Telefon raqami"
                type="tel"
                placeholder="+998901234567"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phoneNumber?.message}
                {...register("phoneNumber")}
              />
            </div>

            <Input
              label="Maktab / Universitet / O'quv markazi"
              placeholder="O'qish yoki ish joyingiz"
              leftIcon={<School className="w-4 h-4" />}
              error={errors.educationPlace?.message}
              {...register("educationPlace")}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                id="profileIsCenter"
                type="checkbox"
                className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800 focus:ring-brand-500"
                {...register("isCenterStudent")}
              />
              <label htmlFor="profileIsCenter" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                O'quv markazimizning amaldagi o'quvchisiman
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
                rightIcon={<Save className="w-4 h-4" />}
              >
                O'zgarishlarni saqlash
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* LMS Section: Attendance, Tuition & Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* Tuition Fee Status */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> To'lov Holati
              </h4>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  debtStatus?.hasDebt
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}
              >
                {debtStatus?.hasDebt ? "Qarzdorlik bor" : "To'langan"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Shu oy to'langan:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumber(debtStatus?.paidAmount || 0)} UZS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Qarz:</span>
                <span
                  className={`font-bold ${
                    debtStatus?.hasDebt ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {formatNumber(debtStatus?.debtAmount || 0)} UZS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Keyingi to'lov:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {debtStatus?.nextPaymentDate || "5-oktabr"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Attendance Summary */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-sky-500" /> Davomat
              </h4>
              <span className="text-base font-black text-sky-500">
                {attendance?.percentage || 100}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Qatnashgan kunlari:</span>
                <span className="font-bold text-emerald-500">
                  {attendance?.present || 0} ta dars
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kechikishlar:</span>
                <span className="font-bold text-amber-500">
                  {attendance?.late || 0} ta
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kelmagan darslar:</span>
                <span className="font-bold text-rose-500">
                  {attendance?.absent || 0} ta
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Enrolled Groups */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Guruhlarim
              </h4>
              {studentGroups.length > 0 && (
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                  {studentGroups.length} ta
                </span>
              )}
            </div>

            {studentGroups.length === 0 ? (
              <p className="text-xs text-slate-400">Hozircha guruhga biriktirilmagan</p>
            ) : (
              <div className="space-y-2.5">
                {studentGroups.map((g) => (
                  <div
                    key={g.groupId}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{g.name}</p>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        {g.startTime} {g.endTime ? `- ${g.endTime}` : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 truncate">
                        <Award className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{g.teacherName || "Ustoz"}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <DoorOpen className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{g.room || "1-xona"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {g.schedule}
                      </span>
                      <Link
                        to="/lessons"
                        className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        Darslar <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
