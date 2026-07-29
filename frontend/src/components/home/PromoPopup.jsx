import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bannerAPI } from "@services/api";

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  const { data: popups = [] } = useQuery({
    queryKey: ["banners", "popup"],
    queryFn: () =>
      bannerAPI.getAll({ type: "popup" }).then((r) => r.data.banners),
    staleTime: 1000 * 60 * 10,
  });

  const popup = popups[0];

  useEffect(() => {
    if (!popup) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [popup]);

  if (!popup || !open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 z-10 text-2xl text-gray-500 transition hover:text-black"
        >
          ✕
        </button>

        {/* Popup Image */}
        {popup.image?.url && (
          <img
            src={popup.image.url}
            alt={popup.title}
            className="h-56 w-full object-cover"
          />
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-900">{popup.title}</h2>

          {popup.subtitle && (
            <p className="mt-2 text-gray-600">{popup.subtitle}</p>
          )}

          {popup.description && (
            <p className="mt-4 text-sm text-gray-500">{popup.description}</p>
          )}

          <Link
            to={popup.ctaLink || "/"}
            onClick={() => setOpen(false)}
            className="mt-6 block w-full rounded-xl bg-brand-900 px-6 py-3 text-center font-semibold text-white transition hover:bg-brand-800"
          >
            {popup.ctaText || "Shop Now"}
          </Link>
        </div>
      </div>
    </div>
  );
}
