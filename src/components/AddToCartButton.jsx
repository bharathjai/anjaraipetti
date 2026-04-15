import { motion, useAnimationControls } from "framer-motion";
import { useState } from "react";

export default function AddToCartButton({ label = "Add To Cart", onAdd }) {
  const [ripples, setRipples] = useState([]);
  const controls = useAnimationControls();

  const handleClick = async (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 650);

    await controls.start({
      scale: [1, 0.96, 1.035, 1],
      transition: { duration: 0.46, ease: [0.2, 0.9, 0.3, 1] }
    });

    if (onAdd) {
      onAdd();
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      animate={controls}
      whileHover={{
        scale: 1.015,
        boxShadow: "0 14px 34px rgba(208, 132, 62, 0.35)"
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative isolate w-full overflow-hidden rounded-xl border border-cocoa/30 bg-gradient-to-r from-[#5d3317] via-[#8a4a22] to-[#c07532] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-halo"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.45 }}
          animate={{ scale: 5.5, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="pointer-events-none absolute h-14 w-14 rounded-full bg-white/50"
          style={{ left: ripple.x - 28, top: ripple.y - 28 }}
        />
      ))}
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}
