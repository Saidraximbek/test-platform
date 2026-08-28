import React, { useEffect, useState } from "react";
import { ShieldAlert, Filter, Clock } from "lucide-react";
import { adminService } from "../../services/adminService";
import { AuditLogItem } from "../../types";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { formatDate } from "../../utils";

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const list = await adminService.getAuditLogs(actionFilter, 100);
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Jurnali (Audit Logs)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Barcha administratorlik amallari, tangalar o'zgarishi va xavfsizlik hodisalari
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300"
        >
          <option value="all">Barcha amallar</option>
          <option value="COIN_ADJUST">COIN_ADJUST</option>
          <option value="USER_BLOCK">USER_BLOCK</option>
          <option value="USER_SUSPEND">USER_SUSPEND</option>
          <option value="QUESTION_APPROVE">QUESTION_APPROVE</option>
          <option value="SETTINGS_CHANGE">SETTINGS_CHANGE</option>
          <option value="ORDER_STATUS">ORDER_STATUS</option>
        </select>
      </div>

      <Card className="bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" className="text-brand-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Jurnalda yozuvlar topilmadi
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.logId} className="p-4 sm:p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-brand-400 uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                    {log.action}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {log.targetCollection}/{log.targetDocumentId}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(log.createdAt)}
                </span>
              </div>

              <p className="text-slate-400">
                Admin UID: <strong className="text-slate-200 font-mono">{log.adminUid}</strong>
              </p>

              {log.changes && (
                <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto font-mono">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
