import { apiRequest } from './client';

export interface StorageReference {
  path: string;
  url?: string;
}

export const getStorage = () => ({});
export const connectStorageEmulator = () => {};

export function ref(_storage: any, path: string): StorageReference {
  return { path };
}

export async function uploadBytes(
  storageRef: StorageReference,
  file: File | Blob
): Promise<{ ref: StorageReference }> {
  const formData = new FormData();
  formData.append('file', file, (file as File).name || 'upload.bin');

  const res = await apiRequest<{ url: string; filename: string }>('/upload', {
    method: 'POST',
    body: formData,
  });

  storageRef.url = res.url;
  return { ref: storageRef };
}

export async function getDownloadURL(storageRef: StorageReference): Promise<string> {
  if (storageRef.url) return storageRef.url;
  return storageRef.path.startsWith('http') ? storageRef.path : `/uploads/${storageRef.path}`;
}
