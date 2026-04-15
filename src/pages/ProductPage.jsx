import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddToCartButton from "../components/AddToCartButton";
import { getProductById } from "../data/products";

function StarLine({ count }) {
  return (
    <div className="flex gap-1 text-amber">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={`${count}-${index}`} className={index < count ? "opacity-100" : "opacity-30"}>
          *
        </span>
      ))}
    </div>
  );
}

export default function ProductPage({
  products,
  ingredients,
  reviews,
  onAddToCart,
  availableMap,
  cartProductId
}) {
  const { productId } = useParams();
  const product = useMemo(() => getProductById(productId), [productId]);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const tiltX = useSpring(rotateX, { stiffness: 180, damping: 22, mass: 0.8 });
  const tiltY = useSpring(rotateY, { stiffness: 180, damping: 22, mass: 0.8 });
  const [quantity, setQuantity] = useState(1);
  const available = Number(availableMap?.[product.id] ?? 0);

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
      <div className="mb-8 flex flex-wrap gap-2">
        {products.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.id}`}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
              item.id === product.id
                ? "border-cocoa bg-cocoa text-porcelain"
                : "border-truffle/20 bg-white/75 text-truffle"
            }`}
          >
            {item.name.replace("Anjaraipetti ", "")}
          </Link>
        ))}
      </div>

      <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-r from-amber/20 to-transparent blur-2xl" />
          <motion.div
            onMouseMove={handlePointerMove}
            onMouseLeave={resetTilt}
            style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d", perspective: 1200 }}
            className="relative rounded-[2.3rem] border border-truffle/15 bg-white/70 p-5 shadow-luxe backdrop-blur-xl"
          >
            <img src={product.image} alt={product.name} className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-halo" />
          </motion.div>
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

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-truffle/10 bg-white/80 p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-cocoa/60">Weight</p>
              <p className="mt-1 text-sm font-semibold text-truffle">{product.size}</p>
            </div>
            <div className="rounded-xl border border-truffle/10 bg-white/80 p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-cocoa/60">Heat</p>
              <p className="mt-1 text-sm font-semibold text-truffle">{product.heatLevel}</p>
            </div>
            <div className="rounded-xl border border-truffle/10 bg-white/80 p-3">
              <p className="text-[0.65rem] uppercase tracking-[0.24em] text-cocoa/60">Origin</p>
              <p className="mt-1 text-sm font-semibold text-truffle">{product.origin}</p>
            </div>
          </div>

          <div className="mt-7 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cocoa/60">Price</p>
              <p className="mt-1 font-display text-5xl text-cocoa">INR {product.price}</p>
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
                disabled={quantity >= Math.max(1, available)}
                className="h-9 w-9 rounded-full bg-almond text-xl text-truffle transition hover:bg-biscuit disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cocoa/60">
            Live stock: {available} packs {cartProductId === product.id ? "| In cart" : ""}
          </p>
          <div className="mt-6">
            <AddToCartButton label="Add to Cart" onAdd={() => onAddToCart(product.id, quantity)} />
          </div>
        </motion.div>
      </div>

      <section className="mt-20">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs uppercase tracking-[0.32em] text-cocoa/70">Ingredients</p>
          <h2 className="mt-2 font-display text-4xl text-espresso">Layered composition</h2>
        </motion.div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {ingredients.map((ingredient, idx) => (
            <motion.article
              key={ingredient.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="rounded-2xl border border-truffle/10 bg-white/70 p-6"
            >
              <h3 className="font-display text-2xl text-truffle">{ingredient.title}</h3>
              <p className="mt-2 text-truffle/80">{ingredient.note}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs uppercase tracking-[0.32em] text-cocoa/70">Reviews</p>
          <h2 className="mt-2 font-display text-4xl text-espresso">Community feedback</h2>
        </motion.div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reviews.map((review, idx) => (
            <motion.article
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="rounded-2xl border border-truffle/10 bg-white/70 p-6 shadow-[0_20px_40px_rgba(90,50,25,0.08)]"
            >
              <StarLine count={review.stars} />
              <p className="mt-3 text-truffle/85">"{review.text}"</p>
              <p className="mt-5 font-display text-2xl text-truffle">{review.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-cocoa/65">{review.city}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </section>
  );
}
