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

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed bottom-4 left-1/2 z-[9999] w-[95%] max-w-xl -translate-x-1/2"
      >
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl backdrop-blur-xl">
          {/* Top Accent */}

          <div className="h-1 w-full bg-gradient-to-r from-brand-900 via-blue-500 to-brand-700" />

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50">
                <span className="text-3xl">🍪</span>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Your Privacy Matters
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  ONE PIECE uses essential cookies to keep your account secure,
                  remember your cart, wishlist, preferences, and provide a
                  smooth premium shopping experience.
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  You can change your cookie preferences anytime from the
                  Privacy Settings page.
                </p>

                <Link
                  to="/pages/cookie-policy"
                  className="mt-3 inline-flex items-center text-sm font-semibold text-brand-900 hover:underline"
                >
                  Learn More →
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={essentialOnly}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Essential Only
              </button>

              <button
                onClick={acceptAll}
                className="rounded-xl bg-brand-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                Accept All Cookies
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
