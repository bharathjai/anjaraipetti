import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

// Swiggy Veg Icon (Green Circle inside Green Square)
function VegIcon() {
  return (
    <span className="inline-flex items-center justify-center border-2 border-emerald-600 p-[1.5px] w-4.5 h-4.5 shrink-0 bg-white rounded-md">
      <span className="h-2 w-2 rounded-full bg-emerald-600" />
    </span>
  );
}

// Swiggy Non-Veg Icon (Red Triangle inside Red Square) for product cards
function NonVegIcon() {
  return (
    <span className="inline-flex items-center justify-center border-2 border-red-700 p-[2.5px] w-4.5 h-4.5 shrink-0 bg-white rounded-md">
      <span className="h-0 w-0 border-l-[3.5px] border-r-[3.5px] border-b-[7px] border-l-transparent border-r-transparent border-b-red-700" />
    </span>
  );
}

export default function ProductsPage({ products }) {
  const [isNonVeg, setIsNonVeg] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = products.filter((product) => {
    // Exclude the test product from standard catalog display
    if (product.id === "test-product") return false;

    if (isNonVeg) {
      return product.category === "non-veg";
    }
    return product.category === "veg";
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10 md:pt-16">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-cocoa/70">Our Full Range</p>
          <h1 className="mt-4 font-display text-4xl text-espresso sm:text-5xl">All Products</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-truffle/80">
            Each blend is freshly prepared, slow-roasted, and packed with care. Select a product to choose your preferred weight and add it to your cart.
          </p>
        </div>

        {/* Single Sliding Veg/Non-Veg Toggle Switch */}
        <div className="self-start md:self-auto">
          <div className="relative flex items-center bg-white border border-truffle/15 rounded-full p-1 shadow-sm w-56 h-11 select-none">
            {/* Sliding background pill */}
            <motion.div
              layout
              className={`absolute top-1 bottom-1 rounded-full ${
                isNonVeg ? "bg-red-50 border-red-500/20" : "bg-emerald-50 border-emerald-500/20"
              } border`}
              initial={false}
              animate={{
                left: isNonVeg ? "calc(50% + 2px)" : "4px",
                right: isNonVeg ? "4px" : "calc(50% + 2px)"
              }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
            />

            {/* Left Side: Veg (OFF) */}
            <button
              type="button"
              onClick={() => setIsNonVeg(false)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer h-full ${
                !isNonVeg ? "text-emerald-700" : "text-truffle/60 hover:text-truffle/90"
              }`}
            >
              <VegIcon />
              <span>Veg</span>
            </button>

            {/* Right Side: Non-Veg (ON) */}
            <button
              type="button"
              onClick={() => setIsNonVeg(true)}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer h-full ${
                isNonVeg ? "text-red-700" : "text-truffle/60 hover:text-truffle/90"
              }`}
            >
              <NonVegIcon />
              <span>Non-Veg</span>
            </button>
          </div>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-truffle/10 bg-white/70 p-12 text-center">
          <p className="text-lg text-truffle/80">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredProducts.map((product, index) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="flex"
            >
              <motion.article
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="flex w-full flex-col rounded-2xl border border-truffle/10 bg-white/70 p-5 shadow-[0_20px_40px_rgba(90,50,25,0.08)] backdrop-blur-lg transition hover:shadow-luxe hover:-translate-y-1 hover:border-truffle/25 cursor-pointer relative"
              >
                <div className="relative mb-5 aspect-square w-full rounded-xl bg-porcelain p-3 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                  {product.category && (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-truffle shadow-sm">
                      {product.category === "veg" ? <VegIcon /> : <NonVegIcon />}
                      <span className="ml-0.5">{product.category}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-2xl text-truffle">{product.name}</h3>
                <p className="mt-1 flex-1 text-xs uppercase tracking-[0.2em] text-cocoa/70">{product.subtitle}</p>
                <p className="mt-4 text-xs font-semibold text-truffle/60 uppercase tracking-[0.1em]">Starts from</p>
                <p className="text-lg font-bold text-cocoa">INR {product.price}</p>
              </motion.article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
