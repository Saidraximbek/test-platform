import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { LoginSchema } from "../../schemas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { authService } from "../../services/authService";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { z } from "zod";

type LoginFormData = z.infer<typeof LoginSchema>;

export const LoginPage: React.FC = () => {
  const { login, firebaseUser, user, isAdmin, isTeacher, isDirector, loading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  // If already authenticated, redirect to appropriate portal immediately
  useEffect(() => {
    if (!authLoading && firebaseUser) {
      if (isDirector || user?.role === "director") {
        navigate("/director", { replace: true });
      } else if (isTeacher || user?.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else if (isAdmin || user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from && from !== "/login" && from !== "/" ? from : "/dashboard", { replace: true });
      }
    }
  }, [firebaseUser, user, isAdmin, isTeacher, isDirector, authLoading, navigate, from]);

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

      // Quick role-based navigation fallback
      const curUser = authService.onAuthChanged(async (u) => {
        if (u) {
          const uDoc = await authService.getUserDoc(u.uid);
          const role = uDoc?.role;
          if (role === "director") {
            navigate("/director", { replace: true });
          } else if (role === "teacher") {
            navigate("/teacher", { replace: true });
          } else if (role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate(from && from !== "/login" && from !== "/" ? from : "/dashboard", { replace: true });
          }
        }
      });
      // Safety cleanup
      setTimeout(() => curUser(), 1000);
    } catch (err: any) {
      toastError(err.message || "Kirishda xatolik yuz berdi. Login yoki parol noto'g'ri.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Tizimga kirish</h2>
        <p className="text-xs text-slate-400 mt-1">
          LMS platformasi va test tizimidan foydalanish uchun login va parolingizni kiriting
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Login yoki Email"
          type="text"
          placeholder="Login yoki email (masalan: user yoki misol@gmail.com)"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Parol"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-slate-200 transition-colors focus:outline-none"
              title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-2 shadow-lg shadow-brand-500/25"
          size="lg"
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          Kirish
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        Profilingiz yo'qmi?{" "}
        <Link to="/register" className="text-brand-400 font-semibold hover:underline">
          Ro'yxatdan o'tish
        </Link>
      </div>
    </div>
  );
};
