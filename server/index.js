import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import { createServer } from "node:http";
import https from "node:https";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { generateInvoicePDF } from "./pdfGenerator.js";
import nodemailer from "nodemailer";
import admin from "firebase-admin";

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
  "sambar-masala-50g": { id: "sambar-masala-50g", name: "Anjaraipetti Sambar Masala (50g Pack)", price: 1, stock: 150 },
  "sambar-masala-100g": { id: "sambar-masala-100g", name: "Anjaraipetti Sambar Masala (100g Pack)", price: 1, stock: 150 },
  "sambar-masala-250g": { id: "sambar-masala-250g", name: "Anjaraipetti Sambar Masala (250g Pack)", price: 1, stock: 150 },

  "biryani-masala-50g": { id: "biryani-masala-50g", name: "Anjaraipetti Biriyani Masala (50g Pack)", price: 75, stock: 150 },
  "biryani-masala-100g": { id: "biryani-masala-100g", name: "Anjaraipetti Biriyani Masala (100g Pack)", price: 139, stock: 150 },
  "biryani-masala-250g": { id: "biryani-masala-250g", name: "Anjaraipetti Biriyani Masala (250g Pack)", price: 339, stock: 150 },

  "pepper-powder-50g": { id: "pepper-powder-50g", name: "Anjaraipetti Pepper Powder (50g Pack)", price: 99, stock: 150 },
  "pepper-powder-100g": { id: "pepper-powder-100g", name: "Anjaraipetti Pepper Powder (100g Pack)", price: 189, stock: 150 },
  "pepper-powder-250g": { id: "pepper-powder-250g", name: "Anjaraipetti Pepper Powder (250g Pack)", price: 459, stock: 150 },

  "parupu-podi-50g": { id: "parupu-podi-50g", name: "Anjaraipetti Parupu Podi (50g Pack)", price: 49, stock: 150 },
  "parupu-podi-100g": { id: "parupu-podi-100g", name: "Anjaraipetti Parupu Podi (100g Pack)", price: 89, stock: 150 },
  "parupu-podi-250g": { id: "parupu-podi-250g", name: "Anjaraipetti Parupu Podi (250g Pack)", price: 215, stock: 150 },

  "fish-fry-masala-50g": { id: "fish-fry-masala-50g", name: "Anjaraipetti Fish Fry Masala (50g Pack)", price: 49, stock: 150 },
  "fish-fry-masala-100g": { id: "fish-fry-masala-100g", name: "Anjaraipetti Fish Fry Masala (100g Pack)", price: 89, stock: 150 },
  "fish-fry-masala-250g": { id: "fish-fry-masala-250g", name: "Anjaraipetti Fish Fry Masala (250g Pack)", price: 215, stock: 150 },

  "tandoori-masala-50g": { id: "tandoori-masala-50g", name: "Anjaraipetti Tandoori Masala (50g Pack)", price: 65, stock: 150 },
  "tandoori-masala-100g": { id: "tandoori-masala-100g", name: "Anjaraipetti Tandoori Masala (100g Pack)", price: 119, stock: 150 },
  "tandoori-masala-250g": { id: "tandoori-masala-250g", name: "Anjaraipetti Tandoori Masala (250g Pack)", price: 289, stock: 150 },

  "mutton-masala-50g": { id: "mutton-masala-50g", name: "Anjaraipetti Mutton Masala (50g Pack)", price: 85, stock: 150 },
  "mutton-masala-100g": { id: "mutton-masala-100g", name: "Anjaraipetti Mutton Masala (100g Pack)", price: 159, stock: 150 },
  "mutton-masala-250g": { id: "mutton-masala-250g", name: "Anjaraipetti Mutton Masala (250g Pack)", price: 389, stock: 150 },

  "kolambu-powder-100g": { id: "kolambu-powder-100g", name: "Anjaraipetti Kolambu / Chilly Powder (100g Pack)", price: 79, stock: 150 },
  "kolambu-powder-250g": { id: "kolambu-powder-250g", name: "Anjaraipetti Kolambu / Chilly Powder (250g Pack)", price: 189, stock: 150 },

  "idly-podi-100g": { id: "idly-podi-100g", name: "Anjaraipetti Idly Podi (100g Pack)", price: 49, stock: 150 },
  "idly-podi-250g": { id: "idly-podi-250g", name: "Anjaraipetti Idly Podi (250g Pack)", price: 119, stock: 150 },

  "garam-masala-50g": { id: "garam-masala-50g", name: "Anjaraipetti Garam Masala (50g Pack)", price: 85, stock: 150 },
  "garam-masala-100g": { id: "garam-masala-100g", name: "Anjaraipetti Garam Masala (100g Pack)", price: 159, stock: 150 },
  "garam-masala-250g": { id: "garam-masala-250g", name: "Anjaraipetti Garam Masala (250g Pack)", price: 389, stock: 150 },

  "chicken-masala-50g": { id: "chicken-masala-50g", name: "Anjaraipetti Chicken Masala (50g Pack)", price: 85, stock: 150 },
  "chicken-masala-100g": { id: "chicken-masala-100g", name: "Anjaraipetti Chicken Masala (100g Pack)", price: 159, stock: 150 },
  "chicken-masala-250g": { id: "chicken-masala-250g", name: "Anjaraipetti Chicken Masala (250g Pack)", price: 389, stock: 150 },

  "coriander-powder-50g": { id: "coriander-powder-50g", name: "Anjaraipetti Coriander Powder (50g Pack)", price: 49, stock: 150 },
  "coriander-powder-100g": { id: "coriander-powder-100g", name: "Anjaraipetti Coriander Powder (100g Pack)", price: 89, stock: 150 },
  "coriander-powder-250g": { id: "coriander-powder-250g", name: "Anjaraipetti Coriander Powder (250g Pack)", price: 215, stock: 150 },

  "combo-box": { id: "combo-box", name: "Anjaraipetti Complete Kitchen Spice Combo Box", price: 299, stock: 150 },
  "test-product": { id: "test-product", name: "Anjaraipetti Test Product", price: 1, stock: 9999 }
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
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true }
      }
    ],
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
    inventoryAvailable: { type: Number, default: 120 },
    deliveryChargeEnabled: { type: Boolean, default: true }
  },
  { versionKey: false }
);

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
const AppStateModel = mongoose.models.AppState || mongoose.model("AppState", appStateSchema);

const productPriceSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true }
  },
  { versionKey: false }
);

const ProductPriceModel = mongoose.models.ProductPrice || mongoose.model("ProductPrice", productPriceSchema);

const adminDeviceTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    adminEmail: { type: String, required: true, index: true },
    deviceName: { type: String, default: "Unknown Device" },
    browser: { type: String, default: "Unknown Browser" },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

const AdminDeviceTokenModel = mongoose.models.AdminDeviceToken || mongoose.model("AdminDeviceToken", adminDeviceTokenSchema);

let deliveryChargeEnabled = true;

const memoryDeviceTokens = new Map();

async function registerDeviceToken(token, adminEmail, deviceName, browser) {
  if (isPersistenceEnabled()) {
    await AdminDeviceTokenModel.findOneAndUpdate(
      { token },
      {
        token,
        adminEmail,
        deviceName: deviceName || "Unknown Device",
        browser: browser || "Unknown Browser",
        lastActiveAt: new Date(),
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  } else {
    const existing = memoryDeviceTokens.get(token) || {};
    memoryDeviceTokens.set(token, {
      adminEmail,
      deviceName: deviceName || "Unknown Device",
      browser: browser || "Unknown Browser",
      createdAt: existing.createdAt || new Date(),
      lastActiveAt: new Date()
    });
  }
}

async function removeDeviceToken(token) {
  if (isPersistenceEnabled()) {
    await AdminDeviceTokenModel.deleteOne({ token });
  } else {
    memoryDeviceTokens.delete(token);
  }
}

async function getDeviceTokens() {
  if (isPersistenceEnabled()) {
    const list = await AdminDeviceTokenModel.find({}).lean();
    return list.map(item => item.token);
  } else {
    return Array.from(memoryDeviceTokens.keys());
  }
}

let firebaseAdminInitialized = false;
const missingAdminVars = [];
if (!process.env.FIREBASE_PROJECT_ID) missingAdminVars.push("FIREBASE_PROJECT_ID");
if (!process.env.FIREBASE_CLIENT_EMAIL) missingAdminVars.push("FIREBASE_CLIENT_EMAIL");
if (!process.env.FIREBASE_PRIVATE_KEY) missingAdminVars.push("FIREBASE_PRIVATE_KEY");

if (missingAdminVars.length === 0) {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    // Strip surrounding quotes if present (common mistake when pasting in Render/Heroku dashboard)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    // Replace literal backslash-n sequences with actual newlines
    privateKey = privateKey.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
    firebaseAdminInitialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
} else {
  console.warn(`Firebase Admin SDK credentials not fully set in .env. Missing: ${missingAdminVars.join(", ")}. Real-time push notifications will be skipped.`);
}

if (!process.env.VITE_FIREBASE_VAPID_KEY) {
  console.warn("VITE_FIREBASE_VAPID_KEY is not defined in .env. Admin users will not be able to subscribe to push notifications on the frontend.");
}

async function sendNewOrderNotification(order) {
  console.log(`[FCM Backend] Triggered dispatch for Order ID: ${order.orderId}`);
  if (!firebaseAdminInitialized) {
    console.warn("[FCM Backend] Firebase Admin SDK is NOT initialized. Check credentials in .env file! Skipping push notification.");
    return;
  }

  try {
    // 1. Fetch full device objects with metadata to log details
    let devices = [];
    if (isPersistenceEnabled()) {
      devices = await AdminDeviceTokenModel.find({}).lean();
    } else {
      devices = Array.from(memoryDeviceTokens.entries()).map(([token, meta]) => ({
        token,
        ...meta
      }));
    }

    console.log(`[FCM Backend] Retrieved ${devices.length} registered admin device records from storage.`);
    if (devices.length === 0) {
      console.log("[FCM Backend] No registered admin device tokens found. Skipping push notification.");
      return;
    }

    // 2. Log all target tokens and their metadata in full before sending
    console.log("[FCM Backend] =================== TARGET FCM TOKENS ===================");
    devices.forEach((d, idx) => {
      console.log(`[FCM Backend] Device [${idx}]: Name="${d.deviceName}", Browser="${d.browser}", Email="${d.adminEmail || "N/A"}"`);
      console.log(`[FCM Backend] Device [${idx}] FULL TOKEN: "${d.token}"`);
    });
    console.log("[FCM Backend] ========================================================");

    const title = "New Order Received";
    const body = `${order.customer?.name || "Customer"}\n${order.orderId}\n₹${order.grandTotal}`;
    const link = "/admin/orders";

    // 3. Construct premium, highly compatible payload containing both notification, data, and webpush structures
    const payload = {
      notification: {
        title,
        body
      },
      data: {
        title,
        body,
        link,
        orderId: String(order.orderId || "")
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "new-order-alert", // Groups/collapses notifications
          requireInteraction: true
        },
        fcmOptions: {
          link
        }
      }
    };

    console.log("[FCM Backend] Message payload layout:", JSON.stringify(payload, null, 2));
    console.log(`[FCM Backend] Initiating dispatch to ${devices.length} target devices...`);
    
    const tokens = devices.map(d => d.token);
    const response = await admin.messaging().sendEach(tokens.map(token => ({
      token,
      ...payload
    })));

    console.log(`[FCM Backend] Google FCM response: successfully sent ${response.successCount} messages; failed ${response.failureCount} messages.`);
    
    const tokensToRemove = [];
    response.responses.forEach((resp, idx) => {
      const device = devices[idx];
      if (resp.success) {
        console.log(`[FCM Backend] [+] SUCCESS delivering message to Device [${idx}] ("${device.deviceName}" on ${device.browser})`);
        console.log(`[FCM Backend]     FCM Message ID: ${resp.messageId}`);
        console.log(`[FCM Backend]     Token: ${device.token}`);
      } else {
        const errCode = resp.error?.code;
        const errMessage = resp.error?.message;
        console.error(`[FCM Backend] [-] FAILURE delivering message to Device [${idx}] ("${device.deviceName}" on ${device.browser})`);
        console.error(`[FCM Backend]     Error Code: ${errCode}`);
        console.error(`[FCM Backend]     Error Message: ${errMessage}`);
        console.error(`[FCM Backend]     Token: ${device.token}`);
        
        if (errCode === "messaging/invalid-registration-token" || errCode === "messaging/registration-token-not-registered") {
          tokensToRemove.push(device.token);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      console.log(`[FCM Backend] Cleaning up ${tokensToRemove.length} inactive device tokens...`);
      for (const t of tokensToRemove) {
        await removeDeviceToken(t);
      }
    }
  } catch (err) {
    console.error("[FCM Backend] Failed to send FCM push notification:", err);
  }
}
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const razorpayClient =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    })
    : null;



/**
 * Obtain a short-lived Gmail OAuth2 access token using the refresh token grant.
 * All traffic goes over HTTPS (port 443) — works on Render's free tier which
 * blocks outbound SMTP ports 465 and 587.
 */
async function getGmailAccessToken() {
  const params = new URLSearchParams({
    client_id: process.env.GMAIL_OAUTH_CLIENT_ID || "",
    client_secret: process.env.GMAIL_OAUTH_CLIENT_SECRET || "",
    refresh_token: process.env.GMAIL_OAUTH_REFRESH_TOKEN || "",
    grant_type: "refresh_token"
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 token exchange failed: ${res.status} ${text}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

async function sendInvoiceEmail(order) {
  const oauthReady =
    process.env.GMAIL_OAUTH_CLIENT_ID &&
    process.env.GMAIL_OAUTH_CLIENT_SECRET &&
    process.env.GMAIL_OAUTH_REFRESH_TOKEN &&
    process.env.GMAIL_USER;

  const appPasswordReady =
    process.env.GMAIL_USER &&
    process.env.GMAIL_PASS;

  if (!oauthReady && !appPasswordReady) {
    // eslint-disable-next-line no-console
    console.log("Gmail SMTP or OAuth2 credentials not set in .env. Skipping email dispatch.");
    return;
  }

  try {
    const pdfBuffer = await generateInvoicePDF(order);
    const toEmails = [order.customer.email, adminEmail].filter(Boolean);
    if (toEmails.length === 0) return;

    let emailSent = false;

    // Calculate estimated dispatch date (2 days from order)
    const orderDate = new Date(order.createdAt || Date.now());
    const dispatchDate = new Date(orderDate);
    dispatchDate.setDate(orderDate.getDate() + 2);
    const formattedDispatchDate = dispatchDate.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const deliveryFee = Number(order.grandTotal || 0) - Number(order.subtotal || 0);

    // 1. Text Fallback body
    const textBody = `Hello ${order.customer.name},\n\n` +
      `Thank you for your purchase! We are preparing your fresh, slow-roasted masala blend with care.\n\n` +
      `Order Summary:\n` +
      `- Order ID: ${order.orderId}\n` +
      `- Invoice Number: ${order.invoiceNumber}\n` +
      `- Estimated Dispatch Date: ${formattedDispatchDate} (2 days from order)\n` +
      `- Subtotal: Rs. ${Number(order.subtotal).toFixed(2)}\n` +
      `- Delivery Fee: ${deliveryFee === 0 ? "FREE" : "Rs. " + deliveryFee.toFixed(2)}\n` +
      `- Grand Total: Rs. ${Number(order.grandTotal).toFixed(2)}\n\n` +
      (order.payment.razorpayPaymentId ? `- Transaction ID: ${order.payment.razorpayPaymentId}\n\n` : "") +
      `Your complete official invoice has been attached to this email as a PDF.\n\n` +
      `Best regards,\n` +
      `Anjaraipetti`;

    // 2. High-fidelity HTML body
    const htmlBody = `
<div style="background-color: #fcfaf6; padding: 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2a1a12;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #ebdcc8; overflow: hidden; box-shadow: 0 4px 12px rgba(68,35,13,0.06);">
    <!-- Header -->
    <div style="background-color: #2a1a12; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #f4eee4; font-family: Georgia, serif; font-size: 28px; letter-spacing: 1px;">Anjaraipetti</h1>
      <p style="margin: 4px 0 0 0; color: #d0843e; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Namma Veetu Premium Spices</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 30px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #6f3f1e;">Thank you for your order, ${escapeHTML(order.customer.name)}!</h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4b2c1a;">
        Your support keeps tradition alive! We are preparing your fresh, slow-roasted masala blend with care. Below are your order details.
      </p>
      
      <!-- Order details box -->
      <div style="background-color: #fcfaf6; border-radius: 12px; border: 1px solid #ebdcc8; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #6f3f1e; font-weight: bold; width: 45%;">Order ID:</td>
            <td style="padding: 4px 0; font-weight: bold; color: #2a1a12;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6f3f1e; font-weight: bold;">Invoice Number:</td>
            <td style="padding: 4px 0; color: #2a1a12;">${order.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6f3f1e; font-weight: bold;">Estimated Dispatch:</td>
            <td style="padding: 4px 0; color: #2e7d32; font-weight: bold;">${formattedDispatchDate} (2 days from order)</td>
          </tr>
          ${order.payment.razorpayPaymentId ? `
          <tr>
            <td style="padding: 4px 0; color: #6f3f1e; font-weight: bold;">Transaction ID:</td>
            <td style="padding: 4px 0; font-family: monospace; color: #2a1a12;">${order.payment.razorpayPaymentId}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Items breakdown -->
      <h3 style="margin: 0 0 10px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #6f3f1e; border-bottom: 1px solid #ebdcc8; padding-bottom: 6px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        ${order.items.map(item => `
        <tr style="border-bottom: 1px solid #f4eee4;">
          <td style="padding: 10px 0; color: #2a1a12; font-weight: bold;">${escapeHTML(item.productName)} <span style="font-weight: normal; color: #4b2c1a;">(x${item.quantity})</span></td>
          <td style="padding: 10px 0; text-align: right; color: #2a1a12; font-weight: bold;">Rs. ${Number(item.subtotal).toFixed(2)}</td>
        </tr>
        `).join('')}
        <tr>
          <td style="padding: 8px 0 4px 0; color: #4b2c1a;">Subtotal</td>
          <td style="padding: 8px 0 4px 0; text-align: right; color: #2a1a12;">Rs. ${Number(order.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #4b2c1a;">Delivery Fee</td>
          <td style="padding: 4px 0; text-align: right; color: #2a1a12;">
            ${deliveryFee === 0 ? '<span style="color: #2e7d32; font-weight: bold;">FREE</span>' : `Rs. ${Number(deliveryFee).toFixed(2)}`}
          </td>
        </tr>
        <tr style="border-top: 1px dashed #ebdcc8;">
          <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #6f3f1e;">Grand Total</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #6f3f1e;">Rs. ${Number(order.grandTotal).toFixed(2)}</td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4b2c1a; text-align: center;">
        Your complete official invoice has been generated and attached to this email as a PDF.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f5f1eb; padding: 20px; text-align: center; border-top: 1px solid #ebdcc8; font-size: 12px; color: #4b2c1a;">
      <p style="margin: 0 0 6px 0; font-style: italic; font-weight: bold; font-family: Georgia, serif;">"Thank you for choosing authenticity."</p>
      <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6f3f1e;">Anjaraipetti | Perungalthur, Chennai, Tamilnadu</p>
    </div>
  </div>
</div>
`;

    if (oauthReady) {
      console.log("Sending email using Gmail REST API (OAuth2)...");
      try {
        const accessToken = await getGmailAccessToken();

        const boundary = `boundary_${crypto.randomBytes(16).toString("hex")}`;
        const pdfBase64 = pdfBuffer.toString("base64");

        const mimeLines = [
          `From: "Anjaraipetti" <${process.env.GMAIL_USER}>`,
          `To: ${toEmails.join(", ")}`,
          `Subject: Invoice for your Anjaraipetti order: ${order.orderId}`,
          "MIME-Version: 1.0",
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          "",
          `--${boundary}`,
          "Content-Type: text/html; charset=UTF-8",
          "",
          htmlBody,
          "",
          `--${boundary}`,
          "Content-Type: application/pdf",
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="Invoice_${order.invoiceNumber}.pdf"`,
          "",
          pdfBase64,
          "",
          `--${boundary}--`
        ];

        const rawMime = mimeLines.join("\r\n");
        const encodedMessage = Buffer.from(rawMime)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

        const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ raw: encodedMessage })
        });

        if (!gmailRes.ok) {
          const errText = await gmailRes.text();
          throw new Error(`Gmail API error: ${gmailRes.status} ${errText}`);
        }

        console.log(`Invoice email sent via Gmail REST API for order ${order.orderId}`);
        emailSent = true;
      } catch (oauthErr) {
        console.error("Gmail OAuth2 failed (refresh token may be expired or revoked):", oauthErr.message);
        if (appPasswordReady) {
          console.warn("Attempting standard Nodemailer SMTP fallback as secondary backup...");
        } else {
          throw oauthErr;
        }
      }
    }

    if (!emailSent && appPasswordReady) {
      console.log("Sending email using standard Nodemailer SMTP (App Password)...");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Anjaraipetti" <${process.env.GMAIL_USER}>`,
        to: toEmails.join(", "),
        subject: `Invoice for your Anjaraipetti order: ${order.orderId}`,
        text: textBody,
        html: htmlBody,
        attachments: [
          {
            filename: `Invoice_${order.invoiceNumber}.pdf`,
            content: pdfBuffer
          }
        ]
      });

      console.log(`Invoice email sent via Nodemailer SMTP for order ${order.orderId}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to send invoice email:", err);
  }
}

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

async function initializeCustomPrices() {
  if (!isPersistenceEnabled()) return;
  try {
    const customPrices = await ProductPriceModel.find({}).lean();
    customPrices.forEach((cp) => {
      if (PRODUCTS[cp.productId]) {
        PRODUCTS[cp.productId].price = cp.price;
      }
    });
    // eslint-disable-next-line no-console
    console.log("Custom product prices initialized from MongoDB");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize custom prices:", error);
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
          invoiceSequence: 0,
          deliveryChargeEnabled: true
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
      
      if (typeof state.deliveryChargeEnabled === "boolean") {
        deliveryChargeEnabled = state.deliveryChargeEnabled;
      }
    }

    await initializeCustomPrices();

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
        inventoryAvailable: Number(inventoryByProduct["biryani-masala"] ?? 0),
        deliveryChargeEnabled
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
  const { customer = {}, address = {}, payment = {}, items = [] } = payload || {};
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.items = "Cart is empty";
  } else {
    items.forEach((item, index) => {
      const product = getProductById(item.productId);
      const qty = Number.parseInt(item.quantity, 10);
      if (!product) {
        errors[`item_${index}`] = "Invalid product";
      } else if (Number.isNaN(qty) || qty < 1) {
        errors[`item_${index}`] = "Invalid quantity";
      } else if (qty > Number(inventoryByProduct[product.id] ?? 0)) {
        errors[`item_${index}`] = `Out of stock for ${product.name}`;
      }
    });
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

  return { errors, items, method };
}

async function createFinalOrder({ items, customer, address, payment }) {
  if (!items || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const processedItems = items.map(item => {
    const product = getProductById(item.productId);
    if (!product) throw new Error("Invalid product in cart");
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: product.price * item.quantity
    };
  });

  const invoiceNumber = await nextInvoiceNumber();
  const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const hasTestProduct = processedItems.some(item => item.productId === "test-product" || item.productId.startsWith("test-product"));
  const deliveryFee = !deliveryChargeEnabled || hasTestProduct ? 0 : (subtotal >= 299 ? 0 : 50);
  const grandTotal = subtotal + deliveryFee;
  const total = grandTotal;
  const orderId = `ANJ-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

  const order = {
    orderId,
    invoiceNumber,
    items: processedItems,
    subtotal,
    grandTotal,
    total,
    customer,
    address,
    payment,
    status: "Order confirmed",
    eta: "2 - 4 business days",
    createdAt: new Date().toISOString()
  };

  await saveOrder(order);
  
  processedItems.forEach(item => {
    inventoryByProduct[item.productId] = Math.max(0, Number(inventoryByProduct[item.productId] ?? 0) - item.quantity);
  });
  await persistState();
  broadcastState();

  // Dispatch email and wait for it to finish so serverless environments don't kill the process
  try {
    await sendInvoiceEmail(order);
  } catch (emailError) {
    console.error("Failed to send email during order creation:", emailError);
  }

  // Dispatch push notification to registered admins
  try {
    await sendNewOrderNotification(order);
  } catch (pushError) {
    console.error("Failed to dispatch push notification:", pushError);
  }

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

app.get("/api/firebase-config", (req, res) => {
  return res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.VITE_FIREBASE_APP_ID || "",
    vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || ""
  });
});

app.post("/api/admin/notifications/subscribe", requireAdminAuth, async (req, res) => {
  const { token, deviceName, browser } = req.body || {};
  if (!token) {
    return res.status(400).json({ ok: false, message: "Device registration token is required" });
  }

  try {
    await registerDeviceToken(token, req.admin.email, deviceName, browser);
    return res.json({ ok: true, message: "Subscribed to push notifications successfully" });
  } catch (err) {
    console.error("Subscription failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to store registration token" });
  }
});

app.post("/api/admin/notifications/unsubscribe", requireAdminAuth, async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ ok: false, message: "Device registration token is required" });
  }

  try {
    await removeDeviceToken(token);
    return res.json({ ok: true, message: "Unsubscribed from push notifications successfully" });
  } catch (err) {
    console.error("Unsubscription failed:", err);
    return res.status(500).json({ ok: false, message: "Failed to remove registration token" });
  }
});

app.get("/api/admin/notifications/devices", requireAdminAuth, async (req, res) => {
  try {
    let devices = [];
    if (isPersistenceEnabled()) {
      devices = await AdminDeviceTokenModel.find({}).sort({ lastActiveAt: -1 }).lean();
    } else {
      devices = Array.from(memoryDeviceTokens.entries()).map(([token, info]) => ({
        token,
        adminEmail: info.adminEmail,
        deviceName: info.deviceName,
        browser: info.browser,
        createdAt: info.createdAt,
        lastActiveAt: info.lastActiveAt
      })).sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt));
    }

    // Console log the registered devices for server logs visibility
    console.log("\n=== REGISTERED ADMIN DEVICES ===");
    devices.forEach((d, idx) => {
      console.log(`[${idx + 1}] Device: ${d.deviceName} | Browser: ${d.browser} | Created: ${d.createdAt} | Last Active: ${d.lastActiveAt}`);
    });
    console.log("=================================\n");

    return res.json({ ok: true, devices });
  } catch (err) {
    console.error("Failed to list registered devices:", err);
    return res.status(500).json({ ok: false, message: "Failed to list registered devices" });
  }
});

