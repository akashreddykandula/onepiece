import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiEye,
  FiCheck,
  FiDownload,
  FiMaximize2,
  FiX,
  FiFileText,
  FiUploadCloud,
  FiPaperclip,
  FiTrash2,
  FiLayers,
  FiMessageSquare,
} from "react-icons/fi";
import { customPrintAPI } from "@services/api";
import { socket } from "@services/socket";
import { formatDate } from "@utils/helpers";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

const STATUS_OPTS = [
  "Pending",
  "Reviewing",
  "Waiting Approval",
  "Approved",
  "Printing",
  "Packed",
  "Shipped",
  "Delivered",
  "Rejected",
];

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  Reviewing: "bg-blue-100 text-blue-700",
  "Waiting Approval": "bg-orange-100 text-orange-700",
  Approved: "bg-green-100 text-green-700",
  Printing: "bg-indigo-100 text-indigo-700",
  Packed: "bg-sky-100 text-sky-700",
  Shipped: "bg-cyan-100 text-cyan-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

// Order of statuses to determine if price modification should be locked (including Waiting Approval)
const LOCKED_PRICE_STATUSES = [
  "Approved",
  "Printing",
  "Packed",
  "Shipped",
  "Delivered",
];

// Helper to check if file URL or type is an image
const isImageFile = (file) => {
  if (!file) return false;
  const type = file.type || "";
  const url = file.url || "";
  return (
    type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)
  );
};

