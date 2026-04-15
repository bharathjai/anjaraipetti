import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/runtime";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const initialForm = {
  customerName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  paymentMethod: "razorpay"
};

export default function CheckoutPage({ cartProduct, cartQuantity }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  const subtotal = useMemo(() => (cartProduct ? cartProduct.price * cartQuantity : 0), [cartProduct, cartQuantity]);
  const tax = Number((subtotal * 0.05).toFixed(2));
  const shipping = cartQuantity > 0 ? 99 : 0;
  const total = subtotal + tax + shipping;

  if ((!cartProduct || cartQuantity < 1) && !isSubmitting) {
    return <Navigate to="/cart" replace />;
  }

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.customerName.trim()) next.customerName = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) next.phone = "Enter valid 10-digit mobile number";
    if (!form.line1.trim()) next.line1 = "Address line is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.state.trim()) next.state = "State is required";
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = "Enter valid 6-digit pincode";
    return next;
  };

  const customer = {
    name: form.customerName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim()
  };
  const address = {
    line1: form.line1.trim(),
    line2: form.line2.trim(),
    landmark: form.landmark.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim()
  };

  const showConfirmationAndNavigate = async (nextOrderId) => {
    setConfirmedOrderId(nextOrderId);
    await new Promise((resolve) => {
      window.setTimeout(resolve, 1700);
    });
    navigate(`/order/${nextOrderId}`);
  };

  const placeCodOrder = async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: cartProduct.id,
          quantity: cartQuantity,
          customer,
          address,
        payment: {
          method: "cod"
        }
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      setErrors(payload.errors || {});
      throw new Error("Unable to place COD order");
    }
    await showConfirmationAndNavigate(payload.order.orderId);
  };

  const placeRazorpayOrder = async () => {
    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) throw new Error("Unable to load Razorpay checkout script");

    const createOrderResponse = await fetch(`${API_BASE_URL}/api/payments/razorpay/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: cartQuantity
      })
    });
    const createOrderPayload = await createOrderResponse.json();
    if (!createOrderResponse.ok || !createOrderPayload.ok) {
      throw new Error(createOrderPayload.message || "Unable to initialize Razorpay");
    }

    const keyId = createOrderPayload.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) throw new Error("Missing Razorpay key. Set RAZORPAY_KEY_ID and VITE_RAZORPAY_KEY_ID.");

    const result = await new Promise((resolve, reject) => {
      const rz = new window.Razorpay({
        key: keyId,
        amount: createOrderPayload.razorpayOrder.amount,
        currency: createOrderPayload.razorpayOrder.currency,
        name: "Anjaraipetti",
        description: `${cartProduct.name} x ${cartQuantity}`,
        order_id: createOrderPayload.razorpayOrder.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        notes: {
          product: cartProduct.id,
          quantity: String(cartQuantity)
        },
        theme: {
          color: "#8a4a22"
        },
        handler: async (response) => {
          try {
            const confirmResponse = await fetch(
              `${API_BASE_URL}/api/orders/razorpay/confirm`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  productId: cartProduct.id,
                  quantity: cartQuantity,
                  customer,
                  address,
                  payment: {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature
                  }
                })
              }
            );
            const confirmPayload = await confirmResponse.json();
            if (!confirmResponse.ok || !confirmPayload.ok) {
              reject(new Error(confirmPayload.message || "Payment verification failed"));
              return;
            }
            resolve(confirmPayload.order.orderId);
          } catch (_error) {
            reject(new Error("Unable to verify Razorpay payment"));
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment popup closed"))
        }
      });
      rz.open();
    });

    await showConfirmationAndNavigate(result);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      if (form.paymentMethod === "cod") {
        await placeCodOrder();
      } else {
        await placeRazorpayOrder();
      }
    } catch (error) {
      setServerError(error.message || "Unable to place order right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-truffle/20 bg-white/80 px-4 py-3 text-sm text-truffle outline-none transition focus:border-cocoa focus:ring-2 focus:ring-cocoa/15";
  const labelClass = "text-xs font-semibold uppercase tracking-[0.16em] text-cocoa/70";

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl text-espresso">
        Checkout
      </motion.h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <section>
            <h2 className="font-display text-3xl text-truffle">Delivery Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name</label>
                <input name="customerName" value={form.customerName} onChange={handleInput} className={inputClass} />
                {errors.customerName ? <p className="mt-1 text-xs text-red-600">{errors.customerName}</p> : null}
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input name="phone" value={form.phone} onChange={handleInput} className={inputClass} />
                {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email (Optional)</label>
                <input name="email" value={form.email} onChange={handleInput} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 1</label>
                <input name="line1" value={form.line1} onChange={handleInput} className={inputClass} />
                {errors.line1 || errors.addressLine1 ? (
                  <p className="mt-1 text-xs text-red-600">{errors.line1 || errors.addressLine1}</p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 2 (Optional)</label>
                <input name="line2" value={form.line2} onChange={handleInput} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Landmark (Optional)</label>
                <input name="landmark" value={form.landmark} onChange={handleInput} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input name="city" value={form.city} onChange={handleInput} className={inputClass} />
                {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city}</p> : null}
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input name="state" value={form.state} onChange={handleInput} className={inputClass} />
                {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state}</p> : null}
              </div>
              <div>
                <label className={labelClass}>Pincode</label>
                <input name="pincode" value={form.pincode} onChange={handleInput} className={inputClass} />
                {errors.pincode ? <p className="mt-1 text-xs text-red-600">{errors.pincode}</p> : null}
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl text-truffle">Payment Method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { id: "razorpay", label: "Razorpay (UPI/Card/Netbanking)" },
                { id: "cod", label: "Cash on Delivery" }
              ].map((method) => (
                <label
                  key={method.id}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
                    form.paymentMethod === method.id
                      ? "border-cocoa bg-cocoa/10 text-cocoa"
                      : "border-truffle/20 bg-white/70 text-truffle"
                  }`}
                >
                  <input
                    type="radio"
                    className="mr-2"
                    name="paymentMethod"
                    value={method.id}
                    checked={form.paymentMethod === method.id}
                    onChange={handleInput}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </section>

          {serverError ? <p className="text-sm font-semibold text-red-700">{serverError}</p> : null}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="h-fit rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Order Summary</p>
          <h2 className="mt-3 font-display text-3xl text-truffle">{cartProduct?.name}</h2>
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-cocoa/65">
            Qty {cartQuantity} x {formatINR(cartProduct?.price || 0)}
          </p>
          <div className="mt-5 space-y-2 text-truffle/85">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{formatINR(shipping)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax (5%)</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="border-t border-truffle/10 pt-3 text-lg font-semibold">
              <div className="flex items-center justify-between">
                <span>Grand Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Processing..." : form.paymentMethod === "cod" ? "Place COD Order" : "Pay with Razorpay"}
          </button>
          <Link
            to="/cart"
            className="mt-3 inline-flex w-full justify-center rounded-full border border-truffle/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond"
          >
            Back To Cart
          </Link>
        </motion.aside>
      </form>

      <AnimatePresence>
        {confirmedOrderId ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/25 bg-white/90 p-8 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
              >
                <svg width="46" height="46" viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="#34D399" strokeWidth="4" />
                  <motion.path
                    d="M15 27L23 34L37 19"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.45, delay: 0.15 }}
                  />
                </svg>
              </motion.div>

              <h3 className="mt-5 font-display text-4xl text-emerald-800">Order Confirmed</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Redirecting to your order details...
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-truffle/70">Order ID: {confirmedOrderId}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
