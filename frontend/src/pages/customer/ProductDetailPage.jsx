import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
  FiHeart,
  FiShoppingBag,
  FiShare2,
  FiStar,
  FiChevronRight,
  FiMinus,
  FiPlus,
  FiZoomIn,
  FiTruck,
  FiRefreshCw,
  FiShield,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { productAPI, reviewAPI } from "@services/api";
import { addToRecentlyViewed } from "@store/index";
import { useCart, useWishlist } from "@hooks/index";
import {
  formatPrice,
  getDiscount,
  productEnquiryMessage,
  openWhatsApp,
} from "@utils/helpers";
import ProductGrid from "@components/product/ProductGrid";

function StarRating({ rating, count, size = "sm" }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`${size === "lg" ? "text-lg" : "text-xs sm:text-sm"} ${i < Math.round(rating) ? "text-amber-400" : "text-gray-200"}`}
          >
            ★
          </span>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-gray-400">({count})</span>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [sizeError, setSizeError] = useState(false);

  const scrollContainerRef = useRef(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productAPI.getOne(slug).then((r) => r.data.product),
    enabled: !!slug,
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related", productData?._id],
    queryFn: () =>
      productAPI.getRelated(productData._id).then((r) => r.data.products),
    enabled: !!productData?._id,
    staleTime: 0,
    //added
    refetchOnMount: "always",
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", productData?._id],
    queryFn: () =>
      reviewAPI
        .getForProduct(productData._id, { limit: 5 })
        .then((r) => r.data),
    enabled: !!productData?._id,
  });

  useEffect(() => {
    if (productData) {
      setSelectedSize(productData.sizes?.[0] || "");
      setSelectedColor(productData.colors?.[0] || null);
      setSelectedImage(0);
      dispatch(
        addToRecentlyViewed({
          _id: productData._id,
          name: productData.name,
          slug: productData.slug,
          images: productData.images,
          price: productData.price,
          comparePrice: productData.comparePrice,
          brand: productData.brand,
        }),
      );
    }
  }, [productData, dispatch]);

  const p = productData;
  const images =
    selectedColor?.images?.length > 1 ? selectedColor.images : p?.images || [];
  const currentImg = images[selectedImage]?.url || images[0]?.url;
  const discount = p ? getDiscount(p.price, p.comparePrice) : 0;
  const wishlisted = p ? isWishlisted(p._id) : false;

  const scrollToImage = (index) => {
    setSelectedImage(index);
    if (scrollContainerRef.current && window.innerWidth < 768) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    const nextIndex =
      selectedImage === 0 ? images.length - 1 : selectedImage - 1;
    scrollToImage(nextIndex);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    const nextIndex =
      selectedImage === images.length - 1 ? 0 : selectedImage + 1;
    scrollToImage(nextIndex);
  };

  const handleScroll = (e) => {
    if (window.innerWidth < 768) {
      const width = e.currentTarget.clientWidth;
      if (width > 0) {
        const index = Math.round(e.currentTarget.scrollLeft / width);
        if (index !== selectedImage && index >= 0 && index < images.length) {
          setSelectedImage(index);
        }
      }
    }
  };

  const handleAddToCart = () => {
    if (p.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart({
      _id: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: currentImg,
      size: selectedSize,
      color: selectedColor?.name || "",
      colorHex: selectedColor?.hex || "",
      freeShipping: p.freeShipping,
      quantity,
    });
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  if (isLoading) {
    return (
      <div className="container-op py-8 sm:py-16 px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="skeleton aspect-[3/4] rounded-2xl w-full" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`skeleton h-${i === 0 ? 8 : 4} rounded-xl w-${i % 2 === 0 ? "full" : "2/3"}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <p className="heading-md mb-4 text-brand-900">Product not found</p>
        <Link to="/collections" className="btn-primary">
          Browse Collections
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: "description", label: "Description" },
    { id: "details", label: "Details & Care" },
    { id: "reviews", label: `Reviews (${p.reviewSummary?.count || 0})` },
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <>
      <Helmet>
        <title>{p.name} | ONE PIECE</title>
        <meta
          name="description"
          content={p.shortDescription || p.description?.slice(0, 160)}
        />
        <meta property="og:title" content={p.name} />
        <meta property="og:image" content={currentImg} />
      </Helmet>

      {/* Breadcrumb */}
      <nav className="container-op pt-4 pb-2 px-4 overflow-x-auto no-scrollbar">
        <ol className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
          <li>
            <Link to="/" className="hover:text-brand-700">
              Home
            </Link>
          </li>
          <FiChevronRight size={10} className="shrink-0" />
          <li>
            <Link to="/collections" className="hover:text-brand-700">
              Collections
            </Link>
          </li>
          {p.category && (
            <>
              <FiChevronRight size={10} className="shrink-0" />
              <li>
                <Link
                  to={`/collections/${p.category.slug}`}
                  className="hover:text-brand-700"
                >
                  {p.category.name}
                </Link>
              </li>
            </>
          )}
          <FiChevronRight size={10} className="shrink-0" />
          <li className="text-gray-700 font-medium truncate max-w-[120px] sm:max-w-[200px]">
            {p.name}
          </li>
        </ol>
      </nav>

      <div className="container-op py-4 sm:py-8 px-4">
        <div className="grid md:grid-cols-12 gap-6 sm:gap-10 lg:gap-16 items-start">
          {/* ── Image Gallery ── */}
          {/* Change from flex flex-col md:flex-row to add md:col-span-5 */}
          <div className="md:col-span-5 flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Desktop Side Thumbnails */}
            <div className="hidden md:flex flex-col gap-2.5 w-20 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => scrollToImage(i)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedImage
                      ? "border-brand-600 shadow-sm"
                      : "border-transparent hover:border-brand-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Image View Card */}
            <div className="flex-1 min-w-0">
              {/* Aspect-[3/4] allows portrait fashion images to display completely without cropping */}
              <div className="relative group rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 aspect-[3/4] w-full">
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  onMouseEnter={() => window.innerWidth >= 768 && setZoom(true)}
                  onMouseLeave={() => setZoom(false)}
                  onMouseMove={(e) => {
                    if (window.innerWidth >= 768) {
                      handleMouseMove(e);
                    }
                  }}
                  className="flex md:block w-full h-full overflow-x-auto md:overflow-hidden snap-x snap-mandatory no-scrollbar cursor-zoom-in relative"
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className={`w-full h-full flex-shrink-0 snap-center md:absolute md:inset-0 transition-opacity duration-200 ${
                        i === selectedImage
                          ? "md:opacity-100 md:z-10"
                          : "md:opacity-0 md:z-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={`${p.name} view ${i + 1}`}
                        className="w-full h-full object-cover object-top transition-transform duration-200"
                        style={
                          zoom &&
                          window.innerWidth >= 768 &&
                          i === selectedImage
                            ? {
                                transform: "scale(1.8)",
                                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                              }
                            : {}
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Arrow Controls - HIDDEN ON MOBILE (hidden md:flex) */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous image"
                      className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md items-center justify-center text-brand-950 hover:bg-white active:scale-95 transition-all"
                    >
                      <FiArrowLeft size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md items-center justify-center text-brand-950 hover:bg-white active:scale-95 transition-all"
                    >
                      <FiArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20 pointer-events-none">
                  {p.isNewArrival && (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-brand-900 text-white shadow-sm">
                      NEW
                    </span>
                  )}
                  {!p.isInStock && (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-gray-700 text-white shadow-sm">
                      SOLD OUT
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-20 pointer-events-none hidden sm:block">
                  <FiZoomIn size={18} className="text-white/80 drop-shadow" />
                </div>
              </div>

              {/* Mobile Pagination Dots */}
              {images.length > 1 && (
                <div className="flex md:hidden items-center justify-center gap-1.5 mt-3">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToImage(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === selectedImage
                          ? "w-6 bg-brand-900"
                          : "w-2 bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Mobile Bottom Thumbnails */}
              <div className="flex gap-2 mt-3 md:hidden overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToImage(i)}
                    className={`w-12 h-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedImage
                        ? "border-brand-600 opacity-100"
                        : "border-gray-200 opacity-60"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Product Details Info ── */}
          {/* Add md:col-span-7 */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-7 flex flex-col"
          >
            {/* Brand Header & SKU */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-brand-600 tracking-widest uppercase">
                {p.brand}
              </span>
              {/* <span className="text-[11px] text-gray-400 font-mono">
                SKU: {p.sku}
              </span> */}
            </div>

            <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-brand-950 leading-snug mb-2 sm:mb-3">
              {p.name}
            </h1>

            {/* Star Rating */}
            {p.reviewSummary?.count > 0 && (
              <div className="flex items-center gap-2.5 mb-3.5">
                <StarRating
                  rating={p.reviewSummary.average}
                  count={p.reviewSummary.count}
                />
                <span className="text-xs text-gray-500 font-semibold">
                  {p.reviewSummary.average}/5
                </span>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  Write review
                </button>
              </div>
            )}

            {/* Price Tag Section */}
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="font-display font-bold text-2xl sm:text-3xl text-brand-950">
                {formatPrice(p.price)}
              </span>
              {p.comparePrice > p.price && (
                <span className="text-gray-400 text-base sm:text-lg line-through">
                  {formatPrice(p.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-700">
                  {discount}% off
                </span>
              )}
            </div>

            {/* Short Description */}
            {p.shortDescription && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
                {p.shortDescription}
              </p>
            )}

            <div className="border-t border-gray-100 my-4" />

            {/* Color Options */}
            {p.colors?.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  Colour:{" "}
                  <span className="text-brand-700 font-bold">
                    {selectedColor?.name}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((c) => (
                    <button
                      key={c.name}
                      title={c.name}
                      onClick={() => {
                        setSelectedColor(c);
                        scrollToImage(0);
                      }}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all active:scale-95 ${
                        selectedColor?.name === c.name
                          ? "border-brand-600 scale-105 shadow-sm"
                          : "border-gray-200"
                      }`}
                      style={{ background: c.hex || "#ccc" }}
                    >
                      {selectedColor?.name === c.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <FiCheck
                            size={12}
                            className="text-white drop-shadow"
                          />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            {p.sizes?.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Size:{" "}
                    <span
                      className={`font-bold ${selectedSize ? "text-brand-700" : "text-gray-400"}`}
                    >
                      {selectedSize || "Select size"}
                    </span>
                  </label>
                  <Link
                    to="/pages/size-guide"
                    className="text-xs text-brand-600 hover:underline font-medium"
                  >
                    Size Guide
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                        selectedSize === size
                          ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                          : "border-gray-200 text-gray-700 hover:border-brand-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    Please select a size to continue
                  </p>
                )}
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-xs sm:text-sm text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(p.stock || 10, q + 1))
                    }
                    className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors active:bg-gray-200"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                {p.stock <= 5 && p.stock > 0 && (
                  <span className="text-xs text-red-500 font-semibold">
                    Only {p.stock} left in stock!
                  </span>
                )}
              </div>
            </div>

            {/* Fully Responsive CTA Actions Block */}
            <div className="flex flex-col gap-2.5 mb-4">
              <div className="flex items-center gap-2">
                {/* Main Add To Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!p.isInStock}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-950 text-white transition-all shadow-md active:scale-[0.98] ${
                    !p.isInStock ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FiShoppingBag size={16} />
                  {p.isInStock ? "Add to Bag" : "Out of Stock"}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(p._id, p.name)}
                  aria-label="Wishlist"
                  className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all shrink-0 active:scale-95 ${
                    wishlisted
                      ? "border-red-400 bg-red-50 text-red-500"
                      : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                  }`}
                >
                  <FiHeart
                    size={18}
                    fill={wishlisted ? "currentColor" : "none"}
                  />
                </button>

                {/* Share Button */}
                <button
                  onClick={() =>
                    navigator.share?.({
                      title: p.name,
                      url: window.location.href,
                    })
                  }
                  aria-label="Share"
                  className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-all shrink-0 active:scale-95"
                >
                  <FiShare2 size={18} />
                </button>
              </div>

              {/* Custom Print Option */}
              {p.supportsCustomPrint && (
                <Link
                  to={`/custom-print/${p._id}`}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border-2 border-brand-800 text-brand-900 hover:bg-brand-50 transition-all text-center block"
                >
                  🎨 Customize & Print This Design
                </Link>
              )}
            </div>

            {/* WhatsApp Direct Enquiry */}
            <button
              onClick={() => openWhatsApp(productEnquiryMessage(p))}
              className="w-full flex items-center justify-center gap-2 py-3 border border-[#25D366] text-[#25D366] rounded-xl font-semibold text-xs sm:text-sm hover:bg-[#25D366] hover:text-white transition-all mb-5 active:scale-[0.98]"
            >
              <FaWhatsapp size={16} /> Enquire on WhatsApp
            </button>

            {/* Mobile Trust Cards Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-auto">
              {[
                {
                  icon: FiShield,
                  label: p.freeShipping ? "Free Shipping" : "Paid Shipping",
                  sub: p.freeShipping
                    ? "Available for this product"
                    : "Shipping charges apply",
                },
                {
                  icon: FiRefreshCw,
                  label: p.isReturnable
                    ? `${p.returnDays || 7}-Day Returns`
                    : "Non-Returnable",
                  sub: p.isReturnable
                    ? "Easy returns"
                    : "Returns not available",
                },
                {
                  icon: FiShield,
                  label: "Authentic",
                  sub: "100% Assured",
                },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center bg-gray-50 border border-gray-100 rounded-xl p-2.5 sm:p-3 gap-1"
                >
                  <Icon size={16} className="text-brand-700 shrink-0" />
                  <p className="text-[11px] sm:text-xs font-bold text-brand-950 leading-tight">
                    {label}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight">
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Product Tabs ── */}
        <div className="mt-10 sm:mt-16">
          <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative ${
                  activeTab === tab.id
                    ? "text-brand-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="py-6"
            >
              {activeTab === "description" && (
                <div className="text-gray-600 text-xs sm:text-sm leading-relaxed space-y-3">
                  <p className="whitespace-pre-line">{p.description}</p>
                  {p.fabric && (
                    <p>
                      <strong className="text-gray-900">Fabric:</strong>{" "}
                      {p.fabric}
                    </p>
                  )}
                  {p.fit && (
                    <p>
                      <strong className="text-gray-900">Fit:</strong> {p.fit}
                    </p>
                  )}
                  {p.occasion?.length > 0 && (
                    <p>
                      <strong className="text-gray-900">Occasion:</strong>{" "}
                      {p.occasion.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid md:grid-cols-2 gap-6 sm:gap-8 text-xs sm:text-sm">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950 mb-3">
                      Product Details
                    </h3>
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {[
                          ["Brand", p.brand],
                          ["SKU", p.sku],
                          ["Category", p.category?.name],
                          ["Fabric", p.fabric],
                          ["Fit", p.fit],
                          ["Available Sizes", p.sizes?.join(", ")],
                          ["Country of Origin", p.countryOfOrigin],
                          ["Shipping Days", p.shippingDays],
                        ]
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <tr key={k}>
                              <td className="py-2 text-gray-500 w-32">{k}</td>
                              <td className="py-2 font-medium text-gray-900">
                                {v}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {p.washCare && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950 mb-3">
                        Wash & Care
                      </h3>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {p.washCare}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  {p.reviewSummary?.count > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-4 sm:p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-center shrink-0">
                        <p className="font-display font-black text-4xl sm:text-5xl text-brand-950">
                          {p.reviewSummary.average}
                        </p>
                        <StarRating
                          rating={p.reviewSummary.average}
                          size="lg"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Based on {p.reviewSummary.count} reviews
                        </p>
                      </div>
                      <div className="w-full flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((n) => (
                          <div key={n} className="flex items-center gap-2.5">
                            <span className="text-xs text-gray-500 w-4 font-mono">
                              {n}★
                            </span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{
                                  width: `${((p.reviewSummary.distribution?.[n] || 0) / p.reviewSummary.count) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-6 font-mono text-right">
                              {p.reviewSummary.distribution?.[n] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    {reviewsData?.reviews?.map((r) => (
                      <div
                        key={r._id}
                        className="p-4 rounded-xl border border-gray-100 bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-brand-900 text-white rounded-full flex items-center justify-center font-bold text-xs">
                              {r.user?.name?.[0]}
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm text-gray-900">
                                {r.user?.name}
                              </p>
                              <StarRating rating={r.rating} />
                            </div>
                          </div>
                          {r.isVerifiedPurchase && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        {r.title && (
                          <p className="font-bold text-xs sm:text-sm text-gray-900 mb-1">
                            {r.title}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {r.comment}
                        </p>
                      </div>
                    ))}
                    {!reviewsData?.reviews?.length && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-base font-semibold mb-1">
                          No reviews yet
                        </p>
                        <p className="text-xs">
                          Be the first to review this product
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="grid md:grid-cols-2 gap-6 text-xs sm:text-sm text-gray-600">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950 mb-3">
                      Delivery Information
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: FiTruck,
                          label: "Standard Delivery",
                          detail: `${p.shippingDays || "3-7 business days"}`,
                        },
                        {
                          icon: FiShield,
                          label: p.freeShipping
                            ? "Free Shipping"
                            : "Paid Shipping",
                          detail: p.freeShipping
                            ? "Available for this product"
                            : "Shipping charges apply",
                        },
                        {
                          icon: FiRefreshCw,
                          label: p.isReturnable
                            ? "Easy Returns"
                            : "Non-Returnable",
                          detail: p.isReturnable
                            ? `${p.returnDays || 7} days return policy`
                            : "This product cannot be returned",
                        },
                      ].map(({ icon: Icon, label, detail }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                        >
                          <Icon size={16} className="text-brand-600 shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900">{label}</p>
                            <p className="text-[11px] text-gray-500">
                              {detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-brand-950 mb-3">
                      Return Policy
                    </h3>
                    <p className="leading-relaxed text-gray-600">
                      {p.isReturnable
                        ? `Items can be returned within ${p.returnDays || 7} days of delivery. Products must be unworn, unwashed, and in their original packaging with tags intact.`
                        : "This product is not eligible for returns."}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related Products Grid */}
        {relatedData?.length > 0 && (
          <section className="mt-12 sm:mt-16 border-t border-gray-100 pt-8 sm:pt-12">
            <h2 className="text-lg sm:text-2xl font-display font-bold text-brand-950 mb-6">
              You May Also Like
            </h2>
            <ProductGrid products={relatedData} columns={4} />
          </section>
        )}
      </div>
    </>
  );
}
