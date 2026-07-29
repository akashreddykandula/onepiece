import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentAPI, customPrintAPI } from "@services/api";

import toast from "react-hot-toast";
import {
  FiCheck,
  FiX,
  FiInfo,
  FiCreditCard,
  FiMessageSquare,
  FiPackage,
} from "react-icons/fi";
import { formatDate } from "@utils/helpers";

const STATUS_COLORS = {
  Pending: "bg-yellow-50 text-yellow-700 border-yellow-200/80",
  Reviewing: "bg-blue-50 text-blue-700 border-blue-200/80",
  "Proof Uploaded": "bg-purple-50 text-purple-700 border-purple-200/80",
  "Waiting Approval": "bg-orange-50 text-orange-700 border-orange-200/80",
  Approved: "bg-green-50 text-green-700 border-green-200/80",
  Printing: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  Packed: "bg-sky-50 text-sky-700 border-sky-200/80",
  Shipped: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  Rejected: "bg-red-50 text-red-700 border-red-200/80",
  "Payment Pending": "bg-amber-50 text-amber-700 border-amber-200/80",
};

export default function MyCustomPrintOrders({ orders = [] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedbackMap, setFeedbackMap] = useState({});

  const handleFeedbackChange = (orderId, value) => {
    setFeedbackMap((prev) => ({ ...prev, [orderId]: value }));
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, decision, feedback }) =>
      customPrintAPI.approve(id, decision, feedback),

    onSuccess: () => {
      toast.success("Response submitted.");
      queryClient.invalidateQueries({
        queryKey: ["my-custom-print-orders"],
      });
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong.");
    },
  });

  const handlePayment = async (order) => {
    console.log("Pay button clicked");

    console.log(order);
    try {
      console.log("Calling createCustomPrintPayment...");
      const { data } = await paymentAPI.createCustomPrintPayment({
        customPrintOrderId: order._id,
      });
      console.log("Payment API response:", data);
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,

        name: "ONE PIECE",
        description: "Custom Print Order",

        handler: async (response) => {
          try {
            const verify = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,

              customPrintOrderId: order._id,
            });

            console.log("Verify Response:", verify);
            console.log("Verify Data:", verify.data);
            console.log("Order ID:", verify.data.orderId);

            toast.success("Payment successful!");
            navigate(`/orders/${verify.data.orderId}`);
          } catch (err) {
            console.log("Payment Error:", err);
            console.log("Response:", err.response);
            console.log("Response Data:", err.response?.data);

            toast.error(
              err.response?.data?.message || "Unable to initiate payment.",
            );
          }
        },

        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone,
        },

        theme: {
          color: "#0A5ACB",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.log("Payment creation failed");

      console.log(err);

      console.log(err.response);

      console.log(err.response?.data);

      toast.error(err.response?.data?.message || "Unable to initiate payment.");
    }
  };

  return (
    <>
      <Helmet>
        <title>My Orders | ONE PIECE</title>
      </Helmet>

      <div className="py-2">
        <div className="space-y-4 sm:space-y-6">
          {!orders.length ? (
            /* Empty State */
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center border border-gray-200 max-w-sm mx-auto my-8 shadow-sm">
              <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiPackage className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                No Custom Print Orders
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Your custom requests and proofs will appear here.
              </p>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order) => {
                const currentFeedback = feedbackMap[order._id] || "";

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-3.5 sm:p-4 bg-gray-50/60 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start justify-between sm:block gap-2">
                        <div>
                          <h2 className="font-semibold text-sm sm:text-base text-gray-900 leading-snug">
                            {order.product?.name || "Custom Print Request"}
                          </h2>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Submitted {formatDate(order.createdAt)}
                          </p>
                        </div>
                        {/* Mobile Status Badge */}
                        <div className="sm:hidden shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold border inline-block ${
                              STATUS_COLORS[order.status] ||
                              "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Desktop Status Badge */}
                      <div className="hidden sm:block">
                        <span
                          className={`px-3 py-1 rounded-md text-xs font-medium border inline-block ${
                            STATUS_COLORS[order.status] ||
                            "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
                      {/* Specs Grid - 2 Cols on Mobile, 4 on Desktop */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-gray-50/80 rounded-lg p-2 sm:p-2.5 border border-gray-100">
                          <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-gray-400 block">
                            Color
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate block">
                            {order.selectedColor?.name || "—"}
                          </span>
                        </div>

                        <div className="bg-gray-50/80 rounded-lg p-2 sm:p-2.5 border border-gray-100">
                          <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-gray-400 block">
                            Size
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate block">
                            {order.selectedSize || "—"}
                          </span>
                        </div>

                        <div className="bg-gray-50/80 rounded-lg p-2 sm:p-2.5 border border-gray-100">
                          <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-gray-400 block">
                            Print Area
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate block">
                            {order.selectedPrintArea || "—"}
                          </span>
                        </div>

                        <div className="bg-gray-50/80 rounded-lg p-2 sm:p-2.5 border border-gray-100">
                          <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-gray-400 block">
                            Quantity
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate block">
                            {order.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quoted Price Banner */}
                      {order.quotedPrice > 0 && (
                        <div className="bg-emerald-50/60 rounded-lg px-3 py-2 sm:px-3.5 sm:py-2.5 border border-emerald-100 flex items-center justify-between">
                          <span className="text-xs font-medium text-emerald-800">
                            Quoted Price
                          </span>
                          <span className="font-bold text-sm sm:text-base text-emerald-700">
                            ₹{order.quotedPrice}
                          </span>
                        </div>
                      )}

                      {/* Designer Notes */}
                      {order.designerNotes && (
                        <div className="bg-blue-50/60 rounded-lg p-2.5 sm:p-3 border border-blue-100 flex gap-2 items-start">
                          <FiInfo className="text-blue-600 w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-blue-900 block uppercase tracking-wider">
                              Designer Note
                            </span>
                            <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                              {order.designerNotes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Previews Grid */}
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                        {/* Designer Preview */}
                        {order.previewImage?.url && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-700 block">
                              Designer Preview
                            </span>
                            <div className="w-full h-44 sm:h-48 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center p-2">
                              <img
                                src={order.previewImage.url}
                                alt="Designer Preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-gray-400">
                              Please review carefully before approving.
                            </p>
                          </div>
                        )}

                        {/* Final Proof */}
                        {order.proofImage?.url && (
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-gray-700 block">
                              Final Proof
                            </span>
                            <div className="w-full h-44 sm:h-48 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center p-2">
                              <img
                                src={order.proofImage.url}
                                alt="Final Proof"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Approval Section */}
                      {order.status === "Waiting Approval" && (
                        <div className="border-t border-gray-100 pt-3.5 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                            <FiMessageSquare className="w-3.5 h-3.5" />
                            <span>Action Required</span>
                          </div>

                          <textarea
                            value={currentFeedback}
                            onChange={(e) =>
                              handleFeedbackChange(order._id, e.target.value)
                            }
                            placeholder="Need changes? Enter details here..."
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-brand-900 transition-colors bg-gray-50/50"
                          />

                          {/* Full width buttons on mobile */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
                              disabled={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate({
                                  id: order._id,
                                  decision: "Approved",
                                  feedback: "",
                                })
                              }
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              Approve Design
                            </button>

                            <button
                              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
                              disabled={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate({
                                  id: order._id,
                                  decision: "Modification Requested",
                                  feedback: currentFeedback,
                                })
                              }
                            >
                              Request Changes
                            </button>

                            <button
                              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                              disabled={approveMutation.isPending}
                              onClick={() =>
                                approveMutation.mutate({
                                  id: order._id,
                                  decision: "Rejected",
                                  feedback: currentFeedback,
                                })
                              }
                            >
                              <FiX className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Action */}
                      {order.status === "Payment Pending" && (
                        <div className="rounded-xl bg-green-50/70 p-3.5 sm:p-4 border border-green-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="text-xs font-bold text-green-800">
                              Design Approved 🎉
                            </h3>
                            <p className="text-[11px] sm:text-xs text-green-700 mt-0.5">
                              Please pay to send this order to production.
                            </p>
                          </div>

                          <button
                            className="btn-primary w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-semibold"
                            onClick={() => handlePayment(order)}
                          >
                            <FiCreditCard className="w-3.5 h-3.5" />
                            <span>Pay ₹{order.quotedPrice}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
