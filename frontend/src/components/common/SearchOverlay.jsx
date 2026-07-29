import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSearch,
  FiX,
  FiTrendingUp,
  FiClock,
  FiArrowRight,
} from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { closeSearch } from "@store/index";
import { productAPI } from "@services/api";
import { useDebounce, useKeyPress, useScrollLock } from "@hooks/index";
import { formatPrice, getPrimaryImage } from "@utils/helpers";

const POPULAR_SEARCHES = [
  "Oversized Tshirt",
  "Cargo Pants",
  "Floral Dress",
  "Joggers",
  "Custom Print",
  "Polo Shirt",
];

export default function SearchOverlay() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchOpen } = useSelector((s) => s.ui);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("op_recent_searches") || "[]");
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);
  const debouncedQ = useDebounce(query, 300);

  useScrollLock(searchOpen);
  useKeyPress("Escape", () => dispatch(closeSearch()));

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 80);
    else setQuery("");
  }, [searchOpen]);

  const { data, isLoading } = useQuery({
    queryKey: ["search-suggestions", debouncedQ],
    queryFn: () => productAPI.getSuggestions(debouncedQ).then((r) => r.data),
    enabled: debouncedQ.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    const term = q.trim();
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      6,
    );
    setRecentSearches(updated);
    localStorage.setItem("op_recent_searches", JSON.stringify(updated));
    navigate(`/search?q=${encodeURIComponent(term)}`);
    dispatch(closeSearch());
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("op_recent_searches");
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-start justify-center"
          onClick={(e) =>
            e.target === e.currentTarget && dispatch(closeSearch())
          }
        >
          <motion.div
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:mt-16 sm:mx-4 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
              <FiSearch size={20} className="text-brand-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search products, categories…"
                className="flex-1 text-sm sm:text-base font-sans text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent min-w-0"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0 active:scale-95"
                  aria-label="Clear query"
                >
                  <FiX size={18} />
                </button>
              )}
              <button
                onClick={() => dispatch(closeSearch())}
                className="p-2 sm:p-1 text-gray-500 hover:text-gray-700 transition-colors shrink-0 active:scale-95"
                aria-label="Close search"
              >
                <span className="hidden sm:inline text-xs font-sans border border-gray-200 rounded px-2 py-1 text-gray-400 font-medium">
                  ESC
                </span>
                <span className="sm:hidden text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Cancel
                </span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-65px)] sm:max-h-[520px] custom-scrollbar">
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <motion.div
                    className="w-7 h-7 border-2 border-brand-200 border-t-brand-600 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              )}

              {/* Results */}
              {!isLoading && data && query.length >= 2 && (
                <div>
                  {data.products?.length > 0 || data.categories?.length > 0 ? (
                    <>
                      {/* Categories Section */}
                      {data.categories?.length > 0 && (
                        <div className="px-4 sm:px-5 py-3 border-b border-gray-100/80 bg-gray-50/50">
                          <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-2.5">
                            Categories
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {data.categories.map((cat) => (
                              <Link
                                key={cat._id}
                                to={`/collections/${cat.slug}`}
                                onClick={() => dispatch(closeSearch())}
                                className="flex items-center gap-2 px-3.5 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-100 transition-colors active:scale-95"
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products Section */}
                      {data.products?.length > 0 && (
                        <div className="divide-y divide-gray-50">
                          <div className="px-4 sm:px-5 pt-3.5 pb-2">
                            <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">
                              Products
                            </p>
                          </div>
                          {data.products.map((product) => (
                            <Link
                              key={product._id}
                              to={`/product/${product.slug}`}
                              onClick={() => {
                                handleSearch(product.name);
                              }}
                              className="flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors group active:bg-gray-100"
                            >
                              <div className="w-12 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                <img
                                  src={getPrimaryImage(product.images)}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {product.brand}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-brand-800 shrink-0">
                                {formatPrice(product.price)}
                              </p>
                            </Link>
                          ))}

                          <div className="p-4 sm:px-5 sm:py-3.5 border-t border-gray-100 bg-gray-50/30">
                            <button
                              onClick={() => handleSearch()}
                              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 text-sm text-brand-600 font-semibold hover:text-brand-800 transition-colors py-2 px-3 rounded-xl hover:bg-brand-50 active:scale-[0.99]"
                            >
                              View all results for "{query}"{" "}
                              <FiArrowRight size={15} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-16 px-4">
                      <p className="text-gray-500 text-sm font-medium">
                        No results found for "
                        <span className="text-gray-900 font-semibold">
                          {query}
                        </span>
                        "
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Check spelling or try using different keywords
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state — show popular & recent */}
              {query.length < 2 && (
                <div className="p-4 sm:p-5 space-y-6">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5">
                          <FiClock size={13} className="text-gray-400" /> Recent
                        </p>
                        <button
                          onClick={clearRecent}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors py-1 px-2 rounded hover:bg-gray-100"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setQuery(s);
                              handleSearch(s);
                            }}
                            className="px-3.5 py-2 bg-gray-100/80 text-gray-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-brand-50 hover:text-brand-700 transition-all active:scale-95"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1.5 mb-3">
                      <FiTrendingUp size={13} className="text-brand-500" />{" "}
                      Popular
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setQuery(s);
                            handleSearch(s);
                          }}
                          className="px-3.5 py-2 bg-brand-50/80 text-brand-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-100 transition-all active:scale-95"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
