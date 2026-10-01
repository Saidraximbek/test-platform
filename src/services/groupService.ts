import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc,
  limit,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Group, GroupStatus, UserProfile } from "../types";

const GROUPS_CACHE_KEY = "fm_groups_cache";
const DELETED_GROUPS_KEY = "fm_deleted_groups";

export function getDeletedGroupIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_GROUPS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markGroupAsDeleted(groupId: string): void {
  try {
    const set = getDeletedGroupIds();
    set.add(groupId);
    localStorage.setItem(DELETED_GROUPS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function getLocalGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_CACHE_KEY);
    const list: Group[] = raw ? JSON.parse(raw) : [];
    const deletedIds = getDeletedGroupIds();
    return list.filter((g) => g && g.groupId && !deletedIds.has(g.groupId));
  } catch {
    return [];
  }
}

let memGroupsCache: { data: Group[]; time: number } | null = null;
const studentGroupsMemCache = new Map<string, { data: Group[]; time: number }>();
const teacherGroupsMemCache = new Map<string, { data: Group[]; time: number }>();

export function invalidateGroupsCache(): void {
  memGroupsCache = null;
  studentGroupsMemCache.clear();
  teacherGroupsMemCache.clear();
}

function saveLocalGroups(groups: Group[]): void {
  try {
    const deletedIds = getDeletedGroupIds();
    const clean = groups.filter((g) => g && g.groupId && !deletedIds.has(g.groupId));
    localStorage.setItem(GROUPS_CACHE_KEY, JSON.stringify(clean));
  } catch {}
}

