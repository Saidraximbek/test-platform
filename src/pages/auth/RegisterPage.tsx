import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone, School, UserPlus } from "lucide-react";
import { RegisterSchema } from "../../schemas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { z } from "zod";

type RegisterFormData = z.infer<typeof RegisterSchema>;

export const RegisterPage: React.FC = () => {
  const { register: authRegister } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      isCenterStudent: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await authRegister(data.email, data.password, {
        displayName: data.displayName,
        age: data.age,
        phoneNumber: data.phoneNumber,
        educationPlace: data.educationPlace,
        isCenterStudent: data.isCenterStudent,
      });
      success("Hisobingiz muvaffaqiyatli yaratildi!");
      navigate("/dashboard");
    } catch (err: any) {
      toastError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Ro'yxatdan o'tish</h2>
        <p className="text-xs text-slate-400 mt-1">
          Yangi hisob yarating va Tillo tangalarini yutishni boshlang
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="To'liq ismingiz"
          type="text"
          placeholder="Ali Valiyev"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.displayName?.message}
          {...register("displayName")}
        />

        <div className="grid grid-cols-2 gap-3">
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
          type="text"
          placeholder="1-sonli maktab yoki TATU"
          leftIcon={<School className="w-4 h-4" />}
          error={errors.educationPlace?.message}
          {...register("educationPlace")}
        />

        <div className="flex items-center gap-2 pt-1 pb-1">
          <input
            id="isCenterStudent"
            type="checkbox"
            className="w-4 h-4 rounded text-brand-600 border-slate-700 bg-slate-800 focus:ring-brand-500"
            {...register("isCenterStudent")}
          />
          <label htmlFor="isCenterStudent" className="text-xs text-slate-300 select-none cursor-pointer">
            O'quv markazimizning amaldagi o'quvchisiman
          </label>
        </div>

        <Input
          label="Email manzil"
          type="email"
          placeholder="misol@gmail.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Parol"
          type="password"
          placeholder="Kamida 6 ta belgi"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-2"
          size="lg"
          rightIcon={<UserPlus className="w-4 h-4" />}
        >
          Hisob yaratish
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Allaqachon hisobingiz bormi?{" "}
        <Link to="/login" className="text-brand-400 font-semibold hover:underline">
          Tizimga kirish
        </Link>
      </div>
    </div>
  );
};
