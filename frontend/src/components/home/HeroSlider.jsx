import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
} from "react-icons/fi";

const DEFAULT_SLIDES = [
  {
    id: 1,
    type: "image",
    title: "Redefine Your Style",
    subtitle: "New Collection 2026",
    description:
      "Discover premium fashion crafted for those who dare to stand out.",
    ctaText: "Shop Now",
    ctaLink: "/collections",
    secondaryCta: "View Lookbook",
    secondaryLink: "/collections?isFeatured=true",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    align: "left",
    accentColor: "#3B82F6",
  },
  {
    id: 2,
    type: "image",
    title: "Custom Print Studio",
    subtitle: "Make It Yours",
    description:
      "Upload your design, choose your style. Your statement, your rules.",
    ctaText: "Start Designing",
    ctaLink: "/custom-print",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=85",
    align: "center",
    accentColor: "#7AB2E4",
  },
  {
    id: 3,
    type: "image",
    title: "Summer Essentials",
    subtitle: "Up to 50% Off",
    description: "Refresh your wardrobe with our curated summer collection.",
    ctaText: "Shop Sale",
    ctaLink: "/collections?sort=price_asc",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=85",
    align: "right",
    accentColor: "#22C55E",
  },
];

export default function HeroSlider({ banners = [] }) {
  const slides =
    banners.length > 0
      ? banners.map((b) => ({
          id: b._id,
          type: b.videoUrl ? "video" : "image",
          title: b.title,
          subtitle: b.subtitle,
          description: b.description,
          ctaText: b.ctaText,
          ctaLink: b.ctaLink,
          image: b.image?.url,
          videoUrl: b.videoUrl,
          align: "left",
          accentColor: "#3B82F6",
        }))
      : DEFAULT_SLIDES;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const go = useCallback(
    (idx) => {
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
    },
    [current],
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next, paused]);

  const slide = slides[current];
  const alignClass =
    {
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    }[slide.align] || "items-start text-left";

  const slideVariants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 80 : -80, scale: 1.02 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -80 : 80, scale: 0.98 }),
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      next();
    } else if (info.offset.x > swipeThreshold) {
      prev();
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden touch-pan-y"
      style={{ height: "min(92vh, 900px)", minHeight: "560px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background with Swipe support */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {slide.type === "video" && slide.videoUrl ? (
            <video
              src={slide.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover pointer-events-none"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/80 via-brand-900/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full container-op flex flex-col justify-center px-6 sm:px-12">
        <div
          className={`flex flex-col ${alignClass} max-w-2xl ${slide.align === "right" ? "ml-auto" : slide.align === "center" ? "mx-auto" : ""}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${slide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`flex flex-col ${alignClass}`}
            >
              {slide.subtitle && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-3 sm:mb-4"
                  style={{ color: slide.accentColor || "#7AB2E4" }}
                >
                  <span
                    className="w-6 sm:w-8 h-0.5"
                    style={{ background: slide.accentColor || "#7AB2E4" }}
                  />
                  {slide.subtitle}
                </motion.span>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.98] tracking-tight"
              >
                {slide.title}
              </motion.h1>

              {slide.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/70 text-sm sm:text-base md:text-lg mt-3 sm:mt-5 max-w-md leading-relaxed"
                >
                  {slide.description}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className={`flex flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 ${slide.align === "center" ? "justify-center" : ""}`}
              >
                {slide.ctaLink && (
                  <Link
                    to={slide.ctaLink}
                    className="btn-primary text-xs sm:text-sm md:text-base px-6 sm:px-8 py-3.5 sm:py-4 shadow-brand-lg hover:shadow-brand-xl"
                  >
                    {slide.ctaText || "Shop Now"} <FiArrowRight size={18} />
                  </Link>
                )}
                {slide.secondaryLink && (
                  <Link
                    to={slide.secondaryLink}
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 border border-white/30 text-white text-xs sm:text-sm md:text-base font-semibold rounded-xl hover:bg-white/10 transition-all backdrop-blur-xs"
                  >
                    {slide.secondaryCta}
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- MOBILE FRIENDLY ARROWS --- */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 active:scale-95 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
            aria-label="Previous slide"
          >
            <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 active:scale-95 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white transition-all shadow-lg"
            aria-label="Next slide"
          >
            <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-white"
                : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 right-8 z-20 hidden lg:flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-px h-14 bg-gradient-to-b from-white/60 to-transparent" />
        <span className="text-white/40 text-[9px] tracking-[0.4em] uppercase rotate-90 mt-1">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
