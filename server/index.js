import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Razorpay from "razorpay";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

const PRODUCTS = {
  "biryani-masala": { id: "biryani-masala", name: "Anjaraipetti Biryani Masala", price: 1, stock: 120 },
  "chilli-masala": { id: "chilli-masala", name: "Anjaraipetti Chilli Masala", price: 349, stock: 140 },
  "chicken-masala": { id: "chicken-masala", name: "Anjaraipetti Chicken Masala", price: 399, stock: 130 },
  "mutton-masala": { id: "mutton-masala", name: "Anjaraipetti Mutton Masala", price: 449, stock: 110 }
};

const memoryOrders = new Map();
const processedPayments = new Set();
const mongoUri = process.env.MONGODB_URI || "";
let mongoConnected = false;
let memoryInvoiceSequence = 0;
const adminEmail = (process.env.ADMIN_EMAIL || "admin@anjaraipetti.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const adminJwtSecret = process.env.ADMIN_JWT_SECRET || "replace-this-secret";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

let inventoryByProduct = Object.fromEntries(Object.values(PRODUCTS).map((product) => [product.id, product.stock]));
let cartState = { productId: null, quantity: 0 };

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: { type: String, default: "" }
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String, default: "" },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    payment: {
      method: { type: String, required: true },
      status: { type: String, required: true },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "", index: true }
    },
    status: { type: String, required: true },
    eta: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },
  { versionKey: false }
);

const appStateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    cart: {
      productId: { type: String, default: "" },
      quantity: { type: Number, default: 0 }
    },
    inventoryByProduct: {
      type: Map,
      of: Number,
      default: {}
    },
    invoiceSequence: { type: Number, required: true, default: 0 },
    productId: { type: String, default: "biryani-masala" },
    cartQuantity: { type: Number, default: 0 },
    inventoryAvailable: { type: Number, default: 120 }
  },
  { versionKey: false }
);

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
const AppStateModel = mongoose.models.AppState || mongoose.model("AppState", appStateSchema);
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const razorpayClient =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      })
    : null;

function isPersistenceEnabled() {
  return mongoConnected;
}

function getProductById(productId) {
  return PRODUCTS[String(productId || "").trim()] || null;
}

function clampQuantity(productId, value) {
  const available = Number(inventoryByProduct[productId] ?? 0);
  return Math.max(0, Math.min(available, value));
}

function broadcastState() {
  io.emit("cart:state", {
    cart: { ...cartState },
    quantity: cartState.quantity,
    cartProductId: cartState.productId,
    totalQuantity: cartState.quantity,
    inventory: { ...inventoryByProduct },
    available: cartState.productId ? Number(inventoryByProduct[cartState.productId] ?? 0) : 0
  });
}

function issueAdminToken() {
  return jwt.sign({ role: "admin", email: adminEmail }, adminJwtSecret, {
    expiresIn: "12h"
  });
}

function requireAdminAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ ok: false, message: "Admin token is required" });
  }

  try {
    const payload = jwt.verify(token, adminJwtSecret);
    if (!payload || payload.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Access denied" });
    }
    req.admin = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ ok: false, message: "Invalid or expired admin token" });
  }
}

async function initializeMongo() {
  if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.warn("MONGODB_URI is not set. Running with in-memory storage.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    mongoConnected = true;

    const state = await AppStateModel.findOneAndUpdate(
      { key: "global" },
      {
        $setOnInsert: {
          key: "global",
          cart: { productId: "", quantity: 0 },
          inventoryByProduct,
          invoiceSequence: 0
        }
      },
      { upsert: true, new: true }
    ).lean();

    if (state) {
      const mappedInventory = state.inventoryByProduct
        ? Object.fromEntries(Object.entries(state.inventoryByProduct).map(([k, v]) => [k, Number(v)]))
        : null;

      if (mappedInventory && Object.keys(mappedInventory).length > 0) {
        inventoryByProduct = { ...inventoryByProduct, ...mappedInventory };
      } else if (typeof state.inventoryAvailable === "number") {
        inventoryByProduct["biryani-masala"] = Number(state.inventoryAvailable);
      }

      const cart = state.cart || {};
      if (cart.productId && getProductById(cart.productId)) {
        cartState = {
          productId: cart.productId,
          quantity: clampQuantity(cart.productId, Number(cart.quantity) || 0)
        };
      } else if (state.productId && typeof state.cartQuantity === "number" && getProductById(state.productId)) {
        cartState = {
          productId: state.productId,
          quantity: clampQuantity(state.productId, Number(state.cartQuantity) || 0)
        };
      }

      memoryInvoiceSequence = Math.max(0, Number(state.invoiceSequence) || 0);
    }

    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect MongoDB:", error.message);
    process.exit(1);
  }
}

