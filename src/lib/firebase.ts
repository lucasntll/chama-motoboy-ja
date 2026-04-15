import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Firebase client config — these are PUBLISHABLE keys (safe for frontend)
const firebaseConfig = {
  apiKey: "AIzaSyD-SlWc0HORS-RyYBglRtwS1l35T_wmhY4",
  authDomain: "urban-dash-f3ecb.firebaseapp.com",
  projectId: "urban-dash-f3ecb",
  storageBucket: "urban-dash-f3ecb.firebasestorage.app",
  messagingSenderId: "991648164099",
  appId: "1:991648164099:web:fde7e7e8076d446e8ea136",
};

// VAPID key for FCM web push
// ⚠️ O valor "G-7XZPN9166E" parece ser um Measurement ID do Google Analytics.
// A VAPID key real do FCM é uma string longa (~88 chars) encontrada em:
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const FIREBASE_VAPID_KEY = "G-7XZPN9166E";

export const firebaseApp = initializeApp(firebaseConfig);

// Messaging is only available in browsers that support it
let messagingInstance: ReturnType<typeof getMessaging> | null = null;

export const getFirebaseMessaging = async () => {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(firebaseApp);
  return messagingInstance;
};
