import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/runtime";
import InvoiceDocument from "../components/InvoiceDocument";

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
          <h1 className="mt-2 font-display text-5xl text-espresso">All Orders</h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-truffle/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle"
        >
          Logout
        </button>
      </div>

      {error ? <p className="mb-4 text-red-700">{error}</p> : null}
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
    </section>
  );
}
