import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/runtime";
import InvoiceDocument from "../components/InvoiceDocument";

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
        const payload = await response.json();
        if (!active) return;
        if (!response.ok || !payload.ok) {
          setError("Order not found.");
          return;
        }
        setOrder(payload.order);
      } catch (_error) {
        if (!active) return;
        setError("Unable to load order details.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      setIsDownloading(true);
      const response = await fetch(`${API_BASE_URL}/api/orders/${order.orderId}/invoice`);
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${order.invoiceNumber || order.orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (_error) {
      window.alert("Unable to download invoice PDF right now. The order might have expired from memory. Please try placing a new order.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-6 py-20 md:px-10">
        <p className="text-lg text-truffle/80">Loading your order...</p>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-6 py-20 md:px-10">
        <div className="rounded-3xl border border-truffle/10 bg-white/75 p-8 text-center">
          <p className="text-lg text-red-700">{error || "Order not found"}</p>
          <Link
            to="/product"
            className="btn-hover mt-6 inline-flex rounded-full bg-truffle px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Order Success</p>
        <h1 className="mt-2 font-display text-5xl text-espresso">Thank you for your order</h1>
        <p className="mt-2 text-truffle/80">
          Order ID: <span className="font-semibold text-cocoa">{order.orderId}</span>
        </p>

        <div ref={invoiceRef} className="mt-8">
          <InvoiceDocument order={order} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="rounded-full bg-truffle px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-65 shadow-md"
          >
            {isDownloading ? "Preparing PDF..." : "Download Invoice PDF"}
          </button>
          <Link
            to="/product"
            className="btn-hover rounded-full border border-truffle/20 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond shadow-sm"
          >
            Shop More
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
