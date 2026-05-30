import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AddToCartButton from "../components/AddToCartButton";

export default function ProductPage({
  products = [],
  ingredients = [],
  onAddToCart,
  availableMap = {}
}) {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = useMemo(() => {
    return products.find((p) => p.id === productId) || null;
  }, [products, productId]);

  const [selectedVariantId, setSelectedVariantId] = useState(
    product?.variants?.[0]?.id || product?.id || ""
  );

  // Reset selected variant whenever the product changes (swipe navigation)
  useEffect(() => {
    if (product) {
      setSelectedVariantId(product.variants?.[0]?.id || product.id || "");
    }
  }, [product?.id]);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    return product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0] || product;
  }, [product, selectedVariantId]);

  const [direction, setDirection] = useState(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const tiltX = useSpring(rotateX, { stiffness: 180, damping: 22, mass: 0.8 });
  const tiltY = useSpring(rotateY, { stiffness: 180, damping: 22, mass: 0.8 });
  const [quantity, setQuantity] = useState(1);

  if (!product || !selectedVariant) {
    return (
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10 md:pt-20 text-center">
        <h2 className="font-display text-3xl text-espresso">Product Not Found</h2>
        <p className="mt-4 text-truffle/80">We couldn't find the requested spice blend.</p>
        <Link
          to="/product"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-truffle px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-porcelain transition hover:bg-espresso shadow-sm cursor-pointer"
        >
          Back to Products
        </Link>
      </section>
    );
  }

  const available = Number(availableMap?.[selectedVariant.id] ?? 9999);

  const swipeToProduct = (newDirection) => {
    if (!products || products.length === 0) return;
    setDirection(newDirection);
    const currentIndex = products.findIndex((p) => p.id === product.id);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex + newDirection;
    if (nextIndex < 0) nextIndex = products.length - 1;
    if (nextIndex >= products.length) nextIndex = 0;
    navigate(`/product/${products[nextIndex].id}`);
  };

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rotateY.set((x - 0.5) * 14);
    rotateX.set((0.5 - y) * 14);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const increaseQuantity = () => {
    setQuantity((q) => Math.min(Math.max(1, available), q + 1));
  };

  const decreaseQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10 md:pt-20">

      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-r from-amber/20 to-transparent blur-2xl" />
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              onMouseMove={handlePointerMove}
              onMouseLeave={resetTilt}
              drag="x"
              dragElastic={0.2}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.x) > 100) {
                  swipeToProduct(info.offset.x > 0 ? -1 : 1);
                }
              }}
              initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d", perspective: 1200 }}
              className="relative cursor-grab rounded-[2.3rem] border border-truffle/15 bg-white/70 p-5 shadow-luxe backdrop-blur-xl active:cursor-grabbing"
            >
              <img src={product.image} alt={product.name} className="aspect-[4/5] w-full rounded-[2rem] object-contain shadow-halo" />
              <p className="mt-4 text-center text-xs text-truffle/50">← Swipe or drag to browse →</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75 }}
          className="rounded-[2rem] border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl"
        >
          <p className="text-xs uppercase tracking-[0.32em] text-cocoa/70">Product Detail</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] text-espresso">{product.name}</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-cocoa/65">{product.subtitle}</p>
          <p className="mt-6 leading-relaxed text-truffle/80">{product.description}</p>

          {product.variants && product.variants.length > 1 && (
            <div className="mt-6">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-cocoa/60">Select Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`relative rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                      selectedVariantId === v.id
                        ? "border-truffle bg-truffle text-porcelain shadow-[0_4px_14px_rgba(90,50,25,0.35)] scale-105"
                        : "border-truffle/25 bg-white/80 text-truffle hover:border-truffle/60 hover:bg-almond"
                    }`}
                  >
                    {v.size}
                    {selectedVariantId === v.id && (
                      <span className="ml-2 text-xs opacity-80">₹{v.price}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-end justify-between gap-5 border-t border-truffle/10 pt-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cocoa/60">Price</p>
              <p className="mt-1 font-display text-5xl text-cocoa">INR {selectedVariant.price}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-truffle/15 bg-white/80 p-1">
              <button
                type="button"
                onClick={decreaseQuantity}
                className="h-9 w-9 rounded-full bg-almond text-xl text-truffle transition hover:bg-biscuit"
              >
                -
              </button>
              <span className="w-10 text-center font-semibold text-truffle">{quantity}</span>
              <button
                type="button"
                onClick={increaseQuantity}
                className="h-9 w-9 rounded-full bg-almond text-xl text-truffle transition hover:bg-biscuit"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-6">
            <AddToCartButton label="Add to Cart" onAdd={() => onAddToCart(selectedVariant.id, quantity)} />
          </div>
        </motion.div>
      </div>

      {/* Simplified generic Sourcing details & Recipe Link */}
      <section className="mt-16 rounded-[2rem] border border-truffle/10 bg-white/70 p-8 shadow-luxe backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.32em] text-cocoa/70">Ingredients & Sourcing</p>
        <h2 className="mt-2 font-display text-3xl text-espresso">Selected Premium Spices</h2>
        <p className="mt-4 leading-relaxed text-sm text-truffle/80">
          Our blends are handcrafted using only the finest ingredients sourced directly from traditional farms. 
          We carefully hand-pick premium sun-dried red chilies, aromatic coriander seeds, sharp black peppercorns, cloves, 
          shahi jeera, and traditional spices. Everything is slow-roasted in small batches to preserve natural oils and 
          aroma, with zero preservatives or artificial colorings added.
        </p>

        {product.id !== "test-product" && (
          <div className="mt-6 border-t border-truffle/10 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-espresso">Ready to cook?</h4>
              <p className="text-xs text-truffle/70 mt-0.5">Explore our traditional chef-recommended recipe for this blend.</p>
            </div>
            <Link
              to={`/recipe/${product.id}`}
              className="inline-flex items-center justify-center rounded-full bg-truffle px-6 py-3 text-xs font-semibold uppercase tracking-wider text-porcelain transition hover:bg-espresso shadow-sm"
            >
              📖 View Cooking Recipe
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}
