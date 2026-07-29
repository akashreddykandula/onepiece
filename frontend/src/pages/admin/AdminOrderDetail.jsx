import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiArrowLeft, FiTruck, FiCheck, FiPackage, FiX } from "react-icons/fi";
import { orderAPI } from "@services/api";
import {
  formatPrice,
  formatDate,
  formatDateTime,
  getOrderStatusConfig,
} from "@utils/helpers";
import { ORDER_TIMELINE_STEPS, ORDER_STATUSES } from "@constants";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => orderAPI.getOne(id).then((r) => r.data.order),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => orderAPI.updateStatus(id, payload),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries(["admin-order", id]);
      qc.invalidateQueries(["admin-orders"]);
      setShowStatusForm(false);
      setStatusNote("");
      setTrackingNumber("");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });

  const handleStatusUpdate = () => {
    if (!selectedStatus) return;
    updateMutation.mutate({
      status: selectedStatus,
      message: statusNote,
      trackingNumber: trackingNumber || undefined,
      courier: courier || undefined,
    });
  };

  if (isLoading) return <PageLoader />;
  if (!order)
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Order not found</p>
        <Link to="/admin/orders" className="btn-primary mt-4 inline-flex">
          Back to Orders
        </Link>
      </div>
    );

  const cfg = getOrderStatusConfig(order.orderStatus);
  const nextStatuses = STATUS_TRANSITIONS[order.orderStatus] || [];
  const isCancelled = ["cancelled", "returned"].includes(order.orderStatus);

  return (
    <>
      <Helmet>
        <title>Order #{order.orderNumber} | Admin</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/admin/orders" className="btn-icon">
            <FiArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-brand-900">
                #{order.orderNumber}
              </h1>
              <span className={cfg.color}>{cfg.label}</span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          {nextStatuses.length > 0 && (
            <button
              onClick={() => {
                setShowStatusForm(!showStatusForm);
                setSelectedStatus(nextStatuses[0]);
              }}
              className="btn-primary"
            >
              <FiTruck size={15} /> Update Status
            </button>
          )}
        </div>

        {/* Status update form */}
        {showStatusForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 border-2 border-brand-200"
          >
            <h3 className="font-semibold text-brand-900 mb-4">
              Update Order Status
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input text-sm"
                >
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              {(selectedStatus === "shipped" ||
                selectedStatus === "out_for_delivery") && (
                <>
                  <div>
                    <label className="label">Tracking Number</label>
                    <input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="input text-sm"
                      placeholder="e.g. 1Z999AA10123456784"
                    />
                  </div>
                  <div>
                    <label className="label">Courier</label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">Select courier</option>
                      {[
                        "Delhivery",
                        "DTDC",
                        "Blue Dart",
                        "Ekart",
                        "India Post",
                        "Xpressbees",
                        "Shadowfax",
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="label">Note for Customer (optional)</label>
                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="input text-sm"
                  placeholder="e.g. Your order has been picked up by Delhivery"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStatusUpdate}
                disabled={updateMutation.isPending}
                className="btn-primary disabled:opacity-60"
              >
                {updateMutation.isPending ? (
                  "Updating…"
                ) : (
                  <>
                    <FiCheck size={15} /> Confirm Update
                  </>
                )}
              </button>
              <button
                onClick={() => setShowStatusForm(false)}
                className="btn-ghost"
              >
                <FiX size={15} /> Cancel
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: items + timeline */}
          <div className="lg:col-span-2 space-y-5">
            {/* Items */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Order Items ({order.items?.length})
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 pb-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-14 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">
                        {item.name}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {item.size && (
                          <span className="badge-gray text-[10px]">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-[10px] text-gray-400">
                            {item.color}
                          </span>
                        )}
                        {item.isCustomPrint && (
                          <span className="badge bg-purple-100 text-purple-700 text-[10px]">
                            Custom Print
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        SKU: {item.sku} · Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-brand-800 text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Pricing */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.pricing?.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span
                    className={
                      order.pricing?.shippingCost === 0 ? "text-green-600" : ""
                    }
                  >
                    {order.pricing?.shippingCost === 0
                      ? "FREE"
                      : formatPrice(order.pricing?.shippingCost)}
                  </span>
                </div>
                {order.pricing?.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon ({order.coupon?.code})</span>
                    <span>−{formatPrice(order.pricing?.couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST ({order.pricing?.gstPercentage}%)</span>
                  <span>{formatPrice(order.pricing?.gst)}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-900 border-t border-gray-200 pt-2 text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.pricing?.total)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Order Timeline
              </h2>
              {order.timeline?.length > 0 ? (
                <div className="space-y-3">
                  {[...order.timeline].reverse().map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand-600">
                          {i === 0 ? "●" : "○"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 capitalize">
                          {ev.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500">{ev.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDateTime(ev.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No timeline events yet</p>
              )}
            </div>
          </div>

          {/* Right: customer, payment, shipping */}
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                Customer
              </h3>
              <p className="font-medium text-gray-900">
                {order.user?.name || order.guestInfo?.name || "Guest"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.user?.email || order.guestInfo?.email}
              </p>
              <p className="text-xs text-gray-500">
                {order.shippingAddress?.phone}
              </p>
              {order.user && (
                <Link
                  to={`/admin/customers`}
                  className="text-xs text-brand-600 mt-2 inline-block hover:text-brand-800"
                >
                  View Customer →
                </Link>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                Payment
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium capitalize">
                    {order.paymentInfo?.method?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-bold ${order.paymentInfo?.status === "paid" ? "text-green-600" : order.paymentInfo?.status === "failed" ? "text-red-600" : "text-amber-600"}`}
                  >
                    {(order.paymentInfo?.status || "pending").toUpperCase()}
                  </span>
                </div>
                {order.paymentInfo?.razorpayPaymentId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment ID</span>
                    <span className="font-mono text-[10px] text-gray-700">
                      {order.paymentInfo.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                Ship To
              </h3>
              <p className="font-medium text-sm text-gray-900">
                {order.shippingAddress?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {order.shippingAddress?.line1}
                {order.shippingAddress?.line2 &&
                  `, ${order.shippingAddress.line2}`}
                <br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} –{" "}
                {order.shippingAddress?.pincode}
              </p>
            </div>

            {order.tracking?.trackingNumber && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                  Tracking
                </h3>
                <p className="font-mono font-bold text-brand-800">
                  {order.tracking.trackingNumber}
                </p>
                {order.tracking.courier && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    via {order.tracking.courier}
                  </p>
                )}
                {order.tracking.trackingUrl && (
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-600 underline mt-1 inline-block"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
