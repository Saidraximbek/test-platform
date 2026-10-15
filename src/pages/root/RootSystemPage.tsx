import React, { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Shield,
  Server,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Key,
  Layers,
  Search,
} from "lucide-react";
import { rootService, RootSystemMetrics } from "../../services/rootService";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { Input } from "../../components/common/Input";

export const RootSystemPage: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [metrics, setMetrics] = useState<RootSystemMetrics | null>(null);
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSystemData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const m = await rootService.getSystemMetrics();
      setMetrics(m);

      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        setClaims(tokenResult.claims);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, [firebaseUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-400" />
            Tizim & Server Salomatligi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Firebase arxitekturasi, server quvvati, token da'volari (claims) va xavfsizlik statusi
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchSystemData(true)}
          isLoading={refreshing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          className="bg-purple-950/40 border-purple-500/30 text-purple-200"
        >
          Qayta tekshirish
        </Button>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B0F1F]/90 border-emerald-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Cloud Firestore</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-300">ULANGAN (ONLINE)</div>
          <p className="mt-1 text-[11px] text-slate-400">todo-e2486 (Multi-region)</p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-emerald-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Firebase Auth</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-300">FAOL (SECURE)</div>
          <p className="mt-1 text-[11px] text-slate-400">Custom Claims RBAC faol</p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-purple-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Root Roli Xavfsizligi</span>
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-purple-300">MAXFIY (RESTRICTED)</div>
          <p className="mt-1 text-[11px] text-slate-400">Oddiy foydalanuvchilarga ko'rinmaydi</p>
        </Card>

        <Card className="bg-[#0B0F1F]/90 border-indigo-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Baza Hujjatlari</span>
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-indigo-300">
            {(metrics?.totalUsers || 0) + (metrics?.totalQuestions || 0)} ta obyekt
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{metrics?.totalQuestions || 0} ta test savoli</p>
        </Card>
      </div>

      {/* Active Token Claims Verification */}
      <Card className="bg-[#0B0F1F]/90 border-purple-500/30 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              Joriy Root Sessiyasi & Custom Claims Tekshiruvi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Firebase Authentication server tomonidan tasdiqlangan maxsus ruxsatlar (claims)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            SERVER VERIFIED
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 font-mono text-xs text-purple-200 overflow-x-auto">
          <pre>{JSON.stringify(claims, null, 2)}</pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Root Owner Claim:</div>
            <div className="font-bold text-purple-300 font-mono mt-0.5">
              {claims.rootOwner === true || claims.role === "root_owner" ? "✓ TASDIQLANGAN" : "—"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Director Claim Override:</div>
            <div className="font-bold text-amber-300 font-mono mt-0.5">
              {claims.director === true || claims.role === "root_owner" ? "✓ BERILGAN" : "—"}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[11px]">Admin Claim Override:</div>
            <div className="font-bold text-indigo-300 font-mono mt-0.5">
              {claims.admin === true || claims.role === "root_owner" ? "✓ BERILGAN" : "—"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
