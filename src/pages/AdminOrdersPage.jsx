import { motion, AnimatePresence } from "framer-motion";
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
  const [expandedOrders, setExpandedOrders] = useState({});
  const invoiceRefs = useRef({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const adminToken = useMemo(() => {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem("anjaraipetti_customer_token") || "";
  }, []);

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
  const [chartMode, setChartMode] = useState("revenue"); // "revenue" or "orders"
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [selectedExportMonth, setSelectedExportMonth] = useState("all");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [exportMode, setExportMode] = useState("month"); // "month" or "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const availableMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`; // YYYY-MM
      const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      list.push({ key, label });
    }
    return list;
  }, []);

  // Calculate business statistics
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const nonCancelledOrders = orders.filter(o => o.status !== "Cancelled");
    
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.grandTotal || o.total || 0), 0);
    const averageOrderValue = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0;
    
    const uniqueCustomers = new Set(orders.map(o => o.customer?.phone || o.customer?.email).filter(Boolean)).size;
    
    // Status breakdown
    const statusCounts = {
      "Order confirmed": 0,
      "Packed": 0,
      "Shipped": 0,
      "Delivered": 0,
      "Cancelled": 0
    };
    orders.forEach(o => {
      const status = o.status || "Order confirmed";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts["Order confirmed"]++;
      }
    });

    // Monthly data
    const monthlyMap = {};
    orders.forEach(o => {
      if (!o.createdAt) return;
      const date = new Date(o.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const key = `${year}-${String(month + 1).padStart(2, "0")}`; // YYYY-MM
      const label = date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = { key, label, revenue: 0, count: 0, orderVolume: 0 };
      }
      
      monthlyMap[key].orderVolume += 1;
      if (o.status !== "Cancelled") {
        monthlyMap[key].revenue += (o.grandTotal || o.total || 0);
        monthlyMap[key].count += 1;
      }
    });
    
    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));
    
    // Top products
    const productMap = {};
    nonCancelledOrders.forEach(o => {
      const items = o.items || [];
      items.forEach(item => {
        const pid = item.productId;
        if (!pid) return;
        if (!productMap[pid]) {
          productMap[pid] = {
            id: pid,
            name: item.productName || pid,
            quantity: 0,
            revenue: 0
          };
        }
        productMap[pid].quantity += (item.quantity || 0);
        productMap[pid].revenue += (item.subtotal || 0);
      });
    });
    
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Payment methods
    let codCount = 0;
    let razorpayCount = 0;
    nonCancelledOrders.forEach(o => {
      const method = o.payment?.method || "cod";
      if (method.toLowerCase() === "razorpay") {
        razorpayCount++;
      } else {
        codCount++;
      }
    });
    const paidOrdersCount = codCount + razorpayCount;
    const paymentStats = {
      cod: codCount,
      razorpay: razorpayCount,
      codPercent: paidOrdersCount > 0 ? Math.round((codCount / paidOrdersCount) * 100) : 0,
      razorpayPercent: paidOrdersCount > 0 ? Math.round((razorpayCount / paidOrdersCount) * 100) : 0
    };

    // Geo breakdown
    const locationMap = {};
    nonCancelledOrders.forEach(o => {
      const city = o.address?.city || "Unknown";
      const state = o.address?.state || "Unknown";
      const key = `${city}, ${state}`;
      if (!locationMap[key]) {
        locationMap[key] = { label: key, count: 0, revenue: 0 };
      }
      locationMap[key].count++;
      locationMap[key].revenue += (o.grandTotal || o.total || 0);
    });
    const topLocations = Object.values(locationMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalOrdersCount,
      totalRevenue,
      averageOrderValue,
      uniqueCustomers,
      statusCounts,
      monthlyData,
      topProducts,
      paymentStats,
      topLocations
    };
  }, [orders]);

  const exportFilteredOrdersToCSV = () => {
    let filtered = orders;
    let filenameSuffix = "all_months";
    
    if (exportMode === "month") {
      if (selectedExportMonth !== "all") {
        filtered = orders.filter((o) => {
          if (!o.createdAt) return false;
          const date = new Date(o.createdAt);
          const year = date.getFullYear();
          const month = date.getMonth();
          const key = `${year}-${String(month + 1).padStart(2, "0")}`;
          return key === selectedExportMonth;
        });
        filenameSuffix = selectedExportMonth;
      }
    } else {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      
      filtered = orders.filter((o) => {
        if (!o.createdAt) return false;
        const orderTime = new Date(o.createdAt).getTime();
        if (start && orderTime < start.getTime()) return false;
        if (end && orderTime > end.getTime()) return false;
        return true;
      });
      filenameSuffix = `${startDate || "start"}_to_${endDate || "end"}`;
    }

    if (filtered.length === 0) {
      alert("No orders found for the selected filter.");
      return;
    }

    const headers = [
      "Order ID", 
      "Date", 
      "Customer Name", 
      "Phone", 
      "Email", 
      "City", 
      "State", 
      "Pincode", 
      "Payment Method", 
      "Payment Status", 
      "Status", 
      "Subtotal", 
      "Grand Total"
    ];
    const rows = filtered.map((o) => [
      o.orderId,
      o.createdAt ? new Date(o.createdAt).toISOString().split("T")[0] : "",
      o.customer?.name || "",
      o.customer?.phone || "",
      o.customer?.email || "",
      o.address?.city || "",
      o.address?.state || "",
      o.address?.pincode || "",
      o.payment?.method || "",
      o.payment?.status || "",
      o.status || "Order confirmed",
      o.subtotal || 0,
      o.grandTotal || o.total || 0
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anjaraipetti_orders_${filenameSuffix}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMonthlySummaryToCSV = () => {
    if (stats.monthlyData.length === 0) {
      alert("No sales data available to summarize.");
      return;
    }

    const headers = [
      "Month", 
      "Total Orders Placed", 
      "Active Orders", 
      "Total Revenue (INR)", 
      "Average Order Value (INR)",
      "COD Orders (Active)", 
      "Razorpay Orders (Active)"
    ];

    const rows = stats.monthlyData.map((m) => {
      const monthOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        const date = new Date(o.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        return key === m.key;
      });

      const activeOrders = monthOrders.filter(o => o.status !== "Cancelled");
      const totalOrdersPlaced = monthOrders.length;
      const activeCount = activeOrders.length;
      const revenue = m.revenue;
      const aov = activeCount > 0 ? revenue / activeCount : 0;

      let cod = 0;
      let razorpay = 0;
      activeOrders.forEach(o => {
        const method = o.payment?.method || "cod";
        if (method.toLowerCase() === "razorpay") {
          razorpay++;
        } else {
          cod++;
        }
      });

      return [
        m.label,
        totalOrdersPlaced,
        activeCount,
        revenue.toFixed(2),
        aov.toFixed(2),
        cod,
        razorpay
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anjaraipetti_monthly_sales_summary_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [downloadingReport, setDownloadingReport] = useState(false);

  const downloadMonthlyBusinessReportPDF = async () => {
    try {
      setDownloadingReport(true);
      const monthParam = exportMode === "month" ? selectedExportMonth : "all";
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/business?month=${monthParam}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to download PDF report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Business_Report_${monthParam}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Unable to generate PDF business report right now.");
      console.error(err);
    } finally {
      setDownloadingReport(false);
    }
  };

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
          stock: 150,
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
        stock: 150,
        updating: false
      }];
    });
  });

  useEffect(() => {
    if (!adminToken) return;
    const fetchPricesAndInventory = async () => {
      try {
        const resPrices = await fetch(`${API_BASE_URL}/api/products/prices`);
        const resInventory = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        let prices = {};
        let inventory = {};
        
        if (resPrices.ok) {
          const payload = await resPrices.json();
          if (payload.ok && payload.prices) prices = payload.prices;
        }
        if (resInventory.ok) {
          const payload = await resInventory.json();
          if (payload.ok && payload.inventory) inventory = payload.inventory;
        }
        
        setProductsState((prev) =>
          prev.map((item) => {
            const nextItem = { ...item };
            if (prices[item.id] !== undefined) {
              nextItem.price = prices[item.id];
              nextItem.pendingPrice = String(prices[item.id]);
            }
            if (inventory[item.id] !== undefined) {
              nextItem.stock = inventory[item.id];
            }
            return nextItem;
          })
        );
      } catch (err) {
        console.error("Failed to load prices/inventory:", err);
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

    fetchPricesAndInventory();
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }
      if (!response.ok || !data.ok) {
        alert(data.message || "Failed to update order status.");
        return;
      }
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
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
            {activeTab === "orders" ? "All Orders" : activeTab === "stats" ? "Business Insights" : "Manage Prices"}
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
          onClick={() => setActiveTab("stats")}
          className={`pb-2 text-sm font-semibold uppercase tracking-[0.2em] transition-all border-b-2 ${
            activeTab === "stats"
              ? "border-cocoa text-cocoa font-bold"
              : "border-transparent text-truffle/60 hover:text-truffle"
          }`}
        >
          Stats
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
      {activeTab === "orders" && (
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
      )}

      {/* Delivery Charge Toggle Card */}
      {activeTab === "orders" && (
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
      )}

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
      ) : activeTab === "stats" ? (
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Revenue Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-truffle/55">Net Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 1.5v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-espresso">{formatINR(stats.totalRevenue)}</h2>
              <p className="mt-1 text-xs text-truffle/70">Excluding cancelled orders</p>
            </motion.div>

            {/* Total Orders Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-truffle/55">Total Orders</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cocoa/10 text-cocoa">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-espresso">{stats.totalOrdersCount}</h2>
              <p className="mt-1 text-xs text-truffle/70">
                {stats.statusCounts["Delivered"]} delivered · {stats.statusCounts["Cancelled"]} cancelled
              </p>
            </motion.div>

            {/* Average Basket Value Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-truffle/55">Avg. Order Value</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-espresso">{formatINR(stats.averageOrderValue)}</h2>
              <p className="mt-1 text-xs text-truffle/70">Per active order</p>
            </motion.div>

            {/* Unique Customers Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-truffle/55">Unique Customers</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-espresso">{stats.uniqueCustomers}</h2>
              <p className="mt-1 text-xs text-truffle/70">Based on contact details</p>
            </motion.div>
          </div>

          {/* Action Row */}
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 rounded-3xl border border-truffle/10 bg-white/75 shadow-luxe backdrop-blur-xl z-20">
            {/* Left side: Detailed export by month or date range */}
            <div className="flex flex-col gap-3 flex-1">
              <div>
                <h4 className="text-sm font-bold text-espresso">Detailed Sales Report</h4>
                <p className="text-xs text-truffle/60">Export order records for a given month or custom date range</p>
              </div>
              
              {/* Selector Mode Capsule */}
              <div className="inline-flex rounded-lg bg-truffle/10 p-0.5 self-start mb-1">
                <button
                  type="button"
                  onClick={() => setExportMode("month")}
                  className={`rounded-md px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    exportMode === "month"
                      ? "bg-white text-cocoa shadow"
                      : "text-truffle/60 hover:text-truffle"
                  }`}
                >
                  By Month
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode("custom")}
                  className={`rounded-md px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    exportMode === "custom"
                      ? "bg-white text-cocoa shadow"
                      : "text-truffle/60 hover:text-truffle"
                  }`}
                >
                  Date Range
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {exportMode === "month" ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                      className="flex items-center justify-between gap-3 w-52 rounded-xl border border-truffle/20 bg-white/95 px-4 py-2.5 text-xs font-semibold text-truffle hover:border-cocoa transition-all focus:outline-none shadow-sm"
                    >
                      <span>
                        {selectedExportMonth === "all"
                          ? "All Months"
                          : availableMonths.find((m) => m.key === selectedExportMonth)?.label || selectedExportMonth}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`h-3.5 w-3.5 text-truffle/60 transition-transform duration-200 ${
                          isMonthDropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isMonthDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-52 max-h-60 overflow-y-auto rounded-2xl border border-truffle/15 bg-white shadow-luxe z-50 py-1.5 focus:outline-none scrollbar-thin"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExportMonth("all");
                              setIsMonthDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-cocoa/10 hover:text-cocoa transition-colors ${
                              selectedExportMonth === "all" ? "text-cocoa bg-cocoa/5 font-bold" : "text-truffle"
                            }`}
                          >
                            All Months
                          </button>
                          {availableMonths.map((m) => {
                            const isSelected = selectedExportMonth === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => {
                                  setSelectedExportMonth(m.key);
                                  setIsMonthDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-cocoa/10 hover:text-cocoa transition-colors ${
                                  isSelected ? "text-cocoa bg-cocoa/5 font-bold" : "text-truffle"
                                }`}
                              >
                                {m.label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold tracking-wider text-truffle/55 pointer-events-none">Start</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-xl border border-truffle/20 bg-white/95 pl-14 pr-3 py-2 text-xs font-semibold text-truffle outline-none hover:border-cocoa focus:border-cocoa transition-all shadow-sm w-44"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[9px] uppercase font-bold tracking-wider text-truffle/55 pointer-events-none">End</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-xl border border-truffle/20 bg-white/95 pl-12 pr-3 py-2 text-xs font-semibold text-truffle outline-none hover:border-cocoa focus:border-cocoa transition-all shadow-sm w-44"
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={exportFilteredOrdersToCSV}
                  className="flex items-center gap-2 rounded-xl bg-cocoa hover:bg-cocoa/90 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Orders
                </button>
              </div>
            </div>

            {/* Right side: Monthly summary export */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-truffle/10 pt-4 md:border-t-0 md:pt-0">
              <div className="text-left md:text-right">
                <h4 className="text-sm font-bold text-espresso">Business Insights Report</h4>
                <p className="text-xs text-truffle/60">Generate PDF business analyses or export CSV summaries</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportMonthlySummaryToCSV}
                  className="flex items-center gap-2 rounded-xl border border-cocoa text-cocoa hover:bg-cocoa/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408.01-.01.007-.007a2.25 2.25 0 0 1 3.178 0l.009.01m-.012-11.826H6.25A2.25 2.25 0 0 0 4 5.25v13.5A2.25 2.25 0 0 0 6.25 21h4.007c-.019-.223-.007-.45.035-.678l.6-3a2.25 2.25 0 0 1 1.258-1.579l1.196-.598m-1.628-2.614a2.25 2.25 0 0 1-.822-2.167l.192-.962a2.25 2.25 0 0 1 1.579-1.706l1.24-.31" />
                  </svg>
                  Export CSV
                </button>
                <button
                  type="button"
                  disabled={downloadingReport}
                  onClick={downloadMonthlyBusinessReportPDF}
                  className="flex items-center gap-2 rounded-xl bg-cocoa hover:bg-cocoa/90 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  {downloadingReport ? "Generating..." : "Generate PDF"}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Analytics Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Chart Card */}
            <div className="lg:col-span-2 rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-espresso">Monthly Trends</h3>
                  <p className="text-xs text-truffle/70">Monthly order volume and revenue growth</p>
                </div>
                
                {/* Toggle Mode */}
                <div className="inline-flex rounded-lg bg-truffle/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setChartMode("revenue")}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                      chartMode === "revenue"
                        ? "bg-white text-cocoa shadow"
                        : "text-truffle/60 hover:text-truffle"
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode("orders")}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                      chartMode === "orders"
                        ? "bg-white text-cocoa shadow"
                        : "text-truffle/60 hover:text-truffle"
                    }`}
                  >
                    Orders
                  </button>
                </div>
              </div>

              {stats.monthlyData.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center border-2 border-dashed border-truffle/15 rounded-2xl">
                  <p className="text-sm text-truffle/55">No historical order data available yet.</p>
                </div>
              ) : (
                <div className="relative w-full pt-4">
                  {/* Custom Interactive SVG Chart */}
                  <svg viewBox="0 0 600 320" className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d0843e" />
                        <stop offset="100%" stopColor="#6f3f1e" />
                      </linearGradient>
                      <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e6a467" />
                        <stop offset="100%" stopColor="#d0843e" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Gridlines & Y-Axis Labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yVal = 20 + 260 * (1 - ratio);
                      const maxVal = chartMode === "revenue" 
                        ? Math.max(...stats.monthlyData.map(d => d.revenue), 1)
                        : Math.max(...stats.monthlyData.map(d => d.orderVolume), 1);
                      const labelValue = Math.round(maxVal * ratio);
                      return (
                        <g key={index} className="opacity-40">
                          <line
                            x1="60"
                            y1={yVal}
                            x2="570"
                            y2={yVal}
                            stroke="#4b2c1a"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="50"
                            y={yVal + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#4b2c1a"
                            fontWeight="600"
                          >
                            {chartMode === "revenue" ? `₹${labelValue}` : labelValue}
                          </text>
                        </g>
                      );
                    })}

                    {/* Render Bars */}
                    {stats.monthlyData.map((item, index) => {
                      const numBars = stats.monthlyData.length;
                      const colWidth = 510 / numBars;
                      const barWidth = Math.max(16, Math.floor(colWidth * 0.5));
                      const x = 60 + index * colWidth + (colWidth - barWidth) / 2;
                      
                      const val = chartMode === "revenue" ? item.revenue : item.orderVolume;
                      const maxVal = chartMode === "revenue" 
                        ? Math.max(...stats.monthlyData.map(d => d.revenue), 1)
                        : Math.max(...stats.monthlyData.map(d => d.orderVolume), 1);
                      
                      const barHeight = Math.max(8, (val / maxVal) * 260);
                      const y = 20 + 260 - barHeight;

                      const isHovered = hoveredBarIndex === index;

                      return (
                        <g key={item.key}>
                          {/* Invisible larger hover trigger area */}
                          <rect
                            x={60 + index * colWidth}
                            y="10"
                            width={colWidth}
                            height="280"
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredBarIndex(index)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          />

                          {/* Visual Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(6, barWidth / 2)}
                            fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                            className="transition-all duration-300"
                          />

                          {/* X-Axis Label */}
                          <text
                            x={60 + index * colWidth + colWidth / 2}
                            y="295"
                            textAnchor="middle"
                            fontSize="10"
                            fill="#4b2c1a"
                            fontWeight="700"
                          >
                            {item.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Line */}
                    <line x1="60" y1="280" x2="570" y2="280" stroke="#4b2c1a" strokeWidth="1.5" />
                  </svg>

                  {/* Absolute Tooltip */}
                  {hoveredBarIndex !== null && stats.monthlyData[hoveredBarIndex] && (
                    <div
                      className="absolute z-10 pointer-events-none rounded-xl bg-espresso text-white p-3 text-xs shadow-xl transition-all duration-150 border border-porcelain/15"
                      style={{
                        left: `${((60 + hoveredBarIndex * (510 / stats.monthlyData.length) + (510 / stats.monthlyData.length) / 2) / 600) * 100}%`,
                        top: `${(20 + 260 - (
                          (chartMode === "revenue" 
                            ? stats.monthlyData[hoveredBarIndex].revenue 
                            : stats.monthlyData[hoveredBarIndex].orderVolume
                          ) / (
                            chartMode === "revenue" 
                              ? Math.max(...stats.monthlyData.map(d => d.revenue), 1) 
                              : Math.max(...stats.monthlyData.map(d => d.orderVolume), 1)
                          )
                        ) * 260) / 320 * 100 - 10}%`,
                        transform: "translate(-50%, -100%)"
                      }}
                    >
                      <p className="font-bold text-almond">{stats.monthlyData[hoveredBarIndex].label}</p>
                      <p className="mt-1 font-semibold text-white">
                        {chartMode === "revenue"
                          ? `Revenue: ${formatINR(stats.monthlyData[hoveredBarIndex].revenue)}`
                          : `Orders: ${stats.monthlyData[hoveredBarIndex].orderVolume} orders`
                        }
                      </p>
                      {chartMode === "revenue" && (
                        <p className="text-[10px] text-almond/75">
                          Volume: {stats.monthlyData[hoveredBarIndex].count} active / {stats.monthlyData[hoveredBarIndex].orderVolume} total
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Status Card */}
            <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-espresso">Order Statuses</h3>
                <p className="text-xs text-truffle/70">Breakdown of orders in processing cycle</p>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { name: "Delivered", color: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-100/50" },
                  { name: "Shipped", color: "bg-blue-500", text: "text-blue-800", bg: "bg-blue-100/50" },
                  { name: "Packed", color: "bg-indigo-500", text: "text-indigo-800", bg: "bg-indigo-100/50" },
                  { name: "Order confirmed", color: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-100/50" },
                  { name: "Cancelled", color: "bg-red-500", text: "text-red-800", bg: "bg-red-100/50" }
                ].map((st) => {
                  const count = stats.statusCounts[st.name] || 0;
                  const total = stats.totalOrdersCount || 1;
                  const percent = Math.round((count / total) * 100);

                  return (
                    <div key={st.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-truffle">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${st.color}`} />
                          {st.name}
                        </span>
                        <span className="font-mono text-truffle/80">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-truffle/10 overflow-hidden">
                        <div className={`h-full rounded-full ${st.color}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-truffle/10 text-center text-xs text-truffle/60">
                Out of {stats.totalOrdersCount} total orders registered
              </div>
            </div>
          </div>

          {/* Bottom Analytics Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Top Products Card (Premium) */}
            <div className="lg:col-span-2 rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl">
              <h3 className="font-display text-2xl font-bold text-espresso">Top Selling Products</h3>
              <p className="text-xs text-truffle/70 mb-6">Best performers by total revenue share</p>

              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-truffle/60 text-center py-12">No products sold yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((p, idx) => {
                    const topRevenue = stats.topProducts[0]?.revenue || 1;
                    const relativePct = Math.round((p.revenue / topRevenue) * 100);

                    return (
                      <div key={p.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-truffle/5 transition-colors">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-cocoa/80 font-mono">#{idx + 1}</span>
                            <h4 className="font-semibold text-sm text-espresso truncate">{p.name}</h4>
                          </div>
                          
                          {/* Relative share bar indicator */}
                          <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-truffle/5 overflow-hidden">
                            <div className="h-full rounded-full bg-amber" style={{ width: `${relativePct}%` }} />
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0 flex items-center justify-between sm:block w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t border-truffle/5 sm:border-t-0">
                          <p className="font-bold text-sm text-truffle">{formatINR(p.revenue)}</p>
                          <p className="text-[11px] font-semibold text-truffle/60">{p.quantity} units sold</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Geography & Payment Breakdowns Card */}
            <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-2xl font-bold text-espresso">Payment & Geography</h3>
                <p className="text-xs text-truffle/70">Source of funds and buyer locales</p>
              </div>

              {/* Payment Split */}
              <div className="my-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cocoa/80 mb-3">Payment Methods</h4>
                <div className="flex h-6 w-full rounded-full bg-truffle/10 overflow-hidden font-bold text-[10px] text-white">
                  {stats.paymentStats.razorpayPercent > 0 && (
                    <div 
                      className="flex items-center justify-center bg-indigo-600 transition-all"
                      style={{ width: `${stats.paymentStats.razorpayPercent}%` }}
                      title={`Razorpay: ${stats.paymentStats.razorpay} orders`}
                    >
                      {stats.paymentStats.razorpayPercent}% Online
                    </div>
                  )}
                  {stats.paymentStats.codPercent > 0 && (
                    <div 
                      className="flex items-center justify-center bg-amber-700 transition-all"
                      style={{ width: `${stats.paymentStats.codPercent}%` }}
                      title={`COD: ${stats.paymentStats.cod} orders`}
                    >
                      {stats.paymentStats.codPercent}% COD
                    </div>
                  )}
                  {stats.paymentStats.razorpayPercent === 0 && stats.paymentStats.codPercent === 0 && (
                    <div className="flex w-full items-center justify-center text-truffle/50">No data</div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-truffle/60">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-600" /> Razorpay ({stats.paymentStats.razorpay})</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-700" /> COD ({stats.paymentStats.cod})</span>
                </div>
              </div>

              {/* Top Cities */}
              <div className="border-t border-truffle/10 pt-4 flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cocoa/80 mb-3">Top Markets (by Sales)</h4>
                
                {stats.topLocations.length === 0 ? (
                  <p className="text-xs text-truffle/55 py-4">No locations recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topLocations.map((loc) => (
                      <div key={loc.label} className="flex justify-between items-center text-xs py-1">
                        <span className="font-semibold text-espresso truncate flex-1 min-w-0 pr-2">{loc.label}</span>
                        <div className="flex gap-3 text-right shrink-0">
                          <span className="text-truffle font-bold">{formatINR(loc.revenue)}</span>
                          <span className="text-truffle/60 text-[10px] font-mono">({loc.count} ord)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Safety Levels Grid */}
          <div className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold text-espresso">Inventory & Safety Levels</h3>
                <p className="text-xs text-truffle/70">Real-time stock monitoring and restocking alerts</p>
              </div>
              <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider bg-amber/10 px-3 py-1 rounded-full text-[#d0843e]">
                {productsState.filter(p => p.stock < 30).length} Spices Low in Stock
              </span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productsState.map((product) => {
                const stock = product.stock ?? 0;
                let statusColor = "bg-emerald-500";
                let statusText = "Fresh (In Stock)";
                let statusBg = "bg-emerald-50/50 border-emerald-200 text-emerald-800";
                
                if (stock < 10) {
                  statusColor = "bg-red-500 animate-pulse";
                  statusText = "Critical Restock";
                  statusBg = "bg-red-50/50 border-red-200 text-red-800";
                } else if (stock < 30) {
                  statusColor = "bg-amber-500 animate-pulse";
                  statusText = "Low Inventory";
                  statusBg = "bg-amber-50/50 border-amber-200 text-amber-800";
                }
                
                return (
                  <div key={product.id} className="p-4 rounded-2xl border border-truffle/5 bg-white flex flex-col justify-between gap-3 hover:border-truffle/15 transition-all">
                    <div>
                      <h4 className="font-bold text-sm text-espresso truncate">{product.name}</h4>
                      <p className="text-[10px] text-truffle/60 font-semibold">{product.size}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-truffle/5">
                      <span className="text-xs text-truffle/70 font-semibold">Stock: <span className="font-bold text-espresso">{stock} units</span></span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${statusBg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                        {statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {orders.length === 0 ? <p className="text-truffle/80">No orders yet.</p> : null}

          <div className="space-y-4">
            {orders.map((order, index) => {
              const isExpanded = !!expandedOrders[order.orderId];
              return (
                <motion.article
                  key={order.orderId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-3xl border border-truffle/10 bg-white/75 shadow-luxe backdrop-blur-xl transition hover:border-truffle/20"
                >
                  {/* Clickable Header */}
                  <div
                    onClick={() => toggleOrderExpand(order.orderId)}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-6 hover:bg-cocoa/5 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-cocoa/10 px-2.5 py-1 rounded-full text-cocoa">
                          {order.invoiceNumber || "No Invoice"}
                        </span>
                        <p className="mt-1 text-[11px] text-truffle/60 font-medium">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="font-display text-lg text-espresso">{order.customer?.name}</p>
                        <p className="text-xs text-truffle/70">{order.customer?.phone}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-truffle/55">City / State</p>
                        <p className="text-sm font-medium text-truffle">
                          {order.address?.city || "N/A"}, {order.address?.state || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-truffle/50">Total Amount</p>
                        <p className="text-xl font-bold text-cocoa">{formatINR(order.grandTotal || order.total)}</p>
                      </div>
                      
                      {/* Chevron Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`h-4.5 w-4.5 text-truffle/60 transition-transform duration-300 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-truffle/10 bg-white/40 p-6 md:p-8">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <p className="text-xs text-truffle/60">
                            Order ID: <span className="font-mono">{order.orderId}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-truffle/70 uppercase tracking-wider">Status:</span>
                            <select
                              value={order.status || "Order confirmed"}
                              onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                              className="rounded-lg border border-truffle/20 bg-white px-2.5 py-1 text-xs text-truffle outline-none focus:border-cocoa transition"
                            >
                              <option value="Order confirmed">Order confirmed</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(order);
                            }}
                            disabled={downloadingOrderId === order.orderId}
                            className="rounded-full bg-cocoa px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-cocoa/90 disabled:cursor-not-allowed disabled:opacity-60 transition shadow-sm"
                          >
                            {downloadingOrderId === order.orderId ? "Preparing PDF..." : "Download PDF"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order);
                            }}
                            disabled={deletingOrderId === order.orderId}
                            className="rounded-full border border-red-200 bg-red-50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-red-700 hover:bg-red-100/70 disabled:cursor-not-allowed disabled:opacity-60 transition"
                          >
                            {deletingOrderId === order.orderId ? "Deleting..." : "Delete Order"}
                          </button>
                        </div>
                      </div>

                      <div ref={setInvoiceRef(order.orderId)} className="mt-4">
                        <InvoiceDocument order={order} />
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
