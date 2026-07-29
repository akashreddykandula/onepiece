import { useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiStar,
  FiTag,
  FiImage,
  FiBarChart2,
  FiFileText,
  FiRefreshCw,
  FiPrinter,
  FiLayers,
  FiSettings,
  FiBell,
  FiMenu,
  FiX,
  FiLogOut,
  FiArrowLeft,
} from "react-icons/fi";
import { useAuth } from "@hooks/index";
import { useSelector } from "react-redux";

const NAV_ITEMS = [
  { to: "/admin", icon: FiGrid, label: "Dashboard", end: true },
  { to: "/admin/categories", icon: FiLayers, label: "Categories" },
  { to: "/admin/products", icon: FiPackage, label: "Products" },

  { to: "/admin/orders", icon: FiShoppingBag, label: "Orders" },
  { to: "/admin/returns", icon: FiRefreshCw, label: "Returns" },
  { to: "/admin/print-jobs", icon: FiPrinter, label: "Print Jobs" },
  { to: "/admin/customers", icon: FiUsers, label: "Customers" },
  { to: "/admin/reviews", icon: FiStar, label: "Reviews" },
  { to: "/admin/coupons", icon: FiTag, label: "Coupons" },
  { to: "/admin/banners", icon: FiImage, label: "Banners" },

  { to: "/admin/analytics", icon: FiBarChart2, label: "Analytics" },
  { to: "/admin/inventory", icon: FiPackage, label: "Inventory" },
  { to: "/admin/cms", icon: FiFileText, label: "CMS Pages" },
  { to: "/admin/settings", icon: FiSettings, label: "Settings" },
];

function Sidebar({ onClose }) {
  const { user, handleLogout } = useAuth();
  return (
    <div className="flex flex-col h-full bg-brand-gradient">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link to="/admin" onClick={onClose} className="block">
          <div className="font-display font-black text-2xl text-white leading-none">
            ONE<span className="text-brand-300">PIECE</span>
          </div>
          <p className="text-white/40 text-[9px] tracking-[0.3em] uppercase mt-0.5">
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link to="/" onClick={onClose} className="admin-nav-item">
          <FiArrowLeft size={16} /> Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="admin-nav-item w-full text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <FiLogOut size={16} /> Sign Out
        </button>
        {user && (
          <div className="mt-3 px-3 py-2">
            <p className="text-xs text-white/40 truncate">{user.name}</p>
            <p className="text-[10px] text-white/30 truncate">{user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-ice">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col shadow-brand-lg z-20">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden flex flex-col shadow-2xl"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4 shrink-0 shadow-sm z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-icon lg:hidden"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex-1" />
          <Link to="/admin/notifications" className="btn-icon relative">
            <FiBell size={19} />
          </Link>
          <Link
            to="/"
            className="btn-secondary text-xs py-1.5 px-3 hidden sm:flex items-center gap-1.5"
          >
            <FiArrowLeft size={13} /> Store
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
