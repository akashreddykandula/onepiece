import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "@components/ui/PageLoader";

export default function ProductGrid({
  products = [],
  loading = false,
  columns = 4,
  emptyMessage = "No products found",
  emptySubtext = "Try adjusting your filters or search terms",
}) {
  const colClass =
    {
      2: "grid-cols-2",
      3: "grid-cols-2 md:grid-cols-3",
      4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    }[columns] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  if (loading) return <ProductGridSkeleton count={columns * 2} />;

  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 text-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
          <span className="text-xl sm:text-2xl">🔍</span>
        </div>
        <p className="font-display font-semibold text-base sm:text-xl text-brand-900 mb-1">
          {emptyMessage}
        </p>
        <p className="text-xs sm:text-sm text-gray-400">{emptySubtext}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${colClass} gap-2.5 sm:gap-4 md:gap-5`}>
      {products.map((product, i) => (
        <ProductCard key={product._id} product={product} index={i} />
      ))}
    </div>
  );
}
