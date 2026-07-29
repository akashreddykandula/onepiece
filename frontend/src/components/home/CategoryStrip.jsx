import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import ProductGrid from "@components/product/ProductGrid";
import { useAnimateOnScroll } from "@hooks/index";

// ─── Constants & Asset Mappings ───────────────────────────────────────────────
const CATEGORY_IMAGES = {
  "t-shirts":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80",
  shirts:
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=300&q=80",
  hoodies:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&q=80",
  jeans: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&q=80",
  shorts:
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&q=80",
  sports:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80",
  "sports-wear":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80",
};

const DEFAULT_CATEGORIES = [
  { _id: "1", name: "T-Shirts", slug: "t-shirts" },
  { _id: "2", name: "Shirts", slug: "shirts" },
  { _id: "3", name: "Hoodies", slug: "hoodies" },
  { _id: "4", name: "Jeans", slug: "jeans" },
  { _id: "5", name: "Shorts", slug: "shorts" },
  { _id: "6", name: "Sports Wear", slug: "sports" },
];

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  linkTo,
  linkLabel = "View All",
  center = true,
}) {
  const { ref, inView } = useAnimateOnScroll();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={`mb-10 ${center ? "text-center" : ""}`}
    >
      {eyebrow && <p className="eyebrow justify-center mb-3">{eyebrow}</p>}
      <h2 className="heading-lg">{title}</h2>
      {subtitle && (
        <p
          className={`text-gray-500 mt-3 text-sm leading-relaxed max-w-xl ${
            center ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors group"
        >
          {linkLabel}{" "}
          <FiArrowRight
            size={15}
            className="group-hover:translate-x-1 transition-transform duration-200"
          />
        </Link>
      )}
    </motion.div>
  );
}

// ─── Category Strip ───────────────────────────────────────────────────────────
export function CategoryStrip({ categories = [] }) {
  const cats = categories.length ? categories : DEFAULT_CATEGORIES;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50 border-y border-gray-100">
      <div className="container-op">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {cats.slice(0, 6).map((cat, i) => {
            const imageUrl =
              CATEGORY_IMAGES[cat.slug] || cat.image?.url || null;

            return (
              <motion.div
                key={cat._id || cat.slug || i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
              >
                <Link
                  to={`/collections?category=men&subcategory=${cat.slug}`}
                  className="group flex flex-col items-center"
                >
                  <div className="relative overflow-hidden rounded-3xl w-28 h-28 md:w-36 md:h-36 shadow-md transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={cat.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-all duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          {cat.name?.[0] || "C"}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="mt-4 text-sm md:text-base font-semibold text-gray-800 group-hover:text-brand-800 transition-colors">
                    {cat.name}
                  </h3>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Section ─────────────────────────────────────────────────────────
export function FeaturedSection({ products, loading }) {
  return (
    <section className="section bg-white">
      <div className="container-op">
        <SectionHeader
          eyebrow="Hand Picked"
          title="Featured Collection"
          subtitle="Curated pieces that define modern style"
          linkTo="/collections?isFeatured=true"
        />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────
export function NewArrivalsSection({ products, loading }) {
  return (
    <section className="section bg-ice">
      <div className="container-op">
        <SectionHeader
          eyebrow="Just Dropped"
          title="New Arrivals"
          subtitle="Fresh styles added every week — be the first"
          linkTo="/collections?isNewArrival=true"
          linkLabel="See All New Arrivals"
        />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────
export function BestSellersSection({ products, loading }) {
  return (
    <section className="section bg-white">
      <div className="container-op">
        <SectionHeader
          eyebrow="Most Loved"
          title="Best Sellers"
          subtitle="The styles our community can't stop wearing"
          linkTo="/collections?isBestSeller=true"
          linkLabel="Shop Best Sellers"
        />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}

// ─── Trending ─────────────────────────────────────────────────────────────────
export function TrendingSection({ products, loading }) {
  return (
    <section className="section bg-ice">
      <div className="container-op">
        <SectionHeader
          eyebrow="Trending Now"
          title="What's Hot 🔥"
          subtitle="The most viewed styles this week"
          linkTo="/collections?sort=trending"
          linkLabel="View Trending"
        />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}

export default CategoryStrip;
