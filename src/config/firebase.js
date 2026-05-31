import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import { API_BASE_URL } from "./runtime";

let firebaseApp = null;
let fcmMessaging = null;
let firebaseConfig = null;

// Helper to fetch the config dynamically from backend
export async function getFirebaseConfig() {
  if (firebaseConfig) return firebaseConfig;

  // Try reading from environmental variables first
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  };

  if (envConfig.apiKey && envConfig.projectId) {
    firebaseConfig = envConfig;
    return firebaseConfig;
  }

  // Fallback to fetching it from the backend API
  try {
    const res = await fetch(`${API_BASE_URL}/api/firebase-config`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.apiKey) {
        firebaseConfig = data;
        return firebaseConfig;
      }
    }
  } catch (error) {
    console.error("Failed to fetch Firebase config from backend:", error);
  }

  return null;
}

let initPromise = null;

export async function initFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const config = await getFirebaseConfig();
    if (!config || !config.apiKey) {
      console.warn("Firebase config not available. Push notifications will be disabled.");
      return { app: null, messaging: null, config: null };
    }

    try {
      if (getApps().length === 0) {
        firebaseApp = initializeApp(config);
      } else {
        firebaseApp = getApp();
      }

      const messagingSupported = await isSupported();
      if (messagingSupported) {
        fcmMessaging = getMessaging(firebaseApp);
      } else {
        console.warn("FCM is not supported in this browser environment.");
      }
    } catch (err) {
      console.error("Error initializing Firebase:", err);
    }

    return { app: firebaseApp, messaging: fcmMessaging, config: firebaseConfig };
  })();

  return initPromise;
}
