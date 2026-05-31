// Import Firebase compat libraries (compat mode is excellent for service workers)
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

let messagingInitialized = false;

async function initializeFirebaseInWorker() {
  if (messagingInitialized) return;

  try {
    // Extract the dynamic API base URL from the service worker URL query parameter
    const urlParams = new URL(self.location.href).searchParams;
    const apiUrl = urlParams.get("apiUrl") || "";
    const fetchUrl = apiUrl ? `${apiUrl}/api/firebase-config` : "/api/firebase-config";

    console.log(`[firebase-messaging-sw.js] Fetching Firebase config from: ${fetchUrl}`);

    // Dynamically retrieve the public Firebase credentials from our server API
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }

    // Explicitly validate content-type to avoid parsing HTML fallbacks as JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON config but received content-type: ${contentType}`);
    }

    const config = await response.json();

    // Only initialize if we got a valid configuration
    if (config.apiKey && config.projectId) {
      firebase.initializeApp(config);
      const messaging = firebase.messaging();
      
      // Listen for background messages via Firebase SDK
      messaging.onBackgroundMessage((payload) => {
        console.log("[firebase-messaging-sw.js] onBackgroundMessage() triggered!", payload);
        
        const notificationTitle = payload.notification?.title || payload.data?.title || "New Order Received";
        const notificationOptions = {
          body: payload.notification?.body || payload.data?.body || "A new order has been placed.",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "new-order-alert",
          data: {
            link: payload.data?.link || payload.webpush?.fcmOptions?.link || "/admin/orders"
          },
          vibrate: [200, 100, 200]
        };

        console.log(`[firebase-messaging-sw.js] onBackgroundMessage calling self.registration.showNotification("${notificationTitle}")`);
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });

      messagingInitialized = true;
      console.log("[firebase-messaging-sw.js] Firebase Messaging initialized successfully.");
    } else {
      console.warn("[firebase-messaging-sw.js] No Firebase configuration found on backend.");
    }
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
  }
}

// Fallback: Listen to the raw W3C Push API event.
// Highly robust for Android Chrome where Firebase SDK hooks might occasionally get delayed/suspended.
self.addEventListener("push", (event) => {
  console.log("[firebase-messaging-sw.js] RAW PUSH EVENT RECEIVED IN SERVICE WORKER!", event);
  
  event.waitUntil(
    initializeFirebaseInWorker().then(() => {
      let payload = null;
      if (event.data) {
        try {
          payload = event.data.json();
          console.log("[firebase-messaging-sw.js] Parsed Raw Push JSON Payload:", JSON.stringify(payload, null, 2));
        } catch (err) {
          console.warn("[firebase-messaging-sw.js] Raw push data payload is not JSON. Text data:", event.data.text());
        }
      }

      // Parse fields from standard FCM format or raw push formats
      const title = payload?.notification?.title || payload?.data?.title || "New Order Received (SW Fallback)";
      const body = payload?.notification?.body || payload?.data?.body || "A new order has been placed.";
      const link = payload?.data?.link || payload?.webpush?.fcmOptions?.link || "/admin/orders";

      console.log(`[firebase-messaging-sw.js] Raw push listener displaying notification: "${title}"`);

      const notificationOptions = {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "new-order-alert",
        data: { link },
        vibrate: [200, 100, 200],
        requireInteraction: true
      };

      return self.registration.showNotification(title, notificationOptions)
        .then(() => {
          console.log("[firebase-messaging-sw.js] self.registration.showNotification succeeded.");
        })
        .catch((err) => {
          console.error("[firebase-messaging-sw.js] self.registration.showNotification failed:", err);
        });
    })
  );
});

// Fetch dynamic config when service worker starts
self.addEventListener("install", (event) => {
  console.log("[firebase-messaging-sw.js] Installing service worker...");
  self.skipWaiting();
  event.waitUntil(initializeFirebaseInWorker());
});

self.addEventListener("activate", (event) => {
  console.log("[firebase-messaging-sw.js] Activating service worker...");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      initializeFirebaseInWorker()
    ])
  );
});

// Handle notification click and navigate to the target link
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked! Event details:", event);
  console.log("[firebase-messaging-sw.js] Notification data object:", event.notification.data);
  
  event.notification.close();

  // Try to extract link, with fallback to orders page
  const targetLink = event.notification.data?.link || "/admin/orders";
  console.log("[firebase-messaging-sw.js] Navigating client to link:", targetLink);
  
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there is already an open window/tab at our origin
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const originUrl = new URL(self.location.origin);
        if (clientUrl.origin === originUrl.origin && "focus" in client) {
          console.log("[firebase-messaging-sw.js] Found existing open tab. Navigating and focusing...");
          return client.navigate(targetLink).then((c) => c.focus());
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        console.log("[firebase-messaging-sw.js] Opening new window for link:", targetLink);
        return self.clients.openWindow(targetLink);
      }
    })
  );
});

// Handle debug messages from the frontend to confirm SW status
self.addEventListener("message", (event) => {
  console.log("[firebase-messaging-sw.js] Message received from client app:", event.data);
  if (event.data && event.data.type === "PING_SW") {
    event.waitUntil(
      initializeFirebaseInWorker().then(() => {
        console.log(`[firebase-messaging-sw.js] Replying to PING_SW. messagingInitialized = ${messagingInitialized}`);
        event.source.postMessage({
          type: "PONG_SW",
          status: "active",
          messagingInitialized,
          time: new Date().toISOString()
        });
      }).catch((err) => {
        console.error("[firebase-messaging-sw.js] Failed to initialize Firebase on diagnostic PING_SW:", err);
        event.source.postMessage({
          type: "PONG_SW",
          status: "active",
          messagingInitialized: false,
          error: err.message,
          time: new Date().toISOString()
        });
      })
    );
  }
});

// Proactively run initialization on global startup evaluation
initializeFirebaseInWorker();
