import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { useRef } from "react";

export default function LandingPage({ products }) {
  const sectionRef = useRef(null);
  const heroImage = "/images/all-masalas-combined.png";
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [60, -70]);

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10 md:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <p className="text-xs uppercase tracking-[0.35em] text-cocoa/70">Namma Veetu Anjaraipetti</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] text-espresso sm:text-6xl lg:text-7xl">
            One Brand.
            <br />
            Four Signature Masalas.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-truffle/80">
            Crafted for real South Indian cooking with bold aroma and consistent taste across Biryani Masala, Chicken Masala, Mutton Masala, and Chilli Powder.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to={`/product/${products[0].id}`}
              className="btn-hover rounded-full bg-truffle px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso"
            >
              View Products
            </Link>
            <Link
              to="/cart"
              className="btn-hover rounded-full border border-truffle/25 bg-white/80 px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond"
            >
              Open Cart
            </Link>
          </div>
        </motion.div>

        <motion.div
          style={{ y: imageY }}
          initial={{ opacity: 0, x: 40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-amber/20 to-biscuit/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-truffle/10 bg-white/70 p-4 shadow-luxe backdrop-blur-xl">
            <img
              src={heroImage}
              alt="Anjaraipetti four-masala product range"
              className="h-auto w-full rounded-[1.5rem] object-contain"
            />
            <div className="mt-4 rounded-2xl border border-truffle/10 bg-white/70 p-4">
              <h2 className="font-display text-3xl text-espresso">4 Signature Packs</h2>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-cocoa/70">
                Biryani | Chicken | Mutton | Chilli Powder
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-16">
        <p className="text-xs uppercase tracking-[0.34em] text-cocoa/70">Our Range</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="rounded-2xl border border-truffle/10 bg-white/70 p-5 shadow-[0_20px_40px_rgba(90,50,25,0.08)] backdrop-blur-lg"
            >
              <h3 className="font-display text-2xl text-truffle">{product.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cocoa/70">{product.subtitle}</p>
              <p className="mt-3 text-sm font-semibold text-cocoa">INR {product.price}</p>
              <Link
                to={`/product/${product.id}`}
                className="btn-hover mt-4 inline-flex rounded-full border border-truffle/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-truffle"
              >
                View
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
