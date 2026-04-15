import { motion } from "framer-motion";

export default function IngredientsSection({ ingredients }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7 }}
        className="mb-10"
      >
        <p className="text-xs uppercase tracking-[0.34em] text-saffron/85">Ingredient Story</p>
        <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Crafted with precision, roasted with intent</h2>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-2">
        {ingredients.map((ingredient, index) => (
          <motion.article
            key={ingredient.title}
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -4, borderColor: "rgba(239, 155, 59, 0.45)" }}
            className="rounded-2xl border border-cream/15 bg-white/8 p-6 backdrop-blur-lg"
          >
            <h3 className="font-display text-xl text-cream">{ingredient.title}</h3>
            <p className="mt-3 leading-relaxed text-cream/80">{ingredient.note}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
