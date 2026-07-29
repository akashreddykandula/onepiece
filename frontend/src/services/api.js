import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "@constants";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("op_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      localStorage.removeItem("op_token");
      localStorage.removeItem("op_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    }

    if (status >= 500) {
      toast.error("Server error. Please try again.");
    }

    return Promise.reject(error);
  },
);

export default api;

// ─── API helpers ──────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (slug) => api.get(`/products/${slug}`),
  getFeatured: (limit) => api.get("/products/featured", { params: { limit } }),
  getNewArrivals: (limit) =>
    api.get("/products/new-arrivals", { params: { limit } }),
  getBestSellers: (limit) =>
    api.get("/products/best-sellers", { params: { limit } }),
  getTrending: (limit) => api.get("/products/trending", { params: { limit } }),
  getSuggestions: (q) =>
    api.get("/products/search/suggestions", { params: { q } }),
  getRelated: (id) => api.get(`/products/${id}/related`),
  // Admin
  getAllAdmin: (p) => api.get("/products/admin/all", { params: p }),
  create: (data) => api.post("/products", data),
  update: (id, d) => api.put(`/products/${id}`, d),
  remove: (id) => api.delete(`/products/${id}`),
  updateStock: (id, d) => api.patch(`/products/${id}/stock`, d),
};

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/update-profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (t, pwd) =>
    api.put(`/auth/reset-password/${t}`, { password: pwd }),
  verifyReset: (t) => api.get(`/auth/verify-reset-token/${t}`),
  toggleWishlist: (id) => api.post(`/auth/wishlist/${id}`),
  addAddress: (d) => api.post("/auth/addresses", d),
  updateAddress: (id, d) => api.put(`/auth/addresses/${id}`, d),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
  addRecentlyViewed: (id) => api.post(`/auth/recently-viewed/${id}`),
};

export const orderAPI = {
  create: (data) => api.post("/orders", data),
  getAll: (params) => api.get("/orders/my", { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  track: (data) => api.post("/orders/track", data),
  cancel: (id, r) => api.put(`/orders/${id}/cancel`, { reason: r }),
  // Admin
  getAllAdmin: (p) => api.get("/orders/admin/all", { params: p }),
  updateStatus: (id, d) => api.put(`/orders/${id}/status`, d),
};

export const paymentAPI = {
  createOrder: (id) => api.post("/payments/create-order", { orderId: id }),
  createCustomPrintPayment: (data) => api.post("/payments/custom-print", data),
  verify: (data) => api.post("/payments/verify", data),
  failed: (id) => api.post("/payments/failed", { orderId: id }),
};

export const categoryAPI = {
  getAll: (p) => api.get("/categories", { params: p }),
  getOne: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post("/categories", data),
  update: (id, d) => api.put(`/categories/${id}`, d),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const reviewAPI = {
  getForProduct: (id, p) => api.get(`/reviews/product/${id}`, { params: p }),
  create: (data) => api.post("/reviews", data),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  // Admin
  getAll: (p) => api.get("/reviews/admin/all", { params: p }),
  approve: (id, v) => api.patch(`/reviews/${id}/approve`, { isApproved: v }),
  reply: (id, c) => api.put(`/reviews/${id}/reply`, { comment: c }),
  remove: (id) => api.delete(`/reviews/${id}`),
};

export const couponAPI = {
  validate: (code, subtotal) =>
    api.post("/coupons/validate", { code, subtotal }),
  getAll: () => api.get("/coupons"),
  create: (d) => api.post("/coupons", d),
  update: (id, d) => api.put(`/coupons/${id}`, d),
  remove: (id) => api.delete(`/coupons/${id}`),
};

export const bannerAPI = {
  getAll: (p) => api.get("/banners", { params: p }),
  getAllAdmin: () => api.get("/banners/admin/all"),
  create: (d) => api.post("/banners", d),
  update: (id, d) => api.put(`/banners/${id}`, d),
  remove: (id) => api.delete(`/banners/${id}`),
};

export const uploadAPI = {
  images: (formData, folder) =>
    api.post(`/upload/images?folder=${folder}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  single: (formData, folder) =>
    api.post(`/upload/single?folder=${folder}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (publicId) => api.delete("/upload/image", { data: { publicId } }),
};

export const returnAPI = {
  create: (d) => api.post("/returns", d),
  getMy: () => api.get("/returns/my"),
  getAll: (p) => api.get("/returns/admin/all", { params: p }),
  updateStatus: (id, d) => api.put(`/returns/${id}/status`, d),
  getById: (id) => api.get(`/returns/admin/${id}`),
};
export const customPrintAPI = {
  create: (formData) =>
    api.post("/custom-print", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  getMine: () => api.get("/custom-print/my"),

  getOne: (id) => api.get(`/custom-print/${id}`),

  getAll: () => api.get("/custom-print/admin/all"),

  updateStatus: (id, data) => api.put(`/custom-print/admin/${id}/status`, data),
  uploadPreview: (id, formData) =>
    api.put(`/custom-print/admin/${id}/preview`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  uploadProof: (id, formData) =>
    api.put(`/custom-print/admin/${id}/proof`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  approve: (id, decision, feedback = "") =>
    api.put(`/custom-print/${id}/decision`, {
      decision,
      feedback,
    }),
};

export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  markRead: (ids) => api.put("/notifications/mark-read", { ids }),
};

export const analyticsAPI = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getSales: (p) => api.get("/analytics/sales", { params: p }),
};

export const cmsAPI = {
  getPage: (slug) => api.get(`/cms/${slug}`),
  getAllAdmin: () => api.get("/cms"),
  upsert: (slug, d) => api.put(`/cms/${slug}`, d),
};
