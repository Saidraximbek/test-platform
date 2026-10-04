import { apiRequest } from './client';

export class Firestore {
  type = 'firestore';
}
export const initializeFirestore = () => new Firestore();
export const getFirestore = () => new Firestore();
export const persistentLocalCache = () => ({});
export const persistentMultipleTabManager = () => ({});
export const connectFirestoreEmulator = () => {};

export class Timestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate() {
    return new Date(this.seconds * 1000);
  }

  toMillis() {
    return this.seconds * 1000;
  }

  static now() {
    const s = Math.floor(Date.now() / 1000);
    return new Timestamp(s, 0);
  }

  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }

  static fromMillis(millis: number) {
    return new Timestamp(Math.floor(millis / 1000), 0);
  }
}

export interface DocumentReference {
  __type: 'docRef';
  collection: string;
  id: string;
}

export interface CollectionReference {
  __type: 'colRef';
  collection: string;
  id?: string;
}

export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: string;
  value?: any;
  direction?: 'asc' | 'desc';
  limitCount?: number;
}

export interface Query {
  __type: 'query';
  collection: string;
  constraints: QueryConstraint[];
}

export class DocumentSnapshot<T = any> {
  id: string;
  ref: DocumentReference;
  private _data: T | null;

  constructor(id: string, data: T | null, collectionName = 'unknown') {
    this.id = id;
    this._data = data;
    this.ref = { __type: 'docRef', collection: collectionName, id };
  }

  exists(): boolean {
    return this._data !== null && this._data !== undefined;
  }

  data(): T | undefined {
    return this._data as T;
  }
}

export class QuerySnapshot<T = any> {
  docs: DocumentSnapshot<T>[];
  size: number;
  empty: boolean;

  constructor(docs: DocumentSnapshot<T>[]) {
    this.docs = docs;
    this.size = docs.length;
    this.empty = docs.length === 0;
  }

  forEach(callback: (result: DocumentSnapshot<T>) => void) {
    this.docs.forEach(callback);
  }
}

// Helpers
export function doc(first: any, ...segments: string[]): DocumentReference {
  let col = '';
  let id = '';

  if (first && first.__type === 'colRef') {
    col = first.collection;
    id = segments[0] || ('doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
  } else if (segments.length >= 2) {
    col = segments[0];
    id = segments[1];
  } else if (segments.length === 1) {
    col = segments[0];
    id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  } else {
    col = 'unknown';
    id = 'doc_' + Date.now();
  }

  return {
    __type: 'docRef',
    collection: col,
    id,
  };
}

export function collection(db: any, path: string): CollectionReference {
  return {
    __type: 'colRef',
    collection: path,
  };
}

export function where(field: string, op: string, value: any): QueryConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(limitCount: number): QueryConstraint {
  return { type: 'limit', limitCount };
}

export function query(colRef: CollectionReference | Query, ...constraints: QueryConstraint[]): Query {
  const existing = (colRef as Query).constraints || [];
  return {
    __type: 'query',
    collection: colRef.collection,
    constraints: [...existing, ...constraints],
  };
}

export function serverTimestamp() {
  return { __type: 'serverTimestamp' };
}

export function increment(value: number) {
  return { __type: 'increment', value };
}

export function arrayUnion(...elements: any[]) {
  return { __type: 'arrayUnion', elements };
}

export function arrayRemove(...elements: any[]) {
  return { __type: 'arrayRemove', elements };
}

// Firestore operations
export async function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  try {
    const data = await apiRequest(`/data/${docRef.collection}/${docRef.id}`);
    return new DocumentSnapshot(docRef.id, data, docRef.collection);
  } catch (err: any) {
    return new DocumentSnapshot(docRef.id, null, docRef.collection);
  }
}

export async function getDocs(target: CollectionReference | Query): Promise<QuerySnapshot> {
  const colName = target.collection;
  const constraints = (target as Query).constraints || [];

  const whereList = constraints.filter((c) => c.type === 'where');
  const orderList = constraints.filter((c) => c.type === 'orderBy');
  const limitConstraint = constraints.find((c) => c.type === 'limit');

  const payload: any = {
    where: whereList.map((w) => ({ field: w.field, op: w.op, value: w.value })),
    orderBy: orderList.map((o) => ({ field: o.field, direction: o.direction })),
  };
  if (limitConstraint) {
    payload.limit = limitConstraint.limitCount;
  }

  try {
    const docs = await apiRequest<any[]>(`/data/${colName}/query`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const snapshots = docs.map((d) => new DocumentSnapshot(d.id || d._id, d, colName));
    return new QuerySnapshot(snapshots);
  } catch (err) {
    console.warn(`Query on ${colName} error:`, err);
    return new QuerySnapshot([]);
  }
}

export async function setDoc(docRef: DocumentReference, data: any, options: { merge?: boolean } = {}) {
  const merge = options.merge !== false;
  return await apiRequest(`/data/${docRef.collection}/${docRef.id}`, {
    method: 'POST',
    body: JSON.stringify({ data, merge }),
  });
}

export async function updateDoc(docRef: DocumentReference, data: any) {
  return await apiRequest(`/data/${docRef.collection}/${docRef.id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDoc(docRef: DocumentReference) {
  return await apiRequest(`/data/${docRef.collection}/${docRef.id}`, {
    method: 'DELETE',
  });
}

export class WriteBatch {
  private ops: (() => Promise<any>)[] = [];

  set(docRef: DocumentReference, data: any, options?: any) {
    this.ops.push(() => setDoc(docRef, data, options));
    return this;
  }

  update(docRef: DocumentReference, data: any) {
    this.ops.push(() => updateDoc(docRef, data));
    return this;
  }

  delete(docRef: DocumentReference) {
    this.ops.push(() => deleteDoc(docRef));
    return this;
  }

  async commit(): Promise<void> {
    await Promise.all(this.ops.map((fn) => fn()));
  }
}

export function writeBatch(_db?: any): WriteBatch {
  return new WriteBatch();
}

export async function runTransaction(_db: any, updateFunction: (transaction: any) => Promise<any>): Promise<any> {
  const transaction = {
    get: async (docRef: DocumentReference) => getDoc(docRef),
    set: (docRef: DocumentReference, data: any, options?: any) => setDoc(docRef, data, options),
    update: (docRef: DocumentReference, data: any) => updateDoc(docRef, data),
    delete: (docRef: DocumentReference) => deleteDoc(docRef),
  };
  return await updateFunction(transaction);
}

// Simple onSnapshot polling emulation
export function onSnapshot(
  target: DocumentReference | CollectionReference | Query,
  callback: (snap: any) => void,
  errorCallback?: (err: any) => void
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      if ((target as DocumentReference).__type === 'docRef') {
        const snap = await getDoc(target as DocumentReference);
        if (active) callback(snap);
      } else {
        const snap = await getDocs(target as CollectionReference | Query);
        if (active) callback(snap);
      }
    } catch (err) {
      if (active && errorCallback) errorCallback(err);
    }
  };

  poll();
  const timer = setInterval(poll, 6000);

  return () => {
    active = false;
    clearInterval(timer);
  };
}