async function persistState() {
  if (!isPersistenceEnabled()) return;
  await AppStateModel.findOneAndUpdate(
    { key: "global" },
    {
      $set: {
        cart: {
          productId: cartState.productId || "",
          quantity: cartState.quantity
        },
        inventoryByProduct,
        invoiceSequence: memoryInvoiceSequence,
        productId: cartState.productId || "biryani-masala",
        cartQuantity: cartState.quantity,
        inventoryAvailable: Number(inventoryByProduct["biryani-masala"] ?? 0)
      }
    },
    { upsert: true }
  );
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  let sequence = 0;

  if (!isPersistenceEnabled()) {
    memoryInvoiceSequence += 1;
    sequence = memoryInvoiceSequence;
    return `INV-${year}-${String(sequence).padStart(3, "0")}`;
  }

  // First ensure document exists
  await AppStateModel.findOneAndUpdate(
    { key: "global" },
    {
      $setOnInsert: {
        key: "global",
        cart: { productId: "", quantity: 0 },
        inventoryByProduct,
        invoiceSequence: 0
      }
    },
    { upsert: true }
  );

  // Then increment invoiceSequence
  const state = await AppStateModel.findOneAndUpdate(
    { key: "global" },
    { $inc: { invoiceSequence: 1 } },
    { new: true }
  ).lean();

  sequence = Math.max(1, Number(state?.invoiceSequence) || 1);
  memoryInvoiceSequence = sequence;
  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
}

async function saveOrder(order) {
  if (!isPersistenceEnabled()) {
    memoryOrders.set(order.orderId, order);
    return;
  }
  await OrderModel.create(order);
}

async function getOrderById(orderId) {
  if (!isPersistenceEnabled()) {
    return memoryOrders.get(orderId) || null;
  }
  return OrderModel.findOne({ orderId }).lean();
}

async function listOrders(phone) {
  if (!isPersistenceEnabled()) {
    return Array.from(memoryOrders.values())
      .filter((order) => (phone ? order.customer?.phone === phone : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const query = phone ? { "customer.phone": phone } : {};
  return OrderModel.find(query).sort({ createdAt: -1 }).lean();
}

async function deleteOrderById(orderId) {
  if (!isPersistenceEnabled()) {
    const existing = memoryOrders.get(orderId);
    if (!existing) return null;
    memoryOrders.delete(orderId);
    return existing;
  }
  return OrderModel.findOneAndDelete({ orderId }).lean();
}

async function paymentAlreadyProcessed(razorpayPaymentId) {
  if (processedPayments.has(razorpayPaymentId)) return true;
  if (!isPersistenceEnabled()) return false;
  const existing = await OrderModel.findOne({ "payment.razorpayPaymentId": razorpayPaymentId }).select("_id").lean();
  return Boolean(existing);
}

function isBlank(value) {
  return !value || String(value).trim().length === 0;
}

function validatePayload(payload, isRazorpayConfirm = false) {
  const errors = {};
  const { customer = {}, address = {}, payment = {}, quantity, productId } = payload || {};
  const product = getProductById(productId);
  const qty = Number.parseInt(quantity, 10);

  if (!product) errors.productId = "Invalid product";
  if (Number.isNaN(qty) || qty < 1) errors.quantity = "Invalid quantity";

  // Skip cart validation for Razorpay confirmation since signature already verified the payment
  if (!isRazorpayConfirm) {
    if (!Number.isNaN(qty) && cartState.productId !== productId) {
      errors.quantity = "Cart contains a different product";
    }
    if (!Number.isNaN(qty) && qty > cartState.quantity) {
      errors.quantity = "Quantity exceeds cart";
    }
  }
  
  if (product && !Number.isNaN(qty) && qty > Number(inventoryByProduct[product.id] ?? 0)) {
    errors.quantity = "Out of stock";
  }

  if (isBlank(customer.name)) errors.customerName = "Customer name is required";
  if (!/^[6-9]\d{9}$/.test(String(customer.phone || "").trim())) errors.customerPhone = "Enter valid 10-digit Indian phone";

  if (isBlank(address.line1)) errors.addressLine1 = "Address line is required";
  if (isBlank(address.city)) errors.city = "City is required";
  if (isBlank(address.state)) errors.state = "State is required";
  if (!/^\d{6}$/.test(String(address.pincode || "").trim())) errors.pincode = "Enter valid 6-digit pincode";

  const method = String(payment.method || "").toLowerCase();
  if (!["upi", "card", "cod", "razorpay"].includes(method)) errors.paymentMethod = "Invalid payment method";
  if (method === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(payment.upiId || "").trim())) {
    errors.upiId = "Enter valid UPI ID";
  }
  if (method === "card") {
    const cardNumber = String(payment.cardNumber || "").replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cardNumber)) errors.cardNumber = "Enter valid 16-digit card number";
    if (!/^\d{2}\/\d{2}$/.test(String(payment.expiry || "").trim())) errors.expiry = "Use MM/YY expiry";
    if (!/^\d{3}$/.test(String(payment.cvv || "").trim())) errors.cvv = "Enter 3-digit CVV";
    if (isBlank(payment.cardName)) errors.cardName = "Card holder name required";
  }

  return { errors, qty, method, product };
}

