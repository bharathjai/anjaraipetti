import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const recipes = [
  {
    id: "chettinad-chicken",
    name: "Chettinad Chicken Pepper Fry",
    cuisine: "Chettinad",
    type: "non-veg",
    heat: "Spicy",
    description: "A fiery, aromatic classic from Tamil Nadu featuring deep slow-roasted black pepper and chicken chunks.",
    spicesNeeded: [
      { id: "pepper-powder-50g", name: "Pepper Powder (50g)", quantity: 1, price: 99 },
      { id: "chicken-masala-50g", name: "Chicken Masala (50g)", quantity: 1, price: 85 }
    ]
  },
  {
    id: "homestyle-sambar",
    name: "Namma Veetu Traditional Sambar",
    cuisine: "Homestyle Tamil",
    type: "veg",
    heat: "Mild",
    description: "A rich, comforting lentil curry with fresh seasonal vegetables and traditional stone-ground coriander.",
    spicesNeeded: [
      { id: "sambar-masala-50g", name: "Sambar Masala (50g)", quantity: 1, price: 1 },
      { id: "coriander-powder-50g", name: "Coriander Powder (50g)", quantity: 1, price: 49 }
    ]
  },
  {
    id: "paneer-biryani",
    name: "Aromatic Paneer Biryani",
    cuisine: "Mughlai",
    type: "veg",
    heat: "Medium",
    description: "Fragrant basmati rice layered with spiced paneer, shahi jeera, and slow-cook warm biryani aromatics.",
    spicesNeeded: [
      { id: "biryani-masala-50g", name: "Biryani Masala (50g)", quantity: 1, price: 75 },
      { id: "garam-masala-50g", name: "Garam Masala (50g)", quantity: 1, price: 85 },
      { id: "jeera-powder-50g", name: "Jeera Powder (50g)", quantity: 1, price: 55 }
    ]
  },
  {
    id: "chettinad-fish-fry",
    name: "Fiery Chettinad Fish Fry",
    cuisine: "Chettinad",
    type: "non-veg",
    heat: "Spicy",
    description: "Crispy-fried fish fillets coated with a bold, tangy layer of hand-blended fish fry spices.",
    spicesNeeded: [
      { id: "fish-fry-masala-50g", name: "Fish Fry Masala (50g)", quantity: 1, price: 49 },
      { id: "pepper-powder-50g", name: "Pepper Powder (50g)", quantity: 1, price: 99 }
    ]
  },
  {
    id: "paneer-tikka",
    name: "Mughlai Tandoori Paneer Tikka",
    cuisine: "Mughlai",
    type: "veg",
    heat: "Medium",
    description: "Smoky, clay-oven roasted paneer cubes marinated in yogurt and warm, robust tandoori masala blends.",
    spicesNeeded: [
      { id: "tandoori-masala-50g", name: "Tandoori Masala (50g)", quantity: 1, price: 65 },
      { id: "garam-masala-50g", name: "Garam Masala (50g)", quantity: 1, price: 85 }
    ]
  },
  {
    id: "mutton-curry",
    name: "Classic Tamil Mutton Gravy",
    cuisine: "Homestyle Tamil",
    type: "non-veg",
    heat: "Spicy",
    description: "Tender pieces of mutton cooked in a rich, slow-simmered onion-tomato gravy with warm garam masala spices.",
    spicesNeeded: [
      { id: "mutton-masala-50g", name: "Mutton Masala (50g)", quantity: 1, price: 85 },
      { id: "garam-masala-50g", name: "Garam Masala (50g)", quantity: 1, price: 85 }
    ]
  }
];

