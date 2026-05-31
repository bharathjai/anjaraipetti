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
      
      // Listen for background messages
      messaging.onBackgroundMessage((payload) => {
        console.log("[firebase-messaging-sw.js] Background message received:", payload);
        
        // Customize background notification if needed
        const notificationTitle = payload.notification?.title || "New Order Received";
        const notificationOptions = {
          body: payload.notification?.body || "A new order has been placed.",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            link: payload.data?.link || payload.webpush?.fcmOptions?.link || "/admin/orders"
          }
        };

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

// Fetch dynamic config when service worker starts
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(initializeFirebaseInWorker());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification click and navigate to the target link
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification clicked:", event.notification);
  event.notification.close();

  // Try to extract link, with fallback to orders page
  const targetLink = event.notification.data?.link || "/admin/orders";
  
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there is already an open window/tab at our origin
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const originUrl = new URL(self.location.origin);
        if (clientUrl.origin === originUrl.origin && "focus" in client) {
          // If already open, navigate it to targetLink and focus
          return client.navigate(targetLink).then((c) => c.focus());
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetLink);
      }
    })
  );
});
