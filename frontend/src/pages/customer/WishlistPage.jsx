// ─── WishlistPage ─────────────────────────────────────────────────────────────
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FiHeart, FiArrowRight, FiShoppingBag } from "react-icons/fi";
import { authAPI, productAPI } from "@services/api";
import { useAuth } from "@hooks/index";
import ProductGrid from "@components/product/ProductGrid";

export function WishlistPage() {
  const { user } = useAuth();
  const wishlistIds = user?.wishlist || [];

  const { data: products, isLoading } = useQuery({
    queryKey: ["wishlist-products", wishlistIds.join(",")],
    queryFn: async () => {
      if (!wishlistIds.length) return [];
      const results = await Promise.all(
        wishlistIds.slice(0, 20).map((id) =>
          productAPI
            .getOne(id)
            .then((r) => r.data.product)
            .catch(() => null),
        ),
      );
      return results.filter(Boolean);
    },
    enabled: !!wishlistIds.length,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <>
      <Helmet>
        <title>My Wishlist | ONE PIECE</title>
      </Helmet>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="container-op py-12 sm:py-16">
        <AnimatePresence mode="wait">
          {!wishlistIds.length ? (
            /* ─── EMPTY STATE ─── */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative max-w-lg mx-auto my-8 p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 backdrop-blur-xl text-center shadow-2xl overflow-hidden"
            >
              {/* Background ambient lighting for frame */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Heart Icon Badge */}
              <div className="relative inline-flex mb-8">
                <div className="absolute inset-0 bg-red-400/20 rounded-full blur-2xl transform scale-150 animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-b from-red-50 to-white dark:from-red-500/15 dark:to-red-500/5 border border-red-200/60 dark:border-red-400/30 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md">
                  <FiHeart
                    size={48}
                    className="text-red-400 stroke-[1.2] fill-red-400/10"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-md text-red-400">
                  <FiShoppingBag size={16} />
                </div>
              </div>

              <h2 className="heading-md text-2xl sm:text-3xl font-bold tracking-tight mb-3 text-white">
                Your wishlist is empty
              </h2>

              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
                Explore our exclusive collections and curate your favorite
                pieces for easy access anytime.
              </p>

              <Link
                to="/collections"
                className="btn-primary group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
              >
                <span className="relative z-10">Browse Collections</span>
                <FiArrowRight
                  size={18}
                  className="relative z-10 group-hover:translate-x-1 transition-transform duration-200"
                />
              </Link>
            </motion.div>
          ) : (
            /* ─── PRODUCT GRID WRAPPER ─── */
            <motion.div
              key="product-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <ProductGrid
                products={products || []}
                loading={isLoading}
                columns={4}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default WishlistPage;
