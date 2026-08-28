import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, School, Camera, Save, Shield } from "lucide-react";
import { ProfileUpdateSchema } from "../../schemas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { storageService } from "../../services/storageService";
import { Card } from "../../components/common/Card";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { CoinBadge } from "../../components/common/CoinBadge";
import { z } from "zod";

type ProfileFormData = z.infer<typeof ProfileUpdateSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    </div>
  );
};
