import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FiMinus,
  FiPlus,
  FiTrash2,
  FiArrowRight,
  FiShoppingBag,
  FiTag,
  FiShield,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { removeItem, updateQuantity, refreshCartItem } from "@store/index";
import { formatPrice } from "@utils/helpers";
import { productAPI } from "@services/api";

export default function CartPage() {
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart);
  const [showBillDetails, setShowBillDetails] = useState(false);
  useEffect(() => {
    const refreshCart = async () => {
      for (const item of cart.items) {
        try {
          const res = await productAPI.getOne(item.slug || item._id);
          const product = res.data.product;

          dispatch(
            refreshCartItem({
              _id: item._id,
              price: product.price,
              freeShipping: product.freeShipping,
              name: product.name,
              slug: product.slug,
              image:
                product.images?.find((img) => img.isPrimary)?.url ||
                product.images?.[0]?.url ||
                item.image,
            }),
          );
        } catch (err) {
          console.error("Failed to refresh cart item:", item._id, err);
        }
      }
    };

    if (cart.items.length) {
      refreshCart();
    }
  }, [cart.items.length, dispatch]);

  const freeShippingThreshold = 999;
  const progressPercent = Math.min(
    (cart.subtotal / freeShippingThreshold) * 100,
    100,
  );

  return (
    <>
      <Helmet>
        <title>Shopping Bag | ONE PIECE</title>
      </Helmet>

      {/* Top Header Banner */}
      <div className="bg-slate-950 text-white sticky top-0 z-30 border-b border-slate-800 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-800/80 rounded-xl flex items-center justify-center text-brand-400">
              <FiShoppingBag size={16} />
            </div>
            <div>
              <h1 className="font-display font-black text-sm sm:text-base text-white tracking-tight leading-tight">
                Shopping Bag
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">
                {cart.count} {cart.count === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-xs">
            <FiShield size={12} className="shrink-0" />
            <span className="tracking-wide">100% Safe Checkout</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/60 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto overscroll-contain max-w-6xl mx-auto w-full px-3.5 sm:px-5 py-3.5 sm:py-8 bg-slate-50">
          {cart.items.length === 0 ? (
            /* Empty Cart State */
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs max-w-lg mx-auto my-8"
            >
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
                className="btn-primary px-5 py-2.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-md"
              >
                Browse Collections <FiArrowRight size={14} />
              </Link>
            </motion.div>
          ) : (
            /* Main Cart Layout */
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-8 items-start content-start">
              {/* Left Column - Cart Items & Progress */}
              <div className="lg:col-span-7 space-y-2.5 sm:space-y-4">
                {/* Free Shipping Alert Bar */}
                {cart.shipping === 0 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl px-3 py-2 text-xs font-bold shadow-2xs">
                    <FiTag size={13} className="text-emerald-600 shrink-0" />
                    <span>🎉 You've unlocked FREE shipping!</span>
                  </div>
                ) : (
                  <div className="bg-brand-50/70 border border-brand-100 rounded-xl px-3 py-2.5 shadow-2xs">
                    <div className="flex justify-between items-center text-[11px] text-slate-700 font-semibold mb-1">
                      <span>
                        Add{" "}
                        <strong className="text-brand-900 font-extrabold">
                          {formatPrice(freeShippingThreshold - cart.subtotal)}
                        </strong>{" "}
                        more for FREE shipping
                      </span>
                      <span className="text-[9px] text-slate-400 font-black">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2.5 pb-6">
                  <AnimatePresence priority={false}>
                    {cart.items.map((item, i) => (
                      <motion.div
                        key={`${item._id}-${item.size}-${item.color}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          x: 20,
                          height: 0,
                          marginBottom: 0,
                          overflow: "hidden",
                        }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs"
                      >
                        <div className="flex gap-3">
                          {/* Image Thumbnail */}
                          <Link
                            to={`/product/${item.slug || item._id}`}
                            className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 shrink-0 hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={item.image}
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
                                  aria-label="Remove item"
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
                                        className="w-2 h-2 rounded-full border border-slate-300 shrink-0"
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
                                  aria-label="Decrease quantity"
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
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus size={10} />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  {formatPrice(item.price)} × {item.quantity}
                                </p>
                                <p className="text-xs sm:text-sm font-black text-slate-900 leading-none mt-0.5">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column - Desktop Summary Box */}
              <div className="hidden md:block lg:col-span-5">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs lg:sticky lg:top-20 space-y-3.5">
                  <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>Order Summary</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/50">
                      {cart.count} {cart.count === 1 ? "Item" : "Items"}
                    </span>
                  </h2>

                  <div className="space-y-1.5 text-xs">
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

                  <div className="pt-1 hidden md:block space-y-2">
                    <Link
                      to="/checkout"
                      className="btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md inline-flex items-center gap-1.5 rounded-xl"
                    >
                      Proceed to Checkout <FiChevronRight size={16} />
                    </Link>
                    <Link
                      to="/collections"
                      className="w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900 block transition-colors bg-slate-100 hover:bg-slate-200/80 rounded-xl"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Bar for Mobile - Formatted identically to CartDrawer Footer */}
        {cart.items.length > 0 && (
          <div className="md:hidden border-t border-slate-200/80 px-4 sm:px-5 py-3.5 bg-white space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
            {/* Expandable Bill Breakdown Drawer for Mobile */}
            <AnimatePresence>
              {showBillDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-100 pb-2.5 space-y-1 text-xs text-slate-600"
                >
                  <div className="flex justify-between">
                    <span>
                      Subtotal ({cart.count}{" "}
                      {cart.count === 1 ? "item" : "items"})
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatPrice(cart.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Sticky Row */}
            <div className="flex items-center justify-between gap-3">
              {/* Total Payable Selector */}
              <button
                type="button"
                onClick={() => setShowBillDetails(!showBillDetails)}
                className="text-left flex items-center gap-1 focus:outline-none shrink-0"
              >
                <div>
                  <div className="flex items-center gap-1 text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">
                    <span>Total Amount</span>
                    <FiChevronDown
                      size={12}
                      className={`text-slate-400 transition-transform duration-200 ${
                        showBillDetails ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <p className="text-sm sm:text-base font-black text-brand-900 leading-tight mt-0.5">
                    {formatPrice(cart.total)}
                  </p>
                </div>
              </button>

              {/* Action Button matching CartDrawer */}
              <Link
                to="/checkout"
                className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold shadow-md inline-flex items-center gap-1.5 rounded-xl whitespace-nowrap"
              >
                Proceed to Checkout <FiChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
