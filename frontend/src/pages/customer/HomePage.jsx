import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { productAPI, bannerAPI, categoryAPI } from "@services/api";
import { APP_NAME, APP_TAGLINE } from "@constants";

// Sections (lazy-loaded for performance)
const PromoPopup = lazy(() => import("@components/home/PromoPopup"));
const HeroSlider = lazy(() => import("@components/home/HeroSlider"));
const CategoryStrip = lazy(() => import("@components/home/CategoryStrip"));
const FeaturedSection = lazy(() => import("@components/home/FeaturedSection"));
const NewArrivalsSection = lazy(
  () => import("@components/home/NewArrivalsSection"),
);
const BestSellersSection = lazy(
  () => import("@components/home/BestSellersSection"),
);
const TrendingSection = lazy(() => import("@components/home/TrendingSection"));
const CustomPrintBanner = lazy(
  () => import("@components/home/CustomPrintBanner"),
);
const BrandStory = lazy(() => import("@components/home/BrandStory"));
const StatsSection = lazy(() => import("@components/home/StatsSection"));
const TestimonialsSection = lazy(
  () => import("@components/home/TestimonialsSection"),
);
const InstagramGrid = lazy(() => import("@components/home/InstagramGrid"));
import { ProductGridSkeleton } from "@components/ui/PageLoader";

//announcement bar
const AnnouncementBar = lazy(
  () => import("@components/layout/AnnouncementBar"),
);
function SectionSkeleton() {
  return (
    <section className="section">
      <div className="container-op">
        <div className="skeleton h-8 w-48 rounded-xl mb-8" />
        <ProductGridSkeleton count={8} />
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: bannersData } = useQuery({
    queryKey: ["banners", "hero"],
    queryFn: () =>
      bannerAPI.getAll({ type: "hero" }).then((r) => r.data.banners),
    staleTime: 1000 * 60 * 10,
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productAPI.getFeatured(8).then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  });

  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery({
    queryKey: ["products", "new-arrivals"],
    queryFn: () => productAPI.getNewArrivals(8).then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  });

  const { data: bestSellersData, isLoading: bestSellersLoading } = useQuery({
    queryKey: ["products", "best-sellers"],
    queryFn: () => productAPI.getBestSellers(8).then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: () => productAPI.getTrending(8).then((r) => r.data.products),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "featured"],
    queryFn: () =>
      categoryAPI.getAll({ featured: "true" }).then((r) => r.data.categories),
    staleTime: 1000 * 60 * 15,
  });

  return (
    <>
      <Helmet>
        <title>
          {APP_NAME} — {APP_TAGLINE}
        </title>
        <meta
          name="description"
          content="Shop the latest fashion at ONE PIECE. Premium clothing, custom prints, and exclusive collections. Free shipping on orders above ₹999."
        />
        <meta property="og:title" content={`${APP_NAME} — ${APP_TAGLINE}`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <Suspense
        fallback={<div className="h-screen bg-brand-900 animate-pulse" />}
      >
        {/* <Suspense fallback={null}>
          <AnnouncementBar />
        </Suspense> */}
        <Suspense fallback={null}>
          <PromoPopup />
        </Suspense>

        <HeroSlider banners={bannersData || []} />
      </Suspense>

      <Suspense fallback={<div className="h-28 bg-gray-50 animate-pulse" />}>
        <CategoryStrip categories={categoriesData || []} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedSection
          products={featuredData || []}
          loading={featuredLoading}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivalsSection
          products={newArrivalsData || []}
          loading={newArrivalsLoading}
        />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-brand-900 animate-pulse" />}>
        <CustomPrintBanner />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <BestSellersSection
          products={bestSellersData || []}
          loading={bestSellersLoading}
        />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TrendingSection
          products={trendingData || []}
          loading={trendingLoading}
        />
      </Suspense>

      <Suspense fallback={null}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={null}>
        <BrandStory />
      </Suspense>

      <Suspense fallback={null}>
        <TestimonialsSection />
      </Suspense>

      <Suspense fallback={null}>
        <InstagramGrid />
      </Suspense>
    </>
  );
}
