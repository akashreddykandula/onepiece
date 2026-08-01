import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "@store/index";
import { socket } from "@services/socket";
import { productAPI } from "@services/api";
import { refreshCartItem } from "@store/index";
import CookieConsent from "@components/common/CookieConsent";

// Scroll Reset Helper

// Layout
import CustomerLayout from "@components/layout/CustomerLayout";
import AdminLayout from "@components/layout/AdminLayout";

// Guards
import ProtectedRoute from "@components/common/ProtectedRoute";
import AdminRoute from "@components/common/AdminRoute";
import GuestRoute from "@components/common/GuestRoute";
import ScrollToTop from "@components/common/ScrollToTop";

// Preloader & Error Boundary
import Preloader from "@components/common/Preloader";
import ErrorBoundary from "@components/common/ErrorBoundary";
import PageLoader from "@components/ui/PageLoader";

// Customer pages — lazy loaded
const HomePage = lazy(() => import("@pages/customer/HomePage"));
const CollectionsPage = lazy(() => import("@pages/customer/CollectionsPage"));
const ProductDetailPage = lazy(
  () => import("@pages/customer/ProductDetailPage"),
);
const CartPage = lazy(() => import("@pages/customer/CartPage"));
const CheckoutPage = lazy(() => import("@pages/customer/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("@pages/customer/OrderSuccessPage"));
const OrdersPage = lazy(() => import("@pages/customer/OrdersPage"));
const OrderDetailPage = lazy(() => import("@pages/customer/OrderDetailPage"));
const TrackOrderPage = lazy(() => import("@pages/customer/TrackOrderPage"));
const ProfilePage = lazy(() => import("@pages/customer/ProfilePage"));
const WishlistPage = lazy(() => import("@pages/customer/WishlistPage"));
const SearchPage = lazy(() => import("@pages/customer/SearchPage"));
const CustomPrintPage = lazy(() => import("@pages/customer/CustomPrintPage"));
const LoginPage = lazy(() => import("@pages/customer/LoginPage"));
const RegisterPage = lazy(() => import("@pages/customer/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("@pages/customer/ForgotPasswordPage"),
);
const MyCustomPrintOrders = lazy(
  () => import("@pages/customer/MyCustomPrintOrders"),
);
const ResetPasswordPage = lazy(
  () => import("@pages/customer/ResetPasswordPage"),
);
const CmsPage = lazy(() => import("@pages/customer/CmsPage"));
const NotFoundPage = lazy(() => import("@pages/customer/NotFoundPage"));

// Admin pages — lazy loaded
const AdminDashboard = lazy(() => import("@pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@pages/admin/AdminProducts"));
const AdminProductForm = lazy(() => import("@pages/admin/AdminProductForm"));
const AdminOrders = lazy(() => import("@pages/admin/AdminOrders"));
const AdminOrderDetail = lazy(() => import("@pages/admin/AdminOrderDetail"));
const AdminCategories = lazy(() => import("@pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("@pages/admin/AdminCustomers"));
const AdminReviews = lazy(() => import("@pages/admin/AdminReviews"));
const AdminCoupons = lazy(() => import("@pages/admin/AdminCoupons"));
const AdminBanners = lazy(() => import("@pages/admin/AdminBanners"));
const AdminReturns = lazy(() => import("@pages/admin/AdminReturns"));
const AdminPrintJobs = lazy(() => import("@pages/admin/AdminPrintJobs"));
const AdminAnalytics = lazy(() => import("@pages/admin/AdminAnalytics"));
const AdminCMS = lazy(() => import("@pages/admin/AdminCMS"));
const AdminInventory = lazy(() => import("@pages/admin/AdminInventory"));
const AdminSettings = lazy(() => import("@pages/admin/AdminSettings"));
const AdminNotifications = lazy(
  () => import("@pages/admin/AdminNotifications"),
);

function AppContent() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  useEffect(() => {
    const handleProductUpdated = async ({ productId }) => {
      const exists = cartItems.some((item) => item._id === productId);

      if (!exists) return;

      try {
        const { data } = await productAPI.getOne(productId);

        dispatch(
          refreshCartItem({
            _id: data.product._id,
            price: data.product.price,
            freeShipping: data.product.freeShipping,
            name: data.product.name,
            image: data.product.images?.[0]?.url || data.product.images?.[0],
            slug: data.product.slug,
          }),
        );
      } catch (err) {
        console.error(err);
      }
    };

    socket.on("productUpdated", handleProductUpdated);

    return () => {
      socket.off("productUpdated", handleProductUpdated);
    };
  }, [cartItems, dispatch]);
  useEffect(() => {
    const token = localStorage.getItem("op_token");
    if (token) dispatch(fetchMe());
  }, [dispatch]);

  return (
    <BrowserRouter>
      {/* 2. Placed inside BrowserRouter to catch all route changes */}
      <ScrollToTop />

      <Preloader />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
          success: { iconTheme: { primary: "#0A5ACB", secondary: "#fff" } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ─── Customer routes ──────────────────────────────── */}
          <Route element={<CustomerLayout />}>
            <Route path="custom-print" element={<CustomPrintPage />} />
            <Route
              path="custom-print/:productId"
              element={<CustomPrintPage />}
            />
            <Route index element={<HomePage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="collections/:cat" element={<CollectionsPage />} />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="track-order" element={<TrackOrderPage />} />
            <Route path="pages/:slug" element={<CmsPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:id" element={<OrderSuccessPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/custom" element={<MyCustomPrintOrders />} />
              <Route
                path="orders/custom/:id"
                element={<MyCustomPrintOrders />}
              />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="wishlist" element={<WishlistPage />} />
            </Route>

            {/* Guest only */}
            <Route element={<GuestRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="reset-password/:token"
                element={<ResetPasswordPage />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ─── Admin routes ─────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="print-jobs" element={<AdminPrintJobs />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="cms" element={<AdminCMS />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Routes>
      </Suspense>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
