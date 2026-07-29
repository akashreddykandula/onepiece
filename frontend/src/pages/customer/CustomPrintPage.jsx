import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  FiUpload,
  FiX,
  FiCheck,
  FiImage,
  FiFileText,
  FiArrowRight,
  FiRotateCw,
  FiRefreshCw,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

import { openWhatsApp } from "@utils/helpers";
import { productAPI, customPrintAPI } from "@services/api";

const STEPS = [
  "Choose Style",
  "Upload Design",
  "Your Details",
  "Review & Order",
];

// Fallback constants if product doesn't supply specific variants
const DEFAULT_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy Blue", hex: "#1D2A44" },
  { name: "Heather Grey", hex: "#9E9E9E" },
];
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const DEFAULT_AREAS = [
  "Front",
  "Back",
  "Both Sides",
  "Right chest",
  "Left Chest",
  "Sleeves",
];

export default function CustomPrintPage() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [designPosition, setDesignPosition] = useState({ x: 0, y: 0 });
  const [designScale, setDesignScale] = useState(1);
  const [designRotation, setDesignRotation] = useState(0);
  const [selectedSide, setSelectedSide] = useState("Front"); // "Front" | "Back"

  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Dynamic state for selected options
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(DEFAULT_SIZES[0]);
  const [selectedArea, setSelectedArea] = useState(DEFAULT_AREAS[0]);

  const fileInputRef = useRef(null);
  const { productId } = useParams();

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      quantity: 1,
      name: "",
      phone: "",
      email: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      printText: "",
      notes: "",
    },
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (productId) {
          const res = await productAPI.getOne(productId);
          const p = res.data.product;

          if (!p?.supportsCustomPrint) {
            toast.error("This product doesn't support custom printing.");
            return;
          }

          applyProductDefaults(p);
        } else {
          const res = await productAPI.getAll({
            supportsCustomPrint: true,
          });
          const fetchedProducts = res.data.products || [];
          setAvailableProducts(fetchedProducts);

          if (fetchedProducts.length > 0) {
            applyProductDefaults(fetchedProducts[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load custom print products:", err);
      }
    };

    loadProducts();
  }, [productId]);

  const applyProductDefaults = (item) => {
    setSelectedProduct(item);

    // Color options check
    if (item?.colors && item.colors.length > 0) {
      setSelectedColor(
        typeof item.colors[0] === "string"
          ? { name: item.colors[0], hex: "#333333" }
          : item.colors[0],
      );
    } else {
      setSelectedColor(DEFAULT_COLORS[0]);
    }

    // Size options check
    if (item?.sizes && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0]);
    } else {
      setSelectedSize(DEFAULT_SIZES[0]);
    }

    // Print area check
    if (item?.printAreas && item.printAreas.length > 0) {
      setSelectedArea(item.printAreas[0]);
    } else {
      setSelectedArea(DEFAULT_AREAS[0]);
    }
  };

  const handleFiles = (incoming) => {
    const valid = Array.from(incoming).filter((f) =>
      ["image/png", "image/jpeg", "image/jpg", "application/pdf"].includes(
        f.type,
      ),
    );
    if (!valid.length) {
      toast.error("Only PNG, JPG, or PDF files are allowed");
      return;
    }
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    const firstImage = valid.find((file) => file.type.startsWith("image/"));

    if (firstImage) {
      setPreviewUrl(URL.createObjectURL(firstImage));
      setDesignPosition({ x: 0, y: 0 });
      setDesignScale(1);
      setDesignRotation(0);
    }
  };

  const removeFile = (i) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const resetTransform = () => {
    setDesignPosition({ x: 0, y: 0 });
    setDesignScale(1);
    setDesignRotation(0);
  };

  const onSubmit = async (formData) => {
    try {
      const payload = new FormData();

      if (selectedProduct?._id) {
        payload.append("product", selectedProduct._id);
      }
      payload.append("selectedColor", JSON.stringify(selectedColor));
      payload.append("selectedSize", selectedSize);
      payload.append("selectedPrintArea", selectedArea);
      payload.append("selectedSide", selectedSide);

      // Pass exact design positioning parameters to backend
      payload.append(
        "designTransform",
        JSON.stringify({
          position: designPosition,
          scale: designScale,
          rotation: designRotation,
        }),
      );

      payload.append("quantity", formData.quantity);
      payload.append("customerNotes", formData.notes || "");
      payload.append("customerName", formData.name);
      payload.append("customerPhone", formData.phone);
      payload.append("customerEmail", formData.email);
      payload.append(
        "shippingAddress",
        JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          line1: formData.line1,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }),
      );
      payload.append("printText", formData.printText || "");

      files.forEach((file) => {
        payload.append("designs", file);
      });

      await customPrintAPI.create(payload);
      setFiles([]);
      setPreviewUrl(null);
      resetTransform();
      reset();
      toast.success("Custom print request submitted successfully!");
      setSubmitted(true);
    } catch (error) {
      console.error("Custom Print Error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit order",
      );
    }
  };

  const getWhatsAppMessage = () => {
    const values = getValues();
    return `Hi ONE PIECE! 👋\n\nI want to place a custom print order:\n\n*Product:* ${
      selectedProduct?.name || "Custom Apparel"
    }\n*Name:* ${values.name || "N/A"}\n*Colour:* ${
      selectedColor?.name || "Default"
    }\n*Size:* ${selectedSize}\n*Print Area:* ${selectedArea} (${selectedSide} View)\n*Quantity:* ${
      values.quantity || 1
    }\n*Files Uploaded:* ${files.length} file(s)\n\nPlease confirm availability and pricing.`;
  };

  const handleResetOrder = () => {
    setSubmitted(false);
    setCurrentStep(0);
    setFiles([]);
    setPreviewUrl(null);
    resetTransform();
    reset();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ice flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="w-20 h-20 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/20">
            <FiCheck size={36} className="text-white" />
          </div>
          <h2 className="heading-lg mb-3">Request Submitted! 🎨</h2>
          <p className="text-gray-500 text-sm mb-8">
            Our design team will review your files and reach out within 2 hours
            with a preview and confirmation.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => openWhatsApp(getWhatsAppMessage())}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-sm"
            >
              <FaWhatsapp size={18} /> Follow Up on WhatsApp
            </button>
            <button
              onClick={handleResetOrder}
              className="btn-secondary w-full justify-center"
            >
              Place Another Order
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (productId && !selectedProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 animate-pulse font-medium">
          Loading custom product details...
        </p>
      </div>
    );
  }

  const availableColors = selectedProduct?.colors?.length
    ? selectedProduct.colors
    : DEFAULT_COLORS;
  const availableSizes = selectedProduct?.sizes?.length
    ? selectedProduct.sizes
    : DEFAULT_SIZES;
  const availableAreas = selectedProduct?.printAreas?.length
    ? selectedProduct.printAreas
    : DEFAULT_AREAS;

  return (
    <>
      <Helmet>
        <title>Custom Print Studio | ONE PIECE</title>
      </Helmet>

      {/* Header */}
      <div
        className="relative overflow-hidden bg-cover bg-center py-20 text-center md:py-28"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1663433567177-9f94be0bff4c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        {/* Multi-pass gradient overlay for high visual depth and optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 pointer-events-none" />

        {/* Ambient brand glow highlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container-op relative z-10 px-4">
          <p className="eyebrow justify-center text-brand-300 mb-3 tracking-widest uppercase font-semibold text-xs drop-shadow-sm">
            Design Studio
          </p>

          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-tight drop-shadow-md">
            Custom Print
          </h1>

          <p className="text-white/80 max-w-md mx-auto text-sm sm:text-base leading-relaxed drop-shadow-sm">
            Upload your design. We print, pack, and deliver in 5 days.
          </p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="container-op py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < currentStep
                        ? "bg-brand-600 text-white"
                        : i === currentStep
                          ? "bg-brand-800 text-white ring-4 ring-brand-100"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <p
                    className={`text-[10px] mt-1 font-medium whitespace-nowrap hidden sm:block ${
                      i === currentStep
                        ? "text-brand-800 font-bold"
                        : i < currentStep
                          ? "text-brand-500"
                          : "text-gray-400"
                    }`}
                  >
                    {step}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${
                      i < currentStep ? "bg-brand-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-op py-10 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {/* STEP 0 – Choose Style & Live Mockup Editor */}
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {!productId && availableProducts.length > 0 && (
                <div>
                  <h2 className="font-display font-bold text-2xl text-brand-900 mb-4">
                    1. Select Garment
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableProducts.map((item) => {
                      const isSelected = selectedProduct?._id === item._id;
                      return (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => applyProductDefaults(item)}
                          className={`overflow-hidden rounded-2xl border-2 text-left transition-all bg-white ${
                            isSelected
                              ? "border-brand-600 ring-2 ring-brand-500/20 shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="h-44 w-full bg-gray-50 overflow-hidden relative">
                            <img
                              src={item.images?.[0]?.url || item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            {isSelected && (
                              <span className="absolute top-2 right-2 bg-brand-600 text-white p-1 rounded-full shadow">
                                <FiCheck size={12} />
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <p className="text-xs text-brand-700 font-bold mt-1">
                              ₹{item.price}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProduct && (
                <div className="card p-6">
                  {/* Front/Back View Switcher Toolbar */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Garment View
                    </span>
                    <div className="flex gap-2">
                      {["Front", "Back"].map((side) => (
                        <button
                          key={side}
                          type="button"
                          onClick={() => {
                            setSelectedSide(side);
                            if (side === "Back") {
                              setSelectedArea("Back");
                              setDesignPosition({ x: 0, y: 25 });
                            } else {
                              setSelectedArea("Front Chest");
                              setDesignPosition({ x: 0, y: 0 });
                            }
                          }}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            selectedSide === side
                              ? "bg-brand-800 text-white border-brand-800 shadow-sm"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {side} Side
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Live Mockup Canvas Area */}
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square border border-gray-200">
                      {selectedColor?.hex &&
                        selectedColor.hex !== "#FFFFFF" && (
                          <div
                            className="absolute inset-0 pointer-events-none mix-blend-multiply transition-all duration-300"
                            style={{
                              backgroundColor: selectedColor.hex,
                              opacity: 0.45,
                            }}
                          />
                        )}
                      <img
                        src={selectedProduct.images?.[0]?.url}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover transition-all duration-300 select-none"
                        style={{
                          filter:
                            selectedColor?.hex &&
                            selectedColor.hex !== "#FFFFFF"
                              ? `drop-shadow(0 6px 10px rgba(0,0,0,.18))
           hue-rotate(0deg)
           saturate(0.9)
           brightness(0.95)`
                              : "none",
                        }}
                      />

                      {/* Printable Area Target Overlay */}
                      <div
                        className="absolute left-1/2 top-[28%] -translate-x-1/2
             w-44 h-44
             border-2 border-dashed border-brand-500/60
             rounded-lg
             pointer-events-none flex items-start justify-center pt-1"
                      >
                        <span className="text-[10px] font-bold text-brand-600 bg-white/80 px-2 py-0.5 rounded-full shadow-xs">
                          {selectedArea} ({selectedSide})
                        </span>
                      </div>

                      {/* Interactive Drag/Scale/Rotate Design Element */}
                      {previewUrl && (
                        <motion.div
                          drag
                          dragMomentum={false}
                          dragConstraints={{
                            top: -55,
                            bottom: 55,
                            left: -55,
                            right: 55,
                          }}
                          style={{
                            x: designPosition.x,
                            y: designPosition.y,
                            scale: designScale,
                            rotate: designRotation,
                          }}
                          onDragEnd={(event, info) => {
                            setDesignPosition({
                              x: designPosition.x + info.offset.x,
                              y: designPosition.y + info.offset.y,
                            });
                          }}
                          className="absolute top-[28%] left-1/2 -translate-x-1/2 w-40 flex justify-center cursor-move active:cursor-grabbing"
                        >
                          <img
                            src={previewUrl}
                            alt="Design Preview"
                            className="max-h-40 object-contain opacity-95 drop-shadow-lg select-none pointer-events-none"
                          />
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedProduct.name}
                      </h2>

                      <p className="text-gray-500 mt-2 text-sm">
                        {selectedProduct.shortDescription ||
                          selectedProduct.description}
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <span className="text-3xl font-bold text-brand-800">
                          ₹{selectedProduct.price}
                        </span>

                        {selectedProduct.comparePrice >
                          selectedProduct.price && (
                          <span className="line-through text-gray-400">
                            ₹{selectedProduct.comparePrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Mockup Controls Panel */}
              {previewUrl && (
                <div className="card p-6 space-y-4 bg-white border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-brand-900 flex items-center gap-2">
                      <FiRotateCw size={14} /> Mockup Transformations
                    </h3>
                    <button
                      type="button"
                      onClick={resetTransform}
                      className="text-xs text-gray-500 hover:text-brand-600 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <FiRefreshCw size={12} /> Reset Position
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Size / Scale Control */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                        <span>Print Scale</span>
                        <span>{Math.round(designScale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={designScale}
                        onChange={(e) => setDesignScale(Number(e.target.value))}
                        className="w-full accent-brand-700 cursor-pointer"
                      />
                    </div>

                    {/* Rotation Control */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-gray-700 mb-2">
                        <span>Rotation</span>
                        <span>{designRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="5"
                        value={designRotation}
                        onChange={(e) =>
                          setDesignRotation(Number(e.target.value))
                        }
                        className="w-full accent-brand-700 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-6 space-y-6">
                <h2 className="font-display font-bold text-2xl text-brand-900">
                  Configure Options
                </h2>

                {/* Colour Options */}
                <div>
                  <label className="label text-sm font-semibold mb-3 block">
                    Garment Colour
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((c, idx) => {
                      const colorObj =
                        typeof c === "string" ? { name: c, hex: "#333" } : c;
                      const isSelected = selectedColor?.name === colorObj.name;
                      return (
                        <button
                          key={colorObj.name || idx}
                          type="button"
                          onClick={() => setSelectedColor(colorObj)}
                          title={colorObj.name}
                          className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-105 ${
                            isSelected
                              ? "border-brand-600 ring-4 ring-brand-100 shadow-sm"
                              : "border-gray-200"
                          }`}
                          style={{ background: colorObj.hex || "#333" }}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <FiCheck
                                size={14}
                                className={
                                  colorObj.hex?.toLowerCase() === "#ffffff"
                                    ? "text-gray-900"
                                    : "text-white"
                                }
                              />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected:{" "}
                    <span className="font-medium text-gray-800">
                      {selectedColor?.name}
                    </span>
                  </p>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="label text-sm font-semibold mb-3 block">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          selectedSize === size
                            ? "bg-brand-800 text-white border-brand-800 shadow-sm"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Print Area Selection */}
                <div>
                  <label className="label text-sm font-semibold mb-3 block">
                    Print Placement Area
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableAreas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          setSelectedArea(area);

                          switch (area) {
                            case "Front Chest":
                              setSelectedSide("Front");
                              setDesignPosition({ x: 0, y: 0 });
                              break;

                            case "Left Chest":
                              setSelectedSide("Front");
                              setDesignPosition({ x: -45, y: -20 });
                              break;

                            case "Back":
                              setSelectedSide("Back");
                              setDesignPosition({ x: 0, y: 25 });
                              break;

                            case "Both Sides":
                              setSelectedSide("Front");
                              setDesignPosition({ x: 0, y: 0 });
                              break;

                            default:
                              setDesignPosition({ x: 0, y: 0 });
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          selectedArea === area
                            ? "bg-brand-50 border-brand-600 text-brand-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedProduct) {
                      toast.error("Please select a product first.");
                      return;
                    }
                    setCurrentStep(1);
                  }}
                  className="btn-primary px-8 py-3.5 flex items-center gap-2"
                >
                  Next: Upload Design <FiArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1 – Upload Design */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card p-8">
                <h2 className="font-display font-bold text-2xl text-brand-900 mb-6">
                  Upload Your Artwork
                </h2>

                <div
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-brand-500 bg-brand-50/50 scale-[1.01]"
                      : "border-gray-200 hover:border-brand-400 hover:bg-gray-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <FiUpload
                    size={38}
                    className={`mx-auto mb-3 ${
                      dragActive ? "text-brand-600" : "text-gray-400"
                    }`}
                  />
                  <p className="font-semibold text-gray-800 text-sm mb-1">
                    Drag & drop files here
                  </p>
                  <p className="text-xs text-gray-400">
                    or click to browse your device
                  </p>
                  <p className="text-[11px] text-gray-400 mt-3">
                    Supported: PNG, JPG, PDF • Max 15MB • Up to 5 files
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-2.5">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Selected Files ({files.length})
                    </p>
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="w-9 h-9 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                          {file.type === "application/pdf" ? (
                            <FiFileText size={16} className="text-brand-700" />
                          ) : (
                            <FiImage size={16} className="text-brand-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                  <p className="text-xs text-amber-900 font-semibold">
                    💡 Tips for high quality prints:
                  </p>
                  <ul className="text-xs text-amber-800 mt-1.5 space-y-1 list-disc list-inside">
                    <li>High resolution vectors or 300 DPI images work best</li>
                    <li>
                      Transparent PNG files are preferred for dark clothing
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="btn-secondary px-6"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!files.length) {
                      toast.error("Please upload at least one design file");
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  Next: Contact Details <FiArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 – Contact Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card p-8">
                <h2 className="font-display font-bold text-2xl text-brand-900 mb-6">
                  Contact Information
                </h2>
                <form
                  id="details-form"
                  onSubmit={handleSubmit(() => setCurrentStep(3))}
                  className="space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-xs font-semibold mb-1 block">
                        Full Name *
                      </label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        className={`input text-sm ${errors.name ? "input-error" : ""}`}
                        placeholder="John Doe"
                      />
                      {errors.name && (
                        <p className="text-xs text-rose-500 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs font-semibold mb-1 block">
                        Phone Number *
                      </label>
                      <input
                        {...register("phone", {
                          required: "Phone is required",
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message: "Enter a valid 10-digit mobile number",
                          },
                        })}
                        className={`input text-sm ${errors.phone ? "input-error" : ""}`}
                        placeholder="10-digit mobile"
                        maxLength={10}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-500 mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="label text-xs font-semibold mb-1 block">
                        Email Address *
                      </label>
                      <input
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: "Enter a valid email address",
                          },
                        })}
                        type="email"
                        className={`input text-sm ${errors.email ? "input-error" : ""}`}
                        placeholder="your@email.com"
                      />
                      <div className="md:col-span-2">
                        <label className="label text-xs font-semibold mb-1 block">
                          Address *
                        </label>

                        <input
                          {...register("line1", {
                            required: "Address is required",
                          })}
                          className="input text-sm"
                          placeholder="House No, Street, Area"
                        />
                      </div>

                      <div>
                        <label className="label text-xs font-semibold mb-1 block">
                          City *
                        </label>

                        <input
                          {...register("city", {
                            required: "City is required",
                          })}
                          className="input text-sm"
                        />
                      </div>

                      <div>
                        <label className="label text-xs font-semibold mb-1 block">
                          State *
                        </label>

                        <input
                          {...register("state", {
                            required: "State is required",
                          })}
                          className="input text-sm"
                        />
                      </div>

                      <div>
                        <label className="label text-xs font-semibold mb-1 block">
                          Pincode *
                        </label>

                        <input
                          {...register("pincode", {
                            required: "Pincode is required",
                          })}
                          className="input text-sm"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-500 mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs font-semibold mb-1 block">
                        Quantity *
                      </label>
                      <input
                        {...register("quantity", {
                          required: "Quantity is required",
                          min: { value: 1, message: "Minimum 1 item required" },
                        })}
                        type="number"
                        min={1}
                        className="input text-sm"
                      />
                      {errors.quantity && (
                        <p className="text-xs text-rose-500 mt-1">
                          {errors.quantity.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label text-xs font-semibold mb-1 block">
                        Text to Print (Optional)
                      </label>
                      <input
                        {...register("printText")}
                        className="input text-sm"
                        placeholder="Custom text overlay..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label text-xs font-semibold mb-1 block">
                        Special Instructions
                      </label>
                      <textarea
                        {...register("notes")}
                        className="input text-sm resize-none h-24"
                        placeholder="Positioning requests, pantone color preferences, deadline info..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary px-6"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="details-form"
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  Next: Review Order <FiArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 – Review & Confirm */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card p-8">
                <h2 className="font-display font-bold text-2xl text-brand-900 mb-6">
                  Review Your Custom Order
                </h2>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      {
                        label: "Product",
                        value: selectedProduct?.name || "Garment",
                      },
                      {
                        label: "Colour",
                        value: selectedColor?.name || "Standard",
                      },
                      { label: "Size", value: selectedSize },
                      {
                        label: "Print Placement",
                        value: `${selectedArea} (${selectedSide})`,
                      },
                      { label: "Quantity", value: getValues("quantity") },
                      {
                        label: "Files Uploaded",
                        value: `${files.length} file(s)`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100"
                      >
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {label}
                        </p>
                        <p className="font-semibold text-gray-900 text-sm mt-0.5 truncate">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-brand-50/80 border border-brand-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-brand-900 mb-1">
                      📋 What happens next?
                    </p>
                    <ol className="text-xs text-brand-800 space-y-1 list-decimal list-inside">
                      <li>
                        Our graphic designers review your files within 2 hours
                      </li>
                      <li>
                        We send an exact high-res digital mockup for approval
                      </li>
                      <li>
                        Printing starts immediately upon your confirmation
                      </li>
                    </ol>
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500">
                      Estimated unit pricing:
                    </p>
                    <p className="font-bold text-brand-900 text-xl mt-0.5">
                      Starting from ₹349 / piece
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Final custom quote confirmed via email & WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className={`btn-primary w-full justify-center py-4 text-base shadow-lg shadow-brand-600/20 ${
                    isSubmitting ? "opacity-70" : ""
                  }`}
                >
                  {isSubmitting ? (
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
                      Submitting Order…
                    </span>
                  ) : (
                    "🎨 Submit Custom Order"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsApp(getWhatsAppMessage())}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-[#25D366] text-[#25D366] rounded-xl font-semibold text-sm hover:bg-[#25D366] hover:text-white transition-all"
                >
                  <FaWhatsapp size={18} /> Or Order Directly via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-ghost w-full justify-center text-xs text-gray-500"
                >
                  ← Go back & edit details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
