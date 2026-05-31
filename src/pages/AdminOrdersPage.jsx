import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/runtime";
import InvoiceDocument from "../components/InvoiceDocument";
import { products as staticProducts } from "../data/products";

const ADMIN_TOKEN_KEY = "anj_admin_token";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function getDeviceAndBrowserInfo() {
  if (typeof navigator === "undefined") {
    return { deviceName: "Server Environment", browser: "None" };
  }
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let deviceName = "Unknown Device";

  if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("Edg/")) {
    browser = "Edge";
  } else if (ua.includes("Chrome/") && ua.includes("Safari/")) {
    browser = "Chrome";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    browser = "Safari";
  } else if (ua.includes("MSIE ") || ua.includes("Trident/")) {
    browser = "Internet Explorer";
  } else if (ua.includes("CriOS/")) {
    browser = "Chrome (iOS)";
  } else if (ua.includes("FxiOS/")) {
    browser = "Firefox (iOS)";
  }

  if (ua.includes("iPhone")) {
    deviceName = "iPhone";
  } else if (ua.includes("iPad")) {
    deviceName = "iPad";
  } else if (ua.includes("Android")) {
    deviceName = "Android Device";
  } else if (ua.includes("Windows NT")) {
    deviceName = "Windows PC";
  } else if (ua.includes("Macintosh")) {
    deviceName = "Macintosh";
  } else if (ua.includes("Linux")) {
    deviceName = "Linux Desktop";
  }

  return { deviceName, browser };
}

function playBellSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq, delay, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Beautiful harmonic chime chords (Ding-Dong chime effect)
    playTone(523.25, 0, 1.2); // C5 (First ding)
    playTone(659.25, 0, 1.2); // E5
    playTone(783.99, 0, 1.2); // G5
    
    playTone(392.00, 0.35, 1.6); // G4 (Second dong)
    playTone(493.88, 0.35, 1.6); // B4
    playTone(587.33, 0.35, 1.6); // D5
  } catch (err) {
    console.warn("Autoplay audio blocked or AudioContext failed:", err);
  }
}

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState("");
  const invoiceRefs = useRef({});

  const adminToken = useMemo(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "", []);

  const [subStatus, setSubStatus] = useState("loading"); // loading, subscribed, unsubscribed, permission_denied, unsupported
  const [swRegistration, setSwRegistration] = useState(null);

  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [swStatus, setSwStatus] = useState({ active: false, messagingInitialized: false, lastPing: null });

  const fetchRegisteredDevices = async () => {
    if (!adminToken) return;
    setLoadingDevices(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/devices`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload.ok && Array.isArray(payload.devices)) {
          setRegisteredDevices(payload.devices);
        }
      }
    } catch (err) {
      console.error("Failed to load registered devices:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!adminToken) return;
    setSendingTest(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to send test notification");
      }
      alert("Test push notification dispatched successfully! Please check your registered device(s).");
    } catch (err) {
      console.error("Test notification error:", err);
      alert(err.message || "Failed to dispatch test notification.");
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchRegisteredDevices();
    }
  }, [adminToken]);

  useEffect(() => {
    let active = true;
    const checkSubscription = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
        if (active) setSubStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (active) setSubStatus("permission_denied");
        return;
      }

      try {
        console.log("[FCM Diagnostic] Starting checkSubscription...");
        console.log("[FCM Diagnostic] Notification permission state:", Notification.permission);
        console.log("[FCM Diagnostic] serviceWorker in navigator:", "serviceWorker" in navigator);
        console.log("[FCM Diagnostic] Notification in window:", "Notification" in window);

        const { initFirebase } = await import("../config/firebase");
        const { messaging, config } = await initFirebase();
        
        console.log("[FCM Diagnostic] initFirebase returned messaging:", messaging ? "Initialized" : "Null/Falsy");
        console.log("[FCM Diagnostic] initFirebase returned config:", config);

        if (!messaging) {
          console.warn("[FCM Diagnostic] messaging is falsy. Checking browser support via isSupported()...");
          const { isSupported } = await import("firebase/messaging");
          const supported = await isSupported();
          console.warn("[FCM Diagnostic] isSupported() resolved to:", supported);
          
          if (active) setSubStatus("unsupported");
          return;
        }

        const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?apiUrl=${encodeURIComponent(API_BASE_URL)}`);
        if (active) setSwRegistration(reg);

        // Listen for debug messages from the active Service Worker
        const swMessageHandler = (event) => {
          console.log("[AdminOrdersPage] Message received from Service Worker:", event.data);
          if (event.data && event.data.type === "PONG_SW") {
            if (active) {
              setSwStatus({
                active: true,
                messagingInitialized: event.data.messagingInitialized,
                lastPing: event.data.time
              });
            }
          }
        };
        navigator.serviceWorker.addEventListener("message", swMessageHandler);

        // Ping the service worker once it is fully ready
        navigator.serviceWorker.ready.then((registration) => {
          if (registration.active) {
            registration.active.postMessage({ type: "PING_SW" });
          }
        });

        const savedPref = localStorage.getItem("anj_admin_subscribed");
        if (savedPref === "true" && Notification.permission === "granted") {
          if (active) setSubStatus("subscribed");
        } else {
          if (active) setSubStatus("unsubscribed");
        }
      } catch (err) {
        console.error("FCM check failed:", err);
        if (active) setSubStatus("unsubscribed");
      }
    };

    checkSubscription();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    const setupForegroundListener = async () => {
      try {
        const { initFirebase } = await import("../config/firebase");
        const { messaging } = await initFirebase();
        if (messaging) {
          const { onMessage } = await import("firebase/messaging");
          unsubscribe = onMessage(messaging, (payload) => {
            console.log("Foreground notification received:", payload);
            if (Notification.permission === "granted") {
              // Play a beautiful synthesized bell chime!
              playBellSound();

              new Notification(payload.notification?.title || "New Order Received", {
                body: payload.notification?.body || "A new order has been placed.",
                icon: "/favicon.ico"
              });
            }
          });
        }
      } catch (err) {
        console.error("Failed to setup foreground listener:", err);
      }
    };

    if (adminToken) {
      setupForegroundListener();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [adminToken]);

  const handleSubscribe = async () => {
    setSubStatus("loading");
    try {
      if (!swRegistration) {
        throw new Error("Service worker not registered");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSubStatus("permission_denied");
        return;
      }

      console.log("[FCM Registration] Starting subscription request...");
      console.log("[FCM Registration] Permission state:", Notification.permission);
      console.log("[FCM Registration] serviceWorkerRegistration scope:", swRegistration.scope);

      const { initFirebase } = await import("../config/firebase");
      const { messaging, config } = await initFirebase();

      console.log("[FCM Registration] dynamic config:", config);

      if (!messaging || !config?.vapidKey) {
        console.error("[FCM Registration] Missing config details: messaging =", messaging ? "Initialized" : "Null", "vapidKey =", config?.vapidKey ? "Present" : "Missing");
        throw new Error("Firebase Messaging configuration is missing or incomplete.");
      }

      console.log("[FCM Registration] Calling getToken() with VAPID Key:", config.vapidKey);

      const { getToken } = await import("firebase/messaging");
      
      let token;
      try {
        token = await getToken(messaging, {
          vapidKey: config.vapidKey,
          serviceWorkerRegistration: swRegistration
        });
        console.log("[FCM Registration] Successfully generated browser token:", token);
      } catch (tokenErr) {
        console.error("[FCM Registration] getToken() threw an error:", tokenErr);
        if (tokenErr.message && (tokenErr.message.includes("authentication credential") || tokenErr.message.includes("subscribe-failed"))) {
          console.error("[FCM Registration] DIAGNOSIS: Your Google Cloud API Key restrictions do not allow 'FCM Registration API'. Go to https://console.cloud.google.com/apis/credentials?project=namma-veetu-anjaraipetti, edit your 'Browser key (auto created by Firebase)', and make sure BOTH 'Firebase Cloud Messaging API' and 'FCM Registration API' are checked in the restrictions list, then click Save!");
        }
        throw tokenErr;
      }

      if (!token) {
        throw new Error("Could not retrieve Firebase device token.");
      }

      const { deviceName, browser } = getDeviceAndBrowserInfo();

      const response = await fetch(`${API_BASE_URL}/api/admin/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ token, deviceName, browser })
      });

      const payload = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Failed to save subscription on server.");
      }

      localStorage.setItem("anj_admin_subscribed", "true");
      localStorage.setItem("anj_admin_fcm_token", token);
      setSubStatus("subscribed");
      fetchRegisteredDevices();
    } catch (err) {
      console.error("Failed to subscribe:", err);
      alert(err.message || "An error occurred while enabling notifications.");
      setSubStatus("unsubscribed");
    }
  };

  const handleUnsubscribe = async () => {
    setSubStatus("loading");
    try {
      const savedToken = localStorage.getItem("anj_admin_fcm_token");
      if (savedToken) {
        await fetch(`${API_BASE_URL}/api/admin/notifications/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ token: savedToken })
        });
      }
    } catch (err) {
      console.error("Failed to unsubscribe on server:", err);
    } finally {
      localStorage.removeItem("anj_admin_subscribed");
      localStorage.removeItem("anj_admin_fcm_token");
      setSubStatus("unsubscribed");
      fetchRegisteredDevices();
    }
  };

  const [activeTab, setActiveTab] = useState("orders");
  const [adminDeliveryChargeEnabled, setAdminDeliveryChargeEnabled] = useState(true);
  const [updatingDeliverySetting, setUpdatingDeliverySetting] = useState(false);
  
  const [productsState, setProductsState] = useState(() => {
    return staticProducts.flatMap((p) => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.map((v) => ({
          id: v.id,
          name: p.name,
          size: v.size,
          category: p.category,
          price: v.price,
          pendingPrice: String(v.price),
          updating: false
        }));
      }
      return [{
        id: p.id,
        name: p.name,
        size: p.size,
        category: p.category,
        price: p.price,
        pendingPrice: String(p.price),
        updating: false
      }];
    });
  });

  useEffect(() => {
    if (!adminToken) return;
    const fetchPrices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/prices`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.ok && payload.prices) {
            setProductsState((prev) =>
              prev.map((item) => {
                if (payload.prices[item.id] !== undefined) {
                  return {
                    ...item,
                    price: payload.prices[item.id],
                    pendingPrice: String(payload.prices[item.id])
                  };
                }
                return item;
              })
            );
          }
        }
      } catch (err) {
        console.error("Failed to load prices in admin:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.ok && typeof payload.deliveryChargeEnabled === "boolean") {
            setAdminDeliveryChargeEnabled(payload.deliveryChargeEnabled);
          }
        }
      } catch (err) {
        console.error("Failed to load settings in admin:", err);
      }
    };

    fetchPrices();
    fetchSettings();
  }, [adminToken]);

  const handlePriceFieldChange = (itemId, val) => {
    setProductsState((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, pendingPrice: val } : item))
    );
  };

  const handleUpdatePrice = async (itemId, newPrice) => {
    const parsedPrice = Number(newPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid positive price.");
      return;
    }

    try {
      setProductsState((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, updating: true } : item))
      );

      const response = await fetch(`${API_BASE_URL}/api/admin/products/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ productId: itemId, price: parsedPrice })
      });

      const payload = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok || !payload.ok) {
        alert(payload.message || "Failed to update price");
        return;
      }

      setProductsState((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, price: parsedPrice, pendingPrice: String(parsedPrice), updating: false } : item
        )
      );
    } catch (err) {
      alert("An error occurred while updating the price.");
    } finally {
      setProductsState((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, updating: false } : item))
      );
    }
  };

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login", { replace: true });
      return;
    }

    let active = true;
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        const payload = await response.json();
        if (!active) return;
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          navigate("/admin/login", { replace: true });
          return;
        }
        if (!response.ok || !payload.ok) {
          setError(payload.message || "Unable to fetch orders");
          return;
        }
        setOrders(payload.orders || []);
      } catch (_error) {
        if (!active) return;
        setError("Unable to fetch orders");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      active = false;
    };
  }, [adminToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate("/admin/login", { replace: true });
  };

  const handleToggleDeliveryCharge = async () => {
    setUpdatingDeliverySetting(true);
    try {
      const nextVal = !adminDeliveryChargeEnabled;
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ enabled: nextVal })
      });

      const payload = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok || !payload.ok) {
        alert(payload.message || "Failed to update delivery setting");
        return;
      }

      setAdminDeliveryChargeEnabled(nextVal);
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating the delivery setting.");
    } finally {
      setUpdatingDeliverySetting(false);
    }
  };

  const setInvoiceRef = (orderId) => (node) => {
    if (node) {
      invoiceRefs.current[orderId] = node;
    }
  };

  const handleDownload = async (order) => {
    const node = invoiceRefs.current[order.orderId];
    if (!node) return;
    try {
      setDownloadingOrderId(order.orderId);
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${order.invoiceNumber || order.orderId}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .from(node)
        .save();
    } finally {
      setDownloadingOrderId("");
    }
  };

  const handleDeleteOrder = async (order) => {
    const shouldDelete = window.confirm(`Delete order ${order.orderId} permanently?`);
    if (!shouldDelete) return;

    try {
      setError("");
      setDeletingOrderId(order.orderId);
      const response = await fetch(
        `${API_BASE_URL}/api/admin/orders/${order.orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      const payload = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok || !payload.ok) {
        setError(payload.message || "Unable to delete order");
        return;
      }
      setOrders((prev) => prev.filter((item) => item.orderId !== order.orderId));
      delete invoiceRefs.current[order.orderId];
    } catch (_error) {
      setError("Unable to delete order");
    } finally {
      setDeletingOrderId("");
    }
  };

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center justify-center px-6 py-20 md:px-10">
        <p className="text-lg text-truffle/80">Loading admin orders...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Admin Panel</p>
          <h1 className="mt-2 font-display text-5xl text-espresso">
            {activeTab === "orders" ? "All Orders" : "Manage Prices"}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-truffle/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle"
        >
          Logout
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="mb-8 flex gap-6 border-b border-truffle/15 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all border-b-2 ${
            activeTab === "orders"
              ? "border-cocoa text-cocoa font-bold"
              : "border-transparent text-truffle/60 hover:text-truffle"
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prices")}
          className={`pb-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all border-b-2 ${
            activeTab === "prices"
              ? "border-cocoa text-cocoa font-bold"
              : "border-transparent text-truffle/60 hover:text-truffle"
          }`}
        >
          Manage Prices
        </button>
      </div>

      {/* Push Notifications Subscription Panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-2xl text-espresso">Order Push Notifications</h2>
              <p className="mt-1 text-sm text-truffle/70">
                Receive real-time push alerts on your phone or desktop the instant a customer places a new order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {subStatus === "loading" && (
              <span className="text-xs uppercase tracking-widest text-truffle/50 animate-pulse font-semibold">Updating...</span>
            )}
            
            {subStatus === "subscribed" && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Active
                </div>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  className="rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-700 transition"
                >
                  Mute Alerts
                </button>
              </div>
            )}

            {subStatus === "unsubscribed" && (
              <button
                type="button"
                onClick={handleSubscribe}
                className="rounded-xl bg-cocoa hover:bg-cocoa/90 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition"
              >
                Enable Notifications
              </button>
            )}

            {subStatus === "permission_denied" && (
              <div className="flex flex-col gap-2 md:items-end">
                <div className="rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-semibold text-amber-800">
                  Permission Denied
                </div>
                <span className="text-[10px] text-truffle/60 text-left md:text-right max-w-xs">
                  Please click the lock icon in your browser address bar and change notifications permission to "Allow", then click "Enable Notifications" again.
                </span>
              </div>
            )}

            {subStatus === "unsupported" && (
              <div className="rounded-full bg-truffle/10 border border-truffle/20 px-4 py-1.5 text-xs font-semibold text-truffle/60">
                Not Supported in this Browser
              </div>
            )}
          </div>
        </div>

        {registeredDevices.length > 0 && (
          <div className="mt-8 border-t border-truffle/10 pt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-cocoa/80">
                Registered Admin Devices ({registeredDevices.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-truffle/15 text-truffle/60">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Device Name</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Browser</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Created Date</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Last Active</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-truffle/10 text-espresso font-medium">
                  {registeredDevices.map((device) => {
                    const isThisDevice = localStorage.getItem("anj_admin_fcm_token") === device.token;
                    return (
                      <tr key={device.token} className={isThisDevice ? "bg-cocoa/5 font-semibold" : ""}>
                        <td className="py-3 pr-2">
                          <span className="flex items-center gap-1.5">
                            {device.deviceName}
                            {isThisDevice && (
                              <span className="rounded bg-cocoa/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-cocoa">
                                This Device
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-2">{device.browser}</td>
                        <td className="py-3 pr-2 text-truffle/70">
                          {new Date(device.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 pr-2 text-truffle/70">
                          {new Date(device.lastActiveAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delivery Charge Toggle Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cocoa/10 text-cocoa">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.269-.852-.685-1.025l-2.636-1.055a.75.75 0 0 0-.586.04L16.5 10.5m-2.25 8.25h-5.25m9-6h-9m9 0V9a2.25 2.25 0 0 0-2.25-2.25h-9a2.25 2.25 0 0 0-2.25 2.25v3m9-6h.75a2.25 2.25 0 0 1 2.25 2.25v1.5" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-2xl text-espresso">Delivery Charges (Flat ₹50)</h2>
              <p className="mt-1 text-sm text-truffle/70">
                Enable or disable shipping fees dynamically. If disabled, all customers receive free delivery instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            {updatingDeliverySetting && (
              <span className="text-xs uppercase tracking-widest text-truffle/50 animate-pulse font-semibold">Updating...</span>
            )}
            
            <button
              type="button"
              onClick={handleToggleDeliveryCharge}
              disabled={updatingDeliverySetting}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                adminDeliveryChargeEnabled ? "bg-cocoa animate-pulse" : "bg-truffle/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  adminDeliveryChargeEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-semibold uppercase tracking-wider text-espresso w-20">
              {adminDeliveryChargeEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </motion.div>

      {error ? <p className="mb-4 text-red-700">{error}</p> : null}

      {activeTab === "prices" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productsState.map((item, index) => {
            const isModified = Number(item.pendingPrice) !== item.price && item.pendingPrice !== "";
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-truffle/10 px-2 py-0.5 rounded text-truffle">
                      {item.size}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.category === "veg" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl text-truffle leading-snug">{item.name}</h3>
                  <p className="mt-1 text-xs text-truffle/60 uppercase tracking-widest">{item.id}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-truffle/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-truffle/70 uppercase tracking-wider">Current Price</span>
                    <span className="text-xl font-bold text-cocoa">{formatINR(item.price)}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-truffle/50 font-semibold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={item.pendingPrice}
                        onChange={(e) => handlePriceFieldChange(item.id, e.target.value)}
                        className="w-full rounded-xl border border-truffle/20 bg-white/80 pl-7 pr-3 py-2 text-sm text-truffle outline-none transition focus:border-cocoa focus:ring-2 focus:ring-cocoa/15"
                        placeholder="Price"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdatePrice(item.id, item.pendingPrice)}
                      disabled={item.updating || !isModified}
                      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition ${
                        isModified && !item.updating
                          ? "bg-cocoa hover:bg-cocoa/90 shadow-md"
                          : "bg-truffle/20 cursor-not-allowed text-truffle/50"
                      }`}
                    >
                      {item.updating ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <>
          {orders.length === 0 ? <p className="text-truffle/80">No orders yet.</p> : null}

          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.article
                key={order.orderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cocoa/70">{order.invoiceNumber || order.orderId}</p>
                    <h2 className="mt-1 font-display text-3xl text-truffle">{order.customer?.name}</h2>
                    <p className="text-truffle/80">
                      {order.customer?.phone} | {order.address?.city}, {order.address?.state}
                    </p>
                    <p className="text-truffle/80">
                      Qty {order.quantity} | Grand Total {formatINR(order.grandTotal || order.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(order)}
                      disabled={downloadingOrderId === order.orderId}
                      className="rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingOrderId === order.orderId ? "Preparing PDF..." : "Download PDF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      disabled={deletingOrderId === order.orderId}
                      className="rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingOrderId === order.orderId ? "Deleting..." : "Delete Order"}
                    </button>
                  </div>
                </div>

                <div ref={setInvoiceRef(order.orderId)} className="mt-5">
                  <InvoiceDocument order={order} />
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
