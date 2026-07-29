import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiGrid,
  FiLayers,
  FiStar,
  FiCornerDownRight,
  FiFolder,
} from "react-icons/fi";
import { categoryAPI } from "@services/api";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

// Framer Motion Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function AdminCategories() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () =>
      categoryAPI
        .getAll({ includeSubcategories: "true" })
        .then((r) => r.data.categories),
    staleTime: 30000,
  });

  const parentCategories = data || [];

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (d) =>
      editItem ? categoryAPI.update(editItem._id, d) : categoryAPI.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success(editItem ? "Category updated!" : "Category created!");
      closeForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Delete failed"),
  });

  const openEdit = (cat) => {
    setEditItem(cat);
    setValue("name", cat.name);
    setValue("description", cat.description || "");
    setValue("isFeatured", cat.isFeatured || false);
    setValue("sortOrder", cat.sortOrder || 0);
    setValue("parent", cat.parent || "");
    setShowForm(true);
  };

  const openNew = (parentId = "") => {
    setEditItem(null);
    reset();
    if (parentId) setValue("parent", parentId);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditItem(null);
    reset();
  };

  // Quick stats
  const totalSubcategories =
    data?.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0) || 0;
  const featuredCount = data?.filter((cat) => cat.isFeatured).length || 0;

  return (
    <>
      <Helmet>
        <title>Categories | Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-brand-50/50 p-5 rounded-2xl border border-brand-100">
          <div>
            <h1 className="font-display font-bold text-2xl text-brand-900 tracking-tight flex items-center gap-2">
              <FiGrid className="text-brand-600" size={22} /> Categories
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage parent categories, subcategories, and homepage features
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openNew()}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus size={16} /> Add Category
          </motion.button>
        </div>

        {/* Quick Stats Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card p-4 flex items-center gap-3 border-l-4 border-l-brand-600">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <FiFolder size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">
                Main Categories
              </p>
              <p className="text-lg font-bold text-brand-900">
                {data?.length || 0}
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3 border-l-4 border-l-brand-400">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <FiLayers size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Subcategories</p>
              <p className="text-lg font-bold text-brand-900">
                {totalSubcategories}
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3 col-span-2 md:col-span-1 border-l-4 border-l-amber-500">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FiStar size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">
                Featured Categories
              </p>
              <p className="text-lg font-bold text-brand-900">
                {featuredCount}
              </p>
            </div>
          </div>
        </div>

        {/* Modal / Overlay Form Animation */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeForm}
                className="fixed inset-0 bg-brand-900/30 backdrop-blur-sm"
              />

              {/* Form Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="card p-6 border-2 border-brand-200 shadow-2xl relative z-10 w-full max-w-xl bg-white"
              >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-100">
                  <h2 className="font-bold text-lg text-brand-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-600" />
                    {editItem ? "Edit" : "New"} Category
                  </h2>
                  <button onClick={closeForm} className="btn-icon">
                    <FiX size={16} />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit((d) => {
                    const payload = {
                      ...d,
                      parent: d.parent || null,
                    };

                    saveMutation.mutate(payload);
                  })}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2">
                    <label className="label">Name *</label>
                    <input
                      {...register("name", { required: "Name is required" })}
                      className={`input ${errors.name ? "input-error" : ""}`}
                      placeholder="e.g. Men's Collection"
                    />
                    {errors.name && (
                      <p className="error-msg">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Parent Category</label>
                    <select {...register("parent")} className="input">
                      <option value="">None (Main Category)</option>
                      {parentCategories
                        .filter((c) => c._id !== editItem?._id)
                        .map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
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

                  <div className="md:col-span-2">
                    <label className="label">Description</label>
                    <input
                      {...register("description")}
                      className="input"
                      placeholder="Short category summary"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                    <input
                      {...register("isFeatured")}
                      type="checkbox"
                      id="isFeatured"
                      className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="isFeatured"
                      className="text-sm font-medium text-brand-900 cursor-pointer"
                    >
                      Featured on homepage
                    </label>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="btn-primary disabled:opacity-60 flex items-center gap-2"
                    >
                      <FiCheck size={14} />
                      {saveMutation.isPending
                        ? "Saving…"
                        : editItem
                          ? "Update Category"
                          : "Create Category"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content Section */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {data?.map((cat) => (
              <motion.div
                layout
                variants={itemVariants}
                whileHover={{ y: -3 }}
                key={cat._id}
                className="card p-5 hover:shadow-card-hover transition-all group flex flex-col justify-between relative overflow-hidden border border-brand-100/60"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl overflow-hidden shrink-0 border border-brand-100 flex items-center justify-center">
                      {cat.image?.url ? (
                        <img
                          src={cat.image.url}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="font-bold text-xl text-brand-400">
                          {cat.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-900 truncate">
                            {cat.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cat.productCount || 0} products · Order:{" "}
                            {cat.sortOrder || 0}
                          </p>
                        </div>

                        {/* Card Hover Quick Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => openEdit(cat)}
                            className="btn-icon hover:text-brand-600"
                            title="Edit Category"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${cat.name}"?`))
                                deleteMutation.mutate(cat._id);
                            }}
                            className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete Category"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {cat.isFeatured && (
                        <span className="badge-blue text-[10px] inline-flex items-center gap-1 mt-1.5">
                          <FiStar size={10} /> Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nested Subcategories List */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Subcategories ({cat.subcategories?.length || 0})
                      </span>
                      <button
                        onClick={() => openNew(cat._id)}
                        className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-0.5"
                      >
                        <FiPlus size={11} /> Add
                      </button>
                    </div>

                    {cat.subcategories?.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {cat.subcategories.map((s) => (
                          <div
                            key={s._id}
                            className="group/sub flex items-center justify-between rounded-lg bg-gray-50/80 px-3 py-1.5 hover:bg-brand-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FiCornerDownRight
                                className="text-gray-400 shrink-0"
                                size={12}
                              />
                              <span className="text-xs font-medium text-gray-700 truncate">
                                {s.name}
                              </span>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => openEdit(s)}
                                className="btn-icon p-1 hover:text-brand-600"
                              >
                                <FiEdit2 size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${s.name}"?`)) {
                                    deleteMutation.mutate(s._id);
                                  }
                                }}
                                className="btn-icon p-1 text-red-400 hover:text-red-600"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        No subcategories created yet
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {!data?.length && (
              <div className="md:col-span-3 card text-center py-12 text-gray-400">
                <FiFolder className="mx-auto mb-2 text-brand-300" size={32} />
                <p>No categories found. Create your first one!</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
