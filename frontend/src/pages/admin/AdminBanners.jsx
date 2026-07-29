import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiUpload,
} from "react-icons/fi";
import { bannerAPI, uploadAPI } from "@services/api";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

const BANNER_TYPES = [
  "hero",
  "category",
  "popup",
  "announcement",
  "collection",
  "festival",
];

export default function AdminBanners() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { type: "hero", overlayOpacity: 40, sortOrder: 0 },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => bannerAPI.getAllAdmin().then((r) => r.data.banners),
    staleTime: 30000,
  });

  const saveMutation = useMutation({
    mutationFn: (d) =>
      editItem ? bannerAPI.update(editItem._id, d) : bannerAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries(["admin-banners"]);
      toast.success(editItem ? "Banner updated!" : "Banner created!");
      closeForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Save failed"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => bannerAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-banners"]);
      toast.success("Banner deleted");
    },
  });

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    reset();
    setImageUrl("");
    setImagePublicId("");
  };

  const openEdit = (b) => {
    setEditItem(b);
    setImageUrl(b.image?.url || "");
    setImagePublicId(b.image?.publicId || "");
    setValue("title", b.title);
    setValue("subtitle", b.subtitle || "");
    setValue("description", b.description || "");
    setValue("ctaText", b.ctaText || "");
    setValue("ctaLink", b.ctaLink || "");
    setValue("type", b.type);
    setValue("position", b.position || "homepage");
    setValue("overlayOpacity", b.overlayOpacity || 40);
    setValue("sortOrder", b.sortOrder || 0);
    setValue("isActive", b.isActive);
    setValue("videoUrl", b.videoUrl || "");
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await uploadAPI.single(fd, "banners");
      setImageUrl(res.data.url);
      setImagePublicId(res.data.publicId);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (d) => {
    saveMutation.mutate({
      ...d,
      image: { url: imageUrl, publicId: imagePublicId },
      overlayOpacity: Number(d.overlayOpacity),
      sortOrder: Number(d.sortOrder),
    });
  };

  return (
    <>
      <Helmet>
        <title>Banners | Admin</title>
      </Helmet>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-brand-900">
              Banners
            </h1>
            <p className="text-sm text-gray-400">{data?.length || 0} banners</p>
          </div>
          <button
            onClick={() => {
              setEditItem(null);
              reset();
              setImageUrl("");
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <FiPlus size={15} /> Add Banner
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 border-2 border-brand-200"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-brand-900">
                {editItem ? "Edit" : "New"} Banner
              </h2>
              <button onClick={closeForm} className="btn-icon">
                <FiX size={16} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid md:grid-cols-2 gap-4"
            >
              <div>
                <label className="label">Title *</label>
                <input
                  {...register("title", { required: "Title required" })}
                  className={`input ${errors.title ? "input-error" : ""}`}
                  placeholder="Banner headline"
                />
                {errors.title && (
                  <p className="error-msg">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="label">Subtitle</label>
                <input
                  {...register("subtitle")}
                  className="input"
                  placeholder="Supporting text"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <input
                  {...register("description")}
                  className="input"
                  placeholder="Banner body text"
                />
              </div>
              <div>
                <label className="label">CTA Button Text</label>
                <input
                  {...register("ctaText")}
                  className="input"
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div>
                <label className="label">CTA Link</label>
                <input
                  {...register("ctaLink")}
                  className="input"
                  placeholder="e.g. /collections"
                />
              </div>
              <div>
                <label className="label">Banner Type</label>
                <select {...register("type")} className="input">
                  {BANNER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Position / Page</label>
                <input
                  {...register("position")}
                  className="input"
                  placeholder="homepage, category, etc."
                />
              </div>
              <div>
                <label className="label">Sort Order</label>
                <input
                  {...register("sortOrder")}
                  type="number"
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Overlay Opacity (0-100)</label>
                <input
                  {...register("overlayOpacity")}
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">
                  Video URL (optional — overrides image)
                </label>
                <input
                  {...register("videoUrl")}
                  className="input"
                  placeholder="https://…mp4"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Banner Image</label>
                <div className="flex items-start gap-4">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Banner preview"
                      className="w-32 h-20 object-cover rounded-xl border border-gray-200"
                    />
                  )}
                  <label
                    className={`flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? "border-brand-300 bg-brand-50" : "border-gray-300 hover:border-brand-400"}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiUpload size={16} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 mt-1">
                          Upload
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  {...register("isActive")}
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-brand-600"
                />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary disabled:opacity-60"
                >
                  <FiCheck size={14} />{" "}
                  {saveMutation.isPending
                    ? "Saving…"
                    : editItem
                      ? "Update Banner"
                      : "Create Banner"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.map((banner) => (
              <div
                key={banner._id}
                className="card overflow-hidden hover:shadow-card-hover transition-shadow group"
              >
                <div className="relative h-36 bg-brand-900">
                  {banner.image?.url ? (
                    <img
                      src={banner.image.url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <p className="text-white/70 text-xs">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span
                      className={`badge text-[10px] ${banner.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="badge bg-brand-800 text-white text-[10px]">
                      {banner.type}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    {banner.ctaText && (
                      <p className="text-xs text-brand-600 font-medium">
                        CTA: {banner.ctaText} → {banner.ctaLink}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Order: {banner.sortOrder} · Opacity:{" "}
                      {banner.overlayOpacity}%
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(banner)}
                      className="btn-icon"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this banner?"))
                          deleteMutation.mutate(banner._id);
                      }}
                      className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!data?.length && (
              <div className="md:col-span-3 text-center py-12 text-gray-400">
                No banners yet
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
