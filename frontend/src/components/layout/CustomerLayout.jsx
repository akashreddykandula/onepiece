import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@components/layout/Navbar";
import Footer from "@components/layout/Footer";
import CartDrawer from "@components/cart/CartDrawer";
import SearchOverlay from "@components/common/SearchOverlay";
import WhatsAppButton from "@components/common/WhatsAppButton";
import AnnouncementBar from "@components/layout/AnnouncementBar";
import { useScrollTop } from "@hooks/index";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function CustomerLayout() {
  const location = useLocation();
  useScrollTop();
  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <AnnouncementBar />
      <Navbar />
      <CartDrawer />
      <SearchOverlay />
      {!["/cart", "/checkout", "/login", "/register", "/"].includes(
        location.pathname,
      ) && <WhatsAppButton />}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={
            location.pathname === "/cart" || location.pathname === "/checkout"
              ? "flex-1 flex flex-col min-h-0"
              : "flex-1"
          }
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!["/cart", "/checkout"].includes(location.pathname) && <Footer />}
    </div>
  );
}
