import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Expense,
  ExpenseCategory,
  Group,
  Payment,
  PaymentStatus,
  SalaryStatus,
  SalaryType,
  TeacherSalary,
  UserProfile,
} from "../types";
import { teacherService } from "./teacherService";
import { groupService } from "./groupService";
import { adminService } from "./adminService";
import { subjectService } from "./subjectService";

export interface StudentPaymentStatusItem {
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentLogin?: string;
  groupId: string;
  groupName: string;
  subjectId?: string;
  subjectName?: string;
  teacherId: string;
  teacherName: string;
  month: string;
  monthlyFee: number;
  paidAmount: number;
  debtAmount: number;
  status: "PAID" | "PARTIAL" | "DEBT";
  lastPaymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  paymentId?: string;
  paymentsCount?: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  totalSalariesPaid: number;
  totalSalariesRemaining: number;
  netIncome: number;
  totalDebtsAmount: number;
  debtorsCount: number;
  monthlyRevenueHistory: { month: string; amount: number }[];
  monthlyExpenseHistory: { month: string; amount: number }[];
  totalTreasuryBalance?: number;
  allTimeRevenue?: number;
  allTimeExpenses?: number;
  allTimeSalariesPaid?: number;
  expensesByCategory?: Record<string, number>;
}

const PAYMENTS_CACHE_KEY = "fm_payments_cache";
const DELETED_PAYMENTS_KEY = "fm_deleted_payments_cache";
const EXPENSES_CACHE_KEY = "fm_expenses_cache";
const DELETED_EXPENSES_KEY = "fm_deleted_expenses_cache";
const SALARIES_CACHE_KEY = "fm_salaries_cache";
const DELETED_SALARIES_KEY = "fm_deleted_salaries_cache";

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

async function syncSystemFinanceToCloud(data: {
  payments?: Payment[];
  deletedPaymentIds?: string[];
  expenses?: Expense[];
  deletedExpenseIds?: string[];
  teacher_salaries?: TeacherSalary[];
  deletedSalaryIds?: string[];
}): Promise<void> {
  try {
    cloudFinanceMemCache = null;
    const ref = doc(db, "users", "system_finance");
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err: any) {
    console.warn("Cloud sync system_finance warning:", err?.message);
  }
}

let cloudFinanceMemCache: { data: any; time: number } | null = null;
let paymentsMemCache: { data: Payment[]; time: number } | null = null;
let expensesMemCache: { data: Expense[]; time: number } | null = null;
let salariesMemCache: { data: TeacherSalary[]; time: number } | null = null;

export function invalidateFinanceMemCache(): void {
  cloudFinanceMemCache = null;
  paymentsMemCache = null;
  expensesMemCache = null;
  salariesMemCache = null;
}

async function loadSystemFinanceFromCloud(): Promise<{
  payments?: Payment[];
  deletedPaymentIds?: string[];
  expenses?: Expense[];
  deletedExpenseIds?: string[];
  teacher_salaries?: TeacherSalary[];
  deletedSalaryIds?: string[];
}> {
  if (cloudFinanceMemCache && Date.now() - cloudFinanceMemCache.time < 30000) {
    return cloudFinanceMemCache.data;
  }
  try {
    const ref = doc(db, "users", "system_finance");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = (snap.data() as any) || {};
      cloudFinanceMemCache = { data, time: Date.now() };
      return data;
    }
  } catch {}
  return {};
}

