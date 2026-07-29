import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSearch,
  FiShoppingBag,
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiMapPin,
  FiShield,
} from "react-icons/fi";
import { openSearch, toggleCart } from "@store/index";
import { useAuth, useOutsideClick } from "@hooks/index";
import { NAV_LINKS, SHOP_MENU } from "@constants";
import MegaMenu from "./MegaMenu";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout, isAdmin } = useAuth();
  const { count } = useSelector((s) => s.cart);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useOutsideClick(userMenuRef, () => setUserMenuOpen(false));

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isNavActive = (href) => {
    if (!href) return false;
    const url = new URL(href, window.location.origin);
    if (url.pathname !== location.pathname) {
      return false;
    }
    if (!url.search) {
      return true;
    }
    const targetParams = url.searchParams;
    const currentParams = new URLSearchParams(location.search);
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 overflow-visible transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-card" : "bg-white"
        }`}
      >
        <div className="container-op relative overflow-visible px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-18 gap-2">
            {/* Left Section: Mobile Hamburger & Desktop Nav */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="md:hidden p-2 -ml-1 text-brand-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
                onClick={() => setMobileOpen(true)}
                aria-label="Open Menu"
              >
                <FiMenu size={22} />
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-2">
                {NAV_LINKS.map((link) => {
                  if (link.mega) {
                    return (
                      <div
                        key={link.label}
                        className="relative overflow-visible"
                        onMouseEnter={() => setMegaOpen(true)}
                        onMouseLeave={() => setMegaOpen(false)}
                      >
                        <button className="nav-link flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-brand-50">
                          {link.label}
                          <FiChevronDown
                            className={`transition-transform duration-200 ${
                              megaOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Render MegaMenu inside container to fix hover-gap bug */}
                        <AnimatePresence>
                          {megaOpen && <MegaMenu />}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`nav-link px-3 py-2 rounded-lg ${
                        isNavActive(link.href)
                          ? "active text-brand-800 bg-brand-50"
                          : ""
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Center Section: Brand Logo */}
            <Link
              to="/"
              className="flex flex-col items-center group shrink-0 min-w-0"
            >
              <span className="font-display font-black text-lg sm:text-2xl md:text-3xl text-brand-900 leading-none tracking-tight group-hover:text-brand-800 transition-colors truncate text-[135%]">
                ONE<span className="text-brand-500">PIECE</span>
              </span>
              <span className="text-[8px] tracking-[0.3em] uppercase text-silver font-sans hidden md:block -mt-0.5">
                Your Statement. Your Style.
              </span>
            </Link>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => dispatch(openSearch())}
                className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                aria-label="Search"
              >
                <FiSearch size={19} />
              </button>

              {user && (
                <Link
                  to="/wishlist"
                  className="p-2 relative text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Wishlist"
                >
                  <FiHeart size={19} />
                  {user.wishlist?.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {user.wishlist.length > 9 ? "9+" : user.wishlist.length}
                    </span>
                  )}
                </Link>
              )}

              {/* User Menu Dropdown */}
              <div
                className={`relative ${user ? "hidden md:block" : "block"}`}
                ref={userMenuRef}
              >
                <button
                  onClick={() => {
                    if (user) {
                      setUserMenuOpen((v) => !v);
                    } else {
                      navigate("/login");
                    }
                  }}
                  className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Account"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-200"
                      alt={user.name}
                    />
                  ) : (
                    <div className="p-0.5">
                      <FiUser size={19} />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-gray-100 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/50">
                        <p className="text-sm font-semibold text-brand-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {[
                        {
                          to: "/orders",
                          icon: FiPackage,
                          label: "My Orders",
                        },
                        {
                          to: "/profile",
                          icon: FiSettings,
                          label: "Account Settings",
                        },
                        {
                          to: "/profile?tab=addresses",
                          icon: FiMapPin,
                          label: "Addresses",
                        },
                        ...(isAdmin
                          ? [
                              {
                                to: "/admin",
                                icon: FiShield,
                                label: "Admin Panel",
                                highlight: true,
                              },
                            ]
                          : []),
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-brand-50 ${
                            item.highlight
                              ? "text-brand-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          <item.icon size={16} className="text-gray-400" />
                          {item.label}
                        </Link>
                      ))}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            handleLogout();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors font-medium"
                        >
                          <FiLogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart Drawer Toggle */}
              <button
                onClick={() => dispatch(toggleCart())}
                className="p-2 relative text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                aria-label="Cart"
              >
                <FiShoppingBag size={19} />
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-brand-800 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  >
                    {count > 9 ? "9+" : count}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[88%] max-w-[360px] bg-white shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col group"
                >
                  <span className="font-display font-black text-2xl text-brand-900 leading-none tracking-tight">
                    ONE<span className="text-brand-500">PIECE</span>
                  </span>
                  <span className="text-[7.5px] tracking-[0.28em] uppercase text-gray-400 font-sans mt-0.5">
                    Your Statement. Your Style.
                  </span>
                </Link>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
                  aria-label="Close menu"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 overscroll-contain">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 px-3">
                    Explore Collections
                  </p>

                  {/* Render Categories on Mobile */}
                  {SHOP_MENU.map((section) => (
                    <div key={section.title} className="space-y-1">
                      <p className="px-3 text-xs font-bold text-brand-900 uppercase tracking-wider">
                        {section.title}
                      </p>
                      {section.links.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-900 transition-colors"
                        >
                          <span>{item.label}</span>
                          <FiChevronRight size={15} className="text-gray-300" />
                        </Link>
                      ))}
                    </div>
                  ))}

                  {/* Direct Static Nav Links */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    {NAV_LINKS.filter((l) => !l.mega).map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <span>{link.label}</span>
                        <FiChevronRight size={15} className="text-gray-300" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account Navigation (Logged In) */}
                {user && (
                  <div className="pt-4 border-t border-gray-100 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 px-3 mb-2">
                      Account & Orders
                    </p>

                    <Link
                      to="/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-800 transition-colors"
                    >
                      <FiPackage size={17} className="text-gray-400" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FiHeart size={17} className="text-gray-400" />
                        <span>Wishlist</span>
                      </div>
                      {user.wishlist?.length > 0 && (
                        <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold shadow-xs">
                          {user.wishlist.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-800 transition-colors"
                    >
                      <FiSettings size={17} className="text-gray-400" />
                      <span>Account Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-brand-700 bg-brand-50/70 hover:bg-brand-100 transition-colors"
                      >
                        <FiShield size={17} className="text-brand-600" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/80">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-brand-200 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center shrink-0 border border-brand-100 overflow-hidden">
                        {user?.avatar?.url ? (
                          <img
                            src={user.avatar.url}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.name?.charAt(0).toUpperCase() || "U"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-900 truncate group-hover:text-brand-600 transition-colors">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <FiChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all"
                      />
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all active:scale-[0.98]"
                    >
                      <FiLogOut size={16} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-primary w-full text-center justify-center text-sm py-3 rounded-xl shadow-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary w-full text-center justify-center text-sm py-3 rounded-xl"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