export default function RecipeCompanion({ onAddMultipleToCart }) {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    type: "all",
    heat: "all",
    cuisine: "all"
  });

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      if (preferences.type !== "all" && r.type !== preferences.type) return false;
      if (preferences.heat !== "all" && r.heat !== preferences.heat) return false;
      if (preferences.cuisine !== "all" && r.cuisine !== preferences.cuisine) return false;
      return true;
    });
  }, [preferences]);

  const handleAddMultiple = (spices) => {
    const items = spices.map(s => ({ productId: s.id, quantity: s.quantity }));
    onAddMultipleToCart(items);
    navigate("/cart");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-[0.3em] text-[#d0843e] font-bold">AI Kitchen Assistant</span>
        <h1 className="mt-2 font-display text-5xl text-espresso font-semibold">Recipe Companion & Spice Planner</h1>
        <p className="text-sm text-truffle/70 mt-1">Set your taste profile to discover traditional recipes and plan your spice needs instantly.</p>
      </div>

      {/* Preferences Quiz Filters */}
      <div className="grid gap-6 md:grid-cols-3 p-6 mb-10 rounded-3xl border border-truffle/10 bg-white/75 shadow-luxe backdrop-blur-xl">
        {/* Diet Preference */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-cocoa/70">Diet Preference</label>
          <div className="mt-2 flex gap-2">
            {["all", "veg", "non-veg"].map(t => (
              <button
                key={t}
                onClick={() => setPreferences(prev => ({ ...prev, type: t }))}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition ${
                  preferences.type === t
                    ? "bg-cocoa border-cocoa text-white shadow-sm"
                    : "bg-white border-truffle/10 text-truffle/70 hover:bg-almond"
                }`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Heat Profile */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-cocoa/70">Heat Intensity</label>
          <div className="mt-2 flex gap-2">
            {["all", "Mild", "Medium", "Spicy"].map(h => (
              <button
                key={h}
                onClick={() => setPreferences(prev => ({ ...prev, heat: h }))}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition ${
                  preferences.heat === h
                    ? "bg-cocoa border-cocoa text-white shadow-sm"
                    : "bg-white border-truffle/10 text-truffle/70 hover:bg-almond"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Type */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.16em] text-cocoa/70">Cuisine Style</label>
          <div className="mt-2 flex gap-2">
            {["all", "Chettinad", "Mughlai", "Homestyle Tamil"].map(c => (
              <button
                key={c}
                onClick={() => setPreferences(prev => ({ ...prev, cuisine: c }))}
                className={`flex-1 py-2 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition ${
                  preferences.cuisine === c
                    ? "bg-cocoa border-cocoa text-white shadow-sm"
                    : "bg-white border-truffle/10 text-truffle/70 hover:bg-almond"
                }`}
              >
                {c === "all" ? "All" : c.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white/70 border border-dashed border-truffle/15 rounded-3xl">
          <p className="text-sm text-truffle/60">No recipes match your current flavor criteria. Try expanding your filters!</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredRecipes.map((recipe) => (
              <motion.article
                key={recipe.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col justify-between rounded-3xl border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl transition hover:border-amber/20"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-truffle/10 text-truffle px-2.5 py-0.5 rounded-full">
                      {recipe.cuisine}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      recipe.type === "veg" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                    }`}>
                      {recipe.type}
                    </span>
                  </div>
                  
                  <h3 className="mt-4 font-display text-2xl text-espresso font-semibold leading-snug">
                    {recipe.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-[#d0843e] uppercase tracking-widest mt-1">
                    Heat Index: {recipe.heat}
                  </p>
                  <p className="mt-3 text-xs text-truffle/70 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-truffle/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-truffle/55">Required Spices:</span>
                  <div className="mt-2 space-y-1.5 mb-5">
                    {recipe.spicesNeeded.map((spice) => (
<<<<<<< HEAD
                      <div key={spice.id} className="text-xs text-espresso">
                        <span className="font-semibold">· {spice.name}</span>
=======
                      <div key={spice.id} className="flex justify-between text-xs text-espresso">
                        <span className="font-semibold">· {spice.name}</span>
                        <span className="font-mono text-truffle/70">₹{spice.price}</span>
>>>>>>> 77080c9 (Enhance mobile spice box with interactive mini-box and dynamic spice image previews)
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAddMultiple(recipe.spicesNeeded)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cocoa hover:bg-cocoa/90 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition shadow-sm cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    Add Spices & checkout
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
