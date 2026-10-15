import React, { useEffect, useState } from "react";
import { Trophy, RefreshCw, CheckCircle2, Users, Crown, Medal } from "lucide-react";
import { leaderboardService } from "../../services/leaderboardService";
import { groupService } from "../../services/groupService";
import { useToast } from "../../context/ToastContext";
import { Group, LeaderboardRankingEntry } from "../../types";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { formatCoins } from "../../utils";
import { CoinBadge } from "../../components/common/CoinBadge";

export const AdminLeaderboardPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Groups and Coins State
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupLeaderboard, setGroupLeaderboard] = useState<LeaderboardRankingEntry[]>([]);
  const [totalGroupCoins, setTotalGroupCoins] = useState(0);
  const [groupsComparison, setGroupsComparison] = useState<any[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [viewMode, setViewMode] = useState<"comparison" | "group">("comparison");

  const loadGroupsData = async () => {
    try {
      const [grps, comparison] = await Promise.all([
        groupService.getGroups("active").catch(() => []),
        leaderboardService.getGroupsCoinsComparisonLeaderboard().catch(() => []),
      ]);
      setGroups(grps);
      setGroupsComparison(comparison);
      if (grps.length > 0 && !selectedGroupId) {
        setSelectedGroupId(grps[0].groupId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGroupsData();
  }, []);

  useEffect(() => {
    if (viewMode === "group" && selectedGroupId) {
      const fetchGroup = async () => {
        setLoadingGroup(true);
        try {
          const res = await leaderboardService.getGroupCoinsLeaderboard(selectedGroupId);
          setGroupLeaderboard(res.rankings || []);
          setTotalGroupCoins(res.totalGroupCoins || 0);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingGroup(false);
        }
      };
      fetchGroup();
    }
  }, [viewMode, selectedGroupId]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await leaderboardService.recalculateLeaderboards();
      await loadGroupsData();
      success("Barcha yetakchilar jadvali muvaffaqiyatli qayta hisoblandi!");
    } catch (err: any) {
      toastError(err.message || "Hisoblashda xatolik");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Reyting va Liderboard Boshqaruvi</h2>
          <p className="text-xs text-slate-400 mt-1">
            Foydalanuvchilar va guruhlarning to'g'ri javoblar, testlar soni va tillolar balansi bo'yicha reytingi
          </p>
        </div>

        <Button
          size="sm"
          isLoading={isRecalculating}
          onClick={handleRecalculate}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Reytingni Qayta Hisoblash
        </Button>
      </div>

      {/* Guruhlar Tillolar Liderboardi Bo'limi */}
      <Card className="p-6 bg-slate-900 border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Guruhlar Tillo Liderboardi</h3>
              <p className="text-xs text-slate-400">Har bir guruhning tillo tangalari bo'yicha o'quvchilar reytingi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => setViewMode("comparison")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "comparison"
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Guruhlar musobaqasi
              </button>
              <button
                onClick={() => setViewMode("group")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "group"
                    ? "bg-amber-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Guruh a'zolari
              </button>
            </div>

            {viewMode === "group" && (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-white font-bold px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                {groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* View Mode: Guruhlar musobaqasi */}
        {viewMode === "comparison" ? (
          <div className="space-y-3">
            {groupsComparison.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">Guruhlar ma'lumotlari topilmadi</div>
            ) : (
              groupsComparison.map((grp) => {
                const isTop1 = grp.rank === 1;
                return (
                  <div
                    key={grp.groupId}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isTop1
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-slate-800/60 border-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          isTop1
                            ? "bg-amber-500 text-slate-950"
                            : grp.rank === 2
                            ? "bg-slate-300 text-slate-900"
                            : grp.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {grp.rank}
                      </div>
                      <div>
                        <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                          {grp.groupName}
                          {isTop1 && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {grp.teacherName} • {grp.studentsCount} ta o'quvchi • o'rtacha {grp.averageCoins} tillo
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-amber-400 block">
                        {formatCoins(grp.totalCoins)} 🪙
                      </span>
                      <span className="text-[10px] text-slate-500">Jami tillolar</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* View Mode: Tanlangan guruh o'quvchilari */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>O'quvchilar: {groupLeaderboard.length} nafar</span>
              <span className="text-amber-400 font-bold">Jami: {totalGroupCoins} Tillo</span>
            </div>

            {loadingGroup ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" className="text-amber-500" />
              </div>
            ) : groupLeaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-800/40 rounded-xl">
                Ushbu guruhda o'quvchilar mavjud emas
              </div>
            ) : (
              groupLeaderboard.map((st, idx) => (
                <div
                  key={st.userId || idx}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? "bg-amber-500 text-slate-950 font-black"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="font-bold text-white">{st.displayName}</h5>
                      <span className="text-[11px] text-slate-400">{st.testsCompleted} ta test yakunlagan</span>
                    </div>
                  </div>

                  <CoinBadge amount={st.coinBalance || 0} size="sm" />
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
