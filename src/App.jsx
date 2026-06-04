import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { SOCKET_URL, API_BASE_URL } from "./config/runtime";
import { products, getProductById } from "./data/products";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LandingPage from "./pages/LandingPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProductPage from "./pages/ProductPage";
import ProductsPage from "./pages/ProductsPage";
import RecipePage from "./pages/RecipePage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProfilePage from "./pages/ProfilePage";
import SpiceBoxBuilder from "./pages/SpiceBoxBuilder";
import RecipeCompanion from "./pages/RecipeCompanion";

const ingredients = [
  { title: "Guntur Chilli", note: "Deep red color and bold chilli-forward heat." },
  { title: "Stone-Ground Coriander", note: "Roasted body and freshness for masala base." },
  { title: "Black Pepper & Clove", note: "Sharp spice kick and warm slow-cook aroma." },
  { title: "Shahi Jeera & Fennel", note: "Fragrant finish for biryani, chicken, and mutton gravies." }
];

function AmbientSpices() {
  const spices = useMemo(
    () =>
      Array.from({ length: 20 }, (_, idx) => ({
        id: idx,
        left: `${(idx * 13) % 100}%`,
        top: `${(idx * 19) % 100}%`,
        size: 6 + (idx % 4) * 2,
        duration: 9 + (idx % 5) * 2,
        delay: (idx % 6) * 0.7
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ivory-glow" />
      <div className="grain-overlay absolute inset-0 opacity-20" />
      <div className="absolute -left-28 top-[-6rem] h-[22rem] w-[22rem] rounded-full bg-amber/20 blur-[90px]" />
      <div className="absolute right-[-5rem] top-[20%] h-[18rem] w-[18rem] rounded-full bg-biscuit/80 blur-[80px]" />
      {spices.map((spice) => (
        <motion.span
          key={spice.id}
          className="absolute rounded-full bg-gradient-to-br from-amber/25 to-cocoa/20 blur-[1px]"
          style={{ left: spice.left, top: spice.top, width: spice.size, height: spice.size }}
          animate={{ x: [0, spice.id % 2 ? 18 : -14, 0], y: [0, -24, 0], opacity: [0.2, 0.45, 0.18] }}
          transition={{ duration: spice.duration, delay: spice.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("anjaraipetti_cart");
      const parsed = saved ? JSON.parse(saved) : null;
      // Handle migration from old single-product cart to new multi-product cart
      if (parsed && typeof parsed === "object") {
        if ("productId" in parsed) {
          return parsed.productId && parsed.quantity > 0 ? { [parsed.productId]: parsed.quantity } : {};
        }
        return parsed;
      }
    } catch (e) {
      console.error("Error parsing cart from localStorage:", e);
    }
    return {};
  });
  const [dynamicProducts, setDynamicProducts] = useState(products);
  const [inventoryMap, setInventoryMap] = useState({});
  const [deliveryChargeEnabled, setDeliveryChargeEnabled] = useState(true);
  const socketRef = useRef(null);
  const defaultProductId = products[0].id;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"]
    });
    socketRef.current = socket;

    socket.on("cart:state", (payload) => {
      const inventory = payload?.inventory || payload?.inventoryByProduct || {};
      setInventoryMap(inventory);
    });

    socket.on("settings:delivery", ({ deliveryChargeEnabled }) => {
      setDeliveryChargeEnabled(deliveryChargeEnabled);
    });

    // Listen to real-time price updates over WebSocket
    socket.on("products:prices", ({ productId, price }) => {
      setDynamicProducts((prevProducts) => {
        return prevProducts.map((p) => {
          const updatedVariants = p.variants?.map((v) => {
            if (v.id === productId) {
              return { ...v, price };
            }
            return v;
          }) || [];
          
          const basePrice = updatedVariants[0]?.price || p.price;
          return {
            ...p,
            price: basePrice,
            variants: updatedVariants
          };
        });
      });
    });

    // Fetch initial customized prices from database
    const fetchCustomPrices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/prices`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.ok && payload.prices) {
            setDynamicProducts((prevProducts) => {
              return prevProducts.map((p) => {
                const updatedVariants = p.variants?.map((v) => {
                  if (payload.prices[v.id] !== undefined) {
                    return { ...v, price: payload.prices[v.id] };
                  }
                  return v;
                }) || [];
                
                const basePrice = updatedVariants[0]?.price || p.price;
                return {
                  ...p,
                  price: basePrice,
                  variants: updatedVariants
                };
              });
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch product prices:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.ok && typeof payload.deliveryChargeEnabled === "boolean") {
            setDeliveryChargeEnabled(payload.deliveryChargeEnabled);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };

    fetchCustomPrices();
    fetchSettings();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("anjaraipetti_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const addToCart = (productId, count = 1) => {
    const delta = Math.max(1, Number.parseInt(count, 10) || 1);
    const available = Number(inventoryMap[productId] ?? 9999);
    setCart((prev) => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, Math.min(available, currentQty + delta));
      if (newQty === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const updateCartQuantity = (productId, count) => {
    const quantity = Math.max(0, Number.parseInt(count, 10) || 0);
    const available = Number(inventoryMap[productId] ?? 9999);
    setCart((prev) => {
      const next = { ...prev };
      if (quantity === 0) {
        delete next[productId];
      } else {
        next[productId] = Math.min(available, quantity);
      }
      return next;
    });
  };

  const addMultipleToCart = (items) => {
    setCart((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const delta = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
        const available = Number(inventoryMap[item.productId] ?? 9999);
        const currentQty = next[item.productId] || 0;
        next[item.productId] = Math.max(0, Math.min(available, currentQty + delta));
      });
      return next;
    });
  };

  const clearCart = () => setCart({});

  const getDynamicProductById = (productId) => {
    if (!dynamicProducts || dynamicProducts.length === 0) {
      return null;
    }
    const cleanId = String(productId || "").trim();
    if (cleanId.startsWith("custom-box:")) {
      const parts = cleanId.split(":");
      const spiceIds = parts[1]?.split(",") || [];
      const spiceNames = spiceIds.map(id => {
        const p = getDynamicProductById(id);
        return p ? p.name.replace("Namma Veetu Anjaraipetti ", "") : id;
      });
      return {
        id: cleanId,
        name: "Custom Anjaraipetti Spice Box",
        price: 399,
        size: `${spiceIds.length} Blends`,
        subtitle: "7-Blend Custom Anjaraipetti Box",
        description: `Customized with: ${spiceNames.join(", ")}`,
        image: "/images/combo-box.jpg",
        isCustomBox: true,
        selectedSpices: spiceIds
      };
    }
    for (const product of dynamicProducts) {
      if (product.id === cleanId) {
        return {
          ...product,
          price: product.variants?.[0]?.price || product.price || 0,
          size: product.variants?.[0]?.size || product.size || ""
        };
      }
      const variant = product.variants?.find(v => v.id === cleanId);
      if (variant) {
        return {
          ...product,
          id: variant.id,
          price: variant.price,
          size: variant.size,
          name: `${product.name} (${variant.size})`
        };
      }
    }
    return null;
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => ({ product: getDynamicProductById(id), quantity: qty }))
      .filter((item) => item.product != null);
  }, [cart, dynamicProducts]);

  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-porcelain text-espresso">
      <AmbientSpices />
      <NavBar cartQuantity={cartQuantity} />
      <Routes>
        <Route path="/" element={<LandingPage products={dynamicProducts} />} />
        <Route path="/product" element={<ProductsPage products={dynamicProducts} />} />
        <Route
          path="/product/:productId"
          element={
            <ProductPage
              products={dynamicProducts}
              ingredients={ingredients}
              onAddToCart={addToCart}
              availableMap={inventoryMap}
              cartItems={cartItems}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <CartPage
              cartItems={cartItems}
              cartQuantity={cartQuantity}
              onUpdateQuantity={updateCartQuantity}
              deliveryChargeEnabled={deliveryChargeEnabled}
            />
          }
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              cartItems={cartItems}
              onClearCart={clearCart}
              deliveryChargeEnabled={deliveryChargeEnabled}
            />
          }
        />
        <Route path="/order/:orderId" element={<OrderSuccessPage />} />
        <Route path="/recipe/:productId" element={<RecipePage />} />
        <Route path="/spice-builder" element={<SpiceBoxBuilder onAddToCart={addToCart} />} />
        <Route path="/recipe-companion" element={<RecipeCompanion onAddMultipleToCart={addMultipleToCart} />} />
        <Route path="/my-orders" element={<MyOrdersPage onAddMultipleToCart={addMultipleToCart} />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </main>
  );
}
