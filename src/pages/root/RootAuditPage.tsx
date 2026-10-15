import React, { useEffect, useState } from "react";
import {
  History,
  Shield,
  Filter,
  RefreshCw,
  Search,
  Lock,
  Terminal,
} from "lucide-react";
import { rootService, RootAuditLogItem } from "../../services/rootService";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";

export const RootAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<RootAuditLogItem[]>([]);
  const [filterAction, setFilterAction] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await rootService.getAuditLogs(100);
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction !== "all" && !l.action.includes(filterAction)) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchAction = l.action.toLowerCase().includes(s);
      const matchBy = l.performedBy.toLowerCase().includes(s);
      const matchNotes = l.notes?.toLowerCase().includes(s);
      if (!matchAction && !matchBy && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            Himoyalangan Audit Jurnali
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ushbu jurnal faqat Root Owner ga ochiq bo'lib, direktorlar yoki adminlar ko'ra olmaydi va o'chira olmaydi
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchLogs(true)}
          isLoading={refreshing}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          className="bg-purple-950/40 border-purple-500/30 text-purple-200"
        >
          Yangilash
        </Button>
      </div>

      {/* Filter and Search */}
      <Card className="bg-[#0B0F1F]/90 border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Audit yozuvlarini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">Barcha amallar</option>
          <option value="PROVISION">Akkaunt yaratilishi</option>
          <option value="ROLE">Rol o'zgarishi</option>
          <option value="USER">Foydalanuvchi holati</option>
          <option value="PASSWORD">Parol o'zgarishi</option>
          <option value="SETTINGS">Sozlamalar</option>
        </select>
      </Card>

      {/* Logs List */}
      <Card className="bg-[#0B0F1F]/90 border-purple-500/20 rounded-2xl overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Spinner size="lg" className="text-purple-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Audit yozuvlari topilmadi.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={idx} className="p-4 hover:bg-slate-900/40 transition space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
                    {log.action}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-slate-300 font-semibold">{log.performedBy}</span>
                  {log.targetUid && (
                    <span className="text-[11px] font-mono text-slate-500">
                      (Target: {log.targetUid.slice(0, 10)}...)
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatDate(log.timestamp)}
                </span>
              </div>

              {log.notes && (
                <p className="text-xs text-slate-300 pl-1">{log.notes}</p>
              )}

              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-purple-300 overflow-x-auto">
                  <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
