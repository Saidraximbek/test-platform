import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  Firestore,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider } from "firebase/app-check";

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || (typeof process !== "undefined" ? process.env : {}) || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForTilloTestingPlatform123",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "tillo-testing-platform.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "tillo-testing-platform",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "tillo-testing-platform.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890abcdef",
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Initialize App Check conditionally
if (typeof window !== "undefined" && env.PROD) {
  const recaptchaKey = env.VITE_FIREBASE_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.warn("App Check initialization skipped or failed:", e);
    }
  }
} else if (typeof window !== "undefined" && env.DEV) {
  // Debug App Check in dev mode if needed
  try {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  } catch (_) {}
}

// Connect to Emulators if configured
if (env.VITE_USE_FIREBASE_EMULATOR === "true") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Connected to Firebase Emulators");
  } catch (err) {
    console.warn("Emulators already connected or failed:", err);
  }
}
