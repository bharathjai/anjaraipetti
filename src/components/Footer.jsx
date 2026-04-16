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
          <div className="lg:col-span-2">
            <div className="h-10 w-32 opacity-80">
              <BrandHatMark />
            </div>
            <p className="mt-4 font-display text-2xl text-espresso">Anjaraipetti</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-truffle/75">
              Handcrafted masala blends bringing authentic South Indian flavors to your kitchen. 
              Premium spices, bold taste, restaurant-quality finish.
            </p>
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

          {/* Contact */}
          <div>
            <h4 className="font-semibold uppercase tracking-[0.2em] text-cocoa">Get in Touch</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-truffle/70">📧 Email</p>
                <a href="mailto:bharathjai2005@gmail.com" className="font-semibold text-cocoa transition hover:text-espresso">
                  bharathjai2005@gmail.com
                </a>
              </div>
              <div>
                <p className="text-truffle/70">👤 Freelancer</p>
                <p className="font-semibold text-cocoa">Bharath</p>
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
          <p>© {currentYear} Anjaraipetti. All rights reserved.</p>
          <p>Crafted with ❤️ by <span className="font-semibold text-cocoa">Bharath</span> | Freelancer</p>
        </motion.div>
      </div>
    </footer>
  );
}
