import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiX,
  FiPlus,
  FiPackage,
  FiTag,
  FiImage,
  FiCheckCircle,
  FiLayers,
  FiSearch,
  FiRotateCcw,
  FiGrid,
  FiCheck,
} from "react-icons/fi";
import { productAPI, categoryAPI, uploadAPI } from "@services/api";
import { SIZES_CLOTHING } from "@constants";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product-edit", id],
    queryFn: () => productAPI.getOne(id).then((r) => r.data.product),
    enabled: isEditing,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () =>
      categoryAPI
        .getAll({
          includeSubcategories: "true",
        })
        .then((r) => r.data.categories),
    staleTime: Infinity,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      brand: "ONE PIECE",
      countryOfOrigin: "India",
      gstPercentage: 18,
      shippingDays: "3-7 days",
      returnDays: 7,
    },
  });

  const selectedCategory = watch("category");
  const selectedCategoryData = categoriesData?.find(
    (cat) => cat._id === selectedCategory,
  );

  const subcategories = selectedCategoryData?.subcategories || [];
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        brand: product.brand,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        category: product.category?._id,
        subcategory: product.subcategory?._id || "",
        fabric: product.fabric,
        fit: product.fit,
        washCare: product.washCare,
        countryOfOrigin: product.countryOfOrigin,
        shippingDays: product.shippingDays,
        returnDays: product.returnDays,
        freeShipping: product.freeShipping,
        isReturnable: product.isReturnable,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        isTrending: product.isTrending,
        supportsCustomPrint: product.supportsCustomPrint,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        lowStockThreshold: product.lowStockThreshold || 5,
      });

      setTimeout(() => {
        console.log(getValues());
      }, 300);

      setImages(product.images || []);
      setSelectedSizes(product.sizes || []);
      setColors(product.colors || []);
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? productAPI.update(id, data) : productAPI.create(data),
    onSuccess: () => {
      toast.success(isEditing ? "Product updated!" : "Product created!");
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Save failed"),
  });

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const res = await uploadAPI.images(formData, "products");
      const newImages = res.data.images.map((img, i) => ({
        ...img,
        alt: "",
        isPrimary: images.length === 0 && i === 0,
      }));
      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleColorImageUpload = async (e, colorIndex) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const res = await uploadAPI.images(formData, "products");
      const uploadedImages = res.data.images;

      const updatedColors = [...colors];
      updatedColors[colorIndex].images = [
        ...(updatedColors[colorIndex].images || []),
        ...uploadedImages,
      ];

      setColors(updatedColors);

      if (uploadedImages.length > 0) {
        setImages((prev) => {
          const firstImage = {
            ...uploadedImages[0],
            alt: "",
            isPrimary: prev.length === 0,
          };

          const alreadyExists = prev.some(
            (img) => img.publicId === firstImage.publicId,
          );

          if (alreadyExists) return prev;

          return [...prev, firstImage];
        });
      }

      toast.success("Color images uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const removeColorImage = async (colorIndex, imageIndex) => {
    const updated = [...colors];
    const image = updated[colorIndex].images[imageIndex];

    if (image.publicId) {
      try {
        await uploadAPI.remove(image.publicId);
      } catch (err) {
        console.error(err);
      }
    }

    updated[colorIndex].images.splice(imageIndex, 1);
    setColors(updated);
  };

  const removeColor = async (colorIndex) => {
    const color = colors[colorIndex];

    for (const img of color.images || []) {
      if (img.publicId) {
        try {
          await uploadAPI.remove(img.publicId);
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (color.images?.length) {
      const firstPublicId = color.images[0].publicId;
      setImages((prev) => prev.filter((img) => img.publicId !== firstPublicId));
    }

    setColors((prev) => prev.filter((_, i) => i !== colorIndex));
    toast.success("Color removed");
  };

  const setPrimary = (idx) =>
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, isPrimary: i === idx })),
    );

  const toggleSize = (s) =>
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  const onSubmit = (data) => {
    console.log("FORM DATA:", data);

    mutation.mutate({
      ...data,
      images,
      sizes: selectedSizes,
      colors,
      price: Number(data.price),
      comparePrice: Number(data.comparePrice) || 0,
      stock: Number(data.stock) || 0,
    });
  };

  if (isEditing && productLoading) return <PageLoader />;

  return (
    <>
      <Helmet>
        <title>{isEditing ? "Edit Product" : "New Product"} | Admin</title>
      </Helmet>

      <form onSubmit={handleSubmit(onSubmit)} className="pb-12 pt-2 space-y-6">
        {/* Header Block (Clean Header without Overflow Issues) */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900 tracking-tight">
                {isEditing ? "Edit Product" : "Create Product"}
              </h1>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Update existing product details & inventory"
                  : "Add a new item to your store catalog"}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-60 text-sm cursor-pointer"
          >
            <FiSave size={16} />
            <span>
              {isSubmitting || mutation.isPending
                ? "Saving…"
                : isEditing
                  ? "Update Product"
                  : "Save Product"}
            </span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FiPackage className="text-brand-600" size={18} />
                <h2 className="font-semibold text-gray-900">Basic Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Product Name *
                  </label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all outline-none ${
                      errors.name
                        ? "border-red-300 ring-2 ring-red-500/10"
                        : "border-gray-200 focus:border-brand-500"
                    }`}
                    placeholder="e.g. Premium Oversized Cotton T-Shirt"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Short Description
                  </label>
                  <input
                    {...register("shortDescription")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="One-line product summary (max 300 chars)"
                    maxLength={300}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Description *
                  </label>
                  <textarea
                    {...register("description", {
                      required: "Description is required",
                    })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50/50 text-sm resize-none h-32 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all outline-none ${
                      errors.description
                        ? "border-red-300 ring-2 ring-red-500/10"
                        : "border-gray-200 focus:border-brand-500"
                    }`}
                    placeholder="Detailed product overview, feel, design elements…"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Brand
                    </label>
                    <input
                      {...register("brand")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                      placeholder="ONE PIECE"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      {...register("category", {
                        required: "Category required",
                      })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all outline-none ${
                        errors.category
                          ? "border-red-300 ring-2 ring-red-500/10"
                          : "border-gray-200 focus:border-brand-500"
                      }`}
                    >
                      <option value="">Select category</option>
                      {categoriesData
                        ?.filter((cat) => cat.level === 0)
                        .map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Subcategory
                    </label>
                    <select
                      {...register("subcategory")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none disabled:opacity-50 disabled:bg-gray-100"
                      disabled={!selectedCategory}
                    >
                      <option value="">Select subcategory</option>
                      {subcategories.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FiTag className="text-brand-600" size={18} />
                <h2 className="font-semibold text-gray-900">
                  Pricing & Inventory
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    {...register("price", {
                      required: "Price required",
                      min: { value: 1, message: "Min ₹1" },
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all outline-none ${
                      errors.price
                        ? "border-red-300 ring-2 ring-red-500/10"
                        : "border-gray-200 focus:border-brand-500"
                    }`}
                    placeholder="499"
                  />
                  {errors.price && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Compare Price (₹)
                  </label>
                  <input
                    {...register("comparePrice")}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="999"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Stock *
                  </label>
                  <input
                    {...register("stock", {
                      required: "Stock required",
                      min: { value: 0, message: "Min 0" },
                    })}
                    type="number"
                    min="0"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all outline-none ${
                      errors.stock
                        ? "border-red-300 ring-2 ring-red-500/10"
                        : "border-gray-200 focus:border-brand-500"
                    }`}
                    placeholder="100"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {errors.stock.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Low Stock Alert
                  </label>
                  <input
                    {...register("lowStockThreshold")}
                    type="number"
                    min="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Product Media */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiImage className="text-brand-600" size={18} />
                  <h2 className="font-semibold text-gray-900">Product Media</h2>
                </div>
                <span className="text-xs text-gray-500 font-normal">
                  {images.length} {images.length === 1 ? "image" : "images"}{" "}
                  uploaded
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all bg-gray-100 ${
                      img.isPrimary
                        ? "border-brand-600 ring-2 ring-brand-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(i)}
                          className="text-[11px] text-white bg-brand-600 hover:bg-brand-700 px-2.5 py-1 rounded-lg transition-colors font-medium"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="p-1.5 text-white bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors"
                        title="Remove image"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold tracking-wider uppercase bg-brand-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                        Primary
                      </span>
                    )}
                  </div>
                ))}

                <label
                  className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    uploadingImages
                      ? "border-brand-400 bg-brand-50/50"
                      : "border-gray-300 hover:border-brand-500 hover:bg-gray-50/80"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? (
                    <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-gray-100 text-gray-500 mb-1">
                        <FiUpload size={16} />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600">
                        Add Images
                      </span>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Tip: First uploaded image becomes primary by default. Click set
                primary to select a custom cover photo.
              </p>
            </div>

            {/* Sizes */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FiGrid className="text-brand-600" size={18} />
                <h2 className="font-semibold text-gray-900">Available Sizes</h2>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {SIZES_CLOTHING.map((s) => {
                  const isSelected = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`min-w-[48px] h-11 px-3 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                          : "border-gray-200 text-gray-700 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {isSelected && <FiCheck size={14} />}
                      <span>{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiLayers className="text-brand-600" size={18} />
                  <h2 className="font-semibold text-gray-900">Color Options</h2>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setColors([...colors, { name: "", hex: "#000000" }])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
                >
                  <FiPlus size={14} />
                  <span>Add Color</span>
                </button>
              </div>

              {colors.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-400">
                    No color variants added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className="border border-gray-200/80 rounded-xl p-4 bg-gray-50/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Variant #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeColor(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FiX size={14} /> Remove
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Color Name (e.g. Navy Blue)"
                          value={color.name}
                          onChange={(e) => {
                            const updated = [...colors];
                            updated[index].name = e.target.value;
                            setColors(updated);
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                        />

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) => {
                              const updated = [...colors];
                              updated[index].hex = e.target.value;
                              setColors(updated);
                            }}
                            className="h-10 w-12 rounded-lg border border-gray-200 p-1 bg-white cursor-pointer"
                          />
                          <span className="text-xs font-mono text-gray-500 uppercase">
                            {color.hex}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Variant Gallery
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {(color.images || []).map((img, i) => (
                            <div
                              key={i}
                              className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                            >
                              <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeColorImage(index, i)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <FiX className="text-white" size={16} />
                              </button>
                            </div>
                          ))}

                          <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                            <FiUpload size={13} />
                            <span>Upload</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleColorImageUpload(e, index)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fashion details */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FiCheckCircle className="text-brand-600" size={18} />
                <h2 className="font-semibold text-gray-900">
                  Garment Specifications
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Fabric
                  </label>
                  <input
                    {...register("fabric")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="e.g. 100% Heavyweight Cotton"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Fit
                  </label>
                  <select
                    {...register("fit")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                  >
                    <option value="">Select fit type</option>
                    {["Slim Fit", "Regular Fit", "Oversized", "Relaxed"].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Country of Origin
                  </label>
                  <input
                    {...register("countryOfOrigin")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Shipping Days
                  </label>
                  <input
                    {...register("shippingDays")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="3-7 days"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Wash Care Instructions
                  </label>
                  <textarea
                    {...register("washCare")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm resize-none h-20 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="Machine wash cold with like colors, line dry..."
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <FiSearch className="text-brand-600" size={18} />
                <h2 className="font-semibold text-gray-900">SEO Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Meta Title{" "}
                    <span className="text-gray-400 font-normal lowercase">
                      (max 70 chars)
                    </span>
                  </label>
                  <input
                    {...register("metaTitle")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    maxLength={70}
                    placeholder="Product name — ONE PIECE"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Meta Description{" "}
                    <span className="text-gray-400 font-normal lowercase">
                      (max 160 chars)
                    </span>
                  </label>
                  <textarea
                    {...register("metaDescription")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm resize-none h-20 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    maxLength={160}
                    placeholder="Summarize product for search engine results..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visibility Settings */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm pb-2 border-b border-gray-100">
                Visibility & Badges
              </h2>

              <div className="space-y-2.5">
                {[
                  { id: "isActive", label: "Active (Visible on store)" },
                  { id: "isFeatured", label: "Featured Product" },
                  { id: "isNewArrival", label: "New Arrival" },
                  { id: "isBestSeller", label: "Best Seller" },
                  { id: "isTrending", label: "Trending" },
                  {
                    id: "supportsCustomPrint",
                    label: "Custom Print Available",
                  },
                  { id: "isReturnable", label: "Returnable" },
                  { id: "freeShipping", label: "Free Shipping" },
                ].map(({ id: fid, label }) => (
                  <label
                    key={fid}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                      {label}
                    </span>
                    <input
                      {...register(fid)}
                      type="checkbox"
                      className="w-4 h-4 rounded text-brand-800 focus:ring-brand-500 border-gray-300 accent-brand-800 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FiRotateCcw size={16} className="text-brand-600" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Returns Policy
                </h2>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Return Window (days)
                </label>
                <input
                  {...register("returnDays")}
                  type="number"
                  min="0"
                  max="30"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
