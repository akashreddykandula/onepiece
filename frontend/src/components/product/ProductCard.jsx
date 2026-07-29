import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiShoppingBag,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useCart, useWishlist } from "@hooks/index";
import {
  formatPrice,
  getDiscount,
  getPrimaryImage,
  productEnquiryMessage,
  openWhatsApp,
} from "@utils/helpers";

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quickAdded, setQuickAdded] = useState(false);

  if (!product) return null;

  const images = product.images || [];
  const primary = getPrimaryImage(images);
  const secondary = images[1]?.url || primary;
  const currentImg = images[activeImageIdx]?.url || primary;

  const discount = getDiscount(product.price, product.comparePrice);
  const wishlisted = isWishlisted(product._id);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isInStock) return;

    addToCart({
      _id: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: primary,
      size: product.sizes?.[0] || "",
      color: selectedColor?.name || product.colors?.[0]?.name || "",
      colorHex: selectedColor?.hex || product.colors?.[0]?.hex || "",
    });

    setQuickAdded(true);
    setTimeout(() => setQuickAdded(false), 1800);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id, product.name);
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openWhatsApp(productEnquiryMessage(product));
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev + 1) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group relative flex flex-col w-full rounded-xl bg-white border border-gray-100/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Visual / Media Container */}
      <div
        className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={
              isHovered && images.length > 1 && activeImageIdx === 0
                ? secondary
                : currentImg
            }
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        {/* --- DESKTOP SLIDING ARROWS (Plain Black Arrows) --- */}
        <AnimatePresence>
          {images.length > 1 && isHovered && (
            <div className="hidden sm:flex absolute inset-x-2 top-1/2 -translate-y-1/2 justify-between pointer-events-none z-20">
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                onClick={handlePrevImage}
                aria-label="Previous image"
                className="pointer-events-auto text-black hover:scale-110 active:scale-95 transition-all drop-shadow-sm p-1"
              >
                <FiArrowLeft size={20} strokeWidth={2.5} />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onClick={handleNextImage}
                aria-label="Next image"
                className="pointer-events-auto text-black hover:scale-110 active:scale-95 transition-all drop-shadow-sm p-1"
              >
                <FiArrowRight size={20} strokeWidth={2.5} />
              </motion.button>
            </div>
          )}
        </AnimatePresence>

        {/* --- PAGINATION DOTS --- */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 pointer-events-none">
            {images.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeImageIdx === idx
                    ? "w-3 bg-white shadow-xs"
                    : "w-1 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Status Badges */}
        {!product.isInStock ? (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-gray-900/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider">
            Sold Out
          </span>
        ) : product.isBestSeller || product.isNewArrival ? (
          <span
            className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs ${
              product.isBestSeller ? "bg-amber-600/90" : "bg-emerald-600/90"
            }`}
          >
            {product.isBestSeller ? "Best Seller" : "New"}
          </span>
        ) : null}

        {/* Quick Add Overlay Button */}
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
          <button
            onClick={handleQuickAdd}
            disabled={!product.isInStock}
            className={`w-full py-2 px-2 rounded-lg font-semibold text-[10px] sm:text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5 transition-all ${
              quickAdded
                ? "bg-emerald-600 text-white"
                : product.isInStock
                  ? "bg-gray-900/90 hover:bg-black text-white backdrop-blur-xs"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <AnimatePresence mode="wait">
              {quickAdded ? (
                <motion.span key="added" className="flex items-center gap-1">
                  <FiCheck size={13} /> Added
                </motion.span>
              ) : (
                <motion.span key="add" className="flex items-center gap-1">
                  <FiShoppingBag size={13} />
                  {product.isInStock ? "Quick Add" : "Out of Stock"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1">
        {/* Brand */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
          {product.brand || "ONE PIECE"}
        </span>

        {/* Title */}
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-black transition-colors capitalize">
            {product.name}
          </h3>
        </Link>

        {/* Color Swatches */}
        {product.colors?.length > 1 && (
          <div className="flex items-center gap-1 my-0.5">
            {product.colors.slice(0, 4).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={() => setSelectedColor(color)}
                className={`w-2.5 h-2.5 rounded-full border border-black/10 transition-transform ${
                  selectedColor?.name === color.name
                    ? "scale-125 ring-1 ring-black"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: color.hex || "#ccc" }}
              />
            ))}
          </div>
        )}

        {/* Price & Actions Row */}
        <div className="mt-1 flex items-center justify-between gap-1 pt-1 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>

            {product.comparePrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}

            {discount > 0 && (
              <span className="text-[9px] font-bold text-rose-600">
                {discount}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleWishlist}
              aria-label="Wishlist"
              className={`p-1 rounded-full transition-colors ${
                wishlisted
                  ? "text-rose-500"
                  : "text-gray-400 hover:text-rose-500 hover:bg-gray-50"
              }`}
            >
              <FiHeart
                className="w-3.5 h-3.5"
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>

            <button
              onClick={handleWhatsApp}
              aria-label="WhatsApp"
              className="p-1 rounded-full text-gray-400 hover:text-[#25D366] hover:bg-emerald-50 transition-colors"
            >
              <FaWhatsapp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
