import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
  FiPackage,
  FiStar,
  FiRefreshCw,
  FiCompass,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { productAPI } from "@services/api";
import { useProductFilters } from "@hooks/index";
import { SORT_OPTIONS } from "@constants";
import ProductGrid from "@components/product/ProductGrid";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const { filters, setFilter, setPage } = useProductFilters({
    search: q,
    sort: "newest",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, filters.page, filters.sort],
    queryFn: () =>
      productAPI
        .getAll({
          search: q,
          page: filters.page,
          limit: 16,
          sort: filters.sort,
        })
        .then((r) => r.data),
    enabled: !!q,
    staleTime: 1000 * 60 * 2,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || {};
  const hasNoResults = !isLoading && q && products.length === 0;

  return (
    <>
      {/* Injecting CSS Keyframe Animations for self-contained premium effects */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-3deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes scan-radar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 5s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-radar { animation: scan-radar 8s linear infinite; }
        .animate-shimmer { animation: shimmer-slide 2.5s infinite; }
      `}</style>

      <Helmet>
        <title>{q ? `"${q}" — Search` : "Search"} | ONE PIECE</title>
      </Helmet>

      {/* Hero Page Header */}
      <div className="relative bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 py-14 sm:py-20 overflow-hidden border-b border-brand-800/50">
        {/* Subtle Background Pattern & Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-700/25 via-brand-950/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        <div className="container-op relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* Search Icon Container with Glowing Pulse */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-brand-600 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition duration-500 animate-pulse-ring" />
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-900/90 border border-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl overflow-hidden">
                  <FiSearch
                    size={26}
                    className="text-brand-300 relative z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] bg-brand-400/10 text-brand-300 border border-brand-400/20 backdrop-blur-md shadow-xs">
                    <FiStar
                      className="w-3 h-3 text-brand-400 animate-spin"
                      style={{ animationDuration: "10s" }}
                    />
                    Search Catalogue
                  </span>
                </div>

                <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight truncate max-w-2xl leading-tight">
                  {q ? `Results for "${q}"` : "Search Products"}
                </h1>

                {!isLoading && q && (
                  <p className="text-brand-200/80 text-xs sm:text-sm mt-1.5 font-medium flex items-center gap-1.5">
                    <FiPackage className="w-4 h-4 text-brand-400" />
                    Found{" "}
                    <span className="text-white font-bold px-1.5 py-0.5 bg-brand-800/60 rounded-md border border-brand-700/50">
                      {pagination.total || 0}
                    </span>{" "}
                    matching items
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gray-50/50 min-h-[60vh] py-8 sm:py-12 relative">
        <div className="container-op">
          {q ? (
            <>
              {/* Toolbar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
                    <FiSliders size={16} />
                  </div>
                  <div>
                    {isLoading ? (
                      <div className="h-4 w-36 bg-gray-200 animate-pulse rounded-md" />
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        Showing{" "}
                        <span className="font-semibold text-gray-900">
                          {products.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-900">
                          {pagination.total || 0}
                        </span>{" "}
                        results
                      </p>
                    )}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:inline-block">
                    Sort By
                  </span>
                  <div className="relative w-full sm:w-auto min-w-[200px]">
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilter("sort", e.target.value)}
                      className="w-full bg-gray-50/50 hover:bg-white border border-gray-200 text-gray-900 text-xs sm:text-sm font-semibold py-2.5 pl-4 pr-10 rounded-xl appearance-none focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 cursor-pointer shadow-2xs transition-all duration-200"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* No Results Custom Animated Hero Card OR Product Grid */}
              {hasNoResults ? (
                <div className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/80 to-white rounded-3xl border border-gray-200/80 shadow-lg p-8 sm:p-14 my-4 text-center">
                  {/* Decorative Subtle Grid Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                  {/* Animated Compass & Glow Aura Center Piece */}
                  <div className="relative mx-auto w-32 h-32 mb-6 flex items-center justify-center">
                    {/* Outer Glowing Pulse Ring */}
                    <div className="absolute inset-0 rounded-full bg-brand-500/15 animate-pulse-ring" />

                    {/* Rotating Radar Scanner Ring */}
                    <div className="absolute inset-1 rounded-full border border-dashed border-brand-400/40 animate-radar" />

                    {/* Floating Glow Orbs */}
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-400/30 blur-xs animate-float" />
                    <div className="absolute -bottom-1 -left-2 w-6 h-6 rounded-full bg-brand-600/20 blur-xs animate-float-reverse" />

                    {/* Central Icon Container */}
                    <div className="relative w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center justify-center text-brand-600 animate-float">
                      <FiSearch size={36} className="text-brand-600" />
                      <span className="absolute -bottom-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 shadow-md border-2 border-white">
                        <FiAlertCircle size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Main Header & Subtext */}
                  <div className="relative z-10 max-w-md mx-auto">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-full mb-3">
                      No Matches Found
                    </span>
                    <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight mb-2">
                      We Couldn’t Find "{q}"
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-8">
                      Double-check your spelling, try broader search terms, or
                      explore popular categories below.
                    </p>

                    {/* Interactive Action Buttons & Quick Suggestions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        onClick={() => setFilter("sort", "newest")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-900 text-white font-semibold text-xs sm:text-sm hover:bg-brand-950 transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        <FiRefreshCw size={15} />
                        Reset Sort Filter
                      </button>

                      <Link
                        to="/collections"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-all shadow-2xs active:scale-95"
                      >
                        <FiCompass size={15} />
                        Browse Catalog
                      </Link>
                    </div>

                    {/* Visual Search Hint Badges */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center flex-wrap gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1 font-medium text-gray-500">
                        <FiTrendingUp className="text-brand-500" /> Popular
                        searches:
                      </span>
                      <span className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg cursor-pointer transition-colors font-medium">
                        Hoodies
                      </span>
                      <span className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg cursor-pointer transition-colors font-medium">
                        Figures
                      </span>
                      <span className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg cursor-pointer transition-colors font-medium">
                        Jackets
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Product Grid */
                <div className="transition-all duration-300">
                  <ProductGrid
                    products={products}
                    loading={isLoading}
                    columns={4}
                    emptyMessage={`No results found for "${q}"`}
                    emptySubtext="Try checking for spelling errors, using more generic terms, or browsing our full range of collections."
                  />
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.pages > 1 && !hasNoResults && (
                <nav
                  aria-label="Pagination"
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-gray-200/80"
                >
                  <p className="text-xs sm:text-sm text-gray-500 font-medium order-2 sm:order-1">
                    Page{" "}
                    <span className="font-semibold text-gray-900">
                      {filters.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900">
                      {pagination.pages}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setPage(filters.page - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 text-xs sm:text-sm font-semibold rounded-xl disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-2xs"
                      aria-label="Previous Page"
                    >
                      <FiChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                        const pageNum = i + 1;
                        const isCurrent = filters.page === pageNum;
                        return (
                          <button
                            key={i}
                            onClick={() => setPage(pageNum)}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                              isCurrent
                                ? "bg-brand-900 text-white shadow-md shadow-brand-950/20 scale-105"
                                : "border border-transparent text-gray-600 hover:border-gray-200 hover:bg-white hover:text-brand-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPage(filters.page + 1)}
                      disabled={!pagination.hasNextPage}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 text-xs sm:text-sm font-semibold rounded-xl disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-2xs"
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            /* Animated Empty Query State (No search term yet) */
            <div className="max-w-lg mx-auto my-12 sm:my-20 p-8 sm:p-14 bg-white rounded-3xl border border-gray-200/80 shadow-xl text-center flex flex-col items-center relative overflow-hidden group">
              {/* Background Light Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-50/30 via-transparent to-brand-100/20 pointer-events-none" />

              {/* Animated Floating Centerpiece */}
              <div className="relative mb-8">
                {/* Glowing Background Pulse Ring */}
                <div className="absolute inset-0 bg-brand-500/20 rounded-3xl blur-xl animate-pulse-ring" />

                <div className="relative w-24 h-24 bg-gradient-to-tr from-brand-50 to-brand-100/50 border border-brand-200/80 rounded-3xl flex items-center justify-center shadow-lg animate-float">
                  <FiSearch size={38} className="text-brand-600" />
                </div>

                {/* Floating Star Badge */}
                <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-brand-900 text-amber-300 rounded-xl border-2 border-white shadow-md flex items-center justify-center animate-float-reverse">
                  <FiStar size={16} className="fill-amber-300" />
                </div>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-gray-900 mb-2.5 tracking-tight">
                What are you looking for?
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-6">
                Enter a query into the header search bar above to explore our
                exclusive apparel, merchandise, and collectibles.
              </p>

              <div className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-full border border-brand-100">
                <FiCompass
                  className="animate-spin"
                  style={{ animationDuration: "12s" }}
                />
                <span>Start typing to explore catalog</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
