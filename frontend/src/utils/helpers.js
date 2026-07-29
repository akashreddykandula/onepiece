import { ORDER_STATUSES, ORDER_TIMELINE_STEPS } from "@constants";

// ─── Price & Currency ─────────────────────────────────────────────────────────
export const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatNumber = (n) =>
  new Intl.NumberFormat("en-IN").format(n || 0);

export const getDiscount = (price, comparePrice) => {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
};

export const calcGST = (amount, rate = 18) =>
  Math.round(((amount * rate) / (100 + rate)) * 100) / 100;

// ─── Date & Time ──────────────────────────────────────────────────────────────
export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateLong = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

export const getDeliveryEstimate = (estimatedDelivery, orderStatus) => {
  if (orderStatus === "delivered") return "Delivered";
  if (["cancelled", "returned"].includes(orderStatus)) return "—";
  if (!estimatedDelivery) return "Calculating…";
  const now = new Date();
  const est = new Date(estimatedDelivery);
  const diff = Math.ceil((est - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Expected ${formatDate(estimatedDelivery)}`;
  if (diff === 0) return "Arriving today!";
  if (diff === 1) return "Arriving tomorrow";
  return `Arriving by ${formatDate(estimatedDelivery)}`;
};

// ─── Images ───────────────────────────────────────────────────────────────────
export const getPrimaryImage = (images = []) => {
  if (!images.length) return "";
  return (images.find((i) => i.isPrimary) || images[0])?.url || "";
};

export const getCloudinaryUrl = (url, width = 600, quality = "auto") => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},q_${quality},f_auto/`);
};

// ─── String utilities ─────────────────────────────────────────────────────────
export const truncate = (str, n = 80) =>
  !str || str.length <= n ? str : str.slice(0, n) + "…";
export const capitalize = (str) =>
  !str ? "" : str.charAt(0).toUpperCase() + str.slice(1);
export const slugToTitle = (slug) =>
  (slug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const titleToSlug = (title) =>
  (title || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
export const maskEmail = (email) => {
  if (!email) return "";
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}****@${d}`;
};

// ─── Order Helpers ────────────────────────────────────────────────────────────
export const getOrderStatusConfig = (status) =>
  ORDER_STATUSES[status] || {
    label: capitalize(status),
    color: "badge-gray",
    step: 0,
  };

export const getOrderStep = (status) => ORDER_STATUSES[status]?.step ?? 0;

export const isOrderCancellable = (status) =>
  ![
    "shipped",
    "out_for_delivery",
    "delivered",
    "return_requested",
    "cancelled",
    "returned",
  ].includes(status);

export const isOrderReturnable = (status, deliveredAt) => {
  if (status !== "delivered") return false;
  if (!deliveredAt) return false;
  const daysSinceDelivery = Math.floor(
    (Date.now() - new Date(deliveredAt)) / (1000 * 60 * 60 * 24),
  );
  return daysSinceDelivery <= 7;
};

// ─── Validation ───────────────────────────────────────────────────────────────
export const isValidEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
export const isValidPhone = (p) => /^[6-9]\d{9}$/.test(p);
export const isValidPincode = (p) => /^\d{6}$/.test(p);
export const isValidPassword = (p) => p && p.length >= 8;

// ─── Local Storage helpers ────────────────────────────────────────────────────
export const lsGet = (key, fallback = null) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
export const lsRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
export const openWhatsApp = (message, number) => {
  const num = number || import.meta.env.VITE_WHATSAPP_NUMBER || "919876543210";
  window.open(
    `https://wa.me/${num}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
};

export const productEnquiryMessage = (product) =>
  `Hi ONE PIECE! 👋\n\nI'm interested in:\n*Product:* ${product.name}\n*Price:* ${formatPrice(product.price)}\n\nCould you please share more details?`;

export const orderSupportMessage = (orderNumber) =>
  `Hi ONE PIECE! 👋\n\nI need help with my order:\n*Order Number:* ${orderNumber}\n\nPlease assist me.`;

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const generateStarArray = (rating, max = 5) =>
  Array.from({ length: max }, (_, i) => {
    if (i < Math.floor(rating)) return "full";
    if (i < rating) return "half";
    return "empty";
  });

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const group = typeof key === "function" ? key(item) : item[key];
    acc[group] = acc[group] || [];
    acc[group].push(item);
    return acc;
  }, {});

export const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);
