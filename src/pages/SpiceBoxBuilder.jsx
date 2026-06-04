import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { products } from "../data/products";

// Get only single spices with all their size variants
const singleSpices = products
  .filter(p => p.id !== "combo-box" && p.id !== "test-product")
  .map(p => {
    return {
      baseId: p.id,
      name: p.name.replace("Namma Veetu Anjaraipetti ", ""),
      image: p.image,
      category: p.category,
      variants: p.variants || [{ id: p.id, size: p.size, price: p.price }]
    };
  });

export default function SpiceBoxBuilder({ onAddToCart }) {
  const navigate = useNavigate();
  const [selectedCompartment, setSelectedCompartment] = useState(null);
  // 7 compartments: 0 is the center, 1-6 are the surrounding ones
  const [boxState, setBoxState] = useState(Array(7).fill(null));
  const [showFloatingBox, setShowFloatingBox] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mainCard = document.getElementById("main-builder-card");
      if (mainCard) {
        const rect = mainCard.getBoundingClientRect();
        // Show floating box only when the main box builder card has scrolled mostly out of view (its bottom is above 120px of the viewport)
        if (rect.bottom < 120) {
          setShowFloatingBox(true);
        } else {
          setShowFloatingBox(false);
        }
      } else {
        // Fallback to static scroll value
        if (window.scrollY > 520) {
          setShowFloatingBox(true);
        } else {
          setShowFloatingBox(false);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    // Trigger immediately in case they refresh while scrolled
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fillCompartment = (spice) => {
    if (selectedCompartment === null) return;
    const newState = [...boxState];
    newState[selectedCompartment] = spice;
    setBoxState(newState);
    
    // Automatically select next empty compartment
    const nextEmpty = newState.findIndex(item => item === null);
    if (nextEmpty !== -1) {
      setSelectedCompartment(nextEmpty);
    } else {
      setSelectedCompartment(null);
    }
  };

  const clearCompartment = (idx, e) => {
    e.stopPropagation();
    const newState = [...boxState];
    newState[idx] = null;
    setBoxState(newState);
    setSelectedCompartment(idx);
  };

  const handleAddToCart = () => {
    const filledSpices = boxState.filter(Boolean);
    if (filledSpices.length < 7) {
      alert("Please fill all 7 compartments of your Anjaraipetti Box before adding to cart.");
      return;
    }
    const spiceIds = filledSpices.map(s => s.id).join(",");
    const customBoxId = `custom-box:${spiceIds}`;
    onAddToCart(customBoxId, 1);
    navigate("/cart");
  };

  const filledCount = boxState.filter(Boolean).length;
  const totalPrice = boxState.reduce((sum, item) => sum + (item ? item.price : 0), 0);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-12 md:px-10">
      
      {/* Sticky Mobile Progress Bar */}
      <div className="sticky top-[72px] lg:hidden z-30 -mx-6 mb-6 bg-porcelain/95 backdrop-blur-md border-b border-truffle/10 py-3.5 px-6 shadow-sm w-[calc(100%+3rem)] flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] uppercase font-bold tracking-wider text-truffle/60">Your Custom Box</span>
          <div className="flex items-center gap-1.5 mt-1 overflow-x-auto scrollbar-none pb-1">
            {boxState.map((spice, idx) => {
              const isSelected = selectedCompartment === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCompartment(idx)}
                  className={`relative shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                    isSelected 
                      ? "border-amber bg-white text-[#d0843e] ring-2 ring-amber/20 scale-105 font-extrabold" 
                      : spice 
                      ? "border-cocoa bg-cocoa text-porcelain" 
                      : "border-truffle/20 bg-truffle/5 text-truffle/40"
                  }`}
                  title={spice ? spice.name : `Slot ${idx === 0 ? "Center" : idx}`}
                >
                  {idx === 0 ? "C" : idx}
                  {spice && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end">
          <span className="text-[9px] uppercase font-bold tracking-wider text-truffle/60">Filled {filledCount}/7</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-[9px] font-bold text-cocoa hover:text-amber uppercase tracking-wider mt-1 underline cursor-pointer"
          >
            View Box
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-stretch">
        
        {/* Left Interactive Builder Visual */}
        <div id="main-builder-card" className="flex-1 rounded-[2.5rem] border border-truffle/10 bg-white/75 p-8 shadow-luxe backdrop-blur-xl flex flex-col justify-between items-center min-h-[500px]">
          <div className="text-center w-full mb-6">
            <span className="text-xs uppercase tracking-[0.3em] text-[#d0843e] font-bold">Anjaraipetti Box</span>
            <h1 className="mt-2 font-display text-4xl text-espresso font-semibold">Craft Your Custom Blend Box</h1>
            <p className="text-sm text-truffle/70 mt-1">Select a compartment, then choose a spice to fill it.</p>
          </div>

          {/* Circular Traditional Spice Box Visualizer */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-[#8a5d3b] to-[#422613] p-6 shadow-2xl flex items-center justify-center border-4 border-[#e6c19c]/40">
            {/* Wooden grain overlay */}
            <div className="absolute inset-0 rounded-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-100 via-amber-900 to-black pointer-events-none" />

            {/* Surrounding Compartments */}
            {boxState.map((spice, idx) => {
              if (idx === 0) return null; // center handled below
              const angle = ((idx - 1) * 360) / 6;
              const radius = 100; // px
              const transform = `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`;

              const isSelected = selectedCompartment === idx;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCompartment(idx)}
                  style={{ transform }}
                  className={`absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-center transition-all duration-300 overflow-hidden ${
                    spice 
                      ? "bg-white border-2 border-amber shadow-md" 
                      : isSelected 
                      ? "bg-white/20 border-2 border-dashed border-white shadow-halo scale-105" 
                      : "bg-[#2a1a12]/40 border border-white/20 hover:bg-white/10"
                  }`}
                >
                  {spice ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5 group">
                      <img src={spice.image} alt={spice.name} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-90 group-hover:scale-105 transition-transform duration-350" />
                      <div className="absolute inset-0 bg-black/40 rounded-full group-hover:bg-black/30 transition-colors pointer-events-none" />
                      <span className="relative z-10 text-[9px] sm:text-[10px] font-bold text-white leading-tight line-clamp-2 w-full px-1">
                        {spice.name}
                      </span>
                      <span className="relative z-10 text-[7px] sm:text-[8px] text-amber/90 uppercase tracking-wider mt-0.5 font-extrabold bg-white/10 px-1 py-0.5 rounded-md">
                        {spice.size.replace(" Pack", "")} • ₹{spice.price}
                      </span>
                      <button
                        onClick={(e) => clearCompartment(idx, e)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer z-25"
                        title="Remove spice"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-white/50">Comp {idx}</span>
                  )}
                </button>
              );
            })}

            {/* Center Compartment (0) */}
            {(() => {
              const isSelected = selectedCompartment === 0;
              const spice = boxState[0];
              return (
                <button
                  onClick={() => setSelectedCompartment(0)}
                  className={`absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center text-center transition-all duration-300 overflow-hidden ${
                    spice 
                      ? "bg-white border-4 border-amber shadow-halo" 
                      : isSelected 
                      ? "bg-white/20 border-2 border-dashed border-white shadow-halo scale-105" 
                      : "bg-[#2a1a12]/50 border border-white/20 hover:bg-white/10"
                  }`}
                >
                  {spice ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-2 group">
                      <img src={spice.image} alt={spice.name} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-90 group-hover:scale-105 transition-transform duration-350" />
                      <div className="absolute inset-0 bg-black/40 rounded-full group-hover:bg-black/30 transition-colors pointer-events-none" />
                      <span className="relative z-10 text-[10px] sm:text-[11px] font-bold text-white leading-tight line-clamp-2 w-full px-1">
                        {spice.name}
                      </span>
                      <span className="relative z-10 text-[8px] text-amber/90 uppercase tracking-wider mt-0.5 font-extrabold bg-white/10 px-1 py-0.5 rounded-md">
                        {spice.size.replace(" Pack", "")} • ₹{spice.price}
                      </span>
                      <button
                        onClick={(e) => clearCompartment(0, e)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer z-25"
                        title="Remove spice"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Center</span>
                  )}
                </button>
              );
            })()}
          </div>

          <div className="w-full mt-6 flex justify-between items-center border-t border-truffle/10 pt-4">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest text-truffle/55">Bundle Price</span>
              <p className="text-2xl font-bold text-cocoa">₹{totalPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-truffle/55">Filled Slots</span>
              <p className="text-lg font-bold text-espresso">{filledCount} / 7</p>
            </div>
          </div>
        </div>

        {/* Right Spices Selection Panel */}
        <div className="w-full lg:w-96 rounded-[2.5rem] border border-truffle/10 bg-white/75 p-6 shadow-luxe backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-espresso mb-4">Select Spices</h2>
            
            {selectedCompartment === null ? (
              <div className="bg-amber/5 border border-amber/15 rounded-2xl p-4 text-center text-xs text-amber-800 font-medium mb-6">
                💡 Select an empty compartment inside the circular box left to start filling it.
              </div>
            ) : (
              <div className="bg-cocoa/5 border border-cocoa/15 rounded-2xl p-4 text-center text-xs text-cocoa/90 font-medium mb-6">
                 Filling compartment: <span className="font-bold">{selectedCompartment === 0 ? "Center" : `Slot ${selectedCompartment}`}</span>
              </div>
            )}

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {singleSpices.map((spice) => (
                <div
                  key={spice.baseId}
                  className={`w-full flex flex-col p-3 rounded-2xl border transition-all duration-200 ${
                    selectedCompartment === null 
                      ? "opacity-60 border-truffle/5 bg-truffle/5"
                      : "border-truffle/10 bg-white/90 hover:border-amber/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={spice.image} alt={spice.name} className="w-10 h-10 object-cover rounded-xl border border-truffle/10" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-espresso truncate">{spice.name}</h4>
                      <p className="text-[9px] uppercase tracking-widest text-[#d0843e] font-bold">
                        {spice.category === "veg" ? "Vegetarian" : "Non-Vegetarian"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Size/Gram selectors */}
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-truffle/5 pt-2">
                    {spice.variants.map((v) => (
                      <button
                        key={v.id}
                        disabled={selectedCompartment === null}
                        onClick={() => fillCompartment({
                          id: v.id,
                          name: spice.name,
                          image: spice.image,
                          size: v.size,
                          price: v.price
                        })}
                        className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                          selectedCompartment === null
                            ? "border-truffle/10 bg-truffle/5 text-truffle/40 cursor-not-allowed"
                            : "border-cocoa/20 bg-cocoa/5 text-cocoa hover:bg-[#d0843e] hover:text-white hover:border-[#d0843e] active:scale-[0.97]"
                        }`}
                      >
                        {v.size.replace(" Pack", "")} (₹{v.price})
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-truffle/10 space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={filledCount < 7}
              className={`w-full py-4.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer ${
                filledCount === 7
                  ? "bg-cocoa hover:bg-cocoa/90 text-white shadow-halo"
                  : "bg-truffle/10 text-truffle/40 cursor-not-allowed"
              }`}
            >
              Add Custom Box to Cart
            </button>
            <button
              onClick={() => setBoxState(Array(7).fill(null))}
              className="w-full py-3.5 rounded-full border border-truffle/20 bg-white text-xs font-bold uppercase tracking-[0.2em] text-truffle hover:bg-almond transition"
            >
              Reset Box
            </button>
          </div>
        </div>

      </div>

      {/* Floating Mobile Mini-Box */}
      <AnimatePresence>
        {showFloatingBox && (
          <div className="fixed bottom-6 right-6 z-45 flex flex-col items-center gap-2 lg:hidden">
            {/* Scroll to Top Arrow Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-9 h-9 rounded-full bg-cocoa text-porcelain shadow-lg flex items-center justify-center border border-white/20 active:scale-90 transition-transform cursor-pointer"
              title="Scroll to top"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
              </svg>
            </motion.button>

            {/* Interactive Mini Spice Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#8a5d3b] to-[#422613] p-1.5 shadow-2xl border-2 border-[#e6c19c]/40 flex items-center justify-center"
            >
              {/* Wooden grain overlay */}
              <div className="absolute inset-0 rounded-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-100 via-amber-900 to-black pointer-events-none" />

              {/* Floating Compartments */}
              {boxState.map((spice, idx) => {
                if (idx === 0) return null; // center handled below
                const angle = ((idx - 1) * 360) / 6;
                const radius = 28; // px
                const transform = `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`;
                const isSelected = selectedCompartment === idx;
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCompartment(idx);
                    }}
                    style={{ transform }}
                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 border cursor-pointer ${
                      isSelected 
                        ? "border-amber bg-white ring-2 ring-amber/40 scale-110 shadow-halo" 
                        : spice 
                        ? "border-white/40 bg-white" 
                        : "border-white/10 bg-[#2a1a12]/60 hover:bg-[#2a1a12]/80"
                    }`}
                    title={spice ? spice.name : `Compartment ${idx}`}
                  >
                    {spice ? (
                      <img src={spice.image} alt={spice.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className={`text-[8px] font-bold ${isSelected ? "text-amber" : "text-white/45"}`}>{idx}</span>
                    )}
                  </button>
                );
              })}

              {/* Center Compartment */}
              {(() => {
                const isSelected = selectedCompartment === 0;
                const spice = boxState[0];
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCompartment(0);
                    }}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center overflow-hidden z-10 transition-all duration-200 border cursor-pointer ${
                      isSelected 
                        ? "border-amber bg-white ring-2 ring-amber/40 scale-110 shadow-halo" 
                        : spice 
                        ? "border-white/40 bg-white" 
                        : "border-white/10 bg-[#2a1a12]/70 hover:bg-[#2a1a12]/90"
                    }`}
                    title={spice ? spice.name : "Center Compartment"}
                  >
                    {spice ? (
                      <img src={spice.image} alt={spice.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className={`text-[9px] font-bold ${isSelected ? "text-amber" : "text-white/45"}`}>C</span>
                    )}
                  </button>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
