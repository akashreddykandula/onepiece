import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import api from "@services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPackage,
  FiArrowRight,
  FiChevronRight,
  FiDownload,
  FiCheck,
  FiCheckCircle,
  FiUpload,
  FiXCircle,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiTruck,
  FiAlertCircle,
  FiX,
  FiPrinter,
  FiMessageSquare,
  FiChevronDown,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import {
  orderAPI,
  returnAPI,
  reviewAPI,
  uploadAPI,
  customPrintAPI,
} from "@services/api";
import ReturnTimeline from "@components/orders/ReturnTimeline";
import {
  formatPrice,
  formatDate,
  formatDateTime,
  getOrderStatusConfig,
  getDeliveryEstimate,
  orderSupportMessage,
  openWhatsApp,
  isOrderCancellable,
} from "@utils/helpers";
import { ORDER_TIMELINE_STEPS, ORDER_STATUSES } from "@constants";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";
import MyCustomPrintOrders from "./MyCustomPrintOrders";
import { socket } from "@services/socket";

// ─── Mobile-Optimized Order Timeline Component ──────────────────────────────
function OrderTimeline({ status, timeline = [], compact = false }) {
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
    <div className="w-full">
      {/* 1. Mobile Vertical List Timeline */}
      {!compact && (
        <div className="block sm:hidden space-y-3.5 py-1">
          {ORDER_TIMELINE_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const done = !isCancelled && currentStep > stepNumber;
            const active = !isCancelled && currentStep === stepNumber;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-brand-900 text-white ring-4 ring-brand-100"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {done ? <FiCheck size={13} strokeWidth={3} /> : step.icon}
                  </div>

                  {index !== ORDER_TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-6 my-1 rounded-full ${
                        done ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>

                <div className="pt-0.5 min-w-0 flex-1">
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      active
                        ? "text-brand-900"
                        : done
                          ? "text-emerald-700"
                          : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {step.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Desktop Horizontal Progress Bar */}
      <div className={`${!compact ? "hidden sm:block" : "block"} w-full`}>
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="min-w-[300px] sm:min-w-full relative px-2 pt-1">
            <div
              className={`absolute ${
                compact ? "top-3" : "top-4 sm:top-5"
              } left-6 right-6 h-1 bg-slate-100 rounded-full -z-0`}
            />

            {!isCancelled && (
              <motion.div
                className={`absolute ${
                  compact ? "top-3" : "top-4 sm:top-5"
                } left-6 h-1 bg-emerald-500 rounded-full -z-0`}
                initial={{ width: "0%" }}
                animate={{ width: `calc(${progressPercent}% - 8px)` }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            )}

            <div className="flex items-start justify-between relative z-10">
              {ORDER_TIMELINE_STEPS.map((step, i) => {
                const stepNumber = i + 1;
                const done = !isCancelled && currentStep > stepNumber;
                const active = !isCancelled && currentStep === stepNumber;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center flex-1 text-center shrink-0 min-w-[50px]"
                  >
                    <motion.div
                      initial={false}
                      animate={{ scale: active ? 1.08 : 1 }}
                      className={`relative flex items-center justify-center rounded-full font-bold transition-all ${
                        compact
                          ? "w-6 h-6 text-[10px]"
                          : "w-8 h-8 sm:w-9 sm:h-9 text-xs"
                      } ${
                        done
                          ? "bg-emerald-500 text-white shadow-xs"
                          : active
                            ? "bg-brand-900 text-white ring-2 ring-brand-100"
                            : "bg-white text-slate-300 border border-slate-200"
                      }`}
                    >
                      {done ? <FiCheck size={14} strokeWidth={3} /> : step.icon}
                    </motion.div>

                    {!compact && (
                      <div className="mt-1.5 px-0.5">
                        <p
                          className={`text-[11px] font-bold leading-tight ${
                            active
                              ? "text-brand-900"
                              : done
                                ? "text-emerald-700"
                                : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status History Timeline */}
      {!compact && timeline.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Status Activity
          </h4>
          <div className="relative pl-3 border-l-2 border-slate-200 space-y-2.5">
            {[...timeline].reverse().map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-3"
              >
                <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-brand-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 capitalize">
                      {event.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {event.message}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OrdersPage Component ──────────────────────────────────────────────────
export function OrdersPage() {
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState(location.state?.tab || "orders");
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCustomPrintUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: ["my-custom-print-orders"],
      });
    };

    socket.on("customPrintUpdated", handleCustomPrintUpdated);

    return () => {
      socket.off("customPrintUpdated", handleCustomPrintUpdated);
    };
  }, [queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", statusFilter],
    queryFn: () =>
      orderAPI
        .getAll({ status: statusFilter || undefined, limit: 20 })
        .then((r) => r.data),
  });

  const { data: customOrders, isLoading: customLoading } = useQuery({
    queryKey: ["my-custom-print-orders"],
    queryFn: () => customPrintAPI.getMine().then((res) => res.data.data),
    enabled: activeTab === "custom",
  });

  const statusTabs = [
    { value: "", label: "All Orders" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <Helmet>
        <title>My Orders | ONE PIECE</title>
      </Helmet>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-6 sm:py-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                My Orders
              </h1>
              <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5 font-medium">
                <FiPackage className="text-brand-400 shrink-0" size={14} />
                <span>
                  {data?.total || 0} order{data?.total !== 1 ? "s" : ""} placed
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8">
        {/* Main Section Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-xl mb-4 max-w-sm">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === "orders"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Regular Orders
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "custom"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FiPrinter size={13} />
            <span>Custom Prints</span>
          </button>
        </div>

        {/* Horizontal Status Filter Chips */}
        {activeTab === "orders" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none mb-4 border-b border-slate-100">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Regular Orders Listing */}
        {activeTab === "orders" ? (
          isLoading ? (
            <PageLoader />
          ) : (
            <>
              {!data?.orders?.length ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200"
                >
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <FiPackage size={24} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1">
                    No orders found
                  </h2>
                  <p className="text-slate-500 text-xs max-w-xs mb-5">
                    {statusFilter
                      ? `No orders marked as "${statusFilter}".`
                      : "You haven't placed any orders yet."}
                  </p>
                  <Link
                    to="/"
                    className="px-5 py-2.5 bg-brand-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-brand-800 transition-all shadow-xs"
                  >
                    Start Shopping <FiArrowRight size={14} />
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3.5 sm:space-y-4">
                  {data.orders.map((order, i) => {
                    const statusCfg = getOrderStatusConfig(order.orderStatus);
                    return (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                      >
                        {/* Order Header Bar */}
                        <div className="bg-slate-50/80 px-3.5 sm:px-5 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${statusCfg.color}`}
                            >
                              {statusCfg.label}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-700">
                              #{order.orderNumber}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Order Body Details */}
                        <div className="p-3.5 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 shrink-0">
                              <img
                                src={order.items?.[0]?.image}
                                alt={order.items?.[0]?.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {order.items?.[0]?.name}
                              </h3>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                {order.items?.[0]?.size && (
                                  <span>
                                    Size:{" "}
                                    <strong className="text-slate-800">
                                      {order.items[0].size}
                                    </strong>
                                  </span>
                                )}
                                {order.items?.[0]?.color && (
                                  <span>
                                    Color:{" "}
                                    <strong className="text-slate-800">
                                      {order.items[0].color}
                                    </strong>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-500">
                                Qty: {order.items?.[0]?.quantity}
                                {order.items?.length > 1 && (
                                  <span className="text-brand-600 font-bold ml-1">
                                    (+{order.items.length - 1} more)
                                  </span>
                                )}
                              </p>

                              <p className="text-xs font-black text-slate-900 pt-0.5">
                                Total: {formatPrice(order.pricing?.total)}
                              </p>
                            </div>
                          </div>

                          {/* Delivery Estimate Status Pill */}
                          <div className="mt-3 p-2.5 bg-brand-50/50 rounded-lg border border-brand-100/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-brand-900 font-semibold text-[11px] sm:text-xs">
                              <FiTruck
                                className="text-brand-600 shrink-0"
                                size={14}
                              />
                              <span>
                                {getDeliveryEstimate(
                                  order.tracking?.estimatedDelivery,
                                  order.orderStatus,
                                )}
                              </span>
                            </div>
                            {order.tracking?.trackingNumber && (
                              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                                ID: {order.tracking.trackingNumber}
                              </span>
                            )}
                          </div>

                          {/* Actions Bar */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                openWhatsApp(
                                  orderSupportMessage(order.orderNumber),
                                )
                              }
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <FaWhatsapp size={14} /> Support
                            </button>

                            <Link
                              to={`/orders/${order._id}`}
                              className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              Details <FiChevronRight size={14} />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )
        ) : customLoading ? (
          <PageLoader />
        ) : (
          <MyCustomPrintOrders
            key={customOrders?.length}
            orders={customOrders || []}
          />
        )}
      </div>
    </>
  );
}

// ─── OrderDetailPage Component ───────────────────────────────────────────────
export function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnComment, setReturnComment] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [refundMethod, setRefundMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);

  const [bankDetails, setBankDetails] = useState({
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderAPI.getOne(id).then((r) => r.data),
    enabled: !!id,
  });

  const order = data?.order;
  const returnRequest = data?.returnRequest;
  const RETURN_WINDOW_DAYS = 7; // or 10/15 depending on your policy

  const deliveredAt = order?.timeline?.find(
    (t) => t.status === "delivered",
  )?.timestamp;

  const returnExpiryDate = deliveredAt
    ? new Date(
        new Date(deliveredAt).getTime() +
          RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      )
    : null;

  const canReturn = returnExpiryDate && new Date() <= returnExpiryDate;

  const daysLeft = returnExpiryDate
    ? Math.ceil((returnExpiryDate - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const cancelMutation = useMutation({
    mutationFn: () => orderAPI.cancel(id, cancelReason),
    onSuccess: () => {
      toast.success("Order cancelled successfully");
      setShowCancelModal(false);
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries(["my-orders"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to cancel order"),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      let uploadedImages = [];

      if (reviewImages.length > 0) {
        const formData = new FormData();
        reviewImages.forEach((file) => formData.append("images", file));

        const uploadRes = await uploadAPI.images(formData, "reviews");
        uploadedImages = uploadRes.data.images || [];
      }

      return reviewAPI.create({
        product: selectedItem.product?._id || selectedItem.product,
        orderId: order._id,
        rating,
        title: reviewTitle,
        comment: reviewComment,
        images: uploadedImages,
      });
    },

    onSuccess: () => {
      toast.success("Review submitted successfully!");

      setShowReviewModal(false);
      setRating(5);
      setReviewTitle("");
      setReviewComment("");
      setReviewImages([]);

      queryClient.invalidateQueries(["order", id]);
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to submit review");
    },
  });

  const returnMutation = useMutation({
    mutationFn: (payload) => returnAPI.create(payload),
    onSuccess: () => {
      toast.success("Return request submitted successfully");
      setShowReturnModal(false);
      setReturnReason("");
      setReturnComment("");
      setReturnImages([]);
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries(["my-orders"]);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || "Failed to submit return request",
      ),
  });

  const handleReturnSubmit = async () => {
    if (!returnReason) {
      toast.error("Please select a return reason");
      return;
    }

    const requiresProof = ["Damaged Product", "Wrong Product"].includes(
      returnReason,
    );
    if (requiresProof && returnImages.length === 0) {
      toast.error(`Proof images are required for "${returnReason}"`);
      return;
    }

    if (isCOD) {
      if (refundMethod === "upi" && !upiId.trim()) {
        toast.error("Please enter a valid UPI ID");
        return;
      }
      if (
        refundMethod === "bank_transfer" &&
        (!bankDetails.accountNumber.trim() || !bankDetails.ifscCode.trim())
      ) {
        toast.error("Please fill in the bank account number and IFSC code");
        return;
      }
    }

    let uploadedImages = [];

    try {
      if (returnImages.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        returnImages.forEach((file) => formData.append("images", file));

        const uploadRes = await uploadAPI.images(formData, "returns");
        uploadedImages = uploadRes.data?.images || [];
      }

      returnMutation.mutate({
        orderId: order._id,
        items: order.items.map((item) => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          reason: returnReason,
          images: uploadedImages,
        })),
        returnType: "refund",
        reason: returnReason,
        comment: returnComment,
        refundDetails: isCOD
          ? {
              method: refundMethod,
              upiId: refundMethod === "upi" ? upiId : undefined,
              bankAccount:
                refundMethod === "bank_transfer" ? bankDetails : undefined,
            }
          : undefined,
      });
    } catch {
      toast.error("Failed to upload proof images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };
  const handleDownloadInvoice = async () => {
    try {
      const response = await orderAPI.downloadInvoice(order._id);

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.invoiceNumber || order.orderNumber}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download invoice");
    }
  };
  if (isLoading) return <PageLoader />;

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <FiAlertCircle className="mx-auto text-red-500 mb-2" size={32} />
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Order Not Found
        </h2>
        <p className="text-slate-500 text-xs mb-5">
          We couldn't retrieve the details for this order.
        </p>
        <Link
          to="/orders"
          className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs inline-block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const canCancel = isOrderCancellable(order.orderStatus);
  const hasReturnRequest = !!returnRequest;
  const statusCfg = getOrderStatusConfig(order.orderStatus);
  const isSubmittingReturn = uploadingImages || returnMutation.isPending;
  const isCOD = order?.paymentInfo?.method?.toLowerCase() === "cod";

  return (
    <>
      <Helmet>
        <title>Order #{order.orderNumber} | ONE PIECE</title>
      </Helmet>

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-5 sm:py-7 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            <Link to="/orders" className="hover:text-white transition-colors">
              Orders
            </Link>
            <FiChevronRight size={12} />
            <span className="text-brand-400">Order Details</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display font-black text-lg sm:text-2xl text-white tracking-tight">
                #{order.orderNumber}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusCfg.color}`}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tracking Status Box */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
              <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 mb-3 pb-2.5 border-b border-slate-100">
                {returnRequest ? "Return Status" : "Delivery Tracking"}
              </h2>

              {!returnRequest ? (
                <OrderTimeline
                  status={order.orderStatus}
                  timeline={order.timeline}
                />
              ) : (
                <ReturnTimeline
                  status={returnRequest.status}
                  timeline={returnRequest.timeline}
                />
              )}
              {returnRequest && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Return Details
                  </h3>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Return Status</span>
                    <span className="font-semibold capitalize">
                      {returnRequest.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Refund Status</span>
                    <span className="font-semibold capitalize">
                      {returnRequest.refundStatus}
                    </span>
                  </div>

                  {returnRequest.refundAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Refund Amount</span>
                      <span className="font-bold text-emerald-600">
                        {formatPrice(returnRequest.refundAmount)}
                      </span>
                    </div>
                  )}

                  {returnRequest.refundMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Refund Method</span>
                      <span className="font-semibold capitalize">
                        {returnRequest.refundMethod.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}

                  {returnRequest.adminNotes && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-xs uppercase font-bold text-slate-500 mb-1">
                        Admin Note
                      </p>

                      <p className="text-sm text-slate-700">
                        {returnRequest.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!returnRequest && (
                <div className="mt-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100/60 flex items-start gap-2.5">
                  <FiTruck className="text-brand-600 text-base mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-900 font-bold">
                      {getDeliveryEstimate(
                        order.tracking?.estimatedDelivery,
                        order.orderStatus,
                      )}
                    </p>
                    {order.tracking?.trackingNumber && (
                      <p className="text-[11px] text-brand-700 font-medium mt-0.5">
                        Tracking ID:{" "}
                        <span className="font-mono font-bold">
                          {order.tracking.trackingNumber}
                        </span>
                        {order.tracking.courier &&
                          ` via ${order.tracking.courier}`}
                        {order.tracking.trackingUrl && (
                          <a
                            href={order.tracking.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 font-bold text-brand-900 underline"
                          >
                            Track Link
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Purchased Items List */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
              <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 mb-3 pb-2.5 border-b border-slate-100">
                Ordered Items ({order.items?.length})
              </h2>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
                  >
                    <div className="w-14 h-16 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.size && (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="font-black text-xs sm:text-sm text-slate-900 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Price Summary */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                <FiCreditCard className="text-brand-600" /> Payment Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(order.pricing?.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span
                    className={
                      order.pricing?.shippingCost === 0
                        ? "text-emerald-600 font-bold"
                        : "font-semibold text-slate-900"
                    }
                  >
                    {order.pricing?.shippingCost === 0
                      ? "FREE"
                      : formatPrice(order.pricing?.shippingCost)}
                  </span>
                </div>

                {order.pricing?.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon ({order.coupon?.code})</span>
                    <span>−{formatPrice(order.pricing?.couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (Included)</span>
                  <span>{formatPrice(order.pricing?.gst)}</span>
                </div>

                <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2.5 text-sm sm:text-base">
                  <span>Total Amount</span>
                  <span className="text-brand-900">
                    {formatPrice(order.pricing?.total)}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Method</span>
                <span className="font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                  {order.paymentInfo?.status} ({order.paymentInfo?.method})
                </span>
              </div>
            </div>

            {/* Delivery Address Box */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-2">
                <FiMapPin className="text-brand-600" /> Delivery Address
              </h3>
              <p className="font-bold text-xs text-slate-900">
                {order.shippingAddress?.name}
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                {order.shippingAddress?.line1}
                {order.shippingAddress?.line2 &&
                  `, ${order.shippingAddress.line2}`}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
                <span className="font-semibold text-slate-800">
                  {order.shippingAddress?.pincode}
                </span>
                <br />
                <span className="font-medium text-slate-700 mt-1 block">
                  Mobile: {order.shippingAddress?.phone}
                </span>
              </p>
            </div>
            {/* Actions Panel */}
            <div className="space-y-2">
              {order.orderStatus === "delivered" && !hasReturnRequest && (
                <div
                  className={`rounded-xl border p-3 ${
                    canReturn
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      canReturn ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {canReturn
                      ? `✓ Return available until ${formatDate(returnExpiryDate)}`
                      : `✕ Return window expired on ${formatDate(returnExpiryDate)}`}
                  </p>

                  {canReturn && (
                    <p className="mt-1 text-[11px] text-emerald-600">
                      {daysLeft === 0
                        ? "Last day to request a return."
                        : `${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() =>
                  openWhatsApp(orderSupportMessage(order.orderNumber))
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-slate-100 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-colors"
              >
                <FaWhatsapp size={15} /> Contact Support
              </button>

              {order.invoiceNumber && (
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(
                        `/orders/${order._id}/invoice`,
                        {
                          responseType: "blob",
                        },
                      );

                      const url = window.URL.createObjectURL(
                        new Blob([response.data]),
                      );

                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `Invoice-${order.orderNumber}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch {
                      toast.error("Unable to download invoice");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors"
                >
                  <FiDownload size={14} />
                  Download Invoice
                </button>
              )}

              {canCancel && !hasReturnRequest && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FiXCircle size={15} /> Cancel Order
                </button>
              )}

              {order.orderStatus === "delivered" &&
                !hasReturnRequest &&
                canReturn && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Request Return
                  </button>
                )}

              {order.orderStatus === "delivered" && (
                <button
                  onClick={() => {
                    setSelectedItem(order.items[0]);
                    setShowReviewModal(true);
                  }}
                  className="w-full bg-brand-900 hover:bg-brand-800 text-white rounded-xl font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  Write Product Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl relative z-10 border border-slate-100"
            >
              <h3 className="font-display font-bold text-base text-slate-900 mb-1">
                Cancel Order?
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Please share your reason to help us improve.
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20 mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {cancelMutation.isPending
                    ? "Cancelling..."
                    : "Confirm Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Product Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-base font-bold mb-3">Write Product Review</h2>

              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold outline-none focus:border-brand-500"
                >
                  <option value={5}>★★★★★ (5 - Excellent)</option>
                  <option value={4}>★★★★☆ (4 - Good)</option>
                  <option value={3}>★★★☆☆ (3 - Average)</option>
                  <option value={2}>★★☆☆☆ (2 - Poor)</option>
                  <option value={1}>★☆☆☆☆ (1 - Terrible)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Title
                </label>
                <input
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-brand-500"
                  placeholder="Review title"
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Comment
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-brand-500 resize-none"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Images (optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="text-xs text-slate-500"
                  onChange={(e) => setReviewImages(Array.from(e.target.files))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>

                <button
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="px-4 py-2 bg-brand-900 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Return Request Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowReturnModal(false)}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-5 shadow-2xl relative z-10 border border-slate-100 max-h-[88vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Request Return
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tell us why you'd like to return this order.
                  </p>
                </div>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="overflow-y-auto py-3 space-y-3.5 pr-0.5 scrollbar-none flex-1">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    Return Reason
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-brand-500 outline-none"
                  >
                    <option value="">Select a reason</option>
                    <option value="Wrong Size">Wrong Size</option>
                    <option value="Damaged Product">Damaged Product</option>
                    <option value="Wrong Product">Wrong Product</option>
                    <option value="Quality Issue">Quality Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                    Additional Comments
                  </label>
                  <textarea
                    rows={2}
                    value={returnComment}
                    onChange={(e) => setReturnComment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-brand-500 outline-none resize-none"
                    placeholder="Describe the issue..."
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-slate-500">
                    <span>Proof Images</span>
                    {["Damaged Product", "Wrong Product"].includes(
                      returnReason,
                    ) && (
                      <span className="text-red-500 font-bold">
                        * (Required)
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col items-center justify-center gap-1 border border-dashed border-slate-200 hover:bg-slate-50 rounded-xl p-3 text-center cursor-pointer">
                    <FiUpload size={16} className="text-brand-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {returnImages.length > 0
                        ? `${returnImages.length} file(s) selected`
                        : "Upload proof images"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setReturnImages(Array.from(e.target.files))
                      }
                    />
                  </label>
                </div>

                {isCOD ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                    <h3 className="text-[10px] font-bold uppercase text-amber-900">
                      Refund Method (COD Order)
                    </h3>

                    <div className="space-y-1">
                      {[
                        { id: "upi", label: "UPI ID" },
                        { id: "bank_transfer", label: "Bank Transfer" },
                      ].map((method) => {
                        const isSelected = refundMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs font-bold cursor-pointer ${
                              isSelected
                                ? "border-amber-400 bg-white text-amber-950"
                                : "border-amber-200/60 bg-white/60 text-amber-900"
                            }`}
                          >
                            <span>{method.label}</span>
                            <input
                              type="radio"
                              name="refundMethod"
                              value={method.id}
                              checked={isSelected}
                              onChange={(e) => setRefundMethod(e.target.value)}
                              className="accent-amber-600 h-3.5 w-3.5 shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>

                    {refundMethod === "upi" && (
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter your UPI ID (e.g. name@upi)"
                        className="w-full rounded-lg border border-amber-200 bg-white p-2 text-xs text-slate-900 outline-none"
                      />
                    )}

                    {refundMethod === "bank_transfer" && (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          value={bankDetails.accountHolder}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              accountHolder: e.target.value,
                            })
                          }
                          placeholder="Account Holder Name"
                          className="w-full rounded-lg border border-amber-200 bg-white p-2 text-xs text-slate-900 outline-none"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={bankDetails.accountNumber}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                accountNumber: e.target.value,
                              })
                            }
                            placeholder="Account Number"
                            className="w-full rounded-lg border border-amber-200 bg-white p-2 text-xs text-slate-900 outline-none"
                          />
                          <input
                            type="text"
                            value={bankDetails.ifscCode}
                            onChange={(e) =>
                              setBankDetails({
                                ...bankDetails,
                                ifscCode: e.target.value,
                              })
                            }
                            placeholder="IFSC Code"
                            className="w-full rounded-lg border border-amber-200 bg-white p-2 text-xs text-slate-900 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex items-start gap-2">
                    <FiCheckCircle
                      size={16}
                      className="text-emerald-600 shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      Your refund will be processed directly to the original
                      payment method after return inspection.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2.5 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleReturnSubmit}
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 bg-brand-900 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isSubmittingReturn ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default OrdersPage;
