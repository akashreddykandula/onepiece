const messages = [
  "Free Shipping on orders above ₹999",
  "New arrivals every week",
  "Custom print on any selective product",
  "7-day easy returns T&C apply",
];

export default function AnnouncementBar() {
  const repeatedMessages = [...messages, ...messages, ...messages, ...messages];

  return (
    <div className="bg-brand-900 border-b border-white/10 overflow-hidden py-2.5 relative select-none">
      <div className="flex w-max shrink-0 whitespace-nowrap animate-marquee">
        {repeatedMessages.map((msg, i) => (
          <div key={i} className="flex items-center">
            <span className="px-8 text-[11px] sm:text-xs tracking-wider uppercase font-medium text-white/90">
              {msg}
            </span>
            <span className="w-1 h-1 rounded-full bg-brand-400/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
