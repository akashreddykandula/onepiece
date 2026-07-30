import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
  FiCheck,
  FiRotateCcw,
} from "react-icons/fi";
import { productAPI, categoryAPI } from "@services/api";
import ProductGrid from "@components/product/ProductGrid";
import { useProductFilters } from "@hooks/index";
import { SORT_OPTIONS, SIZES_CLOTHING } from "@constants";

import menBanner from "@assets/collections/men-banner.jpg";
import womenBanner from "@assets/collections/women-banner.jpg";
import kidsBanner from "@assets/collections/kids-banner.jpg";
import saleBanner from "@assets/collections/sale-banner.jpg";
import trendingBanner from "@assets/collections/trending-banner.jpg";
import featuredBanner from "@assets/collections/featured-banner.jpg";
import bestSellerBanner from "@assets/collections/bestseller-banner.jpg";
import newArrivalBanner from "@assets/collections/new-arrivals-banner.jpg";
import defaultBanner from "@assets/collections/default-banner.jpg";

function FilterPanel({
  filters,
  currentCategory,
  setFilter,
  toggleArrayFilter,
  resetFilters,
  onClose,
}) {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      categoryAPI
        .getAll({
          includeSubcategories: "true",
        })
        .then((r) => r.data.categories),
    staleTime: Infinity,
  });

  return (
    <div className="flex flex-col h-full bg-white/90 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <FiSliders className="w-4 h-4 text-gray-900" />
          <h3 className="font-serif tracking-tight font-semibold text-lg text-gray-900">
            Filters
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-widest font-semibold hover:text-gray-900 transition-colors"
          >
            <FiRotateCcw size={12} />
            Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-600 hover:bg-gray-900 hover:text-white transition-all active:scale-95"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 custom-scrollbar">
        {/* Category */}
        {categoriesData?.length > 0 && (
          <FilterSection title="Category">
            <div className="space-y-3.5 pt-1">
              {categoriesData
                .filter((cat) => {
                  if (cat.level !== 0) return false;
                  if (currentCategory === "men") return cat.slug === "men";
                  if (currentCategory === "women") return cat.slug === "women";
                  return true;
                })
                .map((category) => {
                  const isCatChecked = filters.category === category.slug;
                  return (
                    <div key={category._id} className="group">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                          className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                            isCatChecked
                              ? "border-gray-900 bg-gray-900"
                              : "border-gray-300 group-hover:border-gray-400"
                          }`}
                        >
                          {isCatChecked && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="category"
                          checked={isCatChecked}
                          onChange={() => {
                            setFilter("category", category.slug);
                            setFilter("subcategory", "");
                          }}
                          className="sr-only"
                        />
                        <span
                          className={`text-sm tracking-wide ${
                            isCatChecked
                              ? "font-semibold text-gray-900"
                              : "text-gray-600 group-hover:text-gray-900"
                          }`}
                        >
                          {category.name}
                        </span>
                      </label>

                      {/* Subcategories */}
                      {isCatChecked && category.subcategories?.length > 0 && (
                        <div className="ml-7 mt-3 space-y-2.5 border-l-2 border-gray-100 pl-3">
                          {category.subcategories.map((sub) => {
                            const isSubChecked =
                              filters.subcategory === sub.slug;
                            return (
                              <label
                                key={sub._id}
                                className="flex items-center gap-2.5 cursor-pointer group/sub select-none"
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                                    isSubChecked
                                      ? "border-gray-900 bg-gray-900"
                                      : "border-gray-300 group-hover/sub:border-gray-400"
                                  }`}
                                >
                                  {isSubChecked && (
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                  )}
                                </div>
                                <input
                                  type="radio"
                                  name="subcategory"
                                  checked={isSubChecked}
                                  onChange={() =>
                                    setFilter("subcategory", sub.slug)
                                  }
                                  className="sr-only"
                                />
                                <span
                                  className={`text-xs ${
                                    isSubChecked
                                      ? "font-semibold text-gray-900"
                                      : "text-gray-500 group-hover/sub:text-gray-800"
                                  }`}
                                >
                                  {sub.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </FilterSection>
        )}

        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="space-y-4 pt-1">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">
                  Min (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ""}
                    onChange={(e) => setFilter("minPrice", e.target.value)}
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">
                  Max (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ""}
                    onChange={(e) => setFilter("maxPrice", e.target.value)}
                    className="w-full bg-gray-50/80 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Under ₹500", min: "", max: "500" },
                { label: "₹500–₹1000", min: "500", max: "1000" },
                { label: "₹1000–₹2000", min: "1000", max: "2000" },
                { label: "₹2000+", min: "2000", max: "" },
              ].map((p) => {
                const isActive =
                  filters.minPrice === p.min && filters.maxPrice === p.max;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      setFilter("minPrice", p.min);
                      setFilter("maxPrice", p.max);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-gray-900 text-white shadow-md shadow-gray-900/10"
                        : "bg-gray-50 border border-gray-200/80 text-gray-600 hover:border-gray-900 hover:text-gray-900"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </FilterSection>

        {/* Sizes */}
        <FilterSection title="Size">
          <div className="grid grid-cols-4 gap-2 pt-1">
            {SIZES_CLOTHING.map((size) => {
              const isSelected = filters.sizes?.includes(size);
              return (
                <button
                  key={size}
                  onClick={() => toggleArrayFilter("sizes", size)}
                  className={`py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all border ${
                    isSelected
                      ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-900"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability">
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div
                className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                  filters.inStock === "true"
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "border-gray-300 group-hover:border-gray-400 bg-white"
                }`}
              >
                {filters.inStock === "true" && <FiCheck size={12} />}
              </div>
              <input
                type="checkbox"
                checked={filters.inStock === "true"}
                onChange={(e) =>
                  setFilter("inStock", e.target.checked ? "true" : "")
                }
                className="sr-only"
              />
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                In Stock Only
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div
                className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                  filters.supportsCustomPrint === "true"
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "border-gray-300 group-hover:border-gray-400 bg-white"
                }`}
              >
                {filters.supportsCustomPrint === "true" && (
                  <FiCheck size={12} />
                )}
              </div>
              <input
                type="checkbox"
                checked={filters.supportsCustomPrint === "true"}
                onChange={(e) =>
                  setFilter(
                    "supportsCustomPrint",
                    e.target.checked ? "true" : "",
                  )
                }
                className="sr-only"
              />
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                Custom Print Available
              </span>
            </label>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Rating">
          <div className="space-y-2.5 pt-1">
            {[4, 3, 2].map((r) => {
              const isSelected = filters.rating === String(r);
              return (
                <label
                  key={r}
                  className="flex items-center gap-3 cursor-pointer group select-none"
                >
                  <div
                    className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                      isSelected
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-300 group-hover:border-gray-400 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="rating"
                    checked={isSelected}
                    onChange={() =>
                      setFilter(
                        "rating",
                        filters.rating === String(r) ? "" : String(r),
                      )
                    }
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span className="flex items-center text-amber-400 tracking-tight">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < r ? "text-amber-400" : "text-gray-200"}
                        >
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="text-gray-500 font-medium">& above</span>
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>
      </div>

      {/* Drawer Mobile Footer Apply Button */}
      {onClose && (
        <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-semibold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100/80 pb-5 last:border-b-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-xs uppercase tracking-wider font-bold text-gray-900 mb-2 py-1 select-none"
      >
        {title}
        <FiChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CollectionsPage() {
  const { cat } = useParams();
  const [searchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const gridRef = useRef(null);

  const { filters, setFilter, toggleArrayFilter, resetFilters, setPage } =
    useProductFilters({
      page: Number(searchParams.get("page")) || 1,
      category: cat || searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      sort: searchParams.get("sort") || "newest",
      isNewArrival: searchParams.get("isNewArrival") || "",
      isBestSeller: searchParams.get("isBestSeller") || "",
      isFeatured: searchParams.get("isFeatured") || "",
      isOnSale: searchParams.get("isOnSale") || "",
      search: searchParams.get("q") || "",
    });

  useEffect(() => {
    const categoryMap = { men: "men", women: "women" };
    setFilter(
      "category",
      categoryMap[searchParams.get("category")] ||
        searchParams.get("category") ||
        "",
    );
    setFilter("subcategory", searchParams.get("subcategory") || "");
    setFilter("sort", searchParams.get("sort") || "newest");
    setFilter("isNewArrival", searchParams.get("isNewArrival") || "");
    setFilter("isBestSeller", searchParams.get("isBestSeller") || "");
    setFilter("isFeatured", searchParams.get("isFeatured") || "");
    setFilter("isOnSale", searchParams.get("isOnSale") || "");
    setPage(Number(searchParams.get("page")) || 1);
  }, [searchParams, setFilter, setPage]);

  const queryParams = {
    page: filters.page || 1,
    limit: 16,
    sort: filters.sort,
    ...(filters.category && { category: filters.category }),
    ...(filters.subcategory && { subcategory: filters.subcategory }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.sizes?.length && { sizes: filters.sizes.join(",") }),
    ...(filters.inStock && { inStock: filters.inStock }),
    ...(filters.supportsCustomPrint && {
      supportsCustomPrint: filters.supportsCustomPrint,
    }),
    ...(filters.rating && { rating: filters.rating }),
    ...(filters.isOnSale && { isOnSale: filters.isOnSale }),
    ...(filters.isNewArrival && { isNewArrival: filters.isNewArrival }),
    ...(filters.isBestSeller && { isBestSeller: filters.isBestSeller }),
    ...(filters.isFeatured && { isFeatured: filters.isFeatured }),
    ...(filters.search && { search: filters.search }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productAPI.getAll(queryParams).then((r) => r.data),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const products = data?.products || [];
  const pagination = data?.pagination || {
    page: 1,
    pages: 1,
    total: 0,
    hasPrevPage: false,
    hasNextPage: false,
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper function to build clean pagination page numbers (with ellipsis)
  const getPaginationWindow = () => {
    const totalPages = pagination.pages;
    const currentPage = filters.page || 1;
    const delta = 1;

    let range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");

    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  const category = searchParams.get("category");
  const sort = searchParams.get("sort");
  const isNewArrival = searchParams.get("isNewArrival");
  const isBestSeller = searchParams.get("isBestSeller");
  const isFeatured = searchParams.get("isFeatured");
  const isOnSale = searchParams.get("isOnSale");

  let heroBanner = defaultBanner;
  if (category === "men") heroBanner = menBanner;
  else if (category === "women") heroBanner = womenBanner;
  else if (category === "kids") heroBanner = kidsBanner;
  else if (isOnSale === "true") heroBanner = saleBanner;
  else if (sort === "trending") heroBanner = trendingBanner;
  else if (isBestSeller === "true") heroBanner = bestSellerBanner;
  else if (isFeatured === "true") heroBanner = featuredBanner;
  else if (isNewArrival === "true") heroBanner = newArrivalBanner;

  const pageTitle = category
    ? `${category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Collection`
    : isNewArrival
      ? "New Arrivals"
      : isOnSale
        ? "Sale"
        : isBestSeller
          ? "Best Sellers"
          : isFeatured
            ? "Featured Collection"
            : sort === "trending"
              ? "Trending"
              : "All Collections";

  const activeFilterCount =
    (filters.sizes?.length || 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.subcategory ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.supportsCustomPrint ? 1 : 0) +
    (filters.rating ? 1 : 0);

  return (
    <>
      <Helmet>
        <title>{pageTitle} | ONE PIECE Fashion</title>
        <meta
          name="description"
          content={`Shop ${pageTitle} at ONE PIECE. Premium fashion, fast delivery.`}
        />
      </Helmet>

      {/* Collection Hero Banner */}
      <div
        className="relative h-[480px] sm:h-[540px] md:h-[620px] overflow-hidden bg-gray-950"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: "cover",
          backgroundPosition: "center 25%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Luxury Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-950/20 to-transparent" />

        <div className="relative z-10 h-full flex items-end pb-12 sm:pb-16">
          <div className="container-op w-full">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="uppercase tracking-[0.35em] text-white/90 text-[11px] font-medium">
                Curated Collections
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-serif font-normal text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[0.95]"
            >
              {pageTitle}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-5 flex items-center gap-3 text-white/70 text-sm font-light"
            >
              <span className="font-semibold text-white">
                {isLoading ? "..." : pagination.total}
              </span>
              <span className="text-white/40">|</span>
              <span>Luxury Garments & Apparel</span>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50/50 min-h-screen" ref={gridRef}>
        <div className="container-op py-6 sm:py-10">
          {/* Mobile Floating Sticky Action Bar */}
          <div className="sticky top-16 z-30 lg:hidden mb-6 -mx-4 px-4 py-2.5 bg-white/80 backdrop-blur-xl border-y border-gray-200/60 shadow-xs flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex-1 flex items-center justify-center gap-2.5 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-xl shadow-md shadow-gray-900/10 active:scale-[0.98] transition-all"
            >
              <FiFilter size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 bg-white text-gray-900 text-[10px] rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex-1 relative">
              <select
                value={filters.sort}
                onChange={(e) => setFilter("sort", e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-medium py-3 px-3 rounded-xl appearance-none focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <FiChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Desktop Toolbar Header */}
          <div className="hidden lg:flex items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200/60">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold">
                Catalogue Overview
              </h2>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {isLoading
                  ? "Loading product feed..."
                  : `Showing ${products.length} of ${pagination.total || 0} premium items`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                Sort By:
              </span>
              <div className="relative min-w-[200px]">
                <select
                  value={filters.sort}
                  onChange={(e) => setFilter("sort", e.target.value)}
                  className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold py-2.5 pl-4 pr-8 rounded-xl appearance-none focus:outline-none focus:border-gray-900 cursor-pointer shadow-xs transition-all"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-10">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 bg-white border border-gray-100/80 rounded-2xl shadow-xl shadow-gray-200/40 overflow-hidden">
                <FilterPanel
                  filters={filters}
                  currentCategory={category}
                  setFilter={setFilter}
                  toggleArrayFilter={toggleArrayFilter}
                  resetFilters={resetFilters}
                />
              </div>
            </aside>

            {/* Main Product Showcase */}
            <div className="flex-1 min-w-0">
              <ProductGrid
                products={products}
                loading={isLoading}
                columns={4}
              />

              {/* Luxury Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16 pb-8">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!pagination.hasPrevPage && filters.page <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-700 flex items-center justify-center transition-all shadow-xs"
                    aria-label="Previous Page"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1.5 px-2">
                    {getPaginationWindow().map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-xs text-gray-400 font-serif"
                          >
                            •••
                          </span>
                        );
                      }
                      const isCurrent = filters.page === p;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                            isCurrent
                              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10 scale-105"
                              : "bg-white border border-gray-200/80 text-gray-600 hover:border-gray-900 hover:text-gray-900 shadow-xs"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={
                      !pagination.hasNextPage &&
                      filters.page >= pagination.pages
                    }
                    className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-700 flex items-center justify-center transition-all shadow-xs"
                    aria-label="Next Page"
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Filter Modal */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Dark Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />

            {/* Slide-over Mobile Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[88%] max-w-sm bg-white shadow-2xl overflow-hidden"
            >
              <FilterPanel
                filters={filters}
                currentCategory={category}
                setFilter={setFilter}
                toggleArrayFilter={toggleArrayFilter}
                resetFilters={resetFilters}
                onClose={() => setMobileFiltersOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
