import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function ProductsPage({ products }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10 md:pt-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.34em] text-cocoa/70">Our Full Range</p>
        <h1 className="mt-4 font-display text-4xl text-espresso sm:text-5xl">All Products</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-truffle/80">
          Each blend is freshly prepared, slow-roasted, and packed with care. Select a product to choose your preferred weight and add it to your cart.
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <motion.article
            key={product.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className="flex flex-col rounded-2xl border border-truffle/10 bg-white/70 p-5 shadow-[0_20px_40px_rgba(90,50,25,0.08)] backdrop-blur-lg"
          >
            <img
              src={product.image}
              alt={product.name}
              className="mb-5 aspect-square w-full rounded-xl object-contain mix-blend-multiply"
            />
            <h3 className="font-display text-2xl text-truffle">{product.name}</h3>
            <p className="mt-1 flex-1 text-xs uppercase tracking-[0.2em] text-cocoa/70">{product.subtitle}</p>
            <p className="mt-4 text-xs font-semibold text-truffle/60 uppercase tracking-[0.1em]">Starts from</p>
            <p className="text-lg font-bold text-cocoa">INR {product.price}</p>
            <Link
              to={`/product/${product.id}`}
              className="btn-hover mt-5 inline-flex w-full items-center justify-center rounded-full bg-truffle px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-porcelain transition hover:bg-espresso"
            >
              Select Options
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
