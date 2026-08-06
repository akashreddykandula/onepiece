import { Helmet } from "react-helmet-async";

export default function SEO({
  title = "ONE PIECE | Premium Fashion Store",
  description = "Shop premium clothing, oversized t-shirts, custom print apparel, hoodies, and exclusive fashion collections from ONE PIECE.",
  keywords = "premium clothing, oversized t shirts, custom print t shirts, fashion store India, men's clothing, women's clothing",
  image = "https://onepiecefashion.in/favicon.jpeg",
  url = "https://onepiecefashion.in",
}) {
  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta name="robots" content="index,follow" />

      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="ONE PIECE" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="ONE PIECE Premium Fashion Store" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ONE PIECE",
          url: "https://onepiecefashion.in",
          logo: "https://onepiecefashion.in/favicon.jpeg",
          description:
            "Premium fashion brand in India offering clothing, oversized t-shirts, hoodies and custom print apparel.",
          email: "onepiece.fashion99@gmail.com",
          sameAs: [
            "https://www.instagram.com/onepiece_fashion_in?igsh=MXA0bzFibnNvdzJ1Ng%3D%3D",
          ],
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ONE PIECE",
          url: "https://onepiecefashion.in",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://onepiecefashion.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ClothingStore",
          name: "ONE PIECE",
          image: "https://onepiecefashion.in/favicon.jpeg",
          url: "https://onepiecefashion.in",
          telephone: "+91-XXXXXXXXXX",
          email: "onepiece.fashion99@gmail.com",
          priceRange: "₹₹",
          address: {
            "@type": "PostalAddress",
            addressCountry: "IN",
          },
        })}
      </script>
    </Helmet>
  );
}
