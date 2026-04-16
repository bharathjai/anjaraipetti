import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ProductCarousel({ products }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = products.length - 1;
      if (nextIndex >= products.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const currentProduct = products[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          drag="x"
          dragElastic={1}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-almond/50 to-biscuit/50 p-8 sm:w-48">
              <img
                src={currentProduct.image}
                alt={currentProduct.name}
                className="h-40 w-40 object-cover sm:h-44 sm:w-44"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-cocoa/70">
                {currentIndex + 1} / {products.length}
              </p>
              <Link to={`/product/${currentProduct.id}`}>
                <h2 className="mt-2 font-display text-3xl text-truffle transition hover:text-cocoa">
                  {currentProduct.name}
                </h2>
              </Link>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cocoa/65">
                {currentProduct.subtitle}
              </p>
              <p className="mt-3 text-lg font-semibold text-espresso">
                ₹{currentProduct.price.toLocaleString("en-IN")}
              </p>
              <div className="mt-4 flex gap-2 text-sm text-truffle/80">
                <span className="rounded-full bg-cocoa/10 px-3 py-1">{currentProduct.size}</span>
                <span className="rounded-full bg-cocoa/10 px-3 py-1">{currentProduct.heatLevel}</span>
              </div>
              <Link
                to={`/product/${currentProduct.id}`}
                className="btn-hover mt-5 inline-flex rounded-full bg-truffle px-6 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-porcelain transition hover:bg-espresso"
              >
                View Details
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition ${
              index === currentIndex ? "w-8 bg-cocoa" : "w-2 bg-truffle/30 hover:bg-truffle/50"
            }`}
            aria-label={`Go to product ${index + 1}`}
          />
        ))}
      </div>

      {/* Swipe hint */}
      <p className="mt-4 text-center text-xs text-truffle/50">Swipe or click dots to browse</p>
    </div>
  );
}
