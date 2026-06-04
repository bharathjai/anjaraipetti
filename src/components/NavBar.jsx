import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import BoilingCooktop from "./BoilingCooktop";
import BrandHatMark from "./BrandHatMark";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/product", label: "Product" },
  { to: "/spice-builder", label: "Build Box" },
  { to: "/recipe-companion", label: "AI Planner" },
  { to: "/cart", label: "Cart" }
];

export default function NavBar({ cartQuantity }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
          <span className="relative isolate flex flex-col justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 -top-5 h-16 w-48 opacity-30"
            >
              <BrandHatMark />
            </span>
            <span className="relative z-10 ml-0.5 text-[0.55rem] font-bold uppercase tracking-[0.3em] text-cocoa/80">Namma Veetu</span>
            <span className="relative z-10 -mt-1.5 font-display text-2xl tracking-wide text-truffle sm:text-3xl">Anjaraipetti</span>
          </span>
        </NavLink>
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
          <nav className="flex flex-1 items-center gap-2 rounded-full border border-truffle/15 bg-white/80 p-1 md:w-auto md:flex-none">
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

            {/* Static My Orders link for guests if they want offline sync lookup */}
            {!user && (
              <NavLink
                to="/my-orders"
                className={({ isActive }) =>
                  `btn-hover inline-flex flex-1 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${
                    isActive ? "bg-truffle text-porcelain" : "text-truffle hover:bg-almond"
                  }`
                }
              >
                My Orders
              </NavLink>
            )}
          </nav>

          {/* User Session Interface */}
          <div className="shrink-0 flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-truffle/15 bg-white/80 p-1 pr-2 sm:pr-3 hover:bg-almond transition"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-amber/35 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber/20 border border-amber/30 text-espresso font-bold text-sm flex items-center justify-center shrink-0">
                      {user.name?.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-truffle">{user.name.split(" ")[0]}</span>
                  <svg className="h-4.5 w-4.5 text-truffle/55" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-48 rounded-2xl border border-truffle/10 bg-white p-2 shadow-luxe backdrop-blur-xl z-20 flex flex-col gap-1"
                      >
                        <NavLink
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-truffle hover:bg-almond transition flex items-center gap-2"
                        >
                          <span>👤</span> My Profile
                        </NavLink>
                        <NavLink
                          to="/my-orders"
                          onClick={() => setDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-truffle hover:bg-almond transition flex items-center gap-2"
                        >
                          <span>📦</span> My Orders
                        </NavLink>
                        <NavLink
                          to="/profile"
                          state={{ scroll_to_addresses: true }}
                          onClick={() => setDropdownOpen(false)}
                          className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-truffle hover:bg-almond transition flex items-center gap-2"
                        >
                          <span>📍</span> Saved Addresses
                        </NavLink>
                        <hr className="border-truffle/5 my-1" />
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2 cursor-pointer"
                        >
                          <span>🚪</span> Logout
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
