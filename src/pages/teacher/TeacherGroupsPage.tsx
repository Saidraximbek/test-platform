import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  ClipboardList,
  UserCheck,
  ChevronRight,
  Eye,
  GraduationCap,
  Sparkles,
  Trophy,
  Crown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { leaderboardService } from "../../services/leaderboardService";
import { Group, UserProfile } from "../../types";
import { Button } from "../../components/common/Button";
import { Card } from "../../components/common/Card";
import { Modal } from "../../components/common/Modal";
import { Spinner } from "../../components/common/Spinner";
import { CoinBadge } from "../../components/common/CoinBadge";

export const TeacherGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Roster Modal
  const [selectedGroupForRoster, setSelectedGroupForRoster] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<UserProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Group Coins Leaderboard Modal State
  const [selectedGroupForLeaderboard, setSelectedGroupForLeaderboard] = useState<Group | null>(null);
  const [groupCoinsLeaderboard, setGroupCoinsLeaderboard] = useState<any[]>([]);
  const [totalGroupCoins, setTotalGroupCoins] = useState<number>(0);
  const [loadingGroupLeaderboard, setLoadingGroupLeaderboard] = useState(false);

  const openGroupCoinsLeaderboard = async (grp: Group) => {
    setSelectedGroupForLeaderboard(grp);
    try {
      setLoadingGroupLeaderboard(true);
      const res = await leaderboardService.getGroupCoinsLeaderboard(grp.groupId);
      setGroupCoinsLeaderboard(res.rankings || []);
      setTotalGroupCoins(res.totalGroupCoins || 0);
    } catch (err: any) {
      toastError(err.message || "Guruh reytingini yuklab bo'lmadi");
    } finally {
      setLoadingGroupLeaderboard(false);
    }
  };

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const gList = await groupService.getTeacherGroups(user.uid);
      setGroups(gList);
    } catch (err: any) {
      toastError(err.message || "Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const openStudentRoster = async (grp: Group) => {
    setSelectedGroupForRoster(grp);
    try {
      setLoadingStudents(true);
      const students = await groupService.getGroupStudents(grp.groupId);
      setGroupStudents(students);
    } catch (err: any) {
      toastError(err.message || "Guruh o'quvchilarini yuklab bo'lmadi");
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.room && g.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.schedule && g.schedule.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalStudentsCount = groups.reduce(
    (acc, g) => acc + (g.studentIds?.length || g.currentStudentsCount || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-400" />
            <h1 className="text-2xl font-black tracking-tight text-white">Guruhlarim</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sizga biriktirilgan o'quv guruhlari, dars jadvallari va o'quvchilar tarkibi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/teacher/attendance">
            <Button variant="secondary" size="sm" leftIcon={<ClipboardList className="w-4 h-4" />}>
              Davomat Olish
            </Button>
          </Link>
          <Link to="/teacher/lessons">
            <Button size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
              Dars Rejalari
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Jami Guruhlar</span>
            <span className="text-2xl font-black text-white">{groups.length} ta</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Jami O'quvchilar</span>
            <span className="text-2xl font-black text-white">{totalStudentsCount} nafar</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">O'rtacha Guruh Hajmi</span>
            <span className="text-2xl font-black text-white">
              {groups.length > 0 ? Math.round(totalStudentsCount / groups.length) : 0} nafar
            </span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Guruh nomi, xona yoki dars kunlari bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol guruhlar</option>
            <option value="archived">Arxivlangan</option>
          </select>
        </div>
      </Card>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-slate-300">Guruhlar topilmadi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {groups.length === 0
              ? "Sizga hali o'quv guruhlari biriktirilmagan. Administrator bilan bog'laning."
              : "Qidiruvingiz bo'yicha guruhlar mavjud emas."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((grp) => {
            const studentCount = grp.studentIds?.length || grp.currentStudentsCount || 0;
            const max = grp.maxStudents || 20;
            const fillPercent = Math.min(100, Math.round((studentCount / max) * 100));

            return (
              <Card
                key={grp.groupId}
                className="p-5 bg-slate-900/80 border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        Faol Guruh
                      </span>
                      <h3 className="font-bold text-base text-white mt-1.5">{grp.name}</h3>
                    </div>
                    {grp.room && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                        <MapPin className="w-3 h-3 text-amber-400" /> {grp.room}
                      </span>
                    )}
                  </div>

                  {/* Schedule & Time */}
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{grp.schedule || "Dushanba, Chorshanba, Juma"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>
                        {grp.startTime || "14:00"} {grp.endTime ? `- ${grp.endTime}` : ""} ({grp.lessonDuration || 80} daqiqa)
                      </span>
                    </div>
                  </div>

                  {/* Students fill bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>O'quvchilar soni</span>
                      <span className="font-bold text-white">
                        {studentCount} / {max}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openStudentRoster(grp)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      O'quvchilar
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openGroupCoinsLeaderboard(grp)}
                      leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      title="Guruh o'quvchilarining tillolar bo'yicha reytingi (Liderboard)"
                    >
                      Tillo Reytingi
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link to={`/teacher/attendance?groupId=${grp.groupId}`}>
                      <Button variant="secondary" size="sm" className="text-xs" title="Davomat">
                        Davomat
                      </Button>
                    </Link>
                    <Link to={`/teacher/lessons?groupId=${grp.groupId}`}>
                      <Button size="sm" className="text-xs" title="Darslar">
                        Darslar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Student Roster */}
      <Modal
        isOpen={!!selectedGroupForRoster}
        onClose={() => setSelectedGroupForRoster(null)}
        title={selectedGroupForRoster ? `${selectedGroupForRoster.name} - O'quvchilar Ro'yxati` : ""}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Jami: {groupStudents.length} ta o'quvchi</span>
            <span>Xona: {selectedGroupForRoster?.room || "101"}</span>
          </div>

          {loadingStudents ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" className="text-sky-500" />
            </div>
          ) : groupStudents.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs text-slate-400">
              Ushbu guruhga hali o'quvchilar kiritilmagan
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {groupStudents.map((st, idx) => (
                <div
                  key={st.uid || idx}
                  className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                      {st.displayName ? st.displayName.charAt(0).toUpperCase() : idx + 1}
                    </div>
                    <div>
                      <h5 className="font-bold text-white">{st.displayName || "O'quvchi"}</h5>
                      <span className="text-[11px] text-slate-400">{st.phoneNumber || st.email || "Aloqa mavjud emas"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CoinBadge amount={st.coinBalance || 0} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedGroupForRoster(null)}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Group Coins Leaderboard */}
      <Modal
        isOpen={Boolean(selectedGroupForLeaderboard)}
        onClose={() => setSelectedGroupForLeaderboard(null)}
        title={selectedGroupForLeaderboard ? `🏆 ${selectedGroupForLeaderboard.name} - Tillo Liderboardi` : ""}
        maxWidth="lg"
      >
        {selectedGroupForLeaderboard && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            <div className="p-3 bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-800 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-300">
                O'quvchilar soni: <strong className="text-white">{groupCoinsLeaderboard.length} nafar</strong>
              </span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                Jami: <strong className="text-amber-400 text-sm font-black">{totalGroupCoins}</strong> Tillo
              </span>
            </div>

            {loadingGroupLeaderboard ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" className="text-amber-500" />
              </div>
            ) : groupCoinsLeaderboard.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl text-xs text-slate-400">
                Ushbu guruhda hali o'quvchilar mavjud emas
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top 3 Podium (agar kamida 2 ta o'quvchi bo'lsa) */}
                {groupCoinsLeaderboard.length >= 2 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Rank 2 (Silver) */}
                    <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-center flex flex-col items-center justify-end translate-y-2">
                      <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-black text-[10px] flex items-center justify-center mb-1">
                        2
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-full">
                        {groupCoinsLeaderboard[1]?.displayName}
                      </span>
                      <span className="text-xs font-black text-amber-400 mt-0.5">
                        {groupCoinsLeaderboard[1]?.coinBalance} 🪙
                      </span>
                    </div>

                    {/* Rank 1 (Gold) */}
                    <div className="p-3 rounded-xl bg-amber-500/15 border-2 border-amber-400/60 text-center flex flex-col items-center justify-end shadow-md shadow-amber-500/10">
                      <Crown className="w-4 h-4 text-amber-400 mb-0.5 animate-bounce" />
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center mb-1">
                        1
                      </div>
                      <span className="text-xs font-extrabold text-white truncate max-w-full">
                        {groupCoinsLeaderboard[0]?.displayName}
                      </span>
                      <span className="text-sm font-black text-amber-400 mt-0.5">
                        {groupCoinsLeaderboard[0]?.coinBalance} 🪙
                      </span>
                    </div>

                    {/* Rank 3 (Bronze) */}
                    <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-center flex flex-col items-center justify-end translate-y-3">
                      <div className="w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center mb-1">
                        3
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-full">
                        {groupCoinsLeaderboard[2]?.displayName || "-"}
                      </span>
                      <span className="text-xs font-black text-amber-400 mt-0.5">
                        {groupCoinsLeaderboard[2] ? `${groupCoinsLeaderboard[2].coinBalance} 🪙` : "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* To'liq ro'yxat */}
                <div className="space-y-2 pt-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Guruh O'quvchilari Reytingi
                  </h5>
                  {groupCoinsLeaderboard.map((st, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <div
                        key={st.userId || idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          isTop1
                            ? "bg-amber-500/10 border-amber-500/40"
                            : isTop2
                            ? "bg-slate-800/80 border-slate-700"
                            : isTop3
                            ? "bg-amber-950/20 border-amber-900/40"
                            : "bg-slate-900/60 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isTop1
                                ? "bg-amber-500 text-slate-950"
                                : isTop2
                                ? "bg-slate-300 text-slate-900"
                                : isTop3
                                ? "bg-amber-700 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <h6 className="font-bold text-white">{st.displayName || "O'quvchi"}</h6>
                            <span className="text-[11px] text-slate-400">
                              {st.testsCompleted} ta test topshirgan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CoinBadge amount={st.coinBalance || 0} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedGroupForLeaderboard(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
