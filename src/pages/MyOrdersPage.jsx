import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../config/runtime";
import { getProductById } from "../data/products";
import { useAuth } from "../context/AuthContext";

// Currency Formatter
function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

// Date Formatter
function formatDate(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (_e) {
    return dateString;
  }
}

// Timeline Steps
const TIMELINE_STEPS = [
  { label: "Order Placed", key: "placed" },
  { label: "Confirmed", key: "confirmed" },
  { label: "Packed", key: "packed" },
  { label: "Shipped", key: "shipped" },
  { label: "Delivered", key: "delivered" }
];

// Helper to calculate active step index in progress timeline
function getStepIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("delivered") || s.includes("completed")) return 4;
  if (s.includes("shipped") || s.includes("transit") || s.includes("out for delivery")) return 3;
  if (s.includes("packed") || s.includes("processing")) return 2;
  if (s.includes("confirmed") || s.includes("paid")) return 1;
  return 0; // default to Placed
}

// Spice-themed floating particles
function SpiceParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${(i * 17) % 95}%`,
      top: `${(i * 23) % 95}%`,
      size: 4 + (i % 3) * 2,
      duration: 6 + (i % 4) * 3,
      delay: i * 0.4
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber/15 blur-[0.5px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size
          }}
          animate={{
            y: [0, -15, 0],
            x: [0, p.id % 2 === 0 ? 10 : -10, 0],
            opacity: [0.15, 0.4, 0.15]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Timeline Component
function ProgressTimeline({ status }) {
  const currentStep = getStepIndex(status);

  return (
    <div className="w-full py-6 font-semibold">
      {/* Desktop Horizontal Timeline */}
      <div className="hidden sm:flex items-center justify-between relative w-full px-4">
        {/* Connection Line */}
        <div className="absolute top-[18px] left-[10%] right-[10%] h-1 bg-truffle/10 -z-10 rounded-full" />
        <motion.div
          className="absolute top-[18px] left-[10%] h-1 bg-gradient-to-r from-amber to-emerald-500 -z-10 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / 4) * 80}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              <motion.div
                className={`w-9.5 h-9.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isActive
                    ? "bg-amber border-amber text-white shadow-md shadow-amber/20"
                    : "bg-white border-truffle/20 text-truffle/40"
                }`}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full border-2 border-amber"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {isCompleted ? (
                  <motion.svg
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-5.5 h-5.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : isActive ? (
                  <motion.div
                    className="w-2.5 h-2.5 bg-white rounded-full"
                    animate={{ scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </motion.div>

              <span
                className={`mt-3 text-xs font-bold uppercase tracking-wider text-center ${
                  isActive
                    ? "text-amber"
                    : isCompleted
                    ? "text-emerald-600 font-bold"
                    : "text-truffle/40"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Timeline */}
      <div className="flex sm:hidden flex-col gap-5 relative py-2">
        {/* Connector Line */}
        <div className="absolute top-4 bottom-4 left-[15.5px] w-0.75 bg-truffle/10" />
        <motion.div
          className="absolute top-4 left-[15.5px] w-0.75 bg-gradient-to-b from-amber to-emerald-500"
          initial={{ height: "0%" }}
          animate={{ height: `${(currentStep / 4) * 100}%` }}
          transition={{ duration: 0.8 }}
        />

        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={step.key} className="flex items-center gap-4 relative z-10">
              <div className="relative shrink-0">
                {isActive && (
                  <motion.div
                    className="absolute inset-[-4px] rounded-full border-2 border-amber"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow shadow-emerald-500/20"
                      : isActive
                      ? "bg-amber border-amber text-white shadow shadow-amber/20"
                      : "bg-white border-truffle/20 text-truffle/40"
                  }`}
                >
                  {isCompleted ? (
                    <motion.svg
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : isActive ? (
                    <motion.div
                      className="w-2.5 h-2.5 bg-white rounded-full"
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-truffle/30" />
                  )}
                </motion.div>
              </div>

              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isActive
                    ? "text-amber"
                    : isCompleted
                    ? "text-emerald-600 font-bold"
                    : "text-truffle/45"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Premium Custom Dropdown Component
function CustomDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 bg-transparent text-xs font-bold text-cocoa focus:outline-none cursor-pointer select-none"
      >
        <span>{selectedOption.label}</span>
        <svg className={`h-3.5 w-3.5 text-cocoa/65 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2.5 w-40 rounded-2xl border border-truffle/10 bg-white p-1.5 shadow-luxe backdrop-blur-xl z-40 flex flex-col gap-0.5"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                    value === opt.value
                      ? "bg-cocoa text-white"
                      : "text-truffle hover:bg-almond/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Redesigned Order Card component representing a premium e-commerce order entry
function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  getStatusBadgeStyle,
  buyAgainId,
  downloadingId,
  handleBuyAgain,
  handleDownloadInvoice
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(68, 35, 13, 0.1)" }}
      className="overflow-hidden rounded-3xl border border-truffle/10 bg-white/75 shadow-luxe backdrop-blur-xl transition-all duration-300"
    >
      {/* Card Content (Always Visible) */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Row 1: Header Info */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-truffle/5 pb-4">
          <div>
            <span className="font-display text-lg text-truffle tracking-wide font-semibold">{order.orderId}</span>
            <p className="text-[11px] text-truffle/65 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-1 rounded-full border text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1.5 ${getStatusBadgeStyle(order.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                order.status?.toLowerCase().includes("delivered") ? "bg-emerald-500" : "bg-amber animate-pulse"
              }`} />
              <span>{order.status || "Order confirmed"}</span>
            </div>
            <div className="text-xs text-truffle/80">
              <span className="font-semibold">{order.address?.city ? `${order.address.city}, ${order.address.state}` : "Shipping Location"}</span>
            </div>
          </div>
        </div>

        {/* Row 2: Product Previews & Total */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2">
          {/* Product List instead of photos */}
          <div className="flex flex-col gap-1.5 py-1">
            {order.items?.map((item, idx) => (
              <div key={idx} className="text-xs text-truffle font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
                <span className="font-semibold text-cocoa">{item.productName}</span>
                <span className="text-[10px] text-cocoa bg-almond px-1.5 py-0.5 rounded font-black shrink-0">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Pricing / Total Paid */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-truffle/55">Total Paid</span>
            <span className="text-xl font-black text-cocoa leading-tight">{formatINR(order.grandTotal || order.total || order.totalAmount || 0)}</span>
          </div>
        </div>

        {/* Row 3: Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-truffle/5 pt-4">
          <Link
            to={`/order/${order.orderId}`}
            className="text-xs font-bold text-cocoa hover:text-truffle hover:underline transition flex items-center gap-1"
          >
            Invoice Receipt &rarr;
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleBuyAgain(order)}
              disabled={buyAgainId === order.orderId}
              className="rounded-full bg-white border border-truffle/20 hover:bg-almond px-4 h-8 text-[11px] font-bold uppercase tracking-wider text-truffle transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {buyAgainId === order.orderId ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-truffle" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-cocoa" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                  </svg>
                  <span>Buy Again</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownloadInvoice(order.orderId, order.invoiceNumber || order.orderId)}
              disabled={downloadingId === order.orderId}
              className="rounded-full bg-white border border-truffle/20 hover:bg-almond px-4 h-8 text-[11px] font-bold uppercase tracking-wider text-truffle transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {downloadingId === order.orderId ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-truffle" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-cocoa" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Invoice</span>
                </>
              )}
            </button>

            <button
              onClick={() => onToggleExpand(order.orderId)}
              className="rounded-full bg-truffle text-white hover:bg-espresso px-4.5 h-8 border border-transparent text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Track Order</span>
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Order Detail panel */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-truffle/10 bg-white/40 overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-6">
              {/* Delivery tracker timeline progress */}
              <div className="bg-porcelain/50 border border-truffle/5 rounded-2xl p-5 shadow-inner">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-truffle/50 mb-3">Delivery Progress</h4>
                <ProgressTimeline status={order.status} />
                <div className="mt-4 pt-3 border-t border-truffle/5 text-xs text-truffle/75 flex justify-between">
                  <span>Estimated Delivery: <strong>{order.estimatedDelivery || "2 - 4 business days"}</strong></span>
                  <span>Method: <strong className="uppercase">{order.paymentMethod === "cod" ? "COD" : (order.paymentMethod || "COD")}</strong></span>
                </div>
              </div>

              {/* Item breakdowns */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-truffle/50 mb-3">Ordered Items</h4>
                <div className="space-y-3">
                  {order.items?.map((item) => {
                    const prodInfo = getProductById(item.productId);
                    return (
                      <div key={item.productId} className="flex justify-between items-center text-sm bg-white/80 p-3.5 rounded-2xl border border-truffle/5 shadow-sm">
                        <div className="flex items-center gap-3.5 max-w-[80%]">
                          <div className="w-10 h-10 rounded-xl bg-almond/40 border border-truffle/10 flex items-center justify-center text-cocoa font-bold text-xs shrink-0">
                            🌿
                          </div>
                          <div>
                            <p className="font-bold text-truffle leading-snug">{item.productName}</p>
                            <p className="text-xs text-truffle/55 mt-0.5">Quantity: x{item.quantity} | {formatINR(item.unitPrice)} each</p>
                          </div>
                        </div>
                        <span className="font-bold text-cocoa">{formatINR(item.subtotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// Traditional Spice Mortar & Pestle Illustration
function MortarPestleIllustration() {
  return (
    <svg className="w-20 h-20 text-cocoa" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
      {/* Mortar bowl background shape with a soft warm color */}
      <path d="M25,55 C25,75 40,85 50,85 C60,85 75,75 75,55 L25,55 Z" fill="currentColor" fillOpacity="0.06" />
      {/* Mortar lip / rim */}
      <ellipse cx="50" cy="55" rx="25" ry="5" stroke="currentColor" strokeWidth="1.8" />
      {/* Mortar body outline */}
      <path d="M25,55 C25,75 40,85 50,85 C60,85 75,75 75,55" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Mortar base */}
      <path d="M40,85 L60,85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pestle inside the bowl */}
      <path d="M45,30 L65,65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Spices / aroma waves rising */}
      <path d="M30,45 C28,35 32,25 30,15" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
      <path d="M70,45 C72,35 68,25 70,15" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
      {/* Floating leaves */}
      <path d="M40,20 Q45,15 50,20 Q42,22 40,20 Z" fill="currentColor" />
      <path d="M60,25 Q63,20 66,25 Q60,27 60,25 Z" fill="currentColor" />
    </svg>
  );
}

// Premium background decorative spice leaf outlines and traditional motifs at <3% opacity
function LuxuryBackgroundMotifs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-20 select-none opacity-[0.02]">
      {/* Traditional Indian Motif 1 - Top Left */}
      <svg className="absolute top-12 left-10 w-64 h-64 text-cocoa" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
        <circle cx="50" cy="50" r="40" strokeDasharray="1, 2" />
        <circle cx="50" cy="50" r="30" />
        <path d="M 50 10 C 25 35, 25 65, 50 90 C 75 65, 75 35, 50 10 Z" />
        <path d="M 10 50 C 35 25, 65 25, 90 50 C 65 75, 35 75, 10 50 Z" />
      </svg>
      
      {/* Traditional Paisley Motif - Bottom Right */}
      <svg className="absolute bottom-20 right-10 w-80 h-80 text-cocoa" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.4">
        <path d="M50,15 C40,25 25,45 25,60 C25,75 40,85 50,85 C60,85 75,75 75,60 C75,45 60,25 50,15 Z M50,15 C55,20 62,35 62,45 C62,55 58,60 50,60" />
        <circle cx="50" cy="60" r="10" strokeDasharray="2,2" />
      </svg>

      {/* Spice leaf outlines (Curry/mint leaf sprig) - Middle Right */}
      <svg className="absolute top-1/3 right-12 w-48 h-48 text-cocoa" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.6">
        <path d="M20,80 Q50,50 80,20 M50,50 Q60,30 70,25 Q50,40 50,50 M35,65 Q45,45 55,40 Q35,55 35,65 M65,35 Q75,15 85,10 Q65,25 65,35" />
      </svg>
    </div>
  );
}

export default function MyOrdersPage({ onAddMultipleToCart }) {
  const navigate = useNavigate();
  const { user, token, loginWithGoogle, loading: authLoading } = useAuth();

  // Load cached orders instantly from localStorage
  const [cachedOrders, setCachedOrders] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("anjaraipetti_placed_orders") || "[]");
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_e) {
      // ignore
    }
    return [];
  });

  const [orders, setOrders] = useState(cachedOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filters state
  const [searchTab, setSearchTab] = useState("phone"); // phone, orderId
  const [phoneQuery, setPhoneQuery] = useState("");
  const [orderIdQuery, setOrderIdQuery] = useState("");
  const [filterText, setFilterText] = useState(""); // instant filter query
  const [statusFilter, setStatusFilter] = useState("all"); // all, confirmed, shipped, delivered, cancelled
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest

  const [activePhone, setActivePhone] = useState(() => {
    return localStorage.getItem("anjaraipetti_customer_phone") || "";
  });

  // Action feedback states
  const [downloadingId, setDownloadingId] = useState(null);
  const [buyAgainId, setBuyAgainId] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Initialize Google Sign-in picker dynamically with polling to handle async script loading
  useEffect(() => {
    if (user) return;

    const initGoogleBtn = () => {
      if (typeof window === "undefined" || !window.google) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              const res = await loginWithGoogle(response.credential);
              if (res.success) {
                // Login successful - welcome message is animated on header
              } else {
                setError(res.error || "Failed to log in with Google.");
              }
            }
          }
        });
        const btnEl = document.getElementById("google-signin-btn-myorders");
        if (btnEl) {
          window.google.accounts.id.renderButton(
            btnEl,
            { 
              theme: "outline", 
              size: "large", 
              text: "continue_with",
              shape: "pill",
              width: "250"
            }
          );
          return true;
        }
      } catch (err) {
        console.error("Google GIS integration failed on My Orders:", err);
      }
      return false;
    };

    // Try initializing immediately
    const ok = initGoogleBtn();
    if (ok) return;

    // Check periodically if the script is not yet loaded
    const checkInterval = setInterval(() => {
      const done = initGoogleBtn();
      if (done) {
        clearInterval(checkInterval);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, [user, GOOGLE_CLIENT_ID]);

  // Fetch detailed orders on mount or when auth/phone query changes
  useEffect(() => {
    const syncWithBackend = async () => {
      // If we don't have auth token, phone, or cached orders, do nothing
      if (!token && !activePhone && cachedOrders.length === 0) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError("");

      try {
        let queryUrl = "";
        let fetchHeaders = {};

        if (token) {
          queryUrl = `${API_BASE_URL}/api/orders/my-orders`;
          fetchHeaders = {
            Authorization: `Bearer ${token}`
          };
        } else if (activePhone) {
          queryUrl = `${API_BASE_URL}/api/orders?phone=${activePhone}`;
        } else {
          const ids = cachedOrders.map(o => o.orderId);
          queryUrl = `${API_BASE_URL}/api/orders?orderIds=${ids.join(",")}`;
        }

        const response = await fetch(queryUrl, { headers: fetchHeaders });
        const payload = await response.json();
        
        if (response.ok && payload.ok) {
          const fetchedList = payload.orders || [];
          setOrders(fetchedList);

          // Update local cache
          const updatedCache = fetchedList.map(o => ({
            ...o,
            orderId: o.orderId,
            orderDate: o.createdAt,
            totalAmount: o.grandTotal,
            status: o.status
          }));
          
          localStorage.setItem("anjaraipetti_placed_orders", JSON.stringify(updatedCache));
          setCachedOrders(updatedCache);
        } else {
          // If token fails, user might need to log in again
          setError(payload.message || "Failed to load latest order details.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error. Showing offline cached data.");
      } finally {
        setLoading(false);
      }
    };

    syncWithBackend();
  }, [token, activePhone]);



  // Lookup by phone handler (Guest Flow)
  const handlePhoneSearchSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneQuery.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders?phone=${cleanPhone}`);
      const payload = await response.json();

      if (response.ok && payload.ok) {
        const fetchedList = payload.orders || [];
        setOrders(fetchedList);
        setActivePhone(cleanPhone);
        localStorage.setItem("anjaraipetti_customer_phone", cleanPhone);
        
        const updatedCache = fetchedList.map(o => ({
          ...o,
          orderId: o.orderId,
          orderDate: o.createdAt,
          totalAmount: o.grandTotal,
          status: o.status
        }));
        localStorage.setItem("anjaraipetti_placed_orders", JSON.stringify(updatedCache));
        setCachedOrders(updatedCache);
        setSuccessMsg(`Successfully synced ${fetchedList.length} orders!`);
      } else {
        setError(payload.message || "No orders found for this phone number.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to search orders right now. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Lookup single order ID handler
  const handleOrderIdSearchSubmit = async (e) => {
    e.preventDefault();
    const cleanId = orderIdQuery.trim().toUpperCase();
    if (!cleanId.startsWith("ANJ-") || cleanId.length < 8) {
      setError("Please enter a valid Order ID (e.g. ANJ-B1C2D3).");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${cleanId}`);
      const payload = await response.json();

      if (response.ok && payload.ok && payload.order) {
        const o = payload.order;
        
        setOrders(prev => {
          const filtered = prev.filter(x => x.orderId !== o.orderId);
          return [o, ...filtered];
        });

        const exists = cachedOrders.some(x => x.orderId === o.orderId);
        if (!exists) {
          const updatedCache = [
            {
              ...o,
              orderId: o.orderId,
              orderDate: o.createdAt,
              totalAmount: o.grandTotal || o.total,
              status: o.status
            },
            ...cachedOrders
          ];
          localStorage.setItem("anjaraipetti_placed_orders", JSON.stringify(updatedCache));
          setCachedOrders(updatedCache);
        }

        setSuccessMsg(`Successfully added Order ${cleanId}!`);
        setOrderIdQuery("");
        setExpandedOrders(prev => ({ ...prev, [o.orderId]: true }));
      } else {
        setError(payload.message || "Order ID not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve order details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearPhoneSync = () => {
    localStorage.removeItem("anjaraipetti_customer_phone");
    setActivePhone("");
    setPhoneQuery("");
    setOrders([]);
    setError("");
    setSuccessMsg("");
    setCachedOrders([]);
    localStorage.removeItem("anjaraipetti_placed_orders");
  };

  // Download PDF invoice helper
  const handleDownloadInvoice = async (orderId, invoiceNumber) => {
    try {
      setDownloadingId(orderId);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/invoice`, { headers });
      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${invoiceNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (_err) {
      window.alert("Failed to download PDF invoice. Please ensure you are authorized to view this invoice.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Buy Again handler
  const handleBuyAgain = async (order) => {
    if (!order.items || order.items.length === 0) return;
    try {
      setBuyAgainId(order.orderId);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const cartPayload = order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity || 1
      }));

      if (onAddMultipleToCart) {
        onAddMultipleToCart(cartPayload);
      }
      
      navigate("/cart");
    } catch (err) {
      console.error(err);
    } finally {
      setBuyAgainId(null);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Processed orders list based on status filters, text filters, and date/amount sorting
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Filter by status
    if (statusFilter !== "all") {
      result = result.filter(order => {
        const s = String(order.status || "").toLowerCase();
        if (statusFilter === "confirmed") {
          return s.includes("confirm") || s.includes("paid");
        }
        if (statusFilter === "shipped") {
          return s.includes("ship") || s.includes("transit") || s.includes("pack") || s.includes("process");
        }
        if (statusFilter === "delivered") {
          return s.includes("deliver") || s.includes("complete");
        }
        if (statusFilter === "cancelled") {
          return s.includes("cancel") || s.includes("fail");
        }
        return true;
      });
    }

    // 2. Filter by search text
    const query = filterText.toLowerCase().trim();
    if (query) {
      result = result.filter((order) => {
        const matchId = order.orderId.toLowerCase().includes(query);
        const matchProduct = order.items?.some(i =>
          i.productName.toLowerCase().includes(query)
        );
        return matchId || matchProduct;
      });
    }

    // 3. Sort by date or price
    result.sort((a, b) => {
      if (sortBy === "price_asc" || sortBy === "price_desc") {
        const valA = a.grandTotal || a.total || a.totalAmount || 0;
        const valB = b.grandTotal || b.total || b.totalAmount || 0;
        return sortBy === "price_asc" ? valA - valB : valB - valA;
      } else {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortBy === "newest" ? timeB - timeA : timeA - timeB;
      }
    });

    return result;
  }, [orders, statusFilter, filterText, sortBy]);

  const getStatusBadgeStyle = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("delivered") || s.includes("completed")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    }
    if (s.includes("ship") || s.includes("transit") || s.includes("out for delivery")) {
      return "bg-amber-50 text-amber-700 border-amber-200/50";
    }
    if (s.includes("cancel") || s.includes("fail")) {
      return "bg-rose-50 text-rose-700 border-rose-200/50";
    }
    return "bg-cocoa/5 text-cocoa border-truffle/10";
  };

  if (authLoading) {
    return (
      <section className="relative min-h-screen mx-auto w-full max-w-5xl px-6 pb-24 pt-8 md:px-10">
        <SpiceParticles />
        <LuxuryBackgroundMotifs />
        <div className="flex flex-col gap-3 border-b border-truffle/10 pb-6">
          <h1 className="font-display text-4xl text-espresso sm:text-5xl">My Orders</h1>
          <p className="text-sm text-truffle/70 mt-1">Loading your secured orders...</p>
        </div>
        <div className="mt-8 space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-truffle/10 bg-white/70 p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-truffle/5">
                <div className="h-6 w-1/4 bg-truffle/15 rounded"></div>
                <div className="h-8 w-16 bg-truffle/10 rounded-full"></div>
              </div>
              <div className="h-10 w-full bg-truffle/5 rounded"></div>
              <div className="h-16 w-full bg-truffle/10 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="relative min-h-screen mx-auto w-full max-w-5xl px-6 pb-24 pt-8 md:px-10">
        <SpiceParticles />
        <LuxuryBackgroundMotifs />

        {/* Logged In Header */}
        <div className="border-b border-truffle/10 pb-4 pt-2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-1.5"
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-espresso sm:text-5xl">
              Vanakkam, {user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm font-medium text-truffle/60">
              Track deliveries, reorder authentic masalas, and download invoices.
            </p>
          </motion.div>
        </div>

        {/* Filtering & Sorting Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 flex flex-row flex-wrap items-center justify-start sm:justify-end gap-2.5 border-b border-truffle/10 pb-3"
        >
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="rounded-full border border-truffle/20 bg-white/75 pl-8 pr-4 py-1.5 text-xs text-truffle outline-none transition-all duration-300 focus:border-cocoa focus:bg-white hover:border-truffle/35"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-truffle/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 border border-truffle/10 bg-white/70 hover:bg-white hover:border-truffle/20 hover:shadow-sm rounded-full px-3 py-1.5 transition-all duration-300">
            <span className="text-[10px] font-bold text-truffle/55 uppercase tracking-wide">Status:</span>
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Orders" },
                { value: "confirmed", label: "Confirmed" },
                { value: "shipped", label: "In Transit" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" }
              ]}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 border border-truffle/10 bg-white/70 hover:bg-white hover:border-truffle/20 hover:shadow-sm rounded-full px-3 py-1.5 transition-all duration-300">
            <span className="text-[10px] font-bold text-truffle/55 uppercase tracking-wide">Sort By:</span>
            <CustomDropdown
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" }
              ]}
            />
          </div>
        </motion.div>

        {/* Success/Error Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium shadow-sm"
            >
              {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-medium shadow-sm"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders list or skeletons */}
        {loading && orders.length === 0 ? (
          <div className="mt-8 space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-truffle/10 bg-white/70 p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-truffle/5">
                  <div className="h-6 w-1/4 bg-truffle/15 rounded"></div>
                  <div className="h-8 w-16 bg-truffle/10 rounded-full"></div>
                </div>
                <div className="h-10 w-full bg-truffle/5 rounded"></div>
                <div className="h-16 w-full bg-truffle/10 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {processedOrders.length > 0 ? (
              <AnimatePresence>
                {processedOrders.map((order, index) => {
                  const isExpanded = expandedOrders[order.orderId];
                  return (
                    <OrderCard
                      key={order.orderId}
                      order={order}
                      isExpanded={isExpanded}
                      onToggleExpand={toggleOrderExpand}
                      getStatusBadgeStyle={getStatusBadgeStyle}
                      buyAgainId={buyAgainId}
                      downloadingId={downloadingId}
                      handleBuyAgain={handleBuyAgain}
                      handleDownloadInvoice={handleDownloadInvoice}
                    />
                  );
                })}
              </AnimatePresence>
            ) : (
              /* User Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-truffle/10 bg-white/75 p-12 text-center shadow-luxe backdrop-blur-xl"
              >
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-almond/50 border border-biscuit/40 mb-6 shadow-inner">
                  <MortarPestleIllustration />
                </div>
                <h3 className="font-display text-3xl text-truffle font-semibold">Your Spice Journey Starts Here 🌿</h3>
                <p className="mt-2 text-sm text-truffle/60 max-w-md mx-auto leading-relaxed">
                  Discover handcrafted masalas made using traditional recipes and premium ingredients.
                </p>
                <div className="mt-8 flex items-center justify-center">
                  <Link
                    to="/product"
                    className="rounded-full bg-truffle text-white hover:bg-espresso px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition shadow-md block text-center cursor-pointer"
                  >
                    Explore Products
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </section>
    );
  }

  // Guest / Unauthenticated Login UI Flow
  return (
    <section className="relative min-h-screen mx-auto w-full max-w-5xl px-6 pb-24 pt-8 md:px-10">
      <SpiceParticles />
      <LuxuryBackgroundMotifs />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-truffle/10 pb-4 pt-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          <h1 className="font-display text-4xl text-espresso sm:text-5xl font-semibold">
            My Orders
          </h1>
          <p className="text-sm text-truffle/70">
            Track deliveries, reorder your favorite masalas, and download invoices.
          </p>
        </motion.div>

        {activePhone && (
          <button
            onClick={handleClearPhoneSync}
            className="w-fit text-xs font-bold uppercase tracking-wider text-cocoa hover:text-white border border-cocoa/30 bg-white/60 hover:bg-cocoa px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm cursor-pointer"
          >
            Sign Out Phone Sync
          </button>
        )}
      </div>

      {/* Guest Login Callout */}
      {!activePhone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-3xl border border-amber/30 bg-gradient-to-br from-almond/60 to-porcelain/90 p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-halo relative overflow-hidden group"
        >
          {/* Accent Glow Element */}
          <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-amber/10 blur-2xl group-hover:bg-amber/15 transition-all duration-500" />
          
          <div className="space-y-1.5 max-w-xl relative z-10">
            <h3 className="font-display text-xl text-espresso flex items-center gap-2 font-semibold">
              <span>🔒</span> Sync & Secure Your Order History
            </h3>
            <p className="text-xs text-truffle/80 leading-relaxed font-body">
              Continue with your Google account to automatically track your orders, save multiple shipping addresses, download PDF receipts instantly, and unlock future loyalty rewards.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 shrink-0 relative z-10 w-full sm:w-auto">
            {/* Premium Google Button Wrapper */}
            <div className="relative group/btn overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(208,132,62,0.3)] bg-gradient-to-r from-amber via-yellow-500 to-amber-700 w-[254px]">
              <div className="rounded-full bg-white p-0.5">
                <div id="google-signin-btn-myorders" className="relative z-10" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

    </section>
  );
}