export const groupService = {
  getDeletedGroupIds,
  invalidateGroupsCache,

  async getGroups(statusFilter?: GroupStatus): Promise<Group[]> {
    if (memGroupsCache && Date.now() - memGroupsCache.time < 30000) {
      if (statusFilter) {
        return memGroupsCache.data.filter((g) => g.status === statusFilter || (!g.status && statusFilter === "active"));
      }
      return memGroupsCache.data;
    }

    const groupsMap = new Map<string, Group>();
    const deletedIds = getDeletedGroupIds();

    // 1. Try fetching from Firestore collection "groups"
    try {
      const groupsRef = collection(db, "groups");
      const snap = await getDocs(groupsRef);
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data && d.id && !deletedIds.has(d.id)) {
          groupsMap.set(d.id, {
            groupId: data.groupId || d.id,
            ...data,
          } as Group);
        }
      });
    } catch (err: any) {
      // Handled via users scan fallback
    }

    // 2. Fetch all user documents to discover groups ONLY if groups collection was empty
    const userDocs: UserProfile[] = [];
    if (groupsMap.size === 0) {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.docs.forEach((d) => {
          const u = d.data() as UserProfile;
          userDocs.push({ ...u, uid: u.uid || d.id });
        });
      } catch (err: any) {
        console.warn("Firestore groups scan users warning:", err?.message);
      }
    }

    // Pass 1: Discover all groups from teacher teachingGroups and student enrolledGroups
    userDocs.forEach((u) => {
      const uid = u.uid;

      // Teaching groups from teachers/admins/directors
      if (Array.isArray(u.teachingGroups)) {
        u.teachingGroups.forEach((tg) => {
          if (tg && tg.groupId && !deletedIds.has(tg.groupId)) {
            if (!groupsMap.has(tg.groupId)) {
              groupsMap.set(tg.groupId, {
                groupId: tg.groupId,
                name: tg.name || "Guruh",
                subjectId: tg.subjectId || "",
                teacherId: tg.teacherId || uid,
                teacherName: tg.teacherName || u.displayName || "",
                room: tg.room || "101-xona",
                schedule: tg.schedule || "Dushanba, Chorshanba, Juma",
                startTime: tg.startTime || "14:00",
                endTime: tg.endTime || "15:20",
                lessonDuration: tg.lessonDuration || 80,
                monthlyPrice: tg.monthlyPrice || 450000,
                maxStudents: 20,
                currentStudentsCount: 0,
                studentIds: [],
                status: "active",
                createdAt: tg.enrolledAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            } else {
              const ex = groupsMap.get(tg.groupId)!;
              if (!ex.teacherName && u.displayName) ex.teacherName = u.displayName;
              if (!ex.teacherId && uid) ex.teacherId = uid;
              if (!ex.name && tg.name) ex.name = tg.name;
            }
          }
        });
      }

      // Enrolled groups from students
      if (u.role !== "teacher" && u.role !== "admin" && u.role !== "director") {
        if (Array.isArray(u.enrolledGroups)) {
          u.enrolledGroups.forEach((eg) => {
            if (eg && eg.groupId && !deletedIds.has(eg.groupId)) {
              if (!groupsMap.has(eg.groupId)) {
                groupsMap.set(eg.groupId, {
                  groupId: eg.groupId,
                  name: eg.name || "Guruh",
                  subjectId: eg.subjectId || "",
                  teacherId: eg.teacherId || "",
                  teacherName: eg.teacherName || "",
                  room: eg.room || "101-xona",
                  schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
                  startTime: eg.startTime || "14:00",
                  endTime: eg.endTime || "15:20",
                  lessonDuration: eg.lessonDuration || 80,
                  monthlyPrice: eg.monthlyPrice || 450000,
                  maxStudents: 20,
                  currentStudentsCount: 1,
                  studentIds: [uid],
                  status: "active",
                  createdAt: eg.enrolledAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              } else {
                const ex = groupsMap.get(eg.groupId)!;
                if (!ex.teacherName && eg.teacherName) ex.teacherName = eg.teacherName;
                if (!ex.teacherId && eg.teacherId) ex.teacherId = eg.teacherId;
              }
            }
          });
        }
      }
    });

    // 3. Merge from local cache
    const cached = getLocalGroups();
    cached.forEach((cg) => {
      if (cg && cg.groupId && !deletedIds.has(cg.groupId)) {
        if (!groupsMap.has(cg.groupId)) {
          groupsMap.set(cg.groupId, cg);
        } else {
          const ex = groupsMap.get(cg.groupId)!;
          const mergedS = Array.from(new Set([...(ex.studentIds || []), ...(cg.studentIds || [])]));
          ex.studentIds = mergedS;
          ex.currentStudentsCount = Math.max(ex.currentStudentsCount || 0, mergedS.length);
          if (!ex.name && cg.name) ex.name = cg.name;
          if (!ex.teacherName && cg.teacherName) ex.teacherName = cg.teacherName;
          if (!ex.teacherId && cg.teacherId) ex.teacherId = cg.teacherId;
        }
      }
    });

    // Pass 2: Connect every student's enrollments (enrolledGroups & groupIds) into group.studentIds
    userDocs.forEach((u) => {
      if (u.role !== "teacher" && u.role !== "admin" && u.role !== "director") {
        const uid = u.uid;

        // From enrolledGroups
        if (Array.isArray(u.enrolledGroups)) {
          u.enrolledGroups.forEach((eg) => {
            if (eg && eg.groupId && !deletedIds.has(eg.groupId) && groupsMap.has(eg.groupId)) {
              const grp = groupsMap.get(eg.groupId)!;
              const sIds = new Set(grp.studentIds || []);
              sIds.add(uid);
              grp.studentIds = Array.from(sIds);
            }
          });
        }

        // From groupIds
        if (Array.isArray(u.groupIds)) {
          u.groupIds.forEach((gId) => {
            if (gId && !deletedIds.has(gId)) {
              if (groupsMap.has(gId)) {
                const grp = groupsMap.get(gId)!;
                const sIds = new Set(grp.studentIds || []);
                sIds.add(uid);
                grp.studentIds = Array.from(sIds);
              } else {
                // Recover group from orphan group ID
                groupsMap.set(gId, {
                  groupId: gId,
                  name: "Guruh " + gId.slice(-4),
                  subjectId: "",
                  teacherId: "",
                  teacherName: "O'qituvchi biriktirilmagan",
                  room: "101-xona",
                  schedule: "Dushanba, Chorshanba, Juma",
                  startTime: "14:00",
                  endTime: "15:20",
                  lessonDuration: 80,
                  monthlyPrice: 450000,
                  maxStudents: 20,
                  currentStudentsCount: 1,
                  studentIds: [uid],
                  status: "active",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          });
        }
      }
    });

    // Finalize counts and save cache
    groupsMap.forEach((grp) => {
      const sIds = Array.from(new Set(grp.studentIds || []));
      grp.studentIds = sIds;
      grp.currentStudentsCount = sIds.length;
    });

    let list = Array.from(groupsMap.values());
    saveLocalGroups(list);
    if (!statusFilter) {
      memGroupsCache = { data: list, time: Date.now() };
    }

    if (statusFilter) {
      list = list.filter((g) => g.status === statusFilter || (!g.status && statusFilter === "active"));
    }

    return list.sort((a, b) => {
      const aSec = a.createdAt?.seconds || (typeof a.createdAt === "string" ? new Date(a.createdAt).getTime() / 1000 : 0);
      const bSec = b.createdAt?.seconds || (typeof b.createdAt === "string" ? new Date(b.createdAt).getTime() / 1000 : 0);
      return bSec - aSec;
    });
  },

  async getGroupById(groupId: string): Promise<Group | null> {
    const deletedIds = getDeletedGroupIds();
    if (deletedIds.has(groupId)) return null;

    try {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          groupId: data.groupId || snap.id,
          ...data,
        } as Group;
      }
    } catch (err: any) {}

    // 1. Fallback: check local cache
    const cached = getLocalGroups();
    const foundCached = cached.find((g) => g.groupId === groupId && !deletedIds.has(g.groupId));
    if (foundCached) return foundCached;

    // 2. Fallback: check getGroups()
    const all = await this.getGroups();
    const found = all.find((g) => g.groupId === groupId);
    if (found) return found;

    // 2. Fallback: check users collection (teachers' teachingGroups and students' enrolledGroups)
    try {
      const usersSnap = await getDocs(query(collection(db, "users"), where("groupIds", "array-contains", groupId)));
      for (const d of usersSnap.docs) {
        const u = d.data() as UserProfile;
        if (Array.isArray(u.teachingGroups)) {
          const tg = u.teachingGroups.find((g) => g && g.groupId === groupId);
          if (tg) {
            const fallbackGroup: Group = {
              groupId: tg.groupId,
              name: tg.name || "Guruh",
              subjectId: tg.subjectId || "",
              teacherId: tg.teacherId || u.uid,
              teacherName: tg.teacherName || u.displayName || "",
              room: tg.room || "",
              schedule: tg.schedule || "Dushanba, Chorshanba, Juma",
              startTime: tg.startTime || "14:00",
              endTime: tg.endTime || "",
              lessonDuration: tg.lessonDuration || 80,
              monthlyPrice: tg.monthlyPrice || 0,
              maxStudents: 20,
              currentStudentsCount: 1,
              studentIds: [],
              status: "active",
              createdAt: tg.enrolledAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveLocalGroups([...cached.filter((g) => g.groupId !== fallbackGroup.groupId), fallbackGroup]);
            return fallbackGroup;
          }
        }
        if (Array.isArray(u.enrolledGroups)) {
          const eg = u.enrolledGroups.find((g) => g && g.groupId === groupId);
          if (eg) {
            const fallbackGroup: Group = {
              groupId: eg.groupId,
              name: eg.name || "Guruh",
              subjectId: eg.subjectId || "",
              teacherId: eg.teacherId || "",
              teacherName: eg.teacherName || "",
              room: eg.room || "",
              schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
              startTime: eg.startTime || "14:00",
              endTime: eg.endTime || "",
              lessonDuration: eg.lessonDuration || 80,
              monthlyPrice: eg.monthlyPrice || 0,
              maxStudents: 20,
              currentStudentsCount: 1,
              studentIds: [u.uid || d.id],
              status: "active",
              createdAt: eg.enrolledAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveLocalGroups([...cached.filter((g) => g.groupId !== fallbackGroup.groupId), fallbackGroup]);
            return fallbackGroup;
          }
        }
      }
    } catch {}

    return null;
  },

  async getTeacherGroups(teacherId: string): Promise<Group[]> {
    const cachedTeacher = teacherGroupsMemCache.get(teacherId);
    if (cachedTeacher && Date.now() - cachedTeacher.time < 30000) {
      return cachedTeacher.data;
    }

    const foundGroupsMap = new Map<string, Group>();
    const deletedIds = getDeletedGroupIds();

    // 1. Fetch teacher user profile (to get displayName, email, login, groupIds, teachingGroups)
    let teacherProfile: UserProfile | null = null;
    try {
      const uSnap = await getDoc(doc(db, "users", teacherId));
      if (uSnap.exists()) {
        teacherProfile = uSnap.data() as UserProfile;
      }
    } catch (err: any) {
      console.warn("Firestore getTeacherGroups user doc check warning:", err?.message);
    }

    if (!teacherProfile && auth.currentUser) {
      try {
        if (auth.currentUser.email) {
          const qE = query(collection(db, "users"), where("email", "==", auth.currentUser.email));
          const snapE = await getDocs(qE);
          if (!snapE.empty) {
            teacherProfile = snapE.docs[0].data() as UserProfile;
          }
        }
      } catch {}
    }

    // 2. Authoritatively recover groups directly from teacherProfile.teachingGroups
    if (teacherProfile && Array.isArray(teacherProfile.teachingGroups)) {
      for (const tg of teacherProfile.teachingGroups) {
        if (tg && tg.groupId && !deletedIds.has(tg.groupId)) {
          foundGroupsMap.set(tg.groupId, {
            groupId: tg.groupId,
            name: tg.name || "Guruh",
            subjectId: tg.subjectId || "",
            teacherId: tg.teacherId || teacherId,
            teacherName: tg.teacherName || teacherProfile.displayName || "",
            room: tg.room || "",
            schedule: tg.schedule || "Dushanba, Chorshanba, Juma",
            startTime: tg.startTime || "14:00",
            endTime: tg.endTime || "",
            lessonDuration: tg.lessonDuration || 80,
            monthlyPrice: tg.monthlyPrice || 0,
            maxStudents: 20,
            currentStudentsCount: 0,
            studentIds: [],
            status: "active",
            createdAt: tg.enrolledAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Fetch from collection(db, "groups") if accessible in Firestore
    try {
      const allSnap = await getDocs(collection(db, "groups"));
      const activeFirestoreGroups = allSnap.docs
        .map((d) => {
          const data = d.data();
          return {
            groupId: data.groupId || d.id,
            ...data,
          } as Group;
        })
        .filter((g) => Boolean(g && g.groupId && !deletedIds.has(g.groupId)));

      for (const g of activeFirestoreGroups) {
        const matchesId = g.teacherId === teacherId;
        const matchesEmail = Boolean(teacherProfile?.email && g.teacherId === teacherProfile.email);
        const matchesLogin = Boolean(teacherProfile?.login && g.teacherId === teacherProfile.login);
        const matchesName = Boolean(
          teacherProfile?.displayName &&
          g.teacherName &&
          g.teacherName.trim().toLowerCase() === teacherProfile.displayName.trim().toLowerCase()
        );
        const matchesGroupId = Boolean(
          teacherProfile?.groupIds && teacherProfile.groupIds.includes(g.groupId)
        );
        const matchesTeachingGroups = Boolean(
          Array.isArray(teacherProfile?.teachingGroups) &&
          teacherProfile.teachingGroups.some((tg) => tg && tg.groupId === g.groupId)
        );

        if (matchesId || matchesEmail || matchesLogin || matchesName || matchesGroupId || matchesTeachingGroups) {
          foundGroupsMap.set(g.groupId, {
            ...(foundGroupsMap.get(g.groupId) || {}),
            ...g,
          });
        }
      }
    } catch (err: any) {}

    // 4. Scan all users in users collection to find any groups and students for this teacher ONLY if none found
    if (foundGroupsMap.size === 0) {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
      usersSnap.docs.forEach((d) => {
        const u = d.data() as UserProfile;
        const uid = u.uid || d.id;

        // If teacher document has teachingGroups
        if (uid === teacherId || (teacherProfile?.displayName && u.displayName === teacherProfile.displayName)) {
          if (Array.isArray(u.teachingGroups)) {
            u.teachingGroups.forEach((tg) => {
              if (tg && tg.groupId && !deletedIds.has(tg.groupId)) {
                if (!foundGroupsMap.has(tg.groupId)) {
                  foundGroupsMap.set(tg.groupId, {
                    groupId: tg.groupId,
                    name: tg.name || "Guruh",
                    subjectId: tg.subjectId || "",
                    teacherId: tg.teacherId || teacherId,
                    teacherName: tg.teacherName || teacherProfile?.displayName || "",
                    room: tg.room || "",
                    schedule: tg.schedule || "Dushanba, Chorshanba, Juma",
                    startTime: tg.startTime || "14:00",
                    endTime: tg.endTime || "",
                    lessonDuration: tg.lessonDuration || 80,
                    monthlyPrice: tg.monthlyPrice || 0,
                    maxStudents: 20,
                    currentStudentsCount: 0,
                    studentIds: [],
                    status: "active",
                    createdAt: tg.enrolledAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                }
              }
            });
          }
        }

        // If student document has enrolledGroups
        if (u.role !== "teacher" && u.role !== "admin" && u.role !== "director") {
          if (Array.isArray(u.enrolledGroups)) {
            u.enrolledGroups.forEach((eg) => {
              if (eg && eg.groupId && !deletedIds.has(eg.groupId)) {
                const matchesId = eg.teacherId === teacherId || u.teacherId === teacherId;
                const matchesName = Boolean(
                  teacherProfile?.displayName &&
                  eg.teacherName &&
                  eg.teacherName.trim().toLowerCase() === teacherProfile.displayName.trim().toLowerCase()
                );
                const matchesEmail = Boolean(teacherProfile?.email && eg.teacherId === teacherProfile.email);
                const matchesTeachingGroups = Boolean(
                  Array.isArray(teacherProfile?.teachingGroups) &&
                  teacherProfile.teachingGroups.some((tg) => tg && tg.groupId === eg.groupId)
                );

                if (matchesId || matchesName || matchesEmail || matchesTeachingGroups) {
                  if (!foundGroupsMap.has(eg.groupId)) {
                    foundGroupsMap.set(eg.groupId, {
                      groupId: eg.groupId,
                      name: eg.name || "Guruh",
                      subjectId: eg.subjectId || "",
                      teacherId: eg.teacherId || teacherId,
                      teacherName: eg.teacherName || teacherProfile?.displayName || "",
                      room: eg.room || "",
                      schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
                      startTime: eg.startTime || "14:00",
                      endTime: eg.endTime || "",
                      lessonDuration: eg.lessonDuration || 80,
                      monthlyPrice: eg.monthlyPrice || 0,
                      maxStudents: 20,
                      currentStudentsCount: 1,
                      studentIds: [uid],
                      status: "active",
                      createdAt: eg.enrolledAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                  } else {
                    const existing = foundGroupsMap.get(eg.groupId)!;
                    const sIds = new Set(existing.studentIds || []);
                    sIds.add(uid);
                    existing.studentIds = Array.from(sIds);
                    existing.currentStudentsCount = existing.studentIds.length;
                  }
                }
              }
            });
          }

          // Check if student's groupIds array matches any group
          if (Array.isArray(u.groupIds)) {
            u.groupIds.forEach((gId) => {
              if (foundGroupsMap.has(gId)) {
                const existing = foundGroupsMap.get(gId)!;
                const sIds = new Set(existing.studentIds || []);
                sIds.add(uid);
                existing.studentIds = Array.from(sIds);
                existing.currentStudentsCount = existing.studentIds.length;
              }
            });
          }
        }
      });
    } catch (err: any) {
      console.warn("Firestore scan users for teacher groups warning:", err?.message);
    }
  }

    // 5. Merge from local cache
    const cached = getLocalGroups();
    for (const g of cached) {
      if (!g || !g.groupId || deletedIds.has(g.groupId)) continue;

      const matchesId = g.teacherId === teacherId;
      const matchesEmail = Boolean(teacherProfile?.email && g.teacherId === teacherProfile.email);
      const matchesLogin = Boolean(teacherProfile?.login && g.teacherId === teacherProfile.login);
      const matchesName = Boolean(
        teacherProfile?.displayName &&
        g.teacherName &&
        g.teacherName.trim().toLowerCase() === teacherProfile.displayName.trim().toLowerCase()
      );
      const matchesGroupId = Boolean(
        teacherProfile?.groupIds && teacherProfile.groupIds.includes(g.groupId)
      );

      if (matchesId || matchesEmail || matchesLogin || matchesName || matchesGroupId) {
        if (!foundGroupsMap.has(g.groupId)) {
          foundGroupsMap.set(g.groupId, g);
        } else {
          const ex = foundGroupsMap.get(g.groupId)!;
          const mergedStudents = Array.from(new Set([...(ex.studentIds || []), ...(g.studentIds || [])]));
          ex.studentIds = mergedStudents;
          ex.currentStudentsCount = Math.max(ex.currentStudentsCount || 0, mergedStudents.length);
        }
      }
    }

    const groupsList = Array.from(foundGroupsMap.values());
    const allCached = getLocalGroups();
    const mergedAll = [
      ...allCached.filter((cg) => !groupsList.some((g) => g.groupId === cg.groupId)),
      ...groupsList,
    ];
    saveLocalGroups(mergedAll);
    teacherGroupsMemCache.set(teacherId, { data: groupsList, time: Date.now() });
    return groupsList;
  },

  async getStudentGroups(studentId: string): Promise<Group[]> {
    const cachedStudent = studentGroupsMemCache.get(studentId);
    if (cachedStudent && Date.now() - cachedStudent.time < 30000) {
      return cachedStudent.data;
    }

    const foundGroupsMap = new Map<string, Group>();
    const deletedIds = getDeletedGroupIds();

    // 1. Fetch active groups from Firestore
    let firestoreConnected = false;
    let activeFirestoreGroups: Group[] = [];
    let activeGroupIds = new Set<string>();

    try {
      const allSnap = await getDocs(collection(db, "groups"));
      activeFirestoreGroups = allSnap.docs
        .map((d) => {
          const data = d.data();
          return {
            groupId: data.groupId || d.id,
            ...data,
          } as Group;
        })
        .filter((g) => Boolean(g && g.groupId && !deletedIds.has(g.groupId)));
      activeGroupIds = new Set(activeFirestoreGroups.map((g) => g.groupId));
      firestoreConnected = true;
      const allCached = getLocalGroups();
      const mergedFirestore = [
        ...allCached.filter((cg) => !activeFirestoreGroups.some((g) => g.groupId === cg.groupId)),
        ...activeFirestoreGroups,
      ];
      saveLocalGroups(mergedFirestore);
    } catch (err: any) {
      console.warn("Firestore getStudentGroups groups fetch warning:", err?.message);
    }

    // 2. Read student's user document
    let studentProfile: UserProfile | null = null;
    try {
      const uSnap = await getDoc(doc(db, "users", studentId));
      if (uSnap.exists()) {
        studentProfile = uSnap.data() as UserProfile;
      }
    } catch (err: any) {
      console.warn("Firestore student userDoc warning:", err?.message);
    }

    if (!studentProfile && auth.currentUser) {
      try {
        if (auth.currentUser.email) {
          const qE = query(collection(db, "users"), where("email", "==", auth.currentUser.email));
          const snapE = await getDocs(qE);
          if (!snapE.empty) {
            studentProfile = snapE.docs[0].data() as UserProfile;
          }
        }
      } catch {}
    }

    if (firestoreConnected) {
      // Check which active groups the student belongs to
      for (const g of activeFirestoreGroups) {
        const inStudentIds =
          Array.isArray(g.studentIds) &&
          (g.studentIds.includes(studentId) ||
            Boolean(studentProfile?.uid && g.studentIds.includes(studentProfile.uid)) ||
            Boolean(studentProfile?.email && g.studentIds.includes(studentProfile.email)));

        const inGroupIds = Boolean(
          studentProfile?.groupIds && studentProfile.groupIds.includes(g.groupId)
        );

        const inEnrolled = Boolean(
          Array.isArray(studentProfile?.enrolledGroups) &&
          studentProfile.enrolledGroups.some((eg) => eg && eg.groupId === g.groupId)
        );

        if (inStudentIds || inGroupIds || inEnrolled) {
          foundGroupsMap.set(g.groupId, g);
        }
      }

      // Also check studentProfile.enrolledGroups directly if any was missed
      if (studentProfile && Array.isArray(studentProfile.enrolledGroups)) {
        for (const eg of studentProfile.enrolledGroups) {
          if (eg && eg.groupId && !deletedIds.has(eg.groupId) && !foundGroupsMap.has(eg.groupId)) {
            try {
              const gSnap = await getDoc(doc(db, "groups", eg.groupId));
              if (gSnap.exists()) {
                const gData = gSnap.data();
                foundGroupsMap.set(eg.groupId, {
                  groupId: gData.groupId || gSnap.id,
                  ...gData,
                } as Group);
              }
            } catch {}
          }
        }
      }

      // Also check studentProfile.groupIds directly if missing
      if (studentProfile && Array.isArray(studentProfile.groupIds)) {
        for (const gId of studentProfile.groupIds) {
          if (gId && !deletedIds.has(gId) && !foundGroupsMap.has(gId)) {
            try {
              const gSnap = await getDoc(doc(db, "groups", gId));
              if (gSnap.exists()) {
                const gData = gSnap.data();
                foundGroupsMap.set(gId, {
                  groupId: gData.groupId || gSnap.id,
                  ...gData,
                } as Group);
              }
            } catch {}
          }
        }
      }
    } else {
      // Offline fallback: check cached groups
      const local = getLocalGroups();
      for (const lg of local) {
        if (
          !deletedIds.has(lg.groupId) &&
          Array.isArray(lg.studentIds) &&
          (lg.studentIds.includes(studentId) ||
            Boolean(studentProfile?.uid && lg.studentIds.includes(studentProfile.uid))) &&
          !foundGroupsMap.has(lg.groupId)
        ) {
          foundGroupsMap.set(lg.groupId, lg);
        }
      }
    }

    // Direct fallback from studentProfile.enrolledGroups (as long as not in deletedIds)
    if (foundGroupsMap.size === 0 && studentProfile && Array.isArray(studentProfile.enrolledGroups)) {
      for (const eg of studentProfile.enrolledGroups) {
        if (eg && eg.groupId && !deletedIds.has(eg.groupId)) {
          foundGroupsMap.set(eg.groupId, {
            groupId: eg.groupId,
            name: eg.name || "Guruh",
            subjectId: eg.subjectId || "",
            teacherId: eg.teacherId || "",
            teacherName: eg.teacherName || "",
            room: eg.room || "",
            schedule: eg.schedule || "Dushanba, Chorshanba, Juma",
            startTime: eg.startTime || "14:00",
            endTime: eg.endTime || "",
            lessonDuration: eg.lessonDuration || 80,
            monthlyPrice: eg.monthlyPrice || 0,
            maxStudents: 20,
            currentStudentsCount: 1,
            studentIds: [studentId],
            status: "active",
            createdAt: eg.enrolledAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    const result = Array.from(foundGroupsMap.values());
    studentGroupsMemCache.set(studentId, { data: result, time: Date.now() });
    return result;
  },

  async createGroup(data: {
    name: string;
    subjectId: string;
    teacherId: string;
    teacherName?: string;
    room: string;
    schedule: string;
    startTime: string;
    endTime?: string;
    lessonDuration: number;
    monthlyPrice?: number;
    maxStudents: number;
    status?: GroupStatus;
    description?: string;
  }): Promise<Group> {
    const groupRef = doc(collection(db, "groups"));
    const newGroup: Group = {
      groupId: groupRef.id,
      name: data.name,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      teacherName: data.teacherName || "",
      room: data.room || "",
      schedule: data.schedule || "Dushanba, Chorshanba, Juma",
      startTime: data.startTime || "14:00",
      endTime: data.endTime || "",
      lessonDuration: data.lessonDuration || 80,
      monthlyPrice: data.monthlyPrice || 450000,
      maxStudents: data.maxStudents || 20,
      currentStudentsCount: 0,
      studentIds: [],
      status: data.status || "active",
      description: data.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cached = getLocalGroups();
    saveLocalGroups([newGroup, ...cached.filter((g) => g.groupId !== newGroup.groupId)]);
    invalidateGroupsCache();

    try {
      await setDoc(groupRef, {
        ...newGroup,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore groups write permission warning (saved locally):", err?.message);
    }

    // Sync to teacher user document
    if (data.teacherId) {
      try {
        const teacherRef = doc(db, "users", data.teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          const currentTeaching = Array.isArray(tData.teachingGroups) ? tData.teachingGroups : [];
          const currentGroupIds = Array.isArray(tData.groupIds) ? tData.groupIds : [];

          const teachingItem = {
            groupId: newGroup.groupId,
            name: newGroup.name,
            subjectId: newGroup.subjectId || "",
            teacherId: newGroup.teacherId,
            teacherName: newGroup.teacherName || "",
            room: newGroup.room || "",
            schedule: newGroup.schedule || "",
            startTime: newGroup.startTime || "",
            endTime: newGroup.endTime || "",
            lessonDuration: newGroup.lessonDuration || 80,
            monthlyPrice: newGroup.monthlyPrice || 0,
            enrolledAt: new Date().toISOString(),
          };

          const updatedTeaching = [
            ...currentTeaching.filter((tg) => tg.groupId !== newGroup.groupId),
            teachingItem,
          ];
          const updatedGroupIds = Array.from(new Set([...currentGroupIds, newGroup.groupId]));

          await setDoc(
            teacherRef,
            {
              teachingGroups: updatedTeaching,
              groupIds: updatedGroupIds,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err: any) {
        console.warn("Could not sync group to teacher doc:", err?.message);
      }
    }

    return newGroup;
  },

  async updateGroup(groupId: string, data: Partial<Group>): Promise<void> {
    const cached = getLocalGroups();
    const updated = cached.map((g) => (g.groupId === groupId ? { ...g, ...data, updatedAt: new Date().toISOString() } : g));
    saveLocalGroups(updated);
    invalidateGroupsCache();

    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore groups update permission warning:", err?.message);
    }

    // If teacherId changed or updated, sync to teacher document
    if (data.teacherId) {
      try {
        const teacherRef = doc(db, "users", data.teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          const currentTeaching = Array.isArray(tData.teachingGroups) ? tData.teachingGroups : [];
          const currentGroupIds = Array.isArray(tData.groupIds) ? tData.groupIds : [];

          const updatedGroup = updated.find((g) => g.groupId === groupId);
          if (updatedGroup) {
            const teachingItem = {
              groupId: updatedGroup.groupId,
              name: updatedGroup.name,
              subjectId: updatedGroup.subjectId || "",
              teacherId: updatedGroup.teacherId,
              teacherName: updatedGroup.teacherName || "",
              room: updatedGroup.room || "",
              schedule: updatedGroup.schedule || "",
              startTime: updatedGroup.startTime || "",
              endTime: updatedGroup.endTime || "",
              lessonDuration: updatedGroup.lessonDuration || 80,
              monthlyPrice: updatedGroup.monthlyPrice || 0,
              enrolledAt: new Date().toISOString(),
            };

            const updatedTeaching = [
              ...currentTeaching.filter((tg) => tg.groupId !== groupId),
              teachingItem,
            ];
            const updatedGroupIds = Array.from(new Set([...currentGroupIds, groupId]));

            await setDoc(
              teacherRef,
              {
                teachingGroups: updatedTeaching,
                groupIds: updatedGroupIds,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      } catch (err: any) {
        console.warn("Could not sync updateGroup to teacher doc:", err?.message);
      }
    }
  },

  async addStudentToGroup(groupId: string, studentId: string): Promise<void> {
    // 1. Get group using robust resolver (Firestore -> cache -> teacher/student user documents)
    let group: Group | null = await this.getGroupById(groupId);

    if (!group) {
      throw new Error("Guruh topilmadi. Qayta urinib ko'ring.");
    }

    const currentStudentIds = Array.isArray(group.studentIds) ? group.studentIds : [];
    if (currentStudentIds.includes(studentId)) {
      throw new Error("O'quvchi allaqachon ushbu guruhga biriktirilgan");
    }

    const maxStudents = group.maxStudents || 20;
    if (currentStudentIds.length >= maxStudents) {
      throw new Error(`Guruh to'lgan! Maksimal sig'im: ${maxStudents} nafar`);
    }

    // 2. Update local cache immediately
    const newStudentIds = [...currentStudentIds, studentId];
    const newCount = newStudentIds.length;
    const allCached = getLocalGroups();
    const updatedGroups = allCached.map((g) =>
      g.groupId === groupId
        ? { ...g, studentIds: newStudentIds, currentStudentsCount: newCount, updatedAt: new Date().toISOString() }
        : g
    );
    saveLocalGroups(updatedGroups);
    invalidateGroupsCache();

    // 3. Update Firestore group doc
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        studentIds: arrayUnion(studentId),
        currentStudentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore group studentIds update warning (cached locally):", err?.message);
    }

    // 4. Update student user document with both groupIds and enrolledGroups info
    const enrolledItem = {
      groupId: group.groupId,
      name: group.name,
      subjectId: group.subjectId || "",
      teacherId: group.teacherId || "",
      teacherName: group.teacherName || "",
      room: group.room || "",
      schedule: group.schedule || "Dushanba, Chorshanba, Juma",
      startTime: group.startTime || "14:00",
      endTime: group.endTime || "",
      lessonDuration: group.lessonDuration || 80,
      monthlyPrice: group.monthlyPrice || 0,
      enrolledAt: new Date().toISOString(),
    };

    try {
      const userRef = doc(db, "users", studentId);
      const userSnap = await getDoc(userRef);
      let existingEnrolledGroups: any[] = [];
      let existingGroupIds: string[] = [];

      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        existingEnrolledGroups = Array.isArray(uData.enrolledGroups) ? uData.enrolledGroups : [];
        existingGroupIds = Array.isArray(uData.groupIds) ? uData.groupIds : [];
      }

      // Deduplicate and append
      const updatedEnrolledGroups = [
        ...existingEnrolledGroups.filter((eg) => eg.groupId !== groupId),
        enrolledItem,
      ];
      const updatedGroupIds = Array.from(new Set([...existingGroupIds, groupId]));

      const updateFields: any = {
        groupIds: updatedGroupIds,
        enrolledGroups: updatedEnrolledGroups,
        isCenterStudent: true,
        updatedAt: serverTimestamp(),
      };
      if (group.subjectId && group.subjectId.trim()) {
        updateFields.subjectIds = arrayUnion(group.subjectId.trim());
      }
      if (group.teacherId && group.teacherId.trim()) {
        updateFields.teacherId = group.teacherId.trim();
      }

      await setDoc(userRef, updateFields, { merge: true });
    } catch (err: any) {
      console.warn("Firestore user enrolledGroups update warning:", err?.message);
    }

    // 5. Sync to teacher user document so teacher immediately sees the group and updated student assignment
    if (group.teacherId) {
      try {
        const teacherRef = doc(db, "users", group.teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          const currentTeaching = Array.isArray(tData.teachingGroups) ? tData.teachingGroups : [];
          const currentTGroupIds = Array.isArray(tData.groupIds) ? tData.groupIds : [];

          const existingTeachingItem = currentTeaching.find((tg) => tg && tg.groupId === groupId);
          const teachingItem = {
            groupId: group.groupId,
            name: group.name,
            subjectId: group.subjectId || "",
            teacherId: group.teacherId,
            teacherName: group.teacherName || tData.displayName || "",
            room: group.room || "",
            schedule: group.schedule || "Dushanba, Chorshanba, Juma",
            startTime: group.startTime || "14:00",
            endTime: group.endTime || "",
            lessonDuration: group.lessonDuration || 80,
            monthlyPrice: group.monthlyPrice || 0,
            enrolledAt: existingTeachingItem?.enrolledAt || new Date().toISOString(),
          };

          const updatedTeaching = [
            ...currentTeaching.filter((tg) => tg && tg.groupId !== groupId),
            teachingItem,
          ];
          const updatedTGroupIds = Array.from(new Set([...currentTGroupIds, groupId]));

          await setDoc(
            teacherRef,
            {
              teachingGroups: updatedTeaching,
              groupIds: updatedTGroupIds,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err: any) {
        console.warn("Firestore sync to teacher doc in addStudentToGroup warning:", err?.message);
      }
    }
  },

  async removeStudentFromGroup(groupId: string, studentId: string): Promise<void> {
    // 1. Update local cache (groups and group students)
    const allCached = getLocalGroups();
    const updatedGroups = allCached.map((g) => {
      if (g.groupId === groupId) {
        const remaining = (g.studentIds || []).filter((id) => id !== studentId);
        return {
          ...g,
          studentIds: remaining,
          currentStudentsCount: Math.max(0, remaining.length),
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });
    saveLocalGroups(updatedGroups);
    invalidateGroupsCache();

    const cachedStudentsKey = `fm_group_students_${groupId}`;
    try {
      const raw = localStorage.getItem(cachedStudentsKey);
      if (raw) {
        const cached: UserProfile[] = JSON.parse(raw);
        const updated = cached.filter((cs) => cs && cs.uid !== studentId);
        localStorage.setItem(cachedStudentsKey, JSON.stringify(updated));
      }
    } catch {}

    // 2. Update Firestore group doc
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        studentIds: arrayRemove(studentId),
        currentStudentsCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore group remove student warning:", err?.message);
    }

    // 3. Update student user document
    try {
      const userRef = doc(db, "users", studentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        const remainingEnrolled = (uData.enrolledGroups || []).filter((eg) => eg.groupId !== groupId);
        const remainingGroupIds = (uData.groupIds || []).filter((id) => id !== groupId);

        await setDoc(
          userRef,
          {
            groupIds: remainingGroupIds,
            enrolledGroups: remainingEnrolled,
            isCenterStudent: remainingGroupIds.length > 0,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.warn("Firestore user groupIds remove warning:", err?.message);
    }
  },

  async getGroupStudents(groupId: string): Promise<UserProfile[]> {
    const studentsMap = new Map<string, UserProfile>();
    const isStudent = (u: any) => Boolean(u && u.role !== "teacher" && u.role !== "admin" && u.role !== "director");

    // 1. Fetch by group's studentIds if present
    const group = await this.getGroupById(groupId);
    if (group && Array.isArray(group.studentIds) && group.studentIds.length > 0) {
      for (const sId of group.studentIds) {
        if (!sId) continue;
        try {
          const uSnap = await getDoc(doc(db, "users", sId));
          if (uSnap.exists()) {
            const uData = uSnap.data() as UserProfile;
            if (isStudent(uData)) {
              studentsMap.set(sId, { ...uData, uid: sId });
            }
          } else {
            studentsMap.set(sId, {
              uid: sId,
              displayName: "O'quvchi",
              phoneNumber: "",
              role: "student",
              status: "active",
              coinBalance: 0,
              totalCorrectAnswers: 0,
              testsCompleted: 0,
              educationPlace: "",
              isCenterStudent: true,
              photoURL: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastActiveAt: new Date(),
            });
          }
        } catch (err: any) {
          console.warn("Could not fetch student doc for id:", sId);
        }
      }
    }

    // 2. Query Firestore users collection by groupIds array-contains
    try {
      const q = query(collection(db, "users"), where("groupIds", "array-contains", groupId));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const u = d.data() as UserProfile;
        const uid = u.uid || d.id;
        if (isStudent(u)) {
          studentsMap.set(uid, { ...u, uid });
        }
      });
    } catch (err: any) {
      console.warn("Firestore getGroupStudents array-contains warning:", err?.message);
    }

    // 3. Scan users collection in case enrolledGroups is used or groupIds index is pending
    try {
      const usersRef = collection(db, "users");
      const allUsersSnap = await getDocs(query(usersRef, limit(100)));
      allUsersSnap.docs.forEach((d) => {
        const u = d.data() as UserProfile;
        if (!u) return;
        const uid = u.uid || d.id;
        if (studentsMap.has(uid)) return;
        if (!isStudent(u)) return;

        const hasGroupId = Array.isArray(u.groupIds) && u.groupIds.includes(groupId);
        const hasEnrolledGroup = Array.isArray(u.enrolledGroups) && u.enrolledGroups.some((eg) => eg && eg.groupId === groupId);

        if (hasGroupId || hasEnrolledGroup) {
          studentsMap.set(uid, { ...u, uid });
        }
      });
    } catch (err: any) {
      console.warn("Firestore getGroupStudents broad scan warning:", err?.message);
    }

    // 4. Local cache check
    const cachedStudentsKey = `fm_group_students_${groupId}`;
    try {
      const raw = localStorage.getItem(cachedStudentsKey);
      if (raw) {
        const cached: UserProfile[] = JSON.parse(raw);
        cached.forEach((cs) => {
          if (cs && cs.uid && !studentsMap.has(cs.uid) && isStudent(cs)) {
            studentsMap.set(cs.uid, cs);
          }
        });
      }
    } catch {}

    const result = Array.from(studentsMap.values());

    // Update local cache and group doc sync
    if (result.length > 0) {
      try {
        localStorage.setItem(cachedStudentsKey, JSON.stringify(result));
      } catch {}

      const currentGroups = getLocalGroups();
      const updated = currentGroups.map((g) => {
        if (g.groupId === groupId) {
          const mergedIds = Array.from(new Set([...(g.studentIds || []), ...result.map((s) => s.uid)]));
          return {
            ...g,
            studentIds: mergedIds,
            currentStudentsCount: mergedIds.length,
          };
        }
        return g;
      });
      saveLocalGroups(updated);
    }

    return result;
  },

  async deleteGroup(groupId: string): Promise<void> {
    // 1. Mark as deleted in local storage
    markGroupAsDeleted(groupId);

    // 2. Remove from local cache immediately
    const cached = getLocalGroups();
    saveLocalGroups(cached.filter((g) => g.groupId !== groupId));

    try {
      localStorage.removeItem(`fm_group_students_${groupId}`);
    } catch {}

    // 3. Fetch group details if available before deleting
    let group: Group | null = null;
    try {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (snap.exists()) {
        group = snap.data() as Group;
      }
    } catch (err: any) {
      console.warn("Could not pre-fetch group before delete:", err?.message);
    }
    if (!group) {
      group = cached.find((g) => g.groupId === groupId) || null;
    }

    // 4. Delete document from Firestore
    try {
      await deleteDoc(doc(db, "groups", groupId));
    } catch (err: any) {
      console.warn("Firestore delete group doc warning:", err?.message);
    }

    // 5. Clean up any user who has this groupId in their groupIds array
    try {
      const qUsers = query(collection(db, "users"), where("groupIds", "array-contains", groupId));
      const snapUsers = await getDocs(qUsers);
      for (const uDoc of snapUsers.docs) {
        const uData = uDoc.data() as UserProfile;
        const remainingGroupIds = (uData.groupIds || []).filter((id) => id !== groupId);
        const remainingEnrolled = (uData.enrolledGroups || []).filter((eg) => eg.groupId !== groupId);
        const remainingTeaching = (uData.teachingGroups || []).filter((tg) => tg.groupId !== groupId);

        await setDoc(
          uDoc.ref,
          {
            groupIds: remainingGroupIds,
            enrolledGroups: remainingEnrolled,
            teachingGroups: remainingTeaching,
            isCenterStudent: uData.role === "student" ? remainingGroupIds.length > 0 : (uData.isCenterStudent ?? false),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.warn("Error detaching users by groupIds:", err?.message);
    }

    // 6. Explicitly clean the assigned teacher document if known
    if (group && group.teacherId) {
      try {
        const teacherRef = doc(db, "users", group.teacherId);
        const tSnap = await getDoc(teacherRef);
        if (tSnap.exists()) {
          const tData = tSnap.data() as UserProfile;
          const remainingTeaching = (tData.teachingGroups || []).filter((tg) => tg.groupId !== groupId);
          const remainingGroupIds = (tData.groupIds || []).filter((id) => id !== groupId);

          await setDoc(
            teacherRef,
            {
              teachingGroups: remainingTeaching,
              groupIds: remainingGroupIds,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (err: any) {
        console.warn(`Could not clean teacher doc ${group.teacherId}:`, err?.message);
      }
    }

    // 7. Clean all teachers who might have this group in teachingGroups
    try {
      const qTeachers = query(collection(db, "users"), where("role", "==", "teacher"));
      const snapTeachers = await getDocs(qTeachers);
      for (const tDoc of snapTeachers.docs) {
        const tData = tDoc.data() as UserProfile;
        if (
          Array.isArray(tData.teachingGroups) &&
          tData.teachingGroups.some((tg) => tg.groupId === groupId)
        ) {
          const remainingTeaching = tData.teachingGroups.filter((tg) => tg.groupId !== groupId);
          const remainingGroupIds = (tData.groupIds || []).filter((id) => id !== groupId);
          await setDoc(
            tDoc.ref,
            {
              teachingGroups: remainingTeaching,
              groupIds: remainingGroupIds,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    } catch (err: any) {
      console.warn("Error cleaning all teachers teachingGroups:", err?.message);
    }

    // 8. Explicitly clean all studentIds in group.studentIds
    if (group && Array.isArray(group.studentIds) && group.studentIds.length > 0) {
      for (const sId of group.studentIds) {
        try {
          const sRef = doc(db, "users", sId);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) {
            const sData = sSnap.data() as UserProfile;
            const remainingEnrolled = (sData.enrolledGroups || []).filter((eg) => eg.groupId !== groupId);
            const remainingGroupIds = (sData.groupIds || []).filter((id) => id !== groupId);

            await setDoc(
              sRef,
              {
                groupIds: remainingGroupIds,
                enrolledGroups: remainingEnrolled,
                isCenterStudent: remainingGroupIds.length > 0,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (err: any) {
          console.warn(`Could not clean student ${sId}:`, err?.message);
        }
      }
    }

    // 9. Remove group's lessons from local lesson cache
    try {
      const LESSONS_CACHE_KEY = "fm_lessons_cache";
      const rawL = localStorage.getItem(LESSONS_CACHE_KEY);
      if (rawL) {
        const lList = JSON.parse(rawL);
        if (Array.isArray(lList)) {
          const remainingL = lList.filter((l: any) => l && l.groupId !== groupId);
          localStorage.setItem(LESSONS_CACHE_KEY, JSON.stringify(remainingL));
        }
      }
    } catch {}
    invalidateGroupsCache();
  },
};