export const financeService = {
  // =================== PAYMENTS (Tushumlar) ===================
  async recordPayment(data: {
    studentId: string;
    studentName: string;
    groupId: string;
    groupName?: string;
    teacherId?: string;
    teacherName?: string;
    subjectId: string;
    amount: number;
    month: string;
    paymentDate: string;
    paymentMethod?: string;
    adminId: string;
    adminName?: string;
    status: PaymentStatus;
    note?: string;
  }): Promise<Payment> {
    const pRef = doc(collection(db, "payments"));
    const paymentId = pRef.id;
    const receiptNumber = `FM-${Date.now().toString().slice(-6)}`;

    const payment: Payment = {
      paymentId,
      studentId: data.studentId,
      studentName: data.studentName,
      groupId: data.groupId,
      groupName: data.groupName || "",
      teacherId: data.teacherId || "",
      teacherName: data.teacherName || "",
      subjectId: data.subjectId,
      amount: Number(data.amount),
      month: data.month,
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod || "Naqd",
      adminId: data.adminId,
      adminName: data.adminName || "Administrator",
      status: data.status,
      note: data.note || "",
      receiptNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Cache locally first
    const cached = getLocal<Payment>(PAYMENTS_CACHE_KEY);
    const updatedPayments = [payment, ...cached.filter((p) => p.paymentId !== paymentId)];
    saveLocal(PAYMENTS_CACHE_KEY, updatedPayments);

    // 2. Cloud sync via system_finance
    syncSystemFinanceToCloud({ payments: updatedPayments });

    // 3. Try top-level Firestore collection
    try {
      await setDoc(pRef, {
        ...payment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore payments write warning (saved via cloud finance):", err?.message);
    }

    // 4. Update student profile record
    try {
      const studentRef = doc(db, "users", data.studentId);
      await setDoc(
        studentRef,
        {
          lastPaymentMonth: data.month,
          lastPaymentDate: data.paymentDate,
          lastPaymentAmount: Number(data.amount),
          paymentStatus: data.status,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}

    // 5. Recalculate teacher salaries immediately for this month so salaries reflect the new payment
    const targetMonth = data.month || data.paymentDate?.slice(0, 7);
    if (targetMonth) {
      try {
        await this.autoRecalculateMonthSalaries(targetMonth);
      } catch (err: any) {
        console.warn("Recalculate salary after record payment error:", err?.message);
      }
    }

    // 6. Invalidate memory cache & Dispatch global event so all open pages (Director / Admin) update immediately!
    paymentsMemCache = null;
    salariesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "payment_created", paymentId } })
      );
    }

    return payment;
  },

  async getPayments(filters?: {
    studentId?: string;
    groupId?: string;
    month?: string;
    status?: PaymentStatus;
  }): Promise<Payment[]> {
    if (paymentsMemCache && Date.now() - paymentsMemCache.time < 30000) {
      let list = paymentsMemCache.data;
      if (filters?.studentId) list = list.filter((p) => p.studentId === filters.studentId);
      if (filters?.groupId) list = list.filter((p) => p.groupId === filters.groupId);
      if (filters?.month) {
        list = list.filter((p) => {
          const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
          return pMonth === filters.month;
        });
      }
      if (filters?.status) list = list.filter((p) => p.status === filters.status);
      return list.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));
    }

    // Fast path: studentId specific query
    if (filters?.studentId) {
      try {
        const q = query(collection(db, "payments"), where("studentId", "==", filters.studentId));
        const snap = await getDocs(q);
        let list = snap.docs.map((d) => ({ paymentId: d.id, ...d.data() } as Payment));
        if (filters.groupId) list = list.filter((p) => p.groupId === filters.groupId);
        if (filters.month) {
          list = list.filter((p) => {
            const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
            return pMonth === filters.month;
          });
        }
        if (filters.status) list = list.filter((p) => p.status === filters.status);
        return list.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));
      } catch (err: any) {
        // Fallback to full load below
      }
    }

    // 1. Load cloud state first to get official payments and deleted IDs
    const cloud = await loadSystemFinanceFromCloud();
    const cloudDeleted = Array.isArray(cloud.deletedPaymentIds) ? cloud.deletedPaymentIds : [];
    const localDeleted = getLocal<string>(DELETED_PAYMENTS_KEY);
    const deletedSet = new Set([...cloudDeleted, ...localDeleted]);
    saveLocal(DELETED_PAYMENTS_KEY, Array.from(deletedSet));

    // 2. Fetch from Firestore collection
    let collectionPayments: Payment[] = [];
    try {
      const snap = await getDocs(collection(db, "payments"));
      collectionPayments = snap.docs.map((d) => ({ paymentId: d.id, ...d.data() } as Payment));
    } catch {}

    // Clean up any deleted docs still hanging in Firestore
    for (const p of collectionPayments) {
      if (deletedSet.has(p.paymentId)) {
        deleteDoc(doc(db, "payments", p.paymentId)).catch(() => {});
      }
    }

    const validCollection = collectionPayments.filter((p) => !deletedSet.has(p.paymentId));
    const validCloud = (Array.isArray(cloud.payments) ? cloud.payments : []).filter(
      (p) => !deletedSet.has(p.paymentId)
    );

    // Build authoritative map: cloud payments + collection payments
    const paymentMap = new Map<string, Payment>();
    for (const p of validCollection) {
      paymentMap.set(p.paymentId, p);
    }
    for (const p of validCloud) {
      paymentMap.set(p.paymentId, p);
    }

    // Only if server is totally empty, fallback to non-deleted cached payments
    if (paymentMap.size === 0 && validCollection.length === 0 && validCloud.length === 0) {
      const cached = getLocal<Payment>(PAYMENTS_CACHE_KEY);
      for (const p of cached) {
        if (!deletedSet.has(p.paymentId)) {
          paymentMap.set(p.paymentId, p);
        }
      }
    }

    let list = Array.from(paymentMap.values());
    paymentsMemCache = { data: list, time: Date.now() };
    // Overwrite local cache with only non-deleted payments!
    saveLocal(PAYMENTS_CACHE_KEY, list);

    if (filters?.studentId) list = list.filter((p) => p.studentId === filters.studentId);
    if (filters?.groupId) list = list.filter((p) => p.groupId === filters.groupId);
    if (filters?.month) {
      list = list.filter((p) => {
        const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
        return pMonth === filters.month;
      });
    }
    if (filters?.status) list = list.filter((p) => p.status === filters.status);

    return list.sort((a, b) => (b.paymentDate || "").localeCompare(a.paymentDate || ""));
  },

  async deletePayment(paymentId: string): Promise<void> {
    // 1. Find deleted payment to determine affected month
    const cached = getLocal<Payment>(PAYMENTS_CACHE_KEY);
    const deletedPayment = cached.find((p) => p.paymentId === paymentId);

    // 2. Add to local deleted set
    const localDeleted = getLocal<string>(DELETED_PAYMENTS_KEY);
    const updatedDeleted = Array.from(new Set([...localDeleted, paymentId]));
    saveLocal(DELETED_PAYMENTS_KEY, updatedDeleted);

    // 3. Remove from local cache immediately
    const updatedPayments = cached.filter((p) => p.paymentId !== paymentId);
    saveLocal(PAYMENTS_CACHE_KEY, updatedPayments);

    // 4. Update cloud system_finance
    let monthToRecalc =
      deletedPayment?.month || deletedPayment?.paymentDate?.slice(0, 7);
    try {
      const cloud = await loadSystemFinanceFromCloud();
      const currentCloudPayments = Array.isArray(cloud.payments) ? cloud.payments : [];
      const targetPayment = deletedPayment || currentCloudPayments.find((p) => p.paymentId === paymentId);
      if (!monthToRecalc && targetPayment) {
        monthToRecalc = targetPayment.month || targetPayment.paymentDate?.slice(0, 7);
      }
      const newCloudPayments = currentCloudPayments.filter((p) => p.paymentId !== paymentId);
      const currentCloudDeleted = Array.isArray(cloud.deletedPaymentIds) ? cloud.deletedPaymentIds : [];
      const newCloudDeleted = Array.from(new Set([...currentCloudDeleted, paymentId]));

      await syncSystemFinanceToCloud({
        payments: newCloudPayments,
        deletedPaymentIds: newCloudDeleted,
      });
    } catch (err: any) {
      console.warn("Cloud delete payment sync warning:", err?.message);
    }

    // 5. Delete from Firestore collection
    try {
      const pRef = doc(db, "payments", paymentId);
      await deleteDoc(pRef);
    } catch (err: any) {
      console.warn("Firestore delete payment warning:", err?.message);
    }

    // 6. Recalculate teacher salaries immediately for affected month!
    if (monthToRecalc) {
      try {
        await this.autoRecalculateMonthSalaries(monthToRecalc);
      } catch (err: any) {
        console.warn("Recalculate salary after delete payment error:", err?.message);
      }
    }

    // 7. Dispatch global event so all open pages (Director / Admin) update immediately!
    paymentsMemCache = null;
    salariesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "payment_deleted", paymentId } })
      );
    }
  },

  async getStudentDebtStatus(studentId: string): Promise<{
    paidAmount: number;
    debtAmount: number;
    nextPaymentDate: string;
    hasDebt: boolean;
  }> {
    const payments = await this.getPayments({ studentId });
    const currentMonth = new Date().toISOString().slice(0, 7);

    const paidForMonth = payments
      .filter((p) => {
        const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
        return pMonth === currentMonth && p.status === "PAID" && Number(p.amount) > 0;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const standardMonthlyFee = 500000;
    const debt = Math.max(0, standardMonthlyFee - paidForMonth);

    return {
      paidAmount: paidForMonth,
      debtAmount: debt,
      nextPaymentDate: `${currentMonth}-05`,
      hasDebt: debt > 0,
    };
  },

  // =================== EXPENSES (Xarajatlar) ===================
  async recordExpense(data: {
    category: ExpenseCategory;
    amount: number;
    date: string;
    description: string;
    createdBy: string;
    createdByName?: string;
  }): Promise<Expense> {
    const eRef = doc(collection(db, "expenses"));
    const expenseId = eRef.id;

    const expense: Expense = {
      expenseId,
      category: data.category,
      amount: Number(data.amount),
      date: data.date,
      description: data.description,
      createdBy: data.createdBy,
      createdByName: data.createdByName || "Direktor",
      createdAt: new Date().toISOString(),
    };

    const cached = getLocal<Expense>(EXPENSES_CACHE_KEY);
    const updated = [expense, ...cached.filter((e) => e.expenseId !== expenseId)];
    saveLocal(EXPENSES_CACHE_KEY, updated);
    syncSystemFinanceToCloud({ expenses: updated });

    try {
      await setDoc(eRef, { ...expense, createdAt: serverTimestamp() });
    } catch (err: any) {
      console.warn("Firestore expenses write warning:", err?.message);
    }

    expensesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "expense_created", expenseId } })
      );
    }

    return expense;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const localDeleted = getLocal<string>(DELETED_EXPENSES_KEY);
    const updatedDeleted = Array.from(new Set([...localDeleted, expenseId]));
    saveLocal(DELETED_EXPENSES_KEY, updatedDeleted);

    const cached = getLocal<Expense>(EXPENSES_CACHE_KEY);
    const updated = cached.filter((e) => e.expenseId !== expenseId);
    saveLocal(EXPENSES_CACHE_KEY, updated);

    try {
      const cloud = await loadSystemFinanceFromCloud();
      const currentExpenses = Array.isArray(cloud.expenses) ? cloud.expenses : [];
      const newExpenses = currentExpenses.filter((e) => e.expenseId !== expenseId);
      const currentCloudDeleted = Array.isArray(cloud.deletedExpenseIds) ? cloud.deletedExpenseIds : [];
      const newCloudDeleted = Array.from(new Set([...currentCloudDeleted, expenseId]));

      await syncSystemFinanceToCloud({
        expenses: newExpenses,
        deletedExpenseIds: newCloudDeleted,
      });
    } catch {}

    try {
      const eRef = doc(db, "expenses", expenseId);
      await deleteDoc(eRef);
    } catch {}

    expensesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "expense_deleted", expenseId } })
      );
    }
  },

  async getExpenses(filters?: { month?: string; category?: ExpenseCategory }): Promise<Expense[]> {
    if (expensesMemCache && Date.now() - expensesMemCache.time < 30000) {
      let list = expensesMemCache.data;
      if (filters?.month) {
        list = list.filter((e) => e.date?.startsWith(filters.month!));
      }
      if (filters?.category) {
        list = list.filter((e) => e.category === filters.category);
      }
      return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }

    const cloud = await loadSystemFinanceFromCloud();
    const cloudDeleted = Array.isArray(cloud.deletedExpenseIds) ? cloud.deletedExpenseIds : [];
    const localDeleted = getLocal<string>(DELETED_EXPENSES_KEY);
    const deletedSet = new Set([...cloudDeleted, ...localDeleted]);
    saveLocal(DELETED_EXPENSES_KEY, Array.from(deletedSet));

    let collectionExpenses: Expense[] = [];
    try {
      const snap = await getDocs(collection(db, "expenses"));
      collectionExpenses = snap.docs.map((d) => ({ expenseId: d.id, ...d.data() } as Expense));
    } catch {}

    for (const e of collectionExpenses) {
      if (deletedSet.has(e.expenseId)) {
        deleteDoc(doc(db, "expenses", e.expenseId)).catch(() => {});
      }
    }

    const validCollection = collectionExpenses.filter((e) => !deletedSet.has(e.expenseId));
    const validCloud = (Array.isArray(cloud.expenses) ? cloud.expenses : []).filter(
      (e) => !deletedSet.has(e.expenseId)
    );

    const map = new Map<string, Expense>();
    for (const e of validCollection) map.set(e.expenseId, e);
    for (const e of validCloud) map.set(e.expenseId, e);

    if (map.size === 0 && validCollection.length === 0 && validCloud.length === 0) {
      const cached = getLocal<Expense>(EXPENSES_CACHE_KEY);
      for (const e of cached) {
        if (!deletedSet.has(e.expenseId)) map.set(e.expenseId, e);
      }
    }

    let list = Array.from(map.values());
    expensesMemCache = { data: list, time: Date.now() };
    saveLocal(EXPENSES_CACHE_KEY, list);

    if (filters?.month) {
      list = list.filter((e) => e.date?.startsWith(filters.month!));
    }
    if (filters?.category) {
      list = list.filter((e) => e.category === filters.category);
    }

    return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  },

  // =================== TEACHER SALARIES (Oylik tizimlari & To'lov) ===================
  async calculateAndSaveTeacherSalary(data: {
    teacherId: string;
    teacherName: string;
    month: string;
    salaryType: SalaryType;
    percentage?: number;
    fixedSalary?: number;
    bonus?: number;
    deduction?: number;
    collectedPayment: number;
    note?: string;
  }): Promise<TeacherSalary> {
    const salaryId = `sal_${data.teacherId}_${data.month}`;
    const bonus = Number(data.bonus || 0);
    const deduction = Number(data.deduction || 0);
    let calculated = 0;

    if (data.salaryType === "percentage") {
      calculated = Math.round(data.collectedPayment * ((data.percentage || 40) / 100));
    } else if (data.salaryType === "fixed") {
      calculated = Number(data.fixedSalary || 0);
    } else {
      // mixed
      calculated = Math.round(
        Number(data.fixedSalary || 0) + data.collectedPayment * ((data.percentage || 20) / 100)
      );
    }

    const finalSalary = Math.max(0, calculated + bonus - deduction);

    // Check if an existing salary record had already paid some amount
    const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
    const existing = cached.find((s) => s.salaryId === salaryId);
    const prevPaid = existing?.paidSalary || 0;
    const remaining = Math.max(0, finalSalary - prevPaid);
    const status: SalaryStatus = remaining === 0 && finalSalary > 0 ? "PAID" : existing?.status || "PENDING";

    const salaryDoc: TeacherSalary = {
      salaryId,
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      month: data.month,
      salaryType: data.salaryType,
      percentage: data.percentage,
      fixedSalary: data.fixedSalary,
      bonus,
      deduction,
      collectedPayment: Number(data.collectedPayment || 0),
      calculatedSalary: finalSalary,
      paidSalary: prevPaid,
      remainingSalary: remaining,
      status,
      approvedBy: existing?.approvedBy || null,
      approvedAt: existing?.approvedAt || null,
      paidAt: existing?.paidAt || null,
      note: data.note || "",
      updatedAt: new Date().toISOString(),
    };

    const updated = [salaryDoc, ...cached.filter((s) => s.salaryId !== salaryId)];
    saveLocal(SALARIES_CACHE_KEY, updated);
    salariesMemCache = { data: updated, time: Date.now() };
    syncSystemFinanceToCloud({ teacher_salaries: updated });

    try {
      const salRef = doc(db, "teacher_salaries", salaryId);
      await setDoc(salRef, { ...salaryDoc, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err: any) {
      console.warn("Firestore salaries write warning:", err?.message);
    }

    // Keep teacher master profile rates synchronized so all future calculations & pages use this rate
    if (data.teacherId) {
      try {
        await teacherService.updateTeacher(data.teacherId, {
          salaryType: data.salaryType,
          salaryValue: typeof data.percentage === "number" ? data.percentage : undefined,
          salaryFixedAmount: typeof data.fixedSalary === "number" ? data.fixedSalary : undefined,
        });
      } catch (err: any) {
        console.warn("Update teacher profile rates error:", err?.message);
      }
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "salary_updated", salaryId } })
      );
    }

    return salaryDoc;
  },

  async deleteSalary(salaryId: string): Promise<void> {
    const localDeleted = getLocal<string>(DELETED_SALARIES_KEY);
    const updatedDeleted = Array.from(new Set([...localDeleted, salaryId]));
    saveLocal(DELETED_SALARIES_KEY, updatedDeleted);

    const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
    const updated = cached.filter((s) => s.salaryId !== salaryId);
    saveLocal(SALARIES_CACHE_KEY, updated);

    try {
      const cloud = await loadSystemFinanceFromCloud();
      const currentSalaries = Array.isArray(cloud.teacher_salaries) ? cloud.teacher_salaries : [];
      const newSalaries = currentSalaries.filter((s) => s.salaryId !== salaryId);
      const currentCloudDeleted = Array.isArray(cloud.deletedSalaryIds) ? cloud.deletedSalaryIds : [];
      const newCloudDeleted = Array.from(new Set([...currentCloudDeleted, salaryId]));

      await syncSystemFinanceToCloud({
        teacher_salaries: newSalaries,
        deletedSalaryIds: newCloudDeleted,
      });
    } catch {}

    try {
      const sRef = doc(db, "teacher_salaries", salaryId);
      await deleteDoc(sRef);
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "salary_deleted", salaryId } })
      );
    }
  },

  async getTeacherSalaries(filters?: { month?: string; teacherId?: string }): Promise<TeacherSalary[]> {
    if (salariesMemCache && Date.now() - salariesMemCache.time < 30000) {
      let list = salariesMemCache.data;
      if (filters?.month) list = list.filter((s) => s.month === filters.month);
      if (filters?.teacherId) list = list.filter((s) => s.teacherId === filters.teacherId);
      return list.sort((a, b) => b.month.localeCompare(a.month));
    }

    const cloud = await loadSystemFinanceFromCloud();
    const cloudDeleted = Array.isArray(cloud.deletedSalaryIds) ? cloud.deletedSalaryIds : [];
    const localDeleted = getLocal<string>(DELETED_SALARIES_KEY);
    const deletedSet = new Set([...cloudDeleted, ...localDeleted]);
    saveLocal(DELETED_SALARIES_KEY, Array.from(deletedSet));

    let collectionSalaries: TeacherSalary[] = [];
    try {
      const snap = await getDocs(collection(db, "teacher_salaries"));
      collectionSalaries = snap.docs.map((d) => ({ salaryId: d.id, ...d.data() } as TeacherSalary));
    } catch {}

    for (const s of collectionSalaries) {
      if (deletedSet.has(s.salaryId)) {
        deleteDoc(doc(db, "teacher_salaries", s.salaryId)).catch(() => {});
      }
    }

    const validCollection = collectionSalaries.filter((s) => !deletedSet.has(s.salaryId));
    const validCloud = (Array.isArray(cloud.teacher_salaries) ? cloud.teacher_salaries : []).filter(
      (s) => !deletedSet.has(s.salaryId)
    );

    const map = new Map<string, TeacherSalary>();
    for (const s of validCollection) map.set(s.salaryId, s);
    for (const s of validCloud) map.set(s.salaryId, s);

    if (map.size === 0 && validCollection.length === 0 && validCloud.length === 0) {
      const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
      for (const s of cached) {
        if (!deletedSet.has(s.salaryId)) map.set(s.salaryId, s);
      }
    }

    let list = Array.from(map.values());
    salariesMemCache = { data: list, time: Date.now() };
    saveLocal(SALARIES_CACHE_KEY, list);

    if (filters?.month) list = list.filter((s) => s.month === filters.month);
    if (filters?.teacherId) list = list.filter((s) => s.teacherId === filters.teacherId);

    return list.sort((a, b) => b.month.localeCompare(a.month));
  },

  async autoRecalculateMonthSalaries(month: string): Promise<TeacherSalary[]> {
    try {
      const [teachers, groups] = await Promise.all([
        teacherService.getAllTeachers().catch(() => []),
        groupService.getGroups().catch(() => []),
      ]);
      if (teachers.length > 0) {
        return await this.autoCalculateAllTeacherSalaries(month, teachers, groups);
      }
    } catch (err: any) {
      console.warn("autoRecalculateMonthSalaries error:", err?.message);
    }
    return [];
  },

  async autoCalculateAllTeacherSalaries(
    month: string,
    teachers: UserProfile[],
    groups: Group[]
  ): Promise<TeacherSalary[]> {
    const payments = await this.getPayments({ month });
    const existingSalaries = await this.getTeacherSalaries({ month });
    const existingMap = new Map<string, TeacherSalary>(
      existingSalaries.map((s) => [s.teacherId, s])
    );

    const calculatedList: TeacherSalary[] = [];

    for (const teacher of teachers) {
      if (teacher.role && teacher.role !== "teacher") continue;

      // Find teacher's groups
      const teacherGroups = groups.filter(
        (g) =>
          g.teacherId === teacher.uid ||
          (Array.isArray(teacher.groupIds) && teacher.groupIds.includes(g.groupId)) ||
          (Array.isArray(teacher.teachingGroups) &&
            teacher.teachingGroups.some((tg) => tg && tg.groupId === g.groupId))
      );
      const teacherGroupIds = new Set(teacherGroups.map((g) => g.groupId));

      // Sum ONLY actual collected payments (PAID and positive amount) for this teacher's groups or directly assigned to teacher in this month
      const collected = payments
        .filter(
          (p) =>
            (teacherGroupIds.has(p.groupId) || (p.teacherId && p.teacherId === teacher.uid)) &&
            p.status === "PAID" &&
            Number(p.amount) > 0
        )
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const existing = existingMap.get(teacher.uid);
      const sType: SalaryType =
        (teacher.salaryType as SalaryType) || existing?.salaryType || "percentage";
      const sPercentage =
        typeof teacher.salaryValue === "number" && !isNaN(teacher.salaryValue)
          ? teacher.salaryValue
          : (existing?.percentage ?? 50);
      const sFixed =
        typeof teacher.salaryFixedAmount === "number" && !isNaN(teacher.salaryFixedAmount)
          ? teacher.salaryFixedAmount
          : (teacher.salaryType === "fixed" && typeof teacher.salaryValue === "number"
              ? teacher.salaryValue
              : (existing?.fixedSalary ?? 0));
      const bonus = existing?.bonus || 0;
      const deduction = existing?.deduction || 0;

      let base = 0;
      if (sType === "percentage") {
        base = Math.round(collected * (sPercentage / 100));
      } else if (sType === "fixed") {
        base = Number(sFixed);
      } else {
        base = Math.round(Number(sFixed) + collected * (sPercentage / 100));
      }

      const calculatedSalary = Math.max(0, base + bonus - deduction);
      const prevPaid = existing?.paidSalary || 0;
      const remainingSalary = Math.max(0, calculatedSalary - prevPaid);
      const status: SalaryStatus =
        remainingSalary === 0 && calculatedSalary > 0
          ? "PAID"
          : existing?.status || "APPROVED";

      const salaryId = `sal_${teacher.uid}_${month}`;
      const salaryDoc: TeacherSalary = {
        salaryId,
        teacherId: teacher.uid,
        teacherName: teacher.displayName || "O'qituvchi",
        month,
        salaryType: sType,
        percentage: sPercentage,
        fixedSalary: sFixed,
        bonus,
        deduction,
        collectedPayment: collected,
        calculatedSalary,
        paidSalary: prevPaid,
        remainingSalary,
        status,
        approvedBy: existing?.approvedBy || "director",
        approvedAt: existing?.approvedAt || new Date().toISOString(),
        paidAt: existing?.paidAt || null,
        note: existing?.note || "",
        updatedAt: new Date().toISOString(),
      };

      calculatedList.push(salaryDoc);
    }

    // Save to local cache & cloud
    const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
    const nonMonth = cached.filter((s) => s.month !== month);
    const updatedAll = [...calculatedList, ...nonMonth];
    saveLocal(SALARIES_CACHE_KEY, updatedAll);
    salariesMemCache = { data: updatedAll, time: Date.now() };
    syncSystemFinanceToCloud({ teacher_salaries: updatedAll });

    // Persist in Firestore collection asynchronously without blocking UI
    Promise.allSettled(
      calculatedList.map((docData) => {
        const salRef = doc(db, "teacher_salaries", docData.salaryId);
        return setDoc(salRef, { ...docData, updatedAt: serverTimestamp() }, { merge: true });
      })
    ).catch(() => {});

    return calculatedList;
  },

  async updateTeacherSalaryPercentage(
    teacherId: string,
    newPercentage: number,
    month?: string,
    salaryType: SalaryType = "percentage",
    fixedSalary?: number
  ): Promise<TeacherSalary> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const numPercent = Math.max(0, Math.min(100, Number(newPercentage) || 0));

    // 1. Update teacher master profile rates
    await teacherService.updateTeacher(teacherId, {
      salaryType,
      salaryValue: numPercent,
      salaryFixedAmount: Number(fixedSalary || 0),
    });

    // 2. Fetch existing salaries for this month to preserve collectedPayment, bonus, deduction, etc.
    salariesMemCache = null;
    const existingList = await this.getTeacherSalaries({ month: targetMonth });
    const existing = existingList.find((s) => s.teacherId === teacherId);

    // Sum collected payment for teacher if not already populated
    let collected = existing?.collectedPayment || 0;
    if (!collected) {
      const [payments, groups] = await Promise.all([
        this.getPayments({ month: targetMonth }).catch(() => []),
        groupService.getGroups().catch(() => []),
      ]);
      const teacherGroups = groups.filter(
        (g) =>
          g.teacherId === teacherId ||
          (Array.isArray(g.teacherId) && (g.teacherId as any).includes(teacherId))
      );
      const teacherGroupIds = new Set(teacherGroups.map((g) => g.groupId));
      collected = payments
        .filter(
          (p) =>
            (teacherGroupIds.has(p.groupId) || p.teacherId === teacherId) &&
            p.status === "PAID" &&
            Number(p.amount) > 0
        )
        .reduce((sum, p) => sum + Number(p.amount), 0);
    }

    const t = await teacherService.getTeacherById(teacherId);

    // 3. Save updated salary
    const saved = await this.calculateAndSaveTeacherSalary({
      teacherId,
      teacherName: t?.displayName || existing?.teacherName || "O'qituvchi",
      month: targetMonth,
      salaryType: salaryType || existing?.salaryType || "percentage",
      percentage: numPercent,
      fixedSalary: Number(fixedSalary ?? existing?.fixedSalary ?? 0),
      bonus: existing?.bonus || 0,
      deduction: existing?.deduction || 0,
      collectedPayment: collected,
      note: existing?.note || "",
    });

    return saved;
  },

  async approveSalary(salaryId: string, directorUid: string): Promise<void> {
    const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
    const updated = cached.map((s) =>
      s.salaryId === salaryId
        ? {
            ...s,
            status: "APPROVED" as SalaryStatus,
            approvedBy: directorUid,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : s
    );
    saveLocal(SALARIES_CACHE_KEY, updated);
    syncSystemFinanceToCloud({ teacher_salaries: updated });

    try {
      const salRef = doc(db, "teacher_salaries", salaryId);
      await setDoc(
        salRef,
        {
          status: "APPROVED",
          approvedBy: directorUid,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}

    salariesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "salary_approved", salaryId } })
      );
    }
  },

  async paySalary(salaryId: string, amountToPay: number, note?: string): Promise<TeacherSalary> {
    const cached = getLocal<TeacherSalary>(SALARIES_CACHE_KEY);
    const sal = cached.find((s) => s.salaryId === salaryId);
    if (!sal) throw new Error("Maosh hujjati topilmadi");

    const newPaid = (sal.paidSalary || 0) + Number(amountToPay);
    const remaining = Math.max(0, sal.calculatedSalary - newPaid);
    const newStatus: SalaryStatus = remaining === 0 ? "PAID" : "APPROVED";

    const updatedSal: TeacherSalary = {
      ...sal,
      paidSalary: newPaid,
      remainingSalary: remaining,
      status: newStatus,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: note ? `${sal.note || ""} [${note}]`.trim() : sal.note,
    };

    const updated = cached.map((s) => (s.salaryId === salaryId ? updatedSal : s));
    saveLocal(SALARIES_CACHE_KEY, updated);
    syncSystemFinanceToCloud({ teacher_salaries: updated });

    try {
      const salRef = doc(db, "teacher_salaries", salaryId);
      await setDoc(
        salRef,
        {
          paidSalary: newPaid,
          remainingSalary: remaining,
          status: newStatus,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}

    // Auto-record salary payment into Expenses so center expenses reflect this cash outflow
    try {
      await this.recordExpense({
        category: "salary",
        amount: Number(amountToPay),
        date: new Date().toISOString().slice(0, 10),
        description: `${sal.teacherName} uchun ${sal.month} oylik maoshi to'lovi`,
        createdBy: "director",
        createdByName: "Direktor",
      });
    } catch {}

    salariesMemCache = null;
    expensesMemCache = null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("finance_updated", { detail: { type: "salary_paid", salaryId } })
      );
    }

    return updatedSal;
  },

  // =================== STUDENT PAYMENT & DEBT STATUS BY MONTH ===================
  async getStudentPaymentStatusByMonth(
    month: string,
    filterOption?:
      | string
      | {
          teacherId?: string;
          groupId?: string;
          subjectId?: string;
          status?: "PAID" | "PARTIAL" | "DEBT" | "all";
          searchQuery?: string;
        }
  ): Promise<{
    items: StudentPaymentStatusItem[];
    totalPaidCount: number;
    totalDebtorsCount: number;
    totalPaidAmount: number;
    totalDebtAmount: number;
  }> {
    const filters =
      typeof filterOption === "string"
        ? { teacherId: filterOption }
        : filterOption || {};

    try {
      const [payments, allGroups, allUsers, allSubjects] = await Promise.all([
        this.getPayments({ month }).catch(() => []),
        groupService.getGroups().catch(() => []),
        adminService.getAllUsers("", "all", 500).catch(() => []),
        subjectService.getSubjects().catch(() => []),
      ]);

      const groups = allGroups.filter((g) => g.status === "active" || !g.status);
      const groupMap = new Map<string, Group>(groups.map((g) => [g.groupId, g]));

      const subjectMap = new Map<string, string>();
      allSubjects.forEach((s) => subjectMap.set(s.subjectId, s.name));

      const teacherMap = new Map<string, string>();
      allUsers
        .filter((u) => u.role === "teacher")
        .forEach((t) => teacherMap.set(t.uid, t.displayName || "Ustoz"));

      const students = allUsers.filter(
        (u) => u.role === "student" || u.role === "user" || !u.role
      );
      const studentMap = new Map<string, UserProfile>(students.map((s) => [s.uid, s]));

      const items: StudentPaymentStatusItem[] = [];
      const handledKeySet = new Set<string>();

      // 1. Scan active groups and their enrolled students
      for (const group of groups) {
        const gTeacherId = group.teacherId || "";
        const gTeacherName = group.teacherName || teacherMap.get(gTeacherId) || "Ustoz";
        const gSubjectId = group.subjectId || "";
        const gSubjectName = subjectMap.get(gSubjectId) || "";
        const monthlyFee = Number(group.monthlyPrice) || 500000;

        // Students in this group
        const enrolledStudentIds = new Set<string>();
        if (Array.isArray(group.studentIds)) {
          group.studentIds.forEach((id) => enrolledStudentIds.add(id));
        }

        // Also check students who have enrolledGroups matching this group or groupIds
        students.forEach((st) => {
          const hasEnrolledGroup =
            Array.isArray(st.enrolledGroups) &&
            st.enrolledGroups.some((eg) => eg && eg.groupId === group.groupId);
          const hasGroupId =
            Array.isArray(st.groupIds) && st.groupIds.includes(group.groupId);
          if (hasEnrolledGroup || hasGroupId) {
            enrolledStudentIds.add(st.uid);
          }
        });

        for (const stId of enrolledStudentIds) {
          const student = studentMap.get(stId);
          const studentName = student?.displayName || "O'quvchi";
          const studentPhone = student?.phoneNumber || "";
          const studentLogin = student?.login || "";

          // Payments for this student and this group in this month
          const studentGroupPayments = payments.filter(
            (p) =>
              p.studentId === stId &&
              (p.groupId === group.groupId || (!p.groupId && enrolledStudentIds.size === 1)) &&
              p.status === "PAID" &&
              Number(p.amount) > 0
          );

          const paidAmount = studentGroupPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          const debtAmount = Math.max(0, monthlyFee - paidAmount);
          const status: "PAID" | "PARTIAL" | "DEBT" =
            debtAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DEBT";

          const lastPayment = studentGroupPayments[0];

          const key = `${stId}_${group.groupId}`;
          handledKeySet.add(key);

          items.push({
            studentId: stId,
            studentName,
            studentPhone,
            studentLogin,
            groupId: group.groupId,
            groupName: group.name,
            subjectId: gSubjectId,
            subjectName: gSubjectName,
            teacherId: gTeacherId,
            teacherName: gTeacherName,
            month,
            monthlyFee,
            paidAmount,
            debtAmount,
            status,
            lastPaymentDate: lastPayment?.paymentDate,
            paymentMethod: lastPayment?.paymentMethod,
            receiptNumber: lastPayment?.receiptNumber,
            paymentId: lastPayment?.paymentId,
            paymentsCount: studentGroupPayments.length,
          });
        }
      }

      // 2. Also check any payments made in this month that were not in the above groups
      for (const p of payments) {
        if (!p.studentId) continue;
        const key = `${p.studentId}_${p.groupId || "default"}`;
        if (!handledKeySet.has(key)) {
          handledKeySet.add(key);
          const student = studentMap.get(p.studentId);
          const group = p.groupId ? groupMap.get(p.groupId) : null;
          const gTeacherId = group?.teacherId || p.teacherId || "";
          const gTeacherName = group?.teacherName || p.teacherName || teacherMap.get(gTeacherId) || "Ustoz";
          const gSubjectId = group?.subjectId || p.subjectId || "";
          const gSubjectName = subjectMap.get(gSubjectId) || "";
          const paidAmt = p.status === "PAID" ? Number(p.amount || 0) : 0;
          const isDebt = p.status === "DEBT" || p.status === "PARTIAL";

          items.push({
            studentId: p.studentId,
            studentName: p.studentName || student?.displayName || "O'quvchi",
            studentPhone: student?.phoneNumber || "",
            studentLogin: student?.login || "",
            groupId: p.groupId || "",
            groupName: p.groupName || group?.name || "O'quv kursi",
            subjectId: gSubjectId,
            subjectName: gSubjectName,
            teacherId: gTeacherId,
            teacherName: gTeacherName,
            month,
            monthlyFee: Number(p.amount || 500000),
            paidAmount: paidAmt,
            debtAmount: isDebt ? Number(p.amount || 0) : Math.max(0, Number(p.amount || 500000) - paidAmt),
            status: p.status === "PAID" ? "PAID" : p.status === "PARTIAL" ? "PARTIAL" : "DEBT",
            lastPaymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            receiptNumber: p.receiptNumber,
            paymentId: p.paymentId,
            paymentsCount: 1,
          });
        }
      }

      // Filter by teacherId if requested
      let filteredItems = items;
      if (filters.teacherId && filters.teacherId !== "all") {
        filteredItems = filteredItems.filter((item) => item.teacherId === filters.teacherId);
      }

      // Filter by groupId if requested
      if (filters.groupId && filters.groupId !== "all") {
        filteredItems = filteredItems.filter((item) => item.groupId === filters.groupId);
      }

      // Filter by subjectId if requested
      if (filters.subjectId && filters.subjectId !== "all") {
        filteredItems = filteredItems.filter((item) => item.subjectId === filters.subjectId);
      }

      // Filter by status if requested
      if (filters.status && filters.status !== "all") {
        filteredItems = filteredItems.filter((item) => item.status === filters.status);
      }

      // Filter by search query if requested
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        filteredItems = filteredItems.filter(
          (item) =>
            item.studentName.toLowerCase().includes(q) ||
            (item.studentPhone && item.studentPhone.toLowerCase().includes(q)) ||
            (item.studentLogin && item.studentLogin.toLowerCase().includes(q)) ||
            item.groupName.toLowerCase().includes(q) ||
            item.teacherName.toLowerCase().includes(q) ||
            (item.subjectName && item.subjectName.toLowerCase().includes(q)) ||
            (item.receiptNumber && item.receiptNumber.toLowerCase().includes(q))
        );
      }

      const totalPaidCount = filteredItems.filter((i) => i.status === "PAID").length;
      const totalDebtorsCount = filteredItems.filter((i) => i.status === "DEBT" || i.status === "PARTIAL").length;
      const totalPaidAmount = filteredItems.reduce((sum, i) => sum + i.paidAmount, 0);
      const totalDebtAmount = filteredItems.reduce((sum, i) => sum + i.debtAmount, 0);

      return {
        items: filteredItems,
        totalPaidCount,
        totalDebtorsCount,
        totalPaidAmount,
        totalDebtAmount,
      };
    } catch (err: any) {
      console.warn("getStudentPaymentStatusByMonth error:", err?.message);
      return {
        items: [],
        totalPaidCount: 0,
        totalDebtorsCount: 0,
        totalPaidAmount: 0,
        totalDebtAmount: 0,
      };
    }
  },

  // =================== FINANCIAL SUMMARY (Boshqaruv Hisoboti) ===================
  async getFinancialSummary(selectedMonth?: string): Promise<FinancialSummary> {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = selectedMonth || currentYearMonth;

    try {
      // Auto-recalculate salaries softly in background without holding up immediate summary
      this.autoRecalculateMonthSalaries(month).catch(() => {});

      const [payments, expenses, salaries, studentDebtStats] = await Promise.all([
        this.getPayments().catch(() => []),
        this.getExpenses().catch(() => []),
        this.getTeacherSalaries().catch(() => []),
        this.getStudentPaymentStatusByMonth(month).catch(() => ({
          items: [],
          totalPaidCount: 0,
          totalDebtorsCount: 0,
          totalPaidAmount: 0,
          totalDebtAmount: 0,
        })),
      ]);

      // Current month payments - ONLY collected payments (status === "PAID" and amount > 0)
      const monthPayments = payments.filter((p) => {
        const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
        return pMonth === month && p.status === "PAID" && Number(p.amount) > 0;
      });

      // Current month operational expenses (excluding category "salary" to prevent double deduction)
      const monthExpenses = expenses.filter((e) => e.date?.startsWith(month));
      const operationalExpenses = monthExpenses
        .filter((e) => e.category !== "salary")
        .reduce((acc, e) => acc + Number(e.amount), 0);

      // Current month salaries (strictly for this month)
      const monthSalaries = salaries.filter((s) => s.month === month);
      const totalSalariesCalculated = monthSalaries.reduce((acc, s) => acc + (s.calculatedSalary || 0), 0);
      const totalSalariesPaid = monthSalaries.reduce((acc, s) => acc + (s.paidSalary || 0), 0);
      const totalSalariesRemaining = monthSalaries.reduce((acc, s) => acc + (s.remainingSalary || 0), 0);

      const totalRevenue = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const totalExpenses = operationalExpenses;
      // Net cash income for selected month = Revenue - (Operational Expenses + Actual Salaries Paid)
      const netIncome = totalRevenue - (totalExpenses + totalSalariesPaid);

      // Selected month strictly isolated treasury balance = Net cash balance for that month!
      const totalTreasuryBalance = netIncome;

      // All-time totals for reference
      const allTimeRevenue = payments
        .filter((p) => p.status === "PAID" && Number(p.amount) > 0)
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const allTimeOperationalExpenses = expenses
        .filter((e) => e.category !== "salary")
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const allTimeSalariesPaid = salaries.reduce((sum, s) => sum + (s.paidSalary || 0), 0);
      const allTimeExpenses = allTimeOperationalExpenses + allTimeSalariesPaid;

      // Expenses by category for selected month
      const expensesByCategory: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        const cat = e.category || "other";
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(e.amount);
      });

      // Debtors: strictly for the selected month!
      const totalDebtsAmount = studentDebtStats.totalDebtAmount;
      const debtorsCount = studentDebtStats.totalDebtorsCount;

      // Monthly history (last 6 months) using local calendar to prevent UTC day rollback
      const monthlyRevenueHistory: { month: string; amount: number }[] = [];
      const monthlyExpenseHistory: { month: string; amount: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const pastDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, "0")}`;
        const rev = payments
          .filter((p) => {
            const pMonth = p.month ? p.month.slice(0, 7) : p.paymentDate?.slice(0, 7);
            return pMonth === mStr && p.status === "PAID" && Number(p.amount) > 0;
          })
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const exp = expenses
          .filter((e) => e.date?.startsWith(mStr) && e.category !== "salary")
          .reduce((sum, e) => sum + Number(e.amount), 0);

        monthlyRevenueHistory.push({ month: mStr, amount: rev });
        monthlyExpenseHistory.push({ month: mStr, amount: exp });
      }

      return {
        totalRevenue,
        totalExpenses,
        totalSalaries: totalSalariesCalculated,
        totalSalariesPaid,
        totalSalariesRemaining,
        netIncome,
        totalDebtsAmount,
        debtorsCount,
        monthlyRevenueHistory,
        monthlyExpenseHistory,
        totalTreasuryBalance,
        allTimeRevenue,
        allTimeExpenses,
        allTimeSalariesPaid,
        expensesByCategory,
      };
    } catch (err: any) {
      console.warn("getFinancialSummary error:", err?.message);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalSalaries: 0,
        totalSalariesPaid: 0,
        totalSalariesRemaining: 0,
        netIncome: 0,
        totalDebtsAmount: 0,
        debtorsCount: 0,
        monthlyRevenueHistory: [],
        monthlyExpenseHistory: [],
        totalTreasuryBalance: 0,
        allTimeRevenue: 0,
        allTimeExpenses: 0,
        allTimeSalariesPaid: 0,
        expensesByCategory: {},
      };
    }
  },
};
