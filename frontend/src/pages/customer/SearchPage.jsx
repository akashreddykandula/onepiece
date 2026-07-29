import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
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

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" — Search` : "Search"} | ONE PIECE</title>
      </Helmet>

      {/* Hero Page Header */}
      <div className="relative bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950 py-12 sm:py-16 md:py-20 overflow-hidden border-b border-brand-800/40">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-brand-700/20 via-transparent to-transparent pointer-events-none" />

        <div className="container-op relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xl">
              <FiSearch size={26} className="text-brand-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-brand-300/80 block mb-1">
                SEARCH CATALOGUE
              </span>
              <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight truncate">
                {q ? `Results for "${q}"` : "Search Products"}
              </h1>
              {!isLoading && q && (
                <p className="text-white/70 text-xs sm:text-sm mt-1.5 font-medium">
                  Found{" "}
                  <span className="text-white font-bold">
                    {pagination.total || 0}
                  </span>{" "}
                  matching items
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white min-h-[60vh] py-6 sm:py-10">
        <div className="container-op">
          {q ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FiSliders
                    size={15}
                    className="text-brand-600 hidden sm:block"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    {isLoading
                      ? "Searching feed…"
                      : `Showing ${products.length} of ${pagination.total || 0} results`}
                  </p>
                </div>

                {/* Sort Dropdown matched with your brand inputs */}
                <div className="relative w-full sm:w-auto min-w-[180px] max-w-[200px]">
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilter("sort", e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-900 text-xs sm:text-sm font-semibold py-2.5 pl-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer shadow-xs transition-all"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Product Grid */}
              <ProductGrid
                products={products}
                loading={isLoading}
                columns={4}
                emptyMessage={`No results for "${q}"`}
                emptySubtext="Try different keywords or browse our collections"
              />

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-12 sm:mt-16 pb-6">
                  <button
                    onClick={() => setPage(filters.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="btn-secondary px-3.5 py-2.5 text-xs sm:text-sm disabled:opacity-40 flex items-center gap-1.5 rounded-xl shadow-xs"
                    aria-label="Previous Page"
                  >
                    <FiChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-1 sm:px-2">
                    {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                      const pageNum = i + 1;
                      const isCurrent = filters.page === pageNum;
                      return (
                        <button
                          key={i}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            isCurrent
                              ? "bg-brand-800 text-white shadow-md shadow-brand-900/20 scale-105"
                              : "border border-gray-200 text-gray-600 hover:border-brand-500 hover:text-brand-600 bg-white"
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
                    className="btn-secondary px-3.5 py-2.5 text-xs sm:text-sm disabled:opacity-40 flex items-center gap-1.5 rounded-xl shadow-xs"
                    aria-label="Next Page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty Query State */
            <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center px-4">
              <div className="w-20 h-20 bg-brand-50 border border-brand-100 rounded-3xl flex items-center justify-center mb-5 shadow-xs">
                <FiSearch size={36} className="text-brand-600" />
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-2">
                What are you looking for?
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm max-w-sm">
                Use the search bar above to explore our collections, apparel,
                and products.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
