/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        porcelain: "#fcfaf6",
        almond: "#f4eee4",
        biscuit: "#e6d6c0",
        cocoa: "#6f3f1e",
        amber: "#d0843e",
        espresso: "#2a1a12",
        truffle: "#4b2c1a"
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        halo: "0 20px 60px rgba(208, 132, 62, 0.24)",
        luxe: "0 30px 90px rgba(68, 35, 13, 0.18)"
      },
      backgroundImage: {
        "ivory-glow":
          "radial-gradient(circle at 15% 15%, rgba(208, 132, 62, 0.16), transparent 40%), radial-gradient(circle at 85% 5%, rgba(255, 210, 161, 0.4), transparent 35%), linear-gradient(155deg, #fcfaf6, #f7f0e6 55%, #f2e7d8)"
      }
    }
  },
  plugins: []
};