app.post("/api/admin/notifications/test", requireAdminAuth, async (req, res) => {
  if (!firebaseAdminInitialized) {
    return res.status(503).json({ ok: false, message: "Firebase Admin is not initialized. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env file." });
  }

  try {
    const testOrder = {
      orderId: "ANJ-TEST-PUSH",
      grandTotal: 1234,
      customer: {
        name: "Test Admin System"
      },
      createdAt: new Date().toISOString()
    };

    console.log("Triggering test push notification from Admin Panel...");
    await sendNewOrderNotification(testOrder);
    return res.json({ ok: true, message: "Test push notification dispatched successfully." });
  } catch (err) {
    console.error("Failed to send test push notification:", err);
    return res.status(500).json({ ok: false, message: "Failed to dispatch test notification.", error: err.message });
  }
});

app.get("/api/settings", (req, res) => {
  return res.json({ ok: true, deliveryChargeEnabled });
});

app.post("/api/admin/settings/delivery", requireAdminAuth, async (req, res) => {
  const { enabled } = req.body || {};
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ ok: false, message: "Parameter 'enabled' must be a boolean" });
  }

  try {
    deliveryChargeEnabled = enabled;
    await persistState();
    
    // Broadcast setting change to all clients
    io.emit("settings:delivery", { deliveryChargeEnabled });

    return res.json({
      ok: true,
      message: `Delivery charges ${enabled ? "enabled" : "disabled"} successfully`,
      deliveryChargeEnabled
    });
  } catch (err) {
    console.error("Failed to save delivery charge setting:", err);
    return res.status(500).json({ ok: false, message: "Failed to update setting" });
  }
});