async function createFinalOrder({ productId, quantity, customer, address, payment }) {
  const product = getProductById(productId);
  if (!product) {
    throw new Error("Invalid product");
  }

  const invoiceNumber = await nextInvoiceNumber();
  const subtotal = product.price * quantity;
  const grandTotal = subtotal;
  const total = grandTotal;
  const orderId = `ANJ${Date.now().toString().slice(-8)}`;

  const order = {
    orderId,
    invoiceNumber,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    subtotal,
    grandTotal,
    total,
    customer,
    address,
    payment,
    status: "Order confirmed",
    eta: "2-4 business days",
    createdAt: new Date().toISOString()
  };

  await saveOrder(order);
  inventoryByProduct[product.id] = Math.max(0, Number(inventoryByProduct[product.id] ?? 0) - quantity);
  if (cartState.productId === product.id) {
    cartState.quantity = clampQuantity(product.id, cartState.quantity - quantity);
    if (cartState.quantity === 0) {
      cartState.productId = null;
    }
  }
  await persistState();
  broadcastState();

  return order;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    cart: cartState,
    inventory: inventoryByProduct,
    persistence: isPersistenceEnabled() ? "mongodb" : "memory"
  });
});

app.post("/api/admin/login", (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ ok: false, message: "Invalid admin credentials" });
  }

  const token = issueAdminToken();
  return res.json({
    ok: true,
    token,
    admin: { email: adminEmail, role: "admin" }
  });
});

app.post("/api/orders", async (req, res) => {
  const { errors, qty, method, product } = validatePayload(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const order = await createFinalOrder({
      productId: product.id,
      quantity: qty,
      customer: req.body.customer,
      address: req.body.address,
      payment: {
        method,
        status: method === "cod" ? "Pay on delivery" : "Paid"
      }
    });

    return res.json({ ok: true, order });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: "Unable to place order" });
  }
});

app.post("/api/payments/razorpay/order", async (req, res) => {
  if (!razorpayClient || !razorpayKeyId) {
    return res.status(503).json({ ok: false, message: "Razorpay is not configured on server" });
  }

  const productId = String(req.body?.productId || "");
  const product = getProductById(productId);
  const quantity = Number.parseInt(req.body?.quantity, 10);
  if (!product) {
    return res.status(400).json({ ok: false, message: "Invalid product" });
  }
  if (Number.isNaN(quantity) || quantity < 1) {
    return res.status(400).json({ ok: false, message: "Invalid quantity" });
  }
  if (cartState.productId !== product.id || quantity > cartState.quantity || quantity > Number(inventoryByProduct[product.id] ?? 0)) {
    return res.status(400).json({ ok: false, message: "Requested quantity unavailable" });
  }

  try {
    const subtotal = product.price * quantity;
    const amount = Math.round(subtotal * 100);
    const razorpayOrder = await razorpayClient.orders.create({
      amount,
      currency: "INR",
      receipt: `anj_${Date.now()}`,
      notes: {
        productId: product.id,
        quantity: String(quantity)
      }
    });

    return res.json({
      ok: true,
      keyId: razorpayKeyId,
      razorpayOrder
    });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: "Unable to create Razorpay order" });
  }
});

app.post("/api/orders/razorpay/confirm", async (req, res) => {
  if (!razorpayClient || !razorpayKeySecret) {
    return res.status(503).json({ ok: false, message: "Razorpay is not configured on server" });
  }

  const { payment = {}, customer, address, quantity, productId } = req.body || {};
  const razorpayOrderId = String(payment.razorpayOrderId || "");
  const razorpayPaymentId = String(payment.razorpayPaymentId || "");
  const razorpaySignature = String(payment.razorpaySignature || "");
  const { errors, qty, product } = validatePayload({
    customer,
    address,
    quantity,
    productId,
    payment: { method: "razorpay" }
  }, true);

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    errors.razorpay = "Missing Razorpay payment details";
  }
  if (await paymentAlreadyProcessed(razorpayPaymentId)) {
    return res.status(409).json({ ok: false, message: "Payment already processed" });
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  const expectedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ ok: false, message: "Invalid payment signature" });
  }

  try {
    await razorpayClient.payments.fetch(razorpayPaymentId);
  } catch (_error) {
    return res.status(400).json({ ok: false, message: "Payment not found in Razorpay" });
  }

  try {
    const order = await createFinalOrder({
      productId: product.id,
      quantity: qty,
      customer,
      address,
      payment: {
        method: "razorpay",
        status: "Paid",
        razorpayOrderId,
        razorpayPaymentId
      }
    });
    processedPayments.add(razorpayPaymentId);
    return res.json({ ok: true, order });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Order confirmation error:", error.message, error);
    return res.status(500).json({ ok: false, message: "Unable to confirm order", error: error.message });
  }
});

