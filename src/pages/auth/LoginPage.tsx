import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn } from "lucide-react";
import { LoginSchema } from "../../schemas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { z } from "zod";

type LoginFormData = z.infer<typeof LoginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      success("Tizimga muvaffaqiyatli kirdingiz!");
      navigate(from, { replace: true });
    } catch (err: any) {
      toastError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Tizimga kirish</h2>
        <p className="text-xs text-slate-400 mt-1">
          Testlarni ishlash va Tillo tangalarini to'plash uchun profilingizga kiring
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-2"
          size="lg"
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          Kirish
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        Profilingiz yo'qmi?{" "}
        <Link to="/register" className="text-brand-400 font-semibold hover:underline">
          Ro'yxatdan o'tish
        </Link>
      </div>
    </div>
  );
};
