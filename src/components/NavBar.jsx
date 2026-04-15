import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import BrandHatMark from "./BrandHatMark";

const links = [
  { to: "/product", label: "Product" },
  { to: "/cart", label: "Cart" }
];

export default function NavBar({ cartQuantity }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-truffle/10 bg-porcelain/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <NavLink to="/" className="relative inline-flex items-center px-2 py-1">
          <span aria-hidden="true" className="pointer-events-none absolute -left-5 -top-4 h-16 w-56 opacity-70">
            <BrandHatMark />
          </span>
          <span className="relative z-10 font-display text-3xl tracking-wide text-truffle">Anjaraipetti</span>
        </NavLink>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 rounded-full border border-truffle/15 bg-white/80 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? "bg-truffle text-porcelain" : "text-truffle hover:bg-almond"
                }`
              }
            >
              {link.label}
              {link.to === "/cart" && cartQuantity > 0 ? (
                <span className="ml-2 rounded-full bg-amber px-2 py-0.5 text-xs text-white">{cartQuantity}</span>
              ) : null}
            </NavLink>
          ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