app.get("/api/admin/orders", requireAdminAuth, async (req, res) => {
  const phone = String(req.query.phone || "").trim();
  try {
    const list = await listOrders(phone);
    return res.json({ ok: true, count: list.length, orders: list });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: "Unable to fetch orders" });
  }
});

app.get("/api/admin/orders/:orderId", requireAdminAuth, async (req, res) => {
  const order = await getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ ok: false, message: "Order not found" });
  }
  return res.json({ ok: true, order });
});

app.delete("/api/admin/orders/:orderId", requireAdminAuth, async (req, res) => {
  try {
    const deletedOrder = await deleteOrderById(req.params.orderId);
    if (!deletedOrder) {
      return res.status(404).json({ ok: false, message: "Order not found" });
    }

    const restoreQty = Number.parseInt(deletedOrder.quantity, 10);
    const restoreProduct = getProductById(deletedOrder.productId);
    if (restoreProduct && !Number.isNaN(restoreQty) && restoreQty > 0) {
      inventoryByProduct[restoreProduct.id] = Number(inventoryByProduct[restoreProduct.id] ?? 0) + restoreQty;
    }
    await persistState();
    broadcastState();

    return res.json({ ok: true, message: "Order deleted successfully", order: deletedOrder });
  } catch (_error) {
    return res.status(500).json({ ok: false, message: "Unable to delete order" });
  }
});

app.get("/api/orders/:orderId", async (req, res) => {
  const order = await getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ ok: false, message: "Order not found" });
  }
  return res.json({ ok: true, order });
});

if (fs.existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

io.on("connection", (socket) => {
  // Each user gets their own cart (not global)
  let userCart = { productId: null, quantity: 0 };

  socket.emit("cart:state", {
    cart: { ...userCart },
    quantity: userCart.quantity,
    cartProductId: userCart.productId,
    totalQuantity: userCart.quantity,
    inventory: { ...inventoryByProduct },
    available: userCart.productId ? Number(inventoryByProduct[userCart.productId] ?? 0) : 0
  });

  socket.on("cart:change", async ({ productId, delta }) => {
    const product = getProductById(productId);
    const parsed = Number.parseInt(delta, 10);
    if (!product || Number.isNaN(parsed)) return;

    if (userCart.productId !== product.id) {
      userCart = {
        productId: product.id,
        quantity: clampQuantity(product.id, Math.max(0, parsed))
      };
    } else {
      userCart = {
        productId: product.id,
        quantity: clampQuantity(product.id, userCart.quantity + parsed)
      };
    }

    if (userCart.quantity === 0) {
      userCart.productId = null;
    }

    // Send only to this user, not broadcast to all
    socket.emit("cart:state", {
      cart: { ...userCart },
      quantity: userCart.quantity,
      cartProductId: userCart.productId,
      totalQuantity: userCart.quantity,
      inventory: { ...inventoryByProduct },
      available: userCart.productId ? Number(inventoryByProduct[userCart.productId] ?? 0) : 0
    });
  });

  socket.on("cart:set", async ({ productId, quantity }) => {
    const product = getProductById(productId);
    const parsed = Number.parseInt(quantity, 10);
    if (!product || Number.isNaN(parsed)) return;

    const nextQuantity = clampQuantity(product.id, Math.max(0, parsed));
    userCart = {
      productId: nextQuantity > 0 ? product.id : null,
      quantity: nextQuantity
    };

    // Send only to this user, not broadcast to all
    socket.emit("cart:state", {
      cart: { ...userCart },
      quantity: userCart.quantity,
      cartProductId: userCart.productId,
      totalQuantity: userCart.quantity,
      inventory: { ...inventoryByProduct },
      available: userCart.productId ? Number(inventoryByProduct[userCart.productId] ?? 0) : 0
    });
  });
});

const port = Number.parseInt(process.env.PORT || "4000", 10);
initializeMongo().then(() => {
  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Anjaraipetti realtime server running on http://localhost:${port}`);
  });
});
