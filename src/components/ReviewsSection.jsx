import { motion } from "framer-motion";

function Stars({ count }) {
  return (
    <div className="flex gap-1 text-saffron">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={`${count}-${index}`} className={index < count ? "opacity-100" : "opacity-30"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsSection({ reviews }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 md:px-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7 }}
        className="mb-10"
      >
        <p className="text-xs uppercase tracking-[0.34em] text-saffron/85">Guest Notes</p>
        <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Loved by home chefs and food stylists</h2>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        {reviews.map((review, index) => (
          <motion.article
            key={review.name}
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: index * 0.08 }}
            whileHover={{
              y: -10,
              rotateX: 4,
              transition: { duration: 0.3 }
            }}
            className="rounded-2xl border border-cream/15 bg-white/10 p-6 backdrop-blur-xl"
          >
            <Stars count={review.stars} />
            <p className="mt-4 text-sm leading-relaxed text-cream/85">"{review.text}"</p>
            <p className="mt-6 font-display text-lg text-cream">{review.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-cream/55">{review.city}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
