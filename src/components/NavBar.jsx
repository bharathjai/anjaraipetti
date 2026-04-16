import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import BoilingCooktop from "./BoilingCooktop";
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:px-10 md:py-4">
        <NavLink to="/" className="inline-flex items-center gap-2.5 px-1 py-1">
          <BoilingCooktop />
          <span className="relative isolate">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-5 -top-4 h-12 w-36 opacity-45 sm:-left-6 sm:-top-5 sm:h-14 sm:w-44"
            >
              <BrandHatMark />
            </span>
            <span className="relative z-10 font-display text-2xl tracking-wide text-truffle sm:text-3xl">Anjaraipetti</span>
          </span>
        </NavLink>
        <div className="flex w-full items-center md:w-auto">
          <nav className="flex w-full items-center gap-2 rounded-full border border-truffle/15 bg-white/80 p-1 md:w-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `btn-hover inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${
                  isActive ? "bg-truffle text-porcelain" : "text-truffle hover:bg-almond"
                }`
              }
            >
              {link.label}
              {link.to === "/cart" && cartQuantity > 0 ? (
                <span className="ml-1.5 rounded-full bg-amber px-2 py-0.5 text-xs text-white">{cartQuantity}</span>
              ) : null}
            </NavLink>
          ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
