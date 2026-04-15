import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BrandHatMark from "../components/BrandHatMark";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

const logoNodes = [
  { top: "6%", left: "4%", size: 160, duration: 15, drift: 28, rotate: 7, delay: 0 },
  { top: "18%", left: "76%", size: 120, duration: 13, drift: 24, rotate: 6, delay: 1.4 },
  { top: "54%", left: "10%", size: 210, duration: 18, drift: 30, rotate: 8, delay: 0.9 },
  { top: "62%", left: "70%", size: 140, duration: 12, drift: 22, rotate: 5, delay: 1.8 },
  { top: "82%", left: "38%", size: 180, duration: 16, drift: 26, rotate: 7, delay: 0.6 }
];

function CartLogoBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {logoNodes.map((node, index) => (
        <motion.div
          key={index}
          className="absolute text-cocoa"
          style={{ top: node.top, left: node.left, width: node.size, opacity: 0.14 }}
          animate={{
            y: [0, -node.drift, 0],
            x: [0, node.drift * 0.5, 0],
            rotate: [-node.rotate, node.rotate, -node.rotate],
            opacity: [0.08, 0.18, 0.08]
          }}
          transition={{
            duration: node.duration,
            delay: node.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        >
          <BrandHatMark />
        </motion.div>
      ))}
    </div>
  );
}

export default function CartPage({ cartProduct, cartQuantity, onUpdateQuantity }) {
  if (!cartProduct || cartQuantity === 0) {
    return (
      <section className="relative isolate mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center overflow-hidden px-6 py-20 md:px-10">
        <CartLogoBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[2rem] border border-truffle/10 bg-white/75 p-10 text-center shadow-luxe backdrop-blur-xl"
        >
          <div className="mx-auto mb-2 h-12 w-36 opacity-75">
            <BrandHatMark />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Cart</p>
          <h1 className="mt-3 font-display text-5xl text-espresso">Your cart is empty</h1>
          <p className="mx-auto mt-4 max-w-lg text-truffle/80">
            Add Anjaraipetti Biryani Masala, Chilli Masala, Chicken Masala, or Mutton Masala to begin your order.
          </p>
          <Link
            to="/product/biryani-masala"
            className="mt-8 inline-flex rounded-full bg-truffle px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso"
          >
            Go To Product
          </Link>
        </motion.div>
      </section>
    );
  }

  const subtotal = cartProduct.price * cartQuantity;
  const tax = Number((subtotal * 0.05).toFixed(2));
  const shipping = cartQuantity > 0 ? 99 : 0;
  const total = subtotal + tax + shipping;

  return (
    <section className="relative isolate mx-auto w-full max-w-6xl overflow-hidden px-6 pb-20 pt-12 md:px-10 md:pt-16">
      <CartLogoBackground />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-4">
        <div className="h-12 w-36 opacity-80">
          <BrandHatMark />
        </div>
        <h1 className="font-display text-5xl text-espresso">Your Cart</h1>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <div className="flex flex-col gap-5 sm:flex-row">
            <img src={cartProduct.image} alt={cartProduct.name} className="h-36 w-full rounded-2xl object-cover sm:w-44" />
            <div className="flex-1">
              <h2 className="font-display text-3xl text-truffle">{cartProduct.name}</h2>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cocoa/65">{cartProduct.size}</p>
              <p className="mt-3 text-truffle/80">{formatINR(cartProduct.price)} per pack</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-truffle/15 bg-white p-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(cartProduct.id, cartQuantity - 1)}
                  className="h-9 w-9 rounded-full bg-almond text-xl text-truffle transition hover:bg-biscuit"
                >
                  -
                </button>
                <span className="w-10 text-center font-semibold text-truffle">{cartQuantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(cartProduct.id, cartQuantity + 1)}
                  className="h-9 w-9 rounded-full bg-almond text-xl text-truffle transition hover:bg-biscuit"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">Order Summary</p>
          <div className="mt-5 space-y-3 text-truffle/85">
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
            <div className="mt-3 border-t border-truffle/10 pt-3 text-lg font-semibold">
              <div className="flex items-center justify-between">
                <span>Grand Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </div>
          <Link
            to="/checkout"
            className="mt-7 inline-flex w-full justify-center rounded-full bg-truffle px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso"
          >
            Proceed To Checkout
          </Link>
          <Link
            to={`/product/${cartProduct.id}`}
            className="mt-3 inline-flex w-full justify-center rounded-full border border-truffle/20 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond"
          >
            Continue Shopping
          </Link>
        </motion.aside>
      </div>
    </section>
  );
}
