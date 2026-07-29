// ─── OrderSuccessPage ─────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiArrowRight,
  FiPackage,
  FiCheck,
  FiTruck,
  FiCreditCard,
  FiMapPin,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { orderAPI } from "@services/api";
import {
  formatPrice,
  formatDate,
  getDeliveryEstimate,
  orderSupportMessage,
  openWhatsApp,
} from "@utils/helpers";
import { ORDER_TIMELINE_STEPS, ORDER_STATUSES } from "@constants";

// ─── Responsive & Mobile-Optimized Timeline ────────────────────────────────
function OrderTimeline({ status, timeline = [] }) {
  const currentStep = ORDER_STATUSES[status]?.step ?? 0;
  const isCancelled = ["cancelled", "returned", "return_requested"].includes(
    status,
  );

  const totalSteps = ORDER_TIMELINE_STEPS.length;
  const progressPercent = isCancelled
    ? 0
    : currentStep >= totalSteps
      ? 100
      : Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full overflow-hidden">
      <div className="relative mb-4 sm:mb-6 px-1">
        {/* Background Track Line */}
        <div className="absolute top-4 sm:top-5 left-4 right-4 h-0.5 sm:h-1 bg-gray-100 rounded-full -z-0" />

        {/* Dynamic Animated Active Progress Line */}
        {!isCancelled && (
          <motion.div
            className="absolute top-4 sm:top-5 left-4 h-0.5 sm:h-1 bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full -z-0"
            initial={{ width: "0%" }}
            animate={{ width: `calc(${progressPercent}% - 8px)` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}

        <div className="relative z-10 flex items-start justify-between">
          {ORDER_TIMELINE_STEPS.map((step, i) => {
            const stepNumber = i + 1;
            const done = !isCancelled && currentStep > stepNumber;
            const active = !isCancelled && currentStep === stepNumber;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`relative flex items-center justify-center rounded-full font-bold transition-all duration-300 w-8 h-8 sm:w-11 sm:h-11 text-xs sm:text-sm ${
                    done
                      ? "bg-emerald-500 text-white shadow-sm ring-2 sm:ring-4 ring-emerald-50"
                      : active
                        ? "bg-brand-800 text-white ring-2 sm:ring-4 ring-brand-100 shadow-lg"
                        : isCancelled
                          ? "bg-red-100 text-red-400 border border-red-200"
                          : "bg-white text-gray-300 border border-gray-200"
                  }`}
                >
                  {done ? (
                    <FiCheck
                      className="w-3.5 h-3.5 sm:w-5 sm:h-5"
                      strokeWidth={3}
                    />
                  ) : (
                    step.icon
                  )}

                  {/* Active step pulse animation */}
                  {active && (
                    <span className="absolute -inset-1 rounded-full bg-brand-500/20 animate-ping -z-10" />
                  )}
                </motion.div>

                <p
                  className={`text-[9px] sm:text-xs mt-1.5 sm:mt-2 text-center font-medium leading-tight ${
                    active
                      ? "text-brand-900 font-bold"
                      : done
                        ? "text-emerald-700"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OrderSuccessPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderAPI.getOne(id).then((r) => r.data.order),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <motion.div
          className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Order Confirmed | ONE PIECE</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50/60 py-6 sm:py-12 px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header Card */}
          <div className="bg-gradient-to-r from-gray-900 via-brand-950 to-gray-900 rounded-t-2xl sm:rounded-t-3xl px-5 py-8 sm:py-12 text-center relative overflow-hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 border border-emerald-400/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner"
            >
              <FiCheckCircle size={36} className="text-emerald-400" />
            </motion.div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white mb-1 tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-white/70 text-xs sm:text-sm">
              Thank you for shopping with ONE PIECE
            </p>
            {order && (
              <p className="text-brand-300 font-mono font-bold mt-2 text-sm sm:text-base">
                #{order.orderNumber}
              </p>
            )}
          </div>

          <div className="bg-white rounded-b-2xl sm:rounded-b-3xl shadow-sm border border-t-0 border-gray-100 p-4 sm:p-8 space-y-6 sm:space-y-8">
            {order && (
              <>
                {/* Timeline Section */}
                <div>
                  <h3 className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">
                    Order Status
                  </h3>
                  <OrderTimeline
                    status={order.orderStatus}
                    timeline={order.timeline}
                  />
                  <div className="mt-4 p-3.5 bg-brand-50/70 rounded-xl sm:rounded-2xl border border-brand-100/50 flex items-center gap-2.5">
                    <FiTruck className="text-brand-600 text-base shrink-0" />
                    <p className="text-xs sm:text-sm text-brand-900 font-semibold">
                      {getDeliveryEstimate(
                        order.tracking?.estimatedDelivery,
                        order.orderStatus,
                      )}
                    </p>
                  </div>
                </div>

                {/* Delivery Address & Payment Summary (Stacked Grid for Mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  <div className="bg-gray-50/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2 sm:mb-3 flex items-center gap-1.5">
                      <FiMapPin className="text-brand-600" /> Deliver To
                    </p>
                    <p className="font-semibold text-xs sm:text-sm text-gray-900">
                      {order.shippingAddress?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {order.shippingAddress?.line1},{" "}
                      {order.shippingAddress?.city}
                      <br />
                      {order.shippingAddress?.state} –{" "}
                      {order.shippingAddress?.pincode}
                      <br />
                      <span className="font-medium text-gray-700 mt-0.5 block">
                        📞 {order.shippingAddress?.phone}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2 sm:mb-3 flex items-center gap-1.5">
                      <FiCreditCard className="text-brand-600" /> Payment
                    </p>
                    <span
                      className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${
                        order.paymentInfo?.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.paymentInfo?.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1.5 capitalize font-medium">
                      Method: {order.paymentInfo?.method?.replace("_", " ")}
                    </p>
                    <p className="font-bold text-brand-950 mt-2 text-base sm:text-lg">
                      {formatPrice(order.pricing?.total)}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3 sm:mb-4">
                    Items Ordered ({order.items?.length})
                  </p>
                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item, i) => (
                      <div
                        key={i}
                        className="py-3 first:pt-0 last:pb-0 flex items-center gap-3 sm:gap-4"
                      >
                        <div className="w-12 h-14 sm:w-14 sm:h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                            Qty: {item.quantity}
                            {item.size && ` · Size: ${item.size}`}
                            {item.color && ` · Color: ${item.color}`}
                          </p>
                        </div>
                        <p className="font-bold text-xs sm:text-sm text-brand-950 shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-4 space-y-2 bg-gray-50/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-gray-100 text-xs sm:text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(order.pricing?.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span
                        className={
                          order.pricing?.shippingCost === 0
                            ? "text-emerald-600 font-bold"
                            : "font-medium text-gray-900"
                        }
                      >
                        {order.pricing?.shippingCost === 0
                          ? "FREE"
                          : formatPrice(order.pricing?.shippingCost)}
                      </span>
                    </div>
                    {order.pricing?.couponDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Coupon Discount</span>
                        <span>
                          −{formatPrice(order.pricing?.couponDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-gray-900 border-t border-gray-200 pt-2.5 text-sm sm:text-base">
                      <span>Total Paid</span>
                      <span className="text-brand-950">
                        {formatPrice(order.pricing?.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Touch-Friendly Action Buttons */}
                <div className="space-y-2.5 sm:space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <Link
                      to="/orders"
                      className="btn-primary flex-1 justify-center py-3 text-xs sm:text-sm font-semibold rounded-xl"
                    >
                      <FiPackage size={16} /> View My Orders
                    </Link>
                    <button
                      onClick={() =>
                        openWhatsApp(orderSupportMessage(order.orderNumber))
                      }
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#25D366]/40 text-[#25D366] bg-[#25D366]/5 rounded-xl font-semibold text-xs sm:text-sm hover:bg-[#25D366] hover:text-white transition-all"
                    >
                      <FaWhatsapp size={17} /> Track via WhatsApp
                    </button>
                  </div>
                  <Link
                    to="/collections"
                    className="btn-secondary w-full justify-center py-2.5 text-xs sm:text-sm font-semibold rounded-xl"
                  >
                    Continue Shopping <FiArrowRight size={15} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default OrderSuccessPage;