app.get("/api/products/prices", (req, res) => {
  const prices = {};
  Object.keys(PRODUCTS).forEach((id) => {
    prices[id] = PRODUCTS[id].price;
  });
  return res.json({ ok: true, prices });
});

app.post("/api/admin/products/prices", requireAdminAuth, async (req, res) => {
  const { productId, price } = req.body || {};
  if (!productId || PRODUCTS[productId] === undefined) {
    return res.status(400).json({ ok: false, message: "Invalid product ID" });
  }
  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ ok: false, message: "Price must be a valid positive number" });
  }

  try {
    PRODUCTS[productId].price = parsedPrice;
    if (isPersistenceEnabled()) {
      await ProductPriceModel.findOneAndUpdate(
        { productId },
        { price: parsedPrice },
        { upsert: true }
      );
    }
    
    // Broadcast price change in real-time
    io.emit("products:prices", { productId, price: parsedPrice });

    return res.json({ ok: true, message: "Price updated successfully", productId, price: parsedPrice });
  } catch (error) {
    console.error("Failed to update price:", error);
    return res.status(500).json({ ok: false, message: "Server error updating price" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { errors, items, method } = validatePayload(req.body);
  
  if (method === "razorpay") {
    return res.status(400).json({ ok: false, message: "Razorpay payments must go through signature verification." });
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  try {
    const order = await createFinalOrder({
      items,
      customer: req.body.customer,
      address: req.body.address,
      payment: {
        method: "cod",
        status: "Pay on delivery"
      }
    });

    return res.json({ ok: true, order });
  } catch (error) {
    console.error("Direct order error:", error);
    return res.status(500).json({ ok: false, message: "Unable to place order" });
  }
});

app.post("/api/payments/razorpay/order", async (req, res) => {
  if (!razorpayClient || !razorpayKeyId) {
    return res.status(503).json({ ok: false, message: "Razorpay is not configured on server" });
  }

  const items = req.body?.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: "Cart is empty" });
  }

  let totalAmount = 0;
  for (const item of items) {
    const product = getProductById(item.productId);
    const quantity = Number.parseInt(item.quantity, 10);
    if (!product) {
      return res.status(400).json({ ok: false, message: "Invalid product" });
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ ok: false, message: "Invalid quantity" });
    }
    if (quantity > Number(inventoryByProduct[product.id] ?? 0)) {
      return res.status(400).json({ ok: false, message: `Requested quantity unavailable for ${product.name}` });
    }
    totalAmount += product.price * quantity;
  }

  // Calculate and add delivery charge!
  const hasTestProduct = items.some(item => item.productId === "test-product" || item.productId.startsWith("test-product"));
  const deliveryFee = !deliveryChargeEnabled || hasTestProduct ? 0 : (totalAmount >= 299 ? 0 : 50);
  totalAmount += deliveryFee;

  try {
    const amount = Math.round(totalAmount * 100);
    const razorpayOrder = await razorpayClient.orders.create({
      amount,
      currency: "INR",
      receipt: `anj_${Date.now()}`,
      notes: {
        itemsCount: String(items.length)
      }
    });

    return res.json({
      ok: true,
      keyId: razorpayKeyId,
      razorpayOrder
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({
      ok: false,
      message: "Unable to create Razorpay order",
      error: error.message || String(error)
    });
  }
});

