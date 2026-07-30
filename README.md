# ONE PIECE — Premium Fashion E-Commerce Platform

> **Your Statement. Your Style.**

A production-ready, full-stack MERN e-commerce platform with premium UI, custom print studio, Razorpay payments, and a complete admin dashboard.

---

## 🚀 Tech Stack

| Layer    | Tech                                                                    |
| -------- | ----------------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, React Query, Framer Motion |
| Backend  | Node.js, Express.js, MongoDB, Mongoose, JWT                             |
| Payments | Razorpay                                                                |
| Storage  | Cloudinary                                                              |
| Email    | Resend                                                                  |
| Deploy   | Frontend → Vercel · Backend → Render · DB → MongoDB Atlas               |

---

## 📁 Project Structure

```
onepiece/
├── backend/
│   ├── config/          # Cloudinary config
│   ├── controllers/     # Auth, Product, Order, Payment, Review, Misc
│   ├── middleware/      # Auth (JWT), Error handler
│   ├── models/          # User, Product, Category, Order, Review, Coupon, Banner, Return, CMS, Notification, PrintJob
│   ├── routes/          # All API routes
│   ├── services/        # Email (Resend)
│   └── server.js        # Express app entry
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── cart/        # CartDrawer
│   │   │   ├── common/      # ErrorBoundary, ProtectedRoute, Preloader, SearchOverlay, WhatsApp
│   │   │   ├── home/        # HeroSlider, CategoryStrip, sections, BrandStory, etc.
│   │   │   ├── layout/      # Navbar, Footer, AnnouncementBar, CustomerLayout, AdminLayout
│   │   │   ├── product/     # ProductCard, ProductGrid
│   │   │   └── ui/          # PageLoader, Skeletons
│   │   ├── constants/       # App-wide constants
│   │   ├── hooks/           # useAuth, useCart, useWishlist, useDebounce, etc.
│   │   ├── pages/
│   │   │   ├── customer/    # HomePage, Collections, Product, Cart, Checkout, Orders, Profile, etc.
│   │   │   └── admin/       # Dashboard, Products, Orders, Customers, Analytics, etc.
│   │   ├── services/        # Axios API layer
│   │   ├── store/           # Redux (auth, cart, ui, recentlyViewed)
│   │   ├── styles/          # globals.css (design system)
│   │   └── utils/           # helpers.js
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
└── package.json
```

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/onepiece.git
cd onepiece
npm run install:all
```

### 2. Backend Environment

Copy `backend/.env` and fill in your credentials:

```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/onepiece
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_rzp_secret
RESEND_API_KEY=re_xxxx
CLIENT_URL=http://localhost:5173
```

### 3. Frontend Environment

Create `frontend/.env`:

```env
VITE_API_URL=/api
VITE_RAZORPAY_KEY=rzp_test_xxx
VITE_WHATSAPP_NUMBER=9181212180990
```

### 4. Run Development

```bash
npm run dev
# Backend → http://localhost:5000
# Frontend → http://localhost:5173
```

---

## 🌟 Features

### Customer

- 🔐 JWT authentication (register, login, forgot/reset password)
- 🏠 Premium homepage with hero slider, categories, sections
- 🛍️ Collections with advanced filtering & sorting
- 🔍 Instant search with suggestions
- 📦 Product detail with image zoom, variants, reviews
- 🛒 Animated cart drawer with shipping progress
- 💳 Checkout with Razorpay, COD, coupon codes, GST
- 📋 Order tracking with live timeline
- 💖 Wishlist management
- 👤 Profile with addresses, loyalty points, security
- 🎨 Custom print studio (multi-step upload flow)
- 📱 Fully responsive (mobile-first)

### Admin

- 📊 Dashboard with revenue charts, stats
- 📦 Product management with CRUD
- 🗂️ Category & subcategory management
- 🛒 Order management with status updates
- 👥 Customer management
- ⭐ Review moderation with replies
- 🏷️ Coupon management
- 🖼️ Banner management
- 🔄 Returns & exchanges
- 🖨️ Custom print job management
- 📈 Sales analytics
- 📝 CMS pages editor
- 📦 Inventory management

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend && npm run build
# Deploy dist/ folder to Vercel
# Set environment variables in Vercel dashboard
```

### Backend (Render)

```
Build Command: npm install
Start Command: node server.js
Environment: Add all .env variables
```

---

## 🎨 Design System

| Token         | Value     |
| ------------- | --------- |
| Royal Blue    | `#0A5ACB` |
| Electric Blue | `#3B82F6` |
| Deep Navy     | `#0A2A80` |
| Sky Blue      | `#7AB2E4` |
| Font Display  | Syne      |
| Font Body     | Inter     |

---

## 📄 License

© 2024 ONE PIECE Fashion. All rights reserved.
