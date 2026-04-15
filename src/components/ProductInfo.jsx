import { motion } from "framer-motion";
import AddToCartButton from "./AddToCartButton";

export default function ProductInfo({ product }) {
  const badges = [
    { label: "Net Weight", value: product.size },
    { label: "Heat Profile", value: product.heatLevel },
    { label: "Origin", value: product.origin }
  ];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative rounded-[2rem] border border-cream/15 bg-white/10 p-7 shadow-luxe backdrop-blur-xl sm:p-9"
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-saffron/35 bg-saffron/15 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-saffron">
        Premium Blend
      </div>

      <h1 className="font-display text-3xl leading-tight text-cream sm:text-4xl md:text-5xl">{product.name}</h1>
      <p className="mt-4 text-sm uppercase tracking-[0.2em] text-cream/70">{product.subtitle}</p>

      <p className="mt-6 text-base leading-relaxed text-cream/85">{product.description}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-3"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-cream/55">{badge.label}</p>
            <p className="mt-1 text-sm font-semibold text-cream">{badge.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.25em] text-cream/55">Price</p>
          <p className="mt-1 font-display text-3xl text-saffron sm:text-4xl">{product.price}</p>
        </div>
        <p className="max-w-[12rem] text-right text-xs uppercase tracking-[0.16em] text-cream/50">

        </p>
      </div>

      <div className="mt-8">
        <AddToCartButton />
      </div>
    </motion.aside>
  );
}
