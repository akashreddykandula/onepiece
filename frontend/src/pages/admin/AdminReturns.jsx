import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiEye,
  FiCheck,
  FiX,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiAlertCircle,
  FiImage,
  FiDollarSign,
  FiPackage,
  FiCornerUpLeft,
} from "react-icons/fi";
import { returnAPI } from "@services/api";
import { formatPrice, formatDate, formatDateTime } from "@utils/helpers";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

const STATUS_OPTS = [
  "pending",
  "approved",
  "pickup_scheduled",
  "picked_up",
  "processing",
  "refund_initiated",
  "completed",
  "rejected",
];

const STATUS_FLOW = {
  pending: ["approved", "rejected"],
  approved: ["pickup_scheduled", "rejected"],
  pickup_scheduled: ["picked_up", "rejected"],
  picked_up: ["processing"],
  processing: ["refund_initiated", "rejected"],
  refund_initiated: ["completed"],
  completed: [],
  rejected: [],
};

const statusColor = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  pickup_scheduled: "bg-indigo-100 text-indigo-800 border-indigo-200",
  picked_up: "bg-purple-100 text-purple-800 border-purple-200",
  processing: "bg-cyan-100 text-cyan-800 border-cyan-200",
  refund_initiated: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminReturns() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [activePreviewImage, setActivePreviewImage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", statusFilter],
    queryFn: () =>
      returnAPI
        .getAll({ status: statusFilter || undefined })
        .then((r) => r.data),
    staleTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: (d) => returnAPI.updateStatus(selected._id, d),
    onSuccess: (res) => {
      qc.invalidateQueries(["admin-returns"]);
      toast.success("Return status updated successfully");
      setSelected(res.data?.return || null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });
  const loadReturnDetails = async (id) => {
    try {
      const res = await returnAPI.getById(id);

      const returnData = res.data.return;

      setSelected(returnData);
      setNewStatus(returnData.status);
      setAdminNotes(returnData.adminNotes || "");
      setRefundAmount(returnData.refundAmount || "");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load return details",
      );
    }
  };
  const handleUpdate = () => {
    if (!newStatus) return toast.error("Please select a status");
    updateMutation.mutate({
      status: newStatus,
      adminNotes,
      refundAmount: refundAmount ? Number(refundAmount) : undefined,
    });
  };

  const returns = data?.returns || [];

  // Extract uploaded proof images across return items
  const allImages = selected?.items?.flatMap((item) => item.images || []) || [];

  return (
    <>
      <Helmet>
        <title>Returns & Exchanges | Admin</title>
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-brand-950">
              Returns & Exchanges
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage return requests, inspect proof images, and process refunds.
            </p>
          </div>
          <span className="self-start sm:self-auto bg-brand-50 text-brand-900 font-semibold px-3 py-1 rounded-full text-xs border border-brand-200">
            {data?.total || 0} Total Requests
          </span>
        </div>

        {/* Filter Pills */}
        <div className="-mx-2 px-2 flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {[
            { v: "", l: "All" },
            ...STATUS_OPTS.map((s) => ({
              v: s,
              l: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            })),
          ].map((tab) => {
            const active = statusFilter === tab.v;
            return (
              <button
                key={tab.v}
                onClick={() => setStatusFilter(tab.v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? "bg-brand-900 text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.l}
              </button>
            );
          })}
        </div>

        {/* Main Grid: List + Detail */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* List Section (5 columns on large screens) */}
          <div className="lg:col-span-5 space-y-3">
            {isLoading ? (
              <PageLoader />
            ) : !returns.length ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <FiCornerUpLeft
                  className="mx-auto text-gray-300 mb-2"
                  size={32}
                />
                <p className="text-sm font-semibold text-gray-700">
                  No return requests found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try clearing filter constraints.
                </p>
              </div>
            ) : (
              returns.map((ret) => {
                const isSelected = selected?._id === ret._id;
                return (
                  <div
                    key={ret._id}
                    onClick={() => {
                      loadReturnDetails(ret._id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-2xs ${
                      isSelected
                        ? "border-brand-600 ring-2 ring-brand-500/20 bg-brand-50/20"
                        : "border-gray-200 hover:border-brand-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-gray-900">
                            #{ret.returnNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              statusColor[ret.status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ret.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1">
                          Order: #{ret.order?.orderNumber || "N/A"} ·{" "}
                          {ret.user?.name}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDate(ret.createdAt)}
                        </p>
                      </div>

                      <span className="text-[10px] font-semibold uppercase px-2 py-1 bg-gray-100 text-gray-700 rounded-lg">
                        {ret.returnType}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[200px]">
                        <strong className="font-semibold text-gray-700">
                          Reason:
                        </strong>{" "}
                        {ret.reason}
                      </span>
                      {ret.items?.some((i) => i.images?.length > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                          <FiImage size={12} /> Proof
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed View Section (7 columns on large screens) */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
                {/* Panel Header */}
                <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-bold text-xl text-gray-900">
                        #{selected.returnNumber}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          statusColor[selected.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {selected.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted on {formatDateTime(selected.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {/* 📋 1. Return Summary Block */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs sm:text-sm">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <FiPackage className="text-brand-600" /> Return Overview
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Return Type:</span>
                    <span className="font-semibold capitalize text-gray-900">
                      {selected.returnType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason:</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[240px]">
                      {selected.reason}
                    </span>
                  </div>
                  {selected.comment && (
                    <div className="flex justify-between border-t border-gray-200/60 pt-2 mt-1">
                      <span className="text-gray-500">Customer Note:</span>
                      <span className="text-gray-700 italic text-right max-w-[240px]">
                        "{selected.comment}"
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Associated Order:</span>
                    <span className="font-mono font-bold text-brand-950">
                      #{selected.order?.orderNumber || "N/A"}
                    </span>
                  </div>
                </div>

                {/* 👤 2. Customer Details */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 text-xs sm:text-sm">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <FiUser className="text-brand-600" /> Customer Info
                  </h3>
                  <p className="font-bold text-gray-900">
                    {selected.user?.name}
                  </p>
                  <p className="text-gray-500">{selected.user?.email}</p>
                  {selected.user?.phone && (
                    <p className="text-gray-500">📞 {selected.user.phone}</p>
                  )}
                </div>

                {/* 📍 3. Pickup Address */}
                {selected.pickupAddress && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 text-xs sm:text-sm">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                      <FiMapPin className="text-brand-600" />
                      Pickup Address
                    </h3>

                    <p className="font-bold text-gray-900">
                      {selected.pickupAddress.name}
                    </p>

                    <p className="text-gray-500 mt-1 leading-relaxed">
                      {selected.pickupAddress.line1}
                      {selected.pickupAddress.line2 &&
                        `, ${selected.pickupAddress.line2}`}
                      <br />
                      {selected.pickupAddress.city},{" "}
                      {selected.pickupAddress.state} -{" "}
                      {selected.pickupAddress.pincode}
                      <br />
                      {selected.pickupAddress.country}
                    </p>

                    <div className="mt-3 space-y-1">
                      <p className="text-gray-600">
                        📞 {selected.pickupAddress.phone}
                      </p>

                      <p className="text-gray-600">
                        ✉️ {selected.pickupAddress.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* 💳 4. Refund Payment Details */}
                <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-4 text-xs sm:text-sm space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <FiCreditCard className="text-amber-700" />
                    Refund Details
                  </h3>

                  <div className="flex justify-between">
                    <span>Refund Method</span>

                    <span className="font-semibold capitalize">
                      {selected.refundMethod
                        ? selected.refundMethod.replace(/_/g, " ")
                        : "Original Payment"}
                    </span>
                  </div>

                  {selected.upiId && (
                    <div className="flex justify-between">
                      <span>UPI ID</span>

                      <span className="font-mono">{selected.upiId}</span>
                    </div>
                  )}

                  {selected.bankDetails && (
                    <>
                      <div className="flex justify-between">
                        <span>Account Holder</span>

                        <span>{selected.bankDetails.accountHolder}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Account Number</span>

                        <span>{selected.bankDetails.accountNumber}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>IFSC</span>

                        <span>{selected.bankDetails.ifscCode}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Bank</span>

                        <span>{selected.bankDetails.bankName}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span>Refund Status</span>

                    <span className="font-semibold capitalize">
                      {selected.refundStatus}
                    </span>
                  </div>

                  {selected.refundAmount && (
                    <div className="flex justify-between">
                      <span>Refund Amount</span>

                      <span className="font-bold text-green-600">
                        {formatPrice(selected.refundAmount)}
                      </span>
                    </div>
                  )}
                </div>
                {/* 🖼️ 5. Proof Image Gallery */}
                {allImages.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                      <FiImage className="text-brand-600" /> Proof Images (
                      {allImages.length})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {allImages.map((image, index) => (
                        <div
                          key={index}
                          onClick={() =>
                            setActivePreviewImage(image.url || image)
                          }
                          className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer group bg-gray-50"
                        >
                          <img
                            src={image.url || image}
                            alt={`Proof ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <FiEye size={18} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 🕒 Return Timeline */}
                {selected.timeline?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                      <FiClock className="text-brand-600" />
                      Return Timeline
                    </h3>

                    <div className="space-y-4">
                      {selected.timeline.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-brand-600"></div>

                            {index !== selected.timeline.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 mt-1"></div>
                            )}
                          </div>

                          <div className="pb-3">
                            <p className="font-semibold text-sm text-gray-900">
                              {step.status
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {step.message}
                            </p>

                            <p className="text-[11px] text-gray-400 mt-1">
                              {formatDateTime(step.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 📈 6. Status Update Form */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Update Return Status
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Status Flow Transition
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        disabled={
                          selected.status === "completed" ||
                          selected.status === "rejected"
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {[
                          selected.status,
                          ...(STATUS_FLOW[selected.status] || []),
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    {["approved", "refund_initiated", "completed"].includes(
                      newStatus,
                    ) && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Refund Amount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                          placeholder="e.g. 1499"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Admin Comments / Customer Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none resize-none h-20"
                        placeholder="Internal notes or updates visible to the customer..."
                      />
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={
                        updateMutation.isPending ||
                        selected.status === "completed" ||
                        selected.status === "rejected"
                      }
                      className="w-full py-3 bg-brand-800 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-brand-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiCheck size={16} />
                      {updateMutation.isPending ? "Updating..." : "Save Status"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                <FiEye size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">
                  No Return Selected
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click any return request on the left panel to inspect details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🖼️ Image Preview Modal Lightbox */}
      {activePreviewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActivePreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2"
            >
              <FiX size={24} />
            </button>
            <img
              src={activePreviewImage}
              alt="Proof full preview"
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
