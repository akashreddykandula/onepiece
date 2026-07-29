import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FiX,
  FiShoppingBag,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiTag,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";
import { closeCart, removeItem, updateQuantity } from "@store/index";
import { useScrollLock, useOutsideClick } from "@hooks/index";
import { formatPrice, getPrimaryImage } from "@utils/helpers";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const { cartOpen } = useSelector((s) => s.ui);
  const cart = useSelector((s) => s.cart);
  const drawerRef = useRef(null);

  useScrollLock(cartOpen);
  useOutsideClick(drawerRef, () => dispatch(closeCart()));

  // Strict Background Scroll Lock Effect
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [cartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs transition-opacity touch-none"
          />

          {/* Slide-over Drawer Panel - Full Mobile Screen view */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-screen sm:w-full sm:max-w-md h-dvh bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-800/80 rounded-xl flex items-center justify-center text-brand-400">
                  <FiShoppingBag size={16} />
                </div>
                <div>
                  <h2 className="font-display font-black text-sm sm:text-base text-white tracking-tight leading-tight">
                    Shopping Bag
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {cart.count} {cart.count === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch(closeCart())}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close Bag"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Scrollable Items Container (Overscroll Contained) */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 sm:px-5 py-3.5 bg-slate-50/60">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <FiShoppingBag size={28} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    Your bag is empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mb-5">
                    Explore our collections to add your favorite items.
                  </p>
                  <Link
                    to="/collections"
                    onClick={() => dispatch(closeCart())}
                    className="btn-primary px-5 py-2.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                  >
                    Browse Collections <FiArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {cart.items.map((item, i) => (
                      <motion.div
                        key={`${item._id}-${item.size}-${item.color}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs"
                      >
                        <div className="flex gap-3">
                          {/* Item Thumbnail */}
                          <Link
                            to={`/product/${item.slug || item._id}`}
                            onClick={() => dispatch(closeCart())}
                            className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 shrink-0 hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={item.image || getPrimaryImage(item.images)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1.5">
                                <Link
                                  to={`/product/${item.slug || item._id}`}
                                  onClick={() => dispatch(closeCart())}
                                  className="text-xs font-bold text-slate-900 hover:text-brand-700 transition-colors line-clamp-2 leading-snug"
                                >
                                  {item.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(
                                      removeItem({
                                        _id: item._id,
                                        size: item.size,
                                        color: item.color,
                                      }),
                                    )
                                  }
                                  className="text-slate-400 hover:text-red-500 p-0.5 transition-colors shrink-0"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>

                              {/* Size/Color Badges */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {item.size && (
                                  <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                    Size: {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1">
                                    {item.colorHex && (
                                      <span
                                        className="w-2 h-2 rounded-full border border-slate-300"
                                        style={{ background: item.colorHex }}
                                      />
                                    )}
                                    {item.color}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls & Price */}
                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(
                                      updateQuantity({
                                        _id: item._id,
                                        size: item.size,
                                        color: item.color,
                                        quantity: item.quantity - 1,
                                      }),
                                    )
                                  }
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  <FiMinus size={10} />
                                </button>
                                <span className="w-6 text-center text-[11px] font-extrabold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    dispatch(
                                      updateQuantity({
                                        _id: item._id,
                                        size: item.size,
                                        color: item.color,
                                        quantity: item.quantity + 1,
                                      }),
                                    )
                                  }
                                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                                >
                                  <FiPlus size={10} />
                                </button>
                              </div>

                              <p className="text-xs font-black text-slate-900">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Sticky Drawer Footer */}
            {cart.items.length > 0 && (
              <div className="border-t border-slate-200/80 px-4 sm:px-5 py-3.5 bg-white space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
                {/* Free Shipping Alert Bar */}
                {cart.shipping === 0 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl px-3 py-2 text-xs font-bold">
                    <FiTag size={13} className="text-emerald-600 shrink-0" />
                    <span>🎉 You've unlocked FREE shipping!</span>
                  </div>
                ) : (
                  <div className="bg-brand-50/70 border border-brand-100 rounded-xl px-3 py-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-700 font-semibold mb-1">
                      <span>
                        Add{" "}
                        <strong className="text-brand-900 font-extrabold">
                          {formatPrice(999 - cart.subtotal)}
                        </strong>{" "}
                        more for FREE shipping
                      </span>
                      <span className="text-[9px] text-slate-400 font-black">
                        {Math.round(Math.min((cart.subtotal / 999) * 100, 100))}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((cart.subtotal / 999) * 100, 100)}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span
                      className={
                        cart.shipping === 0
                          ? "text-emerald-600 font-bold"
                          : "font-semibold text-slate-900"
                      }
                    >
                      {cart.shipping === 0
                        ? "FREE"
                        : formatPrice(cart.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 text-sm sm:text-base">
                    <span>Total Amount</span>
                    <span className="text-brand-900">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Link
                    to="/checkout"
                    onClick={() => dispatch(closeCart())}
                    className="btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md"
                  >
                    Proceed to Checkout <FiChevronRight size={16} />
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => dispatch(closeCart())}
                    className="w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900 block transition-colors bg-slate-100 hover:bg-slate-200/80 rounded-xl"
                  >
                    View Full Bag
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
