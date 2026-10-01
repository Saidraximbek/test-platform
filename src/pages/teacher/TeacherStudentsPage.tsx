import React, { useEffect, useState } from "react";
import {
  UserCheck,
  Search,
  Filter,
  GraduationCap,
  Award,
  Phone,
  Clock,
  BookOpen,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { groupService } from "../../services/groupService";
import { Group, UserProfile } from "../../types";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { CoinBadge } from "../../components/common/CoinBadge";

export const TeacherStudentsPage: React.FC = () => {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<{ student: UserProfile; groupName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const gList = await groupService.getTeacherGroups(user.uid).catch(() => []);
        setGroups(gList);

        const list: { student: UserProfile; groupName: string }[] = [];
        const seenStudentIds = new Set<string>();

        for (const g of gList) {
          try {
            const stList = await groupService.getGroupStudents(g.groupId);
            stList.forEach((st) => {
              if (!seenStudentIds.has(st.uid)) {
                list.push({ student: st, groupName: g.name });
                seenStudentIds.add(st.uid);
              }
            });
          } catch (e) {
            console.warn("Error fetching students for group", g.groupId, e);
          }
        }

        // Direct query fallback: find any students explicitly assigned to teacherId in Firestore
        try {
          const qDirect = query(collection(db, "users"), where("teacherId", "==", user.uid));
          const snapDirect = await getDocs(qDirect);
          snapDirect.docs.forEach((d) => {
            const st = d.data() as UserProfile;
            const uid = st.uid || d.id;
            if (!seenStudentIds.has(uid) && st.role !== "teacher" && st.role !== "admin" && st.role !== "director") {
              const matchedGroup = st.enrolledGroups?.find((eg) => eg.teacherId === user.uid || gList.some((g) => g.groupId === eg.groupId));
              const groupName = matchedGroup?.name || (gList.length > 0 ? gList[0].name : "Biriktirilgan o'quvchi");
              list.push({ student: { ...st, uid }, groupName });
              seenStudentIds.add(uid);
            }
          });
        } catch (e) {}

        setStudents(list);
      } catch (err: any) {
        toastError(err.message || "O'quvchilarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const filtered = students.filter(({ student, groupName }) => {
    const matchSearch =
      student.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phoneNumber?.includes(searchQuery);
    const matchGroup = selectedGroupFilter === "all" || groupName === selectedGroupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UserCheck className="w-7 h-7 text-sky-400" />
          <h1 className="text-2xl font-black tracking-tight text-white">O'quvchilarim</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Sizning guruhlaringizda tahsil olayotgan o'quvchilar ro'yxati va umumiy ko'rsatkichlari
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="O'quvchi ismi yoki telefon raqami bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">Barcha guruhlarim</option>
            {groups.map((g) => (
              <option key={g.groupId} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Students Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-sky-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
          <UserCheck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">O'quvchilar mavjud emas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Hozircha guruhlaringizda o'quvchilar ro'yxatdan o'tmagan.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ student, groupName }) => (
            <Card
              key={`${student.uid}_${groupName}`}
              className="p-4 bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    {student.photoURL ? (
                      <img
                        src={student.photoURL}
                        alt=""
                        className="w-10 h-10 rounded-2xl object-cover border border-sky-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                        {student.displayName?.charAt(0) || "S"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-white">{student.displayName}</h4>
                      <p className="text-[11px] text-slate-400">
                        {student.phoneNumber || "Telefon yo'q"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {groupName}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 mb-3">
                  <p>
                    Ta'lim joyi:{" "}
                    <span className="text-slate-200">
                      {student.educationPlace || student.school || "Kiritilmagan"}
                    </span>
                  </p>
                  <p>
                    Yoshi: <span className="text-slate-200">{student.age || 16} yoshda</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Tillo Tangasi:</span>
                <CoinBadge amount={student.coinBalance || 0} size="sm" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