export default function AdminPrintJobs() {
  const qc = useQueryClient();

  useEffect(() => {
    socket.on("connect", () => {});

    socket.on("customPrintUpdated", (data) => {
      qc.invalidateQueries({
        queryKey: ["custom-print-orders"],
      });
    });

    return () => {
      socket.off("connect");
      socket.off("customPrintUpdated");
    };
  }, [qc]);

  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-print-orders"],
    queryFn: () => customPrintAPI.getAll().then((res) => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customPrintAPI.updateStatus(id, data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["custom-print-orders"] });
      setSelected(data.data);
      setAdminNotes(""); // Clear notes field after successful status update
      toast.success("Job updated successfully");
    },
    onError: () => {
      toast.error("Update failed");
    },
  });

  const uploadPreviewMutation = useMutation({
    mutationFn: ({ id, formData }) =>
      customPrintAPI.uploadPreview(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-print-orders"] });
      toast.success("Preview uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload preview");
    },
  });

  const removePreviewMutation = useMutation({
    mutationFn: (id) =>
      customPrintAPI.removePreview
        ? customPrintAPI.removePreview(id)
        : customPrintAPI.updateStatus(id, { previewImage: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-print-orders"] });
      toast.success("Preview removed");
    },
    onError: () => {
      toast.error("Failed to remove preview");
    },
  });

  // Handle automatic file upload when selected
  const handlePreviewFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !selected) return;

    const formData = new FormData();
    formData.append("preview", file);

    uploadPreviewMutation.mutate({
      id: selected._id,
      formData,
    });

    // Reset file input value
    e.target.value = null;
  };

  const allJobs = data || [];
  useEffect(() => {
    if (!selected || !allJobs.length) return;

    const latest = allJobs.find((j) => j._id === selected._id);

    if (latest) {
      setSelected(latest);
      setNewStatus(latest.status);
      setQuotedPrice(latest.quotedPrice || "");
      setAdminNotes(latest.adminNotes || latest.designerNotes || "");
    }
  }, [allJobs]);

  // Apply tab status filter dynamically
  const filteredJobs = statusFilter
    ? allJobs.filter((job) => job.status === statusFilter)
    : allJobs;

  const isPriceLocked =
    selected && LOCKED_PRICE_STATUSES.includes(selected.status);

  return (
    <>
      <Helmet>
        <title>Print Jobs | Admin</title>
      </Helmet>

      {/* Lightbox / High-Res Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all shadow-lg"
            >
              <FiX size={22} />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name || "Design Preview"}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl bg-white/95"
            />
            <div className="mt-4 flex items-center gap-4 bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-xs shadow-xl border border-white/10">
              <span className="truncate max-w-xs font-medium">
                {previewImage.name || "Design File"}
              </span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:underline text-brand-300 font-semibold transition-colors"
              >
                <FiDownload size={14} /> Open Original
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight text-brand-900">
              Custom Print Orders
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredJobs.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {allJobs.length}
              </span>{" "}
              total print jobs
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {[
            { v: "", l: "All Jobs" },
            ...STATUS_OPTS.map((s) => ({
              v: s,
              l: s.charAt(0).toUpperCase() + s.slice(1),
            })),
          ].map((tab) => (
            <button
              key={tab.v}
              onClick={() => setStatusFilter(tab.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
                statusFilter === tab.v
                  ? "bg-brand-800 text-white shadow-md shadow-brand-900/10 scale-[1.02]"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-900 shadow-sm"
              }`}
            >
              {tab.l}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Job List Column */}
          <div className="card p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm">
            {isLoading ? (
              <PageLoader />
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const isSelected = selected?._id === job._id;
                  return (
                    <div
                      key={job._id}
                      onClick={() => {
                        setSelected(job);
                        setNewStatus(job.status);
                        setAdminNotes(
                          job.adminNotes || job.designerNotes || "",
                        );
                        setQuotedPrice(job.quotedPrice || "");
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-500/10"
                          : "border-gray-100 hover:border-brand-300 hover:bg-gray-50/50 bg-white shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {job.customerName ||
                              job.customer?.name ||
                              "Guest Customer"}
                          </p>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p className="truncate">
                              {job.customerEmail || job.customer?.email}
                            </p>
                            {job.customerPhone && <p>{job.customerPhone}</p>}
                          </div>
                          <p className="text-xs text-gray-700 pt-1 font-medium flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            Product:{" "}
                            <span className="text-gray-900">
                              {job.product?.name || "Custom Item"}
                            </span>{" "}
                            · Qty:{" "}
                            <span className="text-gray-900">
                              {job.quantity}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium pt-0.5">
                            {formatDate(job.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize shrink-0 tracking-wide shadow-2xs ${
                            STATUS_COLORS[job.status] ||
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      {/* Mini Preview Thumbnails in Card */}
                      {job.uploadedDesigns?.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100/80">
                          {job.uploadedDesigns.slice(0, 4).map((f, i) => (
                            <div key={i} className="relative group shrink-0">
                              {isImageFile(f) ? (
                                <img
                                  src={f.url}
                                  alt={f.name || "Upload"}
                                  className="w-10 h-10 object-cover rounded-xl border border-gray-200 bg-gray-50 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold shadow-2xs">
                                  PDF
                                </div>
                              )}
                            </div>
                          ))}
                          {job.uploadedDesigns.length > 4 && (
                            <span className="text-xs text-gray-500 font-medium ml-1 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                              +{job.uploadedDesigns.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!filteredJobs.length && (
                  <div className="text-center py-16 text-gray-400 text-sm bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <FiLayers
                      size={32}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    No print jobs found matching this filter.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Details & Action Panel */}
          {selected ? (
            <div className="card p-6 space-y-6 self-start sticky top-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm transition-all">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                    Custom Order Details
                  </h2>
                  <p className="text-xs text-gray-400">
                    Manage status, notes & assets
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border capitalize tracking-wide shadow-2xs ${
                    STATUS_COLORS[selected.status] ||
                    "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              {/* Order Metadata */}
              <div className="bg-gray-50/80 rounded-2xl p-4 space-y-2.5 text-sm border border-gray-200/60 shadow-2xs">
                {[
                  [
                    "Customer",
                    selected.customerName || selected.customer?.name || "Guest",
                  ],
                  [
                    "Email",
                    selected.customerEmail || selected.customer?.email || "—",
                  ],
                  ["Phone", selected.customerPhone || "—"],
                  ["Quantity", selected.quantity],
                  ["Size", selected.selectedSize || "—"],
                  [
                    "Colour",
                    selected.selectedColor?.name ||
                      selected.selectedColor ||
                      "—",
                  ],
                  ["Print Area", selected.selectedPrintArea || "—"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-0.5 text-xs sm:text-sm"
                  >
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="font-semibold text-gray-900 text-right">
                      {v}
                    </span>
                  </div>
                ))}

                {selected.printText && (
                  <div className="pt-3 mt-1 border-t border-gray-200/60">
                    <p className="text-gray-500 text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <FiFileText size={12} /> Text to Print
                    </p>
                    <p className="font-medium text-sm text-gray-800 bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
                      "{selected.printText}"
                    </p>
                  </div>
                )}

                {selected.customerNotes && (
                  <div className="pt-2">
                    <p className="text-gray-500 text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <FiMessageSquare size={12} /> Customer Notes
                    </p>
                    <p className="text-xs text-gray-700 italic bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
                      {selected.customerNotes}
                    </p>
                  </div>
                )}
                {selected.customerFeedback && (
                  <div className="pt-2">
                    <p className="text-gray-500 text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <FiMessageSquare size={12} />
                      Customer Response
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-sm text-amber-900">
                        {selected.customerFeedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Uploaded Design Files Visual Grid */}
              {selected.uploadedDesigns?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <FiPaperclip size={15} /> Uploaded Assets
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-md">
                      {selected.uploadedDesigns.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.uploadedDesigns.map((f, i) => {
                      const image = isImageFile(f);
                      return (
                        <div
                          key={i}
                          className="group relative bg-gray-50/80 border border-gray-200/80 rounded-xl overflow-hidden p-2.5 flex flex-col justify-between hover:border-brand-400 hover:bg-white hover:shadow-xs transition-all"
                        >
                          {image ? (
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-200/70 mb-2 border border-gray-100">
                              <img
                                src={f.url}
                                alt={f.name || `Design ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(f)}
                                  className="p-2 bg-white/95 rounded-lg text-gray-800 hover:bg-white transition-all shadow-md transform hover:scale-105"
                                  title="Quick Preview"
                                >
                                  <FiMaximize2 size={13} />
                                </button>
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-white/95 rounded-lg text-gray-800 hover:bg-white transition-all shadow-md transform hover:scale-105"
                                  title="Download Original"
                                >
                                  <FiDownload size={13} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video w-full rounded-lg bg-gray-100/80 border border-gray-200 flex flex-col items-center justify-center text-gray-500 mb-2">
                              <FiFileText
                                size={22}
                                className="mb-1 text-gray-400"
                              />
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                {f.type ? f.type.split("/")[1] : "FILE"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1.5 text-xs">
                            <span
                              className="truncate font-medium text-gray-700 text-[11px]"
                              title={f.name}
                            >
                              {f.name || `File ${i + 1}`}
                            </span>
                            <a
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-600 hover:text-brand-800 p-1 hover:bg-brand-50 rounded transition-colors shrink-0"
                            >
                              <FiDownload size={13} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Designer Preview Output */}
              {selected.previewImage?.url && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <FiEye size={15} /> Designer Preview
                    </p>
                    <button
                      type="button"
                      onClick={() => removePreviewMutation.mutate(selected._id)}
                      disabled={removePreviewMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-medium transition-colors"
                    >
                      <FiTrash2 size={12} /> Remove Preview
                    </button>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-gray-200/80 bg-gray-50 shadow-2xs relative">
                    <img
                      src={selected.previewImage.url}
                      alt="Designer Preview"
                      className="w-full object-contain max-h-64 bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Instant Auto-Upload Preview File Input */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-gray-800">
                  {selected.previewImage?.url
                    ? "Change Designer Preview"
                    : "Upload Designer Preview"}
                </label>

                <div className="relative flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadPreviewMutation.isPending}
                    onChange={handlePreviewFileChange}
                    className="w-full text-xs text-gray-500 border border-gray-200 rounded-xl p-2.5 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-all bg-gray-50/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {uploadPreviewMutation.isPending && (
                  <p className="text-xs text-brand-600 font-semibold flex items-center gap-1.5 animate-pulse">
                    <FiUploadCloud size={14} /> Uploading preview image...
                  </p>
                )}
              </div>

              {/* Status Update Form */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1.5 block">
                    Update Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input text-sm w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium transition-all"
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1.5 block">
                    Final Price (₹){" "}
                    {isPriceLocked && (
                      <span className="text-[10px] text-amber-600 font-normal ml-1">
                        (Locked - order in/past Waiting Approval)
                      </span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      disabled={isPriceLocked}
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      className={`input text-sm w-full border rounded-xl px-3 py-2.5 font-medium transition-all ${
                        isPriceLocked
                          ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed opacity-80"
                          : "bg-white border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      }`}
                      placeholder="Enter final price"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-gray-700 mb-1.5 block">
                    Admin / Designer Notes (Sent to customer)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input resize-none h-24 text-sm w-full bg-white border border-gray-200 rounded-xl p-3 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                    placeholder="e.g. Design vector approved. Printing in progress..."
                  />
                </div>

                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selected._id,
                      data: {
                        status: newStatus,
                        quotedPrice: Number(quotedPrice),
                        designerNotes: adminNotes,
                        adminNotes,
                      },
                    })
                  }
                  disabled={
                    updateMutation.isPending || uploadPreviewMutation.isPending
                  }
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 py-3 text-sm font-semibold shadow-md transition-all"
                >
                  <FiCheck size={18} />
                  {updateMutation.isPending
                    ? "Saving Updates..."
                    : uploadPreviewMutation.isPending
                      ? "Uploading Image..."
                      : "Save Job Updates"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl min-h-[360px] text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400 shadow-2xs">
                <FiEye size={28} />
              </div>
              <p className="text-base font-semibold text-gray-700">
                Select a print job to review details
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Click on any job card from the left panel to inspect uploaded
                files, manage quotes, and update status.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
