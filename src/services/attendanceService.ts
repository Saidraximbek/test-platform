import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { AttendanceRecord, AttendanceStatus } from "../types";

export interface StudentAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

const attendanceStatsCache = new Map<string, { data: StudentAttendanceSummary; time: number }>();

export const attendanceService = {
  async getAttendance(groupId: string, date: string): Promise<AttendanceRecord | null> {
    const attendanceId = `${groupId}_${date}`;
    const snap = await getDoc(doc(db, "attendance", attendanceId));
    if (!snap.exists()) return null;
    return snap.data() as AttendanceRecord;
  },

  async saveAttendance(params: {
    groupId: string;
    lessonId?: string;
    teacherId: string;
    date: string;
    records: Record<string, AttendanceStatus>;
  }): Promise<AttendanceRecord> {
    const attendanceId = `${params.groupId}_${params.date}`;
    const attRef = doc(db, "attendance", attendanceId);

    const data: AttendanceRecord = {
      attendanceId,
      groupId: params.groupId,
      lessonId: params.lessonId || "",
      teacherId: params.teacherId,
      date: params.date,
      records: params.records,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(attRef, data, { merge: true });
    return data;
  },

  async getGroupAttendanceHistory(groupId: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, "attendance"), where("groupId", "==", groupId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as AttendanceRecord);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async getStudentAttendanceStats(studentId: string, groupIds?: string[]): Promise<StudentAttendanceSummary> {
    const cacheKey = `att_stats_${studentId}`;
    const cached = attendanceStatsCache.get(cacheKey);
    if (cached && Date.now() - cached.time < 60000) {
      return cached.data;
    }

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      const emptyResult: StudentAttendanceSummary = { total: 0, present: 0, absent: 0, late: 0, percentage: 100 };
      attendanceStatsCache.set(cacheKey, { data: emptyResult, time: Date.now() });
      return emptyResult;
    }

    let records: AttendanceRecord[] = [];
    if (groupIds.length <= 30) {
      try {
        const q = query(collection(db, "attendance"), where("groupId", "in", groupIds));
        const snap = await getDocs(q);
        records = snap.docs.map((d) => d.data() as AttendanceRecord);
      } catch {
        records = [];
      }
    } else {
      try {
        const chunks = [];
        for (let i = 0; i < groupIds.length; i += 30) {
          const chunk = groupIds.slice(i, i + 30);
          chunks.push(getDocs(query(collection(db, "attendance"), where("groupId", "in", chunk))));
        }
        const snaps = await Promise.all(chunks);
        records = snaps.flatMap((s) => s.docs.map((d) => d.data() as AttendanceRecord));
      } catch {
        records = [];
      }
    }

    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    records.forEach((att) => {
      if (att.records && att.records[studentId]) {
        total++;
        const status = att.records[studentId];
        if (status === "present") present++;
        else if (status === "absent") absent++;
        else if (status === "late") late++;
      }
    });

    const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;
    const result: StudentAttendanceSummary = { total, present, absent, late, percentage };
    attendanceStatsCache.set(cacheKey, { data: result, time: Date.now() });
    return result;
  },
};
