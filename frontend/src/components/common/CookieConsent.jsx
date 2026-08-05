import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("op_cookie_consent");

    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("op_cookie_consent", "accepted");
    setVisible(false);
  };

  const essentialOnly = () => {
    localStorage.setItem("op_cookie_consent", "essential");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-3 inset-x-3 z-[9999] sm:bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-md sm:p-4">
            {/* Subtle Accent Line */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-400" />

            <div className="flex items-center gap-3">
              {/* Small Cookie Badge */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg border border-sky-100">
                🍪
              </div>

              {/* Compact Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 line-clamp-2 leading-tight">
                  We use cookies for account security, cart & shopping
                  experience.{" "}
                  <Link
                    to="/pages/cookie-policy"
                    className="font-semibold text-sky-600 hover:underline inline-block"
                  >
                    Policy
                  </Link>
                </p>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={essentialOnly}
                className="flex-1 rounded-lg border border-sky-200 bg-white py-1.5 text-[11px] font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Essential
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={acceptAll}
                className="flex-1 rounded-lg bg-sky-500 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-sky-600"
              >
                Accept All
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
