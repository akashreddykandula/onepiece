import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  FiLock,
  FiTag,
  FiX,
  FiCheck,
  FiPlus,
  FiChevronDown,
  FiShield,
  FiShoppingBag,
  FiArrowRight,
  FiPercent,
  FiEdit3,
} from "react-icons/fi";
import { orderAPI, paymentAPI, couponAPI } from "@services/api";
import { clearCart } from "@store/index";
import { useAuth } from "@hooks/index";
import {
  formatPrice,
  isValidPhone,
  isValidPincode,
  isValidEmail,
} from "@utils/helpers";
import { INDIA_STATES, PAYMENT_METHODS } from "@constants";
import toast from "react-hot-toast";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const cart = useSelector((s) => s.cart);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      line1: "",
      line2: "",
      city: "",
      state: "Telangana",
      pincode: "",
    },
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Address selection state
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(
    !!user?.addresses?.length,
  );
  const [selectedAddress, setSelectedAddress] = useState(
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null,
  );
  const [showBillDetails, setShowBillDetails] = useState(false);
  const [showOrderItems, setShowOrderItems] = useState(false);

  useEffect(() => {
    if (cart.items.length === 0 && window.location.pathname === "/checkout") {
      navigate("/cart", { replace: true });
    }
  }, [cart.items.length, navigate]);

  useEffect(() => {
    if (selectedAddress && useExistingAddress) {
      setValue("name", selectedAddress.name);
      setValue("phone", selectedAddress.phone);
      setValue("line1", selectedAddress.line1);
      setValue("line2", selectedAddress.line2 || "");
      setValue("city", selectedAddress.city);
      setValue("state", selectedAddress.state);
      setValue("pincode", selectedAddress.pincode);
    }
  }, [selectedAddress, useExistingAddress, setValue]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate(couponCode, cart.subtotal);
      setCouponApplied({
        code: couponCode.toUpperCase(),
        discount: res.data.discount,
        coupon: res.data.coupon,
      });
      toast.success(
        `Coupon applied! You save ${formatPrice(res.data.discount)}`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
  };

  const finalTotal = Math.max(0, cart.total - (couponApplied?.discount || 0));

  const onSubmit = async (formData) => {
    setProcessing(true);
    try {
      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        line1: formData.line1,
        line2: formData.line2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: "India",
      };

      const orderPayload = {
        items: cart.items.map((i) => ({
          product: i._id,
          name: i.name,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          colorHex: i.colorHex,
        })),
        shippingAddress,
        paymentMethod,
        couponCode: couponApplied?.code,
        guestInfo: !user
          ? {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            }
          : undefined,
      };

      const orderRes = await orderAPI.create(orderPayload);
      const order = orderRes.data.order;

      if (paymentMethod === "cod") {
        dispatch(clearCart());
        navigate(`/order-success/${order._id}`);
        return;
      }

      // Razorpay flow
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Payment gateway unavailable");
        setProcessing(false);
        return;
      }

      const rzpRes = await paymentAPI.createOrder(order._id);
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: "ONE PIECE",
        description: `Order #${order.orderNumber}`,
        order_id: rzpData.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#0A5ACB" },
        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            dispatch(clearCart());
            navigate(`/order-success/${order._id}`);
          } catch {
            toast.error("Payment verification failed. Contact support.");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await paymentAPI.failed(order._id);
            toast.error("Payment cancelled");
            setProcessing(false);
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
      setProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Checkout | ONE PIECE</title>
      </Helmet>

      {/* Top Header Breadcrumb Banner */}
      <div className="bg-slate-950 text-white sticky top-0 z-30 border-b border-slate-800 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 sm:px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <FiShoppingBag size={18} />
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-display font-black text-sm tracking-wide text-white uppercase">
              Checkout
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-xs">
            <FiShield size={12} className="shrink-0" />
            <span className="tracking-wide">256-Bit SSL Secured</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/60 flex-1 flex flex-col min-h-0">
        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50/60">
          <div className="max-w-6xl mx-auto w-full px-3.5 sm:px-5 py-3.5 sm:py-8 pb-36">
            <div className="grid lg:grid-cols-12 gap-4 lg:gap-8 items-start">
              {/* Left Column – Address & Payment */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                {/* Delivery Address Section Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs">
                        1
                      </div>
                      <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
                        Delivery Address
                      </h2>
                    </div>

                    {user?.addresses?.length > 0 &&
                      useExistingAddress &&
                      !isChangingAddress && (
                        <button
                          type="button"
                          onClick={() => setIsChangingAddress(true)}
                          className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <FiEdit3 size={12} /> Change
                        </button>
                      )}
                  </div>

                  {/* Saved Default Address Selected View */}
                  {user?.addresses?.length > 0 &&
                    useExistingAddress &&
                    !isChangingAddress &&
                    selectedAddress && (
                      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white rounded">
                            {selectedAddress.label || "HOME"}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {selectedAddress.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          {selectedAddress.line1}
                          {selectedAddress.line2
                            ? `, ${selectedAddress.line2}`
                            : ""}
                          , {selectedAddress.city}, {selectedAddress.state} -{" "}
                          <span className="font-bold text-slate-800">
                            {selectedAddress.pincode}
                          </span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-700 pt-0.5">
                          Phone:{" "}
                          <span className="text-slate-900">
                            {selectedAddress.phone}
                          </span>
                        </p>
                      </div>
                    )}

                  {/* Change Saved Address List */}
                  {user?.addresses?.length > 0 && isChangingAddress && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Select Address
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setUseExistingAddress(false);
                            setSelectedAddress(null);
                            setIsChangingAddress(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 font-bold hover:underline"
                        >
                          <FiPlus size={13} /> Add New
                        </button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                        {user.addresses.map((addr) => {
                          const isSelected =
                            selectedAddress?._id === addr._id &&
                            useExistingAddress;
                          return (
                            <div
                              key={addr._id}
                              onClick={() => {
                                setSelectedAddress(addr);
                                setUseExistingAddress(true);
                                setIsChangingAddress(false);
                              }}
                              className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-brand-600 bg-brand-50/40"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-slate-200 text-slate-700 rounded">
                                      {addr.label || "HOME"}
                                    </span>
                                    <p className="font-bold text-xs text-slate-900">
                                      {addr.name}
                                    </p>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-snug">
                                    {addr.line1}, {addr.city}, {addr.state} -{" "}
                                    {addr.pincode}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Phone: {addr.phone}
                                  </p>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                                    isSelected
                                      ? "bg-brand-600 border-brand-600 text-white"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <FiCheck size={10} strokeWidth={3} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsChangingAddress(false)}
                        className="w-full py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Add New Address Form */}
                  {(!useExistingAddress || !user?.addresses?.length) && (
                    <div className="space-y-3 mt-1">
                      {user?.addresses?.length > 0 && (
                        <div className="flex justify-end mb-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUseExistingAddress(true);
                              setIsChangingAddress(false);
                            }}
                            className="text-xs text-brand-600 hover:underline font-bold"
                          >
                            ← Back to Saved Addresses
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Full Name *
                          </label>
                          <input
                            {...register("name", {
                              required: "Name is required",
                            })}
                            className={`input text-xs py-2.5 ${errors.name ? "input-error" : ""}`}
                            placeholder="Full name"
                          />
                          {errors.name && (
                            <p className="error-msg text-[10px]">
                              {errors.name.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Phone Number *
                          </label>
                          <input
                            {...register("phone", {
                              required: "Phone is required",
                              validate: (v) =>
                                isValidPhone(v) ||
                                "Enter valid 10-digit number",
                            })}
                            className={`input text-xs py-2.5 ${errors.phone ? "input-error" : ""}`}
                            placeholder="10-digit mobile"
                            maxLength={10}
                          />
                          {errors.phone && (
                            <p className="error-msg text-[10px]">
                              {errors.phone.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Email Address *
                          </label>
                          <input
                            {...register("email", {
                              required: "Email is required",
                              validate: (v) =>
                                isValidEmail(v) || "Enter valid email",
                            })}
                            type="email"
                            className={`input text-xs py-2.5 ${errors.email ? "input-error" : ""}`}
                            placeholder="email@domain.com"
                          />
                          {errors.email && (
                            <p className="error-msg text-[10px]">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Address Line 1 *
                          </label>
                          <input
                            {...register("line1", {
                              required: "Address is required",
                            })}
                            className={`input text-xs py-2.5 ${errors.line1 ? "input-error" : ""}`}
                            placeholder="House / Flat No., Street name, Area"
                          />
                          {errors.line1 && (
                            <p className="error-msg text-[10px]">
                              {errors.line1.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Address Line 2 (Optional)
                          </label>
                          <input
                            {...register("line2")}
                            className="input text-xs py-2.5"
                            placeholder="Landmark, Locality"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            City *
                          </label>
                          <input
                            {...register("city", {
                              required: "City is required",
                            })}
                            className={`input text-xs py-2.5 ${errors.city ? "input-error" : ""}`}
                            placeholder="City"
                          />
                          {errors.city && (
                            <p className="error-msg text-[10px]">
                              {errors.city.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            Pincode *
                          </label>
                          <input
                            {...register("pincode", {
                              required: "Pincode is required",
                              validate: (v) =>
                                isValidPincode(v) ||
                                "Enter valid 6-digit pincode",
                            })}
                            className={`input text-xs py-2.5 ${errors.pincode ? "input-error" : ""}`}
                            placeholder="6-digit pincode"
                            maxLength={6}
                          />
                          {errors.pincode && (
                            <p className="error-msg text-[10px]">
                              {errors.pincode.message}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1 block">
                            State *
                          </label>
                          <select
                            {...register("state", {
                              required: "State is required",
                            })}
                            className="input text-xs py-2.5 cursor-pointer"
                          >
                            {INDIA_STATES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Payment Methods Section Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                    <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
                      Select Payment Method
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-600 bg-brand-50/40"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            value={method.id}
                            checked={isSelected}
                            onChange={() => setPaymentMethod(method.id)}
                            className="w-4 h-4 accent-brand-600 shrink-0"
                          />
                          <span className="text-xl shrink-0">
                            {method.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-slate-900">
                              {method.label}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {method.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center shrink-0 text-white">
                              <FiCheck size={10} strokeWidth={3} />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-3.5 p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-start gap-2">
                    <FiShield
                      size={15}
                      className="text-emerald-600 mt-0.5 shrink-0"
                    />
                    <p className="text-[10px] text-emerald-900 font-semibold leading-tight">
                      Payments are encrypted & 100% safe.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right Column – Desktop Order Summary */}
              <div className="hidden md:block lg:col-span-5">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs lg:sticky lg:top-20 space-y-3.5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="font-display font-bold text-sm sm:text-base text-slate-900">
                      Order Summary
                    </h2>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200/50">
                      {cart.items.length}{" "}
                      {cart.items.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>

                  {/* Items Collapsible List */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowOrderItems(!showOrderItems)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 md:hidden bg-slate-50 p-2.5 rounded-lg border border-slate-200/80"
                    >
                      <span>
                        {showOrderItems ? "Hide Items" : "View Items"}
                      </span>
                      <FiChevronDown
                        className={`transition-transform ${showOrderItems ? "rotate-180" : ""}`}
                        size={14}
                      />
                    </button>

                    <div
                      className={`space-y-2 mt-2.5 max-h-56 overflow-y-auto pr-0.5 ${
                        showOrderItems ? "block" : "hidden md:block"
                      }`}
                    >
                      {cart.items.map((item) => (
                        <div
                          key={`${item._id}-${item.size}`}
                          className="flex items-center gap-2.5 bg-slate-50/70 p-2 rounded-xl border border-slate-100"
                        >
                          <div className="w-11 h-13 bg-white rounded-md overflow-hidden shrink-0 border border-slate-200/60">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {item.size && (
                                <span className="text-[8px] font-semibold text-slate-500 bg-white border border-slate-200 px-1 rounded">
                                  {item.size}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <p className="text-[11px] font-extrabold text-brand-900 mt-0.5">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <p className="text-[11px] font-bold text-slate-900 shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon Code Section */}
                  <div>
                    {couponApplied ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FiPercent size={13} className="text-emerald-700" />
                          <div>
                            <p className="text-xs font-bold text-emerald-800">
                              {couponApplied.code}
                            </p>
                            <p className="text-[9px] text-emerald-600 font-medium">
                              Saved {formatPrice(couponApplied.discount)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <FiX size={15} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <FiTag
                            size={13}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), applyCoupon())
                            }
                            placeholder="COUPON CODE"
                            className="input text-[11px] pl-8 uppercase font-bold py-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="btn-secondary px-3 py-2 text-[11px] font-bold shrink-0 uppercase tracking-wider"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bill Breakdown */}
                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
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
                    {couponApplied && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount ({couponApplied.code})</span>
                        <span>−{formatPrice(couponApplied.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>GST (incl.)</span>
                      <span>{formatPrice(cart.gst)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-2 text-sm sm:text-base">
                      <span>Total Amount</span>
                      <span className="text-brand-900">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Place Order Button */}
                  <button
                    type="submit"
                    disabled={processing}
                    className={`btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md hidden md:flex rounded-xl ${
                      processing ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <FiLock size={14} /> Place Order •{" "}
                        {formatPrice(finalTotal)}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Mobile Bottom CTA Bar (Cart Page Matched Style) */}
          {cart.items.length > 0 && (
            <div className="md:hidden border-t border-slate-200/80 px-4 sm:px-5 py-3.5 bg-white space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
              {/* Expandable Bill Breakdown Drawer */}
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
                    {couponApplied && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount ({couponApplied.code})</span>
                        <span>−{formatPrice(couponApplied.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>GST (incl.)</span>
                      <span>{formatPrice(cart.gst)}</span>
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
                      {formatPrice(finalTotal)}
                    </p>
                  </div>
                </button>

                {/* Mobile CTA Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className={`btn-primary flex-1 justify-center py-2.5 text-xs font-bold shadow-md inline-flex items-center gap-1.5 rounded-xl whitespace-nowrap ${
                    processing ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.7,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <FiLock size={13} /> Place Order
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
