import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";
import ProductInfo from "./ProductInfo";

function buildParticles() {
  return Array.from({ length: 26 }, (_, idx) => ({
    id: idx,
    left: (idx * 17) % 100,
    top: (idx * 29) % 100,
    size: 4 + (idx % 5) * 2,
    duration: 10 + (idx % 7) * 2,
    delay: (idx % 6) * 0.8
  }));
}

export default function HeroProduct({ product }) {
  const sectionRef = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const tiltX = useSpring(rotateX, { stiffness: 180, damping: 22, mass: 0.8 });
  const tiltY = useSpring(rotateY, { stiffness: 180, damping: 22, mass: 0.8 });
  const particles = useMemo(() => buildParticles(), []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  const deepLayerY = useTransform(scrollYProgress, [0, 1], [120, -70]);
  const frontLayerY = useTransform(scrollYProgress, [0, 1], [40, -140]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rotateY.set((x - 0.5) * 16);
    rotateX.set((0.5 - y) * 16);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <section ref={sectionRef} className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 pb-12 pt-24 md:px-10">
      <motion.div style={{ y: deepLayerY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[16%] h-52 w-52 rounded-full bg-paprika/12 blur-[100px]" />
        <div className="absolute right-[12%] top-[38%] h-60 w-60 rounded-full bg-saffron/10 blur-[120px]" />
      </motion.div>

      <div className="grid w-full items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          style={{ y: frontLayerY }}
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-saffron/10 via-transparent to-paprika/20 blur-2xl" />

          <motion.div
            className="relative mx-auto aspect-[4/5] w-full max-w-[540px] overflow-hidden rounded-[2.5rem] border border-cream/20 bg-white/5 p-5 shadow-luxe backdrop-blur-sm"
            onMouseMove={handlePointerMove}
            onMouseLeave={resetTilt}
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              transformStyle: "preserve-3d",
              perspective: 1200
            }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-transparent via-saffron/10 to-white/10" />
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full rounded-[2rem] object-cover shadow-spice"
            />
            <div className="pointer-events-none absolute inset-x-8 bottom-8 rounded-2xl border border-white/20 bg-black/35 px-5 py-4 backdrop-blur-lg">
              <p className="font-display text-lg tracking-wide text-cream">{product.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.35em] text-cream/75">{product.subtitle}</p>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full bg-gradient-to-br from-saffron/45 to-paprika/35 blur-[1px]"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  width: particle.size,
                  height: particle.size
                }}
                animate={{
                  x: [0, particle.id % 2 === 0 ? 20 : -16, 0],
                  y: [0, -22, 0],
                  opacity: [0.18, 0.48, 0.15]
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        <ProductInfo product={product} />
      </div>
    </section>
  );
}
