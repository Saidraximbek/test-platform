import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const storageRef = ref(storage, `users/${userId}/avatar/avatar_${Date.now()}.${ext}`);
    const snap = await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(snap.ref);
  },

  async uploadSubmissionImage(submissionId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const storageRef = ref(storage, `submissions/${submissionId}/img_${Date.now()}.${ext}`);
    const snap = await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(snap.ref);
  },

  async uploadProductImage(productId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const storageRef = ref(storage, `products/${productId}/img_${Date.now()}.${ext}`);
    const snap = await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(snap.ref);
  },
};