app.post("/api/orders/razorpay/confirm", async (req, res) => {
  if (!razorpayClient || !razorpayKeySecret) {
    return res.status(503).json({ ok: false, message: "Razorpay is not configured on server" });
  }

  const { payment = {}, customer, address, items: reqItems } = req.body || {};
  const razorpayOrderId = String(payment.razorpayOrderId || "");
  const razorpayPaymentId = String(payment.razorpayPaymentId || "");
  const razorpaySignature = String(payment.razorpaySignature || "");
  const { errors, items } = validatePayload({
    customer,
    address,
    items: reqItems,
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
      items,
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

app.get("/api/orders/:orderId/invoice", async (req, res) => {
  const order = await getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ ok: false, message: "Order not found" });
  }

  try {
    const pdfBuffer = await generateInvoicePDF(order);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice_${order.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Invoice generation error:", error);
    res.status(500).json({ ok: false, message: "Unable to generate invoice PDF" });
  }
});

app.get("/api/pincode/:pincode", (req, res) => {
  const pin = req.params.pincode;
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ ok: false, message: "Enter valid 6-digit pincode" });
  }

  const options = {
    hostname: "api.postalpincode.in",
    path: `/pincode/${pin}`,
    method: "GET",
    rejectUnauthorized: false // Bypasses expired cert warning securely ONLY for this outbound India Post call
  };

  const request = https.request(options, (response) => {
    let rawData = "";
    response.on("data", (chunk) => { rawData += chunk; });
    response.on("end", () => {
      try {
        const data = JSON.parse(rawData);
        return res.json({ ok: true, data });
      } catch (parseError) {
        console.error("Pincode JSON parse error:", parseError);
        return res.status(500).json({ ok: false, message: "Failed to parse postal details" });
      }
    });
  });

  request.on("error", (error) => {
    console.error("Pincode network error:", error);
    return res.status(500).json({ ok: false, message: "Unable to retrieve postal details" });
  });

  request.end();
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