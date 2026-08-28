import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Yaroqli email manzilini kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Yaroqli email manzilini kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  displayName: z.string().min(3, "Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak"),
  age: z.coerce.number().min(5, "Yosh kamida 5 bo'lishi kerak").max(100, "Yosh 100 dan oshmasligi kerak"),
  phoneNumber: z.string().min(7, "Telefon raqamini to'liq kiriting"),
  educationPlace: z.string().min(2, "O'qish yoki ish joyini kiriting"),
  isCenterStudent: z.boolean().default(false),
});

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(3, "Ism kamida 3 ta belgi bo'lishi kerak"),
  age: z.coerce.number().min(5).max(100),
  phoneNumber: z.string().min(7),
  educationPlace: z.string().min(2),
  isCenterStudent: z.boolean(),
  photoURL: z.string().url().nullable().optional(),
});

export const QuestionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Variant matni kiritilishi shart"),
});

export const QuestionSubmissionFormSchema = z.object({
  subjectId: z.string().min(1, "Fanni tanlang"),
  suggestedLevelNumber: z.coerce.number().min(1, "Daraja raqamini kiriting"),
  text: z.string().min(10, "Savol matni kamida 10 ta belgidan iborat bo'lishi kerak"),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  options: z.array(QuestionOptionSchema).length(4, "Aynan 4 ta variant kiritilishi shart"),
  correctOptionId: z.string().min(1, "To'g'ri javobni tanlang"),
  explanation: z.string().min(5, "Tushuntirish kamida 5 ta belgidan iborat bo'lishi kerak"),
  difficulty: z.coerce.number().min(1).max(5).default(2),
}).refine((data) => data.options.some((opt) => opt.id === data.correctOptionId), {
  message: "To'g'ri javob kiritilgan 4 ta variantdan biri bo'lishi kerak",
  path: ["correctOptionId"],
});

export const PurchaseProductFormSchema = z.object({
  quantity: z.coerce.number().min(1, "Minimal 1 ta").max(10, "Maksimal 10 ta"),
  fullName: z.string().min(3, "Ism va familiyangizni to'liq kiriting"),
  phone: z.string().min(7, "Telefon raqamingizni to'g'ri kiriting"),
  region: z.string().min(2, "Viloyat yoki shaharni tanlang"),
  address: z.string().min(5, "Aniq manzilni kiriting"),
  targetBranch: z.string().nullable().optional(),
});

export const ReviewFormSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(5, "Fikr kamida 5 ta belgidan iborat bo'lishi kerak").max(500),
});
