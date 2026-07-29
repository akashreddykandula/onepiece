import { motion } from "framer-motion";

const messages = [
  "🚚 Free Shipping on orders above ₹999",
  "✨ New arrivals every week",
  "🎨 Custom print on any product",
  "↩️ 7-day easy returns",
  "💳 EMI available on orders above ₹3000",
];

export default function AnnouncementBar() {
  return (
    <div className="bg-brand-900 border-b border-white/10 overflow-hidden py-2.5 relative select-none">
      <motion.div
        className="flex w-max shrink-0 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          },
        }}
      >
        {/* Render list twice to fill track dynamically */}
        {[...messages, ...messages].map((msg, i) => (
          <div key={i} className="flex items-center">
            <span className="px-8 text-[11px] sm:text-xs tracking-wider uppercase font-medium text-white/90">
              {msg}
            </span>
            <span className="w-1 h-1 rounded-full bg-brand-400/50" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
