import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { getRecipeByProductId } from "../data/recipes";
import { getProductById } from "../data/products";
import BrandHatMark from "../components/BrandHatMark";

export default function RecipePage() {
  const { productId } = useParams();
  const recipe = useMemo(() => getRecipeByProductId(productId), [productId]);
  const product = useMemo(() => getProductById(productId), [productId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 md:px-10 md:pt-16">
      {/* Top Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-truffle/15 bg-gradient-to-br from-[#fcfbf9] to-[#f5f1eb] p-8 shadow-luxe md:p-12"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-5 grayscale">
          <BrandHatMark />
        </div>

        <div className="relative">
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cocoa transition hover:text-espresso"
          >
            ← Back to {product.name}
          </Link>

          <h1 className="mt-6 font-display text-4xl leading-tight text-espresso sm:text-5xl md:max-w-3xl">
            {recipe.title}
          </h1>
          <p className="mt-3 text-sm text-truffle/75 max-w-2xl">
            A traditional, chef-recommended recipe crafted specifically to bring out the rich, authentic South Indian flavors of our <span className="font-semibold text-cocoa">{product.name}</span>.
          </p>

          {/* Quick Stats Grid */}
          <div className="mt-8 flex flex-wrap gap-4 border-t border-truffle/15 pt-6 text-sm">
            <div className="rounded-xl border border-truffle/10 bg-white/60 px-5 py-3 shadow-sm backdrop-blur-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-cocoa/75">Prep & Cook Time</span>
              <span className="mt-1 block font-semibold text-truffle">{recipe.time}</span>
            </div>
            <div className="rounded-xl border border-truffle/10 bg-white/60 px-5 py-3 shadow-sm backdrop-blur-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-cocoa/75">Servings</span>
              <span className="mt-1 block font-semibold text-truffle">{recipe.serves}</span>
            </div>
            <div className="rounded-xl border border-truffle/10 bg-white/60 px-5 py-3 shadow-sm backdrop-blur-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-cocoa/75">Key Masala</span>
              <span className="mt-1 block font-semibold text-truffle">{product.name}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Recipe Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Ingredients Column */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl h-fit"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-cocoa/30" />
            <h3 className="font-display text-2xl text-espresso">Ingredients</h3>
          </div>
          <ul className="space-y-3.5 text-sm">
            {recipe.ingredients.map((ing, index) => (
              <li key={index} className="flex items-start gap-3 text-truffle/90 leading-relaxed border-b border-truffle/5 pb-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cocoa/60" />
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </motion.aside>

        {/* Step-by-Step Instructions Column */}
        <motion.main
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-cocoa/30" />
            <h3 className="font-display text-2xl text-espresso">Step-by-Step Method</h3>
          </div>
          
          <ol className="space-y-6">
            {recipe.steps.map((step, index) => (
              <li key={index} className="relative pl-10">
                {/* Custom Step Number Dot */}
                <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-almond font-mono text-xs font-bold text-cocoa shadow-sm">
                  {index + 1}
                </div>
                <div className="border-l-2 border-dashed border-truffle/15 pl-4 pb-1">
                  <p className="text-sm leading-relaxed text-truffle/85">{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.main>
      </div>

      {/* Back to Products Button */}
      <div className="mt-12 text-center">
        <Link
          to="/product"
          className="inline-flex rounded-full border border-truffle/20 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-truffle transition hover:bg-almond shadow-sm"
        >
          Explore Other Blends
        </Link>
      </div>
    </section>
  );
}
