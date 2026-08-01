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
  const [previewFile, setPreviewFile] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["custom-print-orders"],
    queryFn: () => customPrintAPI.getAll().then((res) => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customPrintAPI.updateStatus(id, data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["custom-print-orders"] });

      setSelected(data.data); // <-- important

      toast.success("Preview uploaded");
      setPreviewFile(null);
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
      toast.success("Preview uploaded");
      setPreviewFile(null);
    },

    onError: () => {
      toast.error("Failed to upload preview");
    },
  });

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

  return (
    <>
      <Helmet>
        <title>Print Jobs | Admin</title>
      </Helmet>

      {/* Lightbox / High-Res Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 rounded-full bg-white/10 transition-colors"
            >
              <FiX size={24} />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name || "Design Preview"}
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-2xl bg-white"
            />
            <div className="mt-3 flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full text-white text-xs">
              <span className="truncate max-w-xs">
                {previewImage.name || "Design File"}
              </span>
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:underline text-brand-300"
              >
                <FiDownload size={14} /> Open Original
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-brand-900">
            Custom Print Jobs
          </h1>
          <p className="text-sm text-gray-400">
            Showing {filteredJobs.length} of {allJobs.length} total jobs
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                statusFilter === tab.v
                  ? "bg-brand-800 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-400"
              }`}
            >
              {tab.l}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Job List Column */}
          <div className="card p-5">
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
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-brand-500 bg-brand-50/50 shadow-sm"
                          : "border-gray-100 hover:border-brand-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {job.customerName ||
                              job.customer?.name ||
                              "Guest Customer"}
                          </p>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <p>{job.customerEmail || job.customer?.email}</p>
                            {job.customerPhone && <p>{job.customerPhone}</p>}
                          </div>
                          <p className="text-xs text-gray-600 mt-2 font-medium">
                            Product: {job.product?.name || "Custom Item"} · Qty:{" "}
                            {job.quantity}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDate(job.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize shrink-0 ${
                            STATUS_COLORS[job.status] ||
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      {/* Mini Preview Thumbnails in Card */}
                      {job.uploadedDesigns?.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          {job.uploadedDesigns.slice(0, 4).map((f, i) => (
                            <div key={i} className="relative group shrink-0">
                              {isImageFile(f) ? (
                                <img
                                  src={f.url}
                                  alt={f.name || "Upload"}
                                  className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-gray-50"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold">
                                  PDF
                                </div>
                              )}
                            </div>
                          ))}
                          {job.uploadedDesigns.length > 4 && (
                            <span className="text-xs text-gray-400 font-medium ml-1">
                              +{job.uploadedDesigns.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!filteredJobs.length && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No print jobs found for this filter.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Details & Action Panel */}
          {selected ? (
            <div className="card p-6 space-y-6 self-start sticky top-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 text-lg">
                  Job Details
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${
                    STATUS_COLORS[selected.status] ||
                    "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              {/* Order Metadata */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-100">
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
                    className="flex justify-between items-center py-0.5"
                  >
                    <span className="text-gray-500 text-xs">{k}</span>
                    <span className="font-medium text-gray-900 text-right">
                      {v}
                    </span>
                  </div>
                ))}

                {selected.printText && (
                  <div className="pt-2.5 mt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-xs mb-1">Text to Print</p>
                    <p className="font-medium text-sm text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                      "{selected.printText}"
                    </p>
                  </div>
                )}

                {selected.customerNotes && (
                  <div className="pt-2">
                    <p className="text-gray-500 text-xs mb-1">Customer Notes</p>
                    <p className="text-xs text-gray-700 italic bg-white p-2.5 rounded-xl border border-gray-200">
                      {selected.customerNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Design Files Visual Grid */}
              {selected.uploadedDesigns?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Uploaded Assets ({selected.uploadedDesigns.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.uploadedDesigns.map((f, i) => {
                      const image = isImageFile(f);
                      return (
                        <div
                          key={i}
                          className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden p-2 flex flex-col justify-between hover:border-brand-400 transition-colors"
                        >
                          {image ? (
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-200 mb-2">
                              <img
                                src={f.url}
                                alt={f.name || `Design ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(f)}
                                  className="p-1.5 bg-white/90 rounded-lg text-gray-800 hover:bg-white transition-colors"
                                  title="Quick Preview"
                                >
                                  <FiMaximize2 size={14} />
                                </button>
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-white/90 rounded-lg text-gray-800 hover:bg-white transition-colors"
                                  title="Download Original"
                                >
                                  <FiDownload size={14} />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video w-full rounded-lg bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-500 mb-2">
                              <FiFileText size={24} className="mb-1" />
                              <span className="text-[10px] font-bold uppercase">
                                {f.type ? f.type.split("/")[1] : "FILE"}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-1 text-xs">
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
                              className="text-brand-600 hover:text-brand-800 shrink-0"
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
              {selected.previewImage?.url && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Designer Preview
                  </p>

                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    <img
                      src={selected.previewImage.url}
                      alt="Designer Preview"
                      className="w-full object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Upload Designer Preview
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPreviewFile(e.target.files[0])}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2"
                />
              </div>

              <button
                type="button"
                disabled={!previewFile || uploadPreviewMutation.isPending}
                onClick={() => {
                  const formData = new FormData();
                  formData.append("preview", previewFile);

                  uploadPreviewMutation.mutate({
                    id: selected._id,
                    formData,
                  });
                }}
                className="btn-primary w-full justify-center disabled:opacity-60"
              >
                {uploadPreviewMutation.isPending
                  ? "Uploading Preview..."
                  : "Upload Preview"}
              </button>
              {/* Status Update Form */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="label text-xs font-semibold text-gray-700 mb-1 block">
                    Update Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input text-sm w-full bg-white border border-gray-200 rounded-xl px-3 py-2"
                  >
                    {STATUS_OPTS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-semibold text-gray-700 mb-1 block">
                    Final Price (₹)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(e.target.value)}
                    className="input text-sm w-full bg-white border border-gray-200 rounded-xl px-3 py-2"
                    placeholder="Enter final price"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-gray-700 mb-1 block">
                    Admin / Designer Notes (Sent to customer)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input resize-none h-20 text-sm w-full bg-white border border-gray-200 rounded-xl p-3"
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
                  disabled={updateMutation.isPending}
                  className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2 py-2.5"
                >
                  <FiCheck size={16} />
                  {updateMutation.isPending
                    ? "Updating Job..."
                    : "Save Job Updates"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl min-h-[300px]">
              <FiEye size={36} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">
                Select a print job to review details
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click on any job card from the left panel
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
