import { motion, useReducedMotion } from "framer-motion";

export default function BoilingCooktop() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative h-10 w-10 flex-shrink-0"
      animate={reduceMotion ? undefined : { y: [0, -1.1, 0] }}
      transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 56 56" className="h-full w-full text-cocoa" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M14 27h28" strokeLinecap="round" />
        <path d="M16 27h24l-2.2 9h-19.6z" />
        <path d="M16 28.5l-3 1.8M40 28.5l3 1.8" strokeLinecap="round" />

        <motion.path
          d="M23 19.5c0-2 1.8-2.3 1.8-4"
          strokeLinecap="round"
          animate={reduceMotion ? undefined : { opacity: [0, 0.95, 0], y: [1.8, -0.8, -3.6] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
        />
        <motion.path
          d="M28 18.3c0-2 1.8-2.3 1.8-4"
          strokeLinecap="round"
          animate={reduceMotion ? undefined : { opacity: [0, 1, 0], y: [1.8, -1, -3.8] }}
          transition={{ duration: 1.95, delay: 0.25, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
        />
        <motion.path
          d="M33 19.5c0-2 1.8-2.3 1.8-4"
          strokeLinecap="round"
          animate={reduceMotion ? undefined : { opacity: [0, 0.95, 0], y: [1.8, -0.8, -3.6] }}
          transition={{ duration: 1.8, delay: 0.45, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}
