import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../config/runtime";
import TruckOrderButton from "../components/TruckOrderButton";
import { useAuth } from "../context/AuthContext";

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

export default function CheckoutPage({ cartItems, onClearCart, deliveryChargeEnabled = true }) {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const pendingOrderId = useRef("");   // holds orderId until animation completes
  const isAnimating   = useRef(false); // true while truck animation is running
  const isConfirmed   = useRef(false); // true after animation completes to bypass redirect guard
  const isAnimationFinished = useRef(false); // true after GSAP animation completes
  const pendingRazorpayResponse = useRef(null);
  const { user, token, loginWithGoogle } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);

  // Pre-fill checkout form details if user is authenticated
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0] || {};
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        line1: prev.line1 || defaultAddr.line1 || "",
        line2: prev.line2 || defaultAddr.line2 || "",
        landmark: prev.landmark || defaultAddr.landmark || "",
        city: prev.city || defaultAddr.city || "",
        state: prev.state || defaultAddr.state || "",
        pincode: prev.pincode || defaultAddr.pincode || ""
      }));
    }
  }, [user]);

  // Initialize Google Sign-in button for checkout authentication
  useEffect(() => {
    if (user) return;

    const initGoogleBtn = () => {
      if (typeof window === "undefined" || !window.google) return false;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response.credential) {
              await loginWithGoogle(response.credential);
            }
          }
        });
        const btnEl = document.getElementById("google-signin-btn-checkout-login");
        if (btnEl) {
          window.google.accounts.id.renderButton(btnEl, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            width: "250"
          });
          return true;
        }
      } catch (err) {
        console.error("Google sign-in initialization failed on Checkout Page:", err);
      }
      return false;
    };

    const ok = initGoogleBtn();
    if (ok) return;

    const checkInterval = setInterval(() => {
      const done = initGoogleBtn();
      if (done) {
        clearInterval(checkInterval);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, [user, GOOGLE_CLIENT_ID]);

  useEffect(() => {
    const pin = form.pincode.trim();
    if (/^\d{6}$/.test(pin)) {
      const fetchAddress = async () => {
        setIsFetchingPincode(true);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.pincode;
          return next;
        });
        try {
          const response = await fetch(`${API_BASE_URL}/api/pincode/${pin}`);
          if (!response.ok) throw new Error();
          const payload = await response.json();
          if (payload.ok && payload.data && payload.data[0] && payload.data[0].Status === "Success" && payload.data[0].PostOffice && payload.data[0].PostOffice[0]) {
            const po = payload.data[0].PostOffice[0];
            setForm((prev) => ({
              ...prev,
              city: po.District || po.Division || prev.city,
              state: po.State || prev.state
            }));
          } else {
            setErrors((prev) => ({ ...prev, pincode: "Invalid pincode" }));
          }
        } catch {
          // ignore network errors silently
        } finally {
          setIsFetchingPincode(false);
        }
      };
      fetchAddress();
    }
  }, [form.pincode]);

  const subtotal = useMemo(() => cartItems?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0, [cartItems]);
  const hasTestProduct = useMemo(() => cartItems?.some(item => item.product.id === "test-product" || item.product.id.startsWith("test-product")) || false, [cartItems]);
  const deliveryFee = useMemo(() => !deliveryChargeEnabled || hasTestProduct ? 0 : (subtotal >= 299 ? 0 : 50), [subtotal, hasTestProduct, deliveryChargeEnabled]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  // Don't redirect if truck animation is in progress or order is confirmed
  if ((!cartItems || cartItems.length === 0) && !isSubmitting && !confirmedOrderId && !isAnimating.current && !isConfirmed.current) {
    return <Navigate to="/cart" replace />;
  }

  // Force login before checkout can be accessed
  if (!user) {
    return (
      <section className="relative min-h-[80vh] mx-auto w-full max-w-xl px-6 flex items-center justify-center">
        <div className="w-full text-center bg-gradient-to-br from-almond/50 to-porcelain/90 rounded-3xl border border-amber/30 p-8 shadow-halo backdrop-blur-xl space-y-6 relative overflow-hidden group">
          {/* Accent Glow Element */}
          <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-amber/10 blur-2xl group-hover:bg-amber/15 transition-all duration-500" />
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 text-3xl border border-amber/20 relative z-10">
            🔒
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-3xl text-espresso font-semibold animate-pulse">Sign in to Checkout</h2>
            <p className="text-xs text-truffle/80 mt-2 leading-relaxed font-body">
              Please sign in using your Google account to complete your purchase. This links this order to your email, allowing you to track deliveries, download PDF receipts instantly, and secure your order history.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 pt-2 relative z-10">
            {/* Premium Google Button Wrapper */}
            <div className="relative group/btn overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(208,132,62,0.3)] bg-gradient-to-r from-amber via-yellow-500 to-amber-700 w-[254px]">
              <div className="rounded-full bg-white p-0.5">
                <div id="google-signin-btn-checkout-login" className="relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
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

  const focusFirstInvalidField = (errorBag) => {
    if (!errorBag || typeof errorBag !== "object") return;
    const priority = ["customerName", "phone", "line1", "addressLine1", "city", "state", "pincode"];
    const firstErrorKey = priority.find((key) => errorBag[key]) || Object.keys(errorBag)[0];
    if (!firstErrorKey) return;
    const inputName = firstErrorKey === "addressLine1" ? "line1" : firstErrorKey;
    const field = formRef.current?.querySelector(`[name="${inputName}"]`);
    if (!field) return;
    field.focus({ preventScroll: true });
    field.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // Called by the API — store orderId, but DON'T clear cart yet (animation still running)
  const showConfirmation = (nextOrderId) => {
    pendingOrderId.current = nextOrderId;
    try {
      let savedOrders = [];
      try {
        const parsed = JSON.parse(localStorage.getItem("anjaraipetti_placed_orders") || "[]");
        if (Array.isArray(parsed)) {
          savedOrders = parsed.map(o => {
            if (typeof o === "string") {
              return {
                orderId: o,
                orderDate: new Date().toISOString(),
                totalAmount: 0,
                status: "Order confirmed"
              };
            }
            return o;
          });
        }
      } catch (e) {
        savedOrders = [];
      }

      const exists = savedOrders.some(o => o && o.orderId === nextOrderId);
      if (!exists) {
        savedOrders.push({
          orderId: nextOrderId,
          orderDate: new Date().toISOString(),
          totalAmount: total,
          status: "Order confirmed"
        });
        localStorage.setItem("anjaraipetti_placed_orders", JSON.stringify(savedOrders));
      }
      if (form.phone) {
        localStorage.setItem("anjaraipetti_customer_phone", form.phone.trim());
      }
    } catch (e) {
      console.error("Error updating local storage with order/phone:", e);
    }
    // If the animation has already finished driving, show the popup immediately!
    if (isAnimationFinished.current) {
      isConfirmed.current = true;
      setConfirmedOrderId(nextOrderId);
      if (onClearCart) onClearCart();
    }
  };

  // Called by TruckOrderButton when the truck fully exits
  const handleAnimationDone = () => {
    isAnimating.current = false;
    isAnimationFinished.current = true;
    // If the network request has already completed, show the popup!
    if (pendingOrderId.current) {
      isConfirmed.current = true;
      setConfirmedOrderId(pendingOrderId.current);
      if (onClearCart) onClearCart(); // clear cart only after showing confirmation
    }
  };

  const placeCodOrder = async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        customer,
        address,
        payment: {
          method: "cod"
        }
      })
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      const nextErrors = payload.errors || {};
      setErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      throw new Error("Unable to place COD order");
    }
    showConfirmation(payload.order.orderId);
  };

  const placeRazorpayOrder = async () => {
    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) throw new Error("Unable to load Razorpay checkout script");

    const createOrderResponse = await fetch(`${API_BASE_URL}/api/payments/razorpay/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      })
    });
    const createOrderPayload = await createOrderResponse.json();
    if (!createOrderResponse.ok || !createOrderPayload.ok) {
      const details = createOrderPayload.error ? `: ${createOrderPayload.error}` : "";
      throw new Error((createOrderPayload.message || "Unable to initialize Razorpay") + details);
    }

    const keyId = createOrderPayload.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) throw new Error("Missing Razorpay key. Set RAZORPAY_KEY_ID and VITE_RAZORPAY_KEY_ID.");

    const result = await new Promise((resolve, reject) => {
      const rz = new window.Razorpay({
        key: keyId,
        amount: createOrderPayload.razorpayOrder.amount,
        currency: createOrderPayload.razorpayOrder.currency,
        name: "Namma Veetu Anjaraipetti",
        description: `${cartItems.length} item(s)`,
        order_id: createOrderPayload.razorpayOrder.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        notes: {
          itemsCount: String(cartItems.length)
        },
        theme: {
          color: "#8a4a22"
        },
        handler: (response) => {
          // Resolve immediately when user completes payment!
          resolve(response);
        },
        modal: {
          ondismiss: () => reject(new Error("Payment popup closed"))
        }
      });
      rz.open();
    });

    pendingRazorpayResponse.current = result;
  };

  // Runs BEFORE animation — throws on validation or Razorpay failure
  const handleValidateCheckout = async () => {
    setServerError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField(nextErrors);
      throw new Error("validation");
    }

    if (form.paymentMethod === "razorpay") {
      setIsSubmitting(true);
      isAnimating.current = true; // block redirect guard
      try {
        await placeRazorpayOrder();
      } catch (error) {
        isAnimating.current = false;
        setServerError(error.message || "Unable to process payment right now. Please try again.");
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Runs DURING animation — throws on payment verification or COD order placement failure
  const handleExecuteCheckout = async () => {
    isAnimating.current = true; // block redirect guard
    setIsSubmitting(true);
    try {
      if (form.paymentMethod === "cod") {
        await placeCodOrder();
      } else {
        // For Razorpay, the payment is complete! Verify signature and create invoice in the background during the animation
        const response = pendingRazorpayResponse.current;
        if (!response) throw new Error("Payment signature missing");

        const confirmResponse = await fetch(
          `${API_BASE_URL}/api/orders/razorpay/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              items: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
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
          const errorMsg = confirmPayload.error || confirmPayload.message || "Payment verification failed";
          throw new Error(errorMsg);
        }
        showConfirmation(confirmPayload.order.orderId);
      }
    } catch (error) {
      isAnimating.current = false;
      setServerError(error.message || "Unable to place order right now. Please try again.");
      throw error;
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

      <form ref={formRef} onSubmit={e => e.preventDefault()} className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <section>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-truffle/10 pb-3">
              <h2 className="font-display text-3xl text-truffle">Delivery Address</h2>
              <p className="text-xs text-truffle/50">
                <span className="text-red-500 font-bold">*</span> Indicates mandatory fields
              </p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <input name="customerName" value={form.customerName} onChange={handleInput} className={inputClass} />
                {errors.customerName ? <p className="mt-1 text-xs text-red-600">{errors.customerName}</p> : null}
              </div>
              <div>
                <label className={labelClass}>Mobile Number <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <input name="phone" value={form.phone} onChange={handleInput} className={inputClass} />
                {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email Address</label>
                <input name="email" value={form.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Address Line 1 <span className="text-red-500 font-bold ml-0.5">*</span></label>
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
              <div className="relative">
                <label className={labelClass}>Pincode <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <div className="relative">
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      handleInput({ target: { name: "pincode", value: val } });
                    }}
                    className={inputClass}
                    placeholder="Enter 6-digit Pincode"
                  />
                  {isFetchingPincode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-cocoa/50">
                      <svg className="animate-spin h-5 w-5 text-cocoa" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {errors.pincode ? <p className="mt-1 text-xs text-red-600">{errors.pincode}</p> : null}
              </div>
              <div>
                <label className={labelClass}>City <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <input name="city" value={form.city} onChange={handleInput} className={inputClass} />
                {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city}</p> : null}
              </div>
              <div>
                <label className={labelClass}>State <span className="text-red-500 font-bold ml-0.5">*</span></label>
                <input name="state" value={form.state} onChange={handleInput} className={inputClass} />
                {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state}</p> : null}
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-3xl text-truffle">Payment Method</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-cocoa bg-cocoa/10 px-4 py-3 text-sm text-cocoa font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-cocoa mr-3 animate-pulse"></span>
                  Razorpay (UPI/Card/Netbanking)
                </div>
              </div>
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
          <div className="mt-4 mb-2 space-y-3">
            {cartItems?.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-truffle">{item.product.name} (x{item.quantity})</span>
                <span className="text-cocoa font-medium">{formatINR(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-truffle/85 text-sm">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery Fee</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE</span>
                ) : (
                  formatINR(deliveryFee)
                )}
              </span>
            </div>
            <div className="border-t border-truffle/10 pt-3 text-lg font-semibold">
              <div className="flex items-center justify-between">
                <span>Grand Total</span>
                <span className="text-cocoa font-bold">{formatINR(total)}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <TruckOrderButton
              label={form.paymentMethod === "cod" ? "Place COD Order" : "Pay with Razorpay"}
              successLabel="Order Placed"
              disabled={isSubmitting}
              onValidate={handleValidateCheckout}
              onClick={handleExecuteCheckout}
              onDone={handleAnimationDone}
            />
          </div>
          <Link
            to="/cart"
            className="btn-hover mt-3 inline-flex w-full justify-center rounded-full border border-truffle/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond"
          >
            Back To Cart
          </Link>
        </motion.aside>
      </form>

      {confirmedOrderId ? (
        <>
          <style>{`
            @keyframes confirmationFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes confirmationScaleIn {
              from { transform: scale(0.9) translateY(20px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes confirmationPopCircle {
              from { transform: scale(0.8) rotate(-12deg); opacity: 0; }
              to { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes confirmationDrawCheckmark {
              from { stroke-dashoffset: 50; }
              to { stroke-dashoffset: 0; }
            }
            .animate-confirmation-fade-in {
              animation: confirmationFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-confirmation-scale-in {
              animation: confirmationScaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .animate-confirmation-pop-circle {
              opacity: 0;
              animation: confirmationPopCircle 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
            }
            .animate-confirmation-draw-checkmark {
              stroke-dasharray: 50;
              stroke-dashoffset: 50;
              animation: confirmationDrawCheckmark 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
            }
          `}</style>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm animate-confirmation-fade-in">
            <div className="w-full max-w-md rounded-3xl border border-white/25 bg-white/90 p-8 text-center shadow-2xl animate-confirmation-scale-in">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 animate-confirmation-pop-circle">
                <svg width="46" height="46" viewBox="0 0 52 52" aria-hidden="true">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="#34D399" strokeWidth="4" />
                  <path
                    d="M15 27L23 34L37 19"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-confirmation-draw-checkmark"
                  />
                </svg>
              </div>

              <h3 className="mt-5 font-display text-4xl text-emerald-800">Order Confirmed</h3>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-truffle/70">Order ID: {confirmedOrderId}</p>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsDownloading(true);
                      const response = await fetch(`${API_BASE_URL}/api/orders/${confirmedOrderId}/invoice`);
                      if (!response.ok) throw new Error();
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `Invoice_${confirmedOrderId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch {
                      window.alert("Unable to download invoice right now.");
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                  disabled={isDownloading}
                  className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700 shadow-md disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isDownloading ? "Preparing PDF..." : "Download Invoice"}
                </button>
                <Link
                  to={`/order/${confirmedOrderId}`}
                  className="w-full rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-50 shadow-sm block"
                >
                  View Order Details
                </Link>


              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
