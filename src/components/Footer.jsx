import { motion } from "framer-motion";
import BrandHatMark from "./BrandHatMark";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-truffle/10 bg-gradient-to-b from-white/50 to-white/30 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Brand Section */}
          <div>
            <div className="h-10 w-32 opacity-80">
              <BrandHatMark />
            </div>
            <p className="mt-4 font-display text-2xl text-espresso">Namma Veetu Anjaraipetti</p>
            <p className="mt-2 text-sm leading-relaxed text-truffle/75">
              Handcrafted masala blends bringing authentic South Indian flavors to your kitchen. 
              Premium spices, bold taste, restaurant-quality finish.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://www.instagram.com/namma.veetu.anjaraipetti?igsh=N251aW9iOHgzeGMz"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-truffle/15 bg-white/50 text-truffle/70 transition hover:border-cocoa hover:bg-almond hover:text-cocoa shadow-sm"
                aria-label="Instagram"
                title="Follow us on Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition duration-300 group-hover:scale-110"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold uppercase tracking-[0.2em] text-cocoa">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="/" className="text-truffle/70 transition hover:text-cocoa">
                  Home
                </a>
              </li>
              <li>
                <a href="/product/biryani-masala" className="text-truffle/70 transition hover:text-cocoa">
                  Products
                </a>
              </li>
              <li>
                <a href="/cart" className="text-truffle/70 transition hover:text-cocoa">
                  Cart
                </a>
              </li>
            </ul>
          </div>

          {/* Company & FSSAI Details */}
          <div>
            <h4 className="font-semibold uppercase tracking-[0.2em] text-cocoa">Company Details</h4>
            <div className="mt-4 space-y-3 text-sm text-truffle/75">
              <div>
                <p className="font-semibold text-espresso">FSSAI Reg. No.</p>
                <p className="mt-0.5 font-mono text-cocoa">22426425000511</p>
              </div>
              <div>
                <p className="font-semibold text-espresso">Address</p>
                <p className="mt-0.5 leading-relaxed">Perungalthur, Chennai, Tamilnadu</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <h4 className="font-semibold uppercase tracking-[0.2em] text-cocoa">Support</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-truffle/70">📧 Email</p>
                <a href="mailto:Nammaveetuanjaraipetti.support@gmail.com" className="font-semibold text-cocoa transition hover:text-espresso break-all">
                  Nammaveetuanjaraipetti.support@gmail.com
                </a>
              </div>
              <div>
                <p className="text-truffle/70">📞 Phone</p>
                <a href="tel:9442698661" className="font-semibold text-cocoa transition hover:text-espresso">
                  9442698661
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="mt-10 border-t border-truffle/10" />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-truffle/60 sm:flex-row"
        >
          <p>© {currentYear} Namma Veetu Anjaraipetti. All rights reserved.</p>
          <p>
            Crafted with ❤️ by{" "}
            <a
              href="mailto:bharathjai2005@gmail.com"
              className="font-semibold text-cocoa transition hover:text-espresso underline decoration-dashed decoration-cocoa/30 hover:decoration-solid"
              title="Contact Developer: bharathjai2005@gmail.com"
            >
              Bharath | Freelancer (bharathjai2005@gmail.com)
            </a>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
