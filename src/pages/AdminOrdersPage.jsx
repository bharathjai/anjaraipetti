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

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState("");
  const invoiceRefs = useRef({});

  const adminToken = useMemo(() => localStorage.getItem(ADMIN_TOKEN_KEY) || "", []);

  const [activeTab, setActiveTab] = useState("orders");
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
    fetchPrices();
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
