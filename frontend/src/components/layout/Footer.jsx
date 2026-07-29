import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiInstagram,
  FiFacebook,
  FiTwitter,
  FiYoutube,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowUpRight,
  FiLock,
  FiCheckCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";

const footerLinks = {
  Shop: [
    { label: "Men's Collection", href: "/collections?category=men" },
    { label: "Women's Collection", href: "/collections?category=women" },
    { label: "Kids' Collection", href: "/collections?category=kids" },
    {
      label: "New Arrivals",
      href: "/collections?isNewArrival=true",
      badge: "Hot",
    },
    { label: "Best Sellers", href: "/collections?isBestSeller=true" },
    { label: "Sale Drops", href: "/collections?isOnSale=true", badge: "Sale" },
    { label: "Custom Print", href: "/custom-print" },
  ],
  Help: [
    { label: "Track Order", href: "/track-order" },
    { label: "Returns & Exchange", href: "/pages/returns" },
    { label: "Shipping Policy", href: "/pages/shipping" },
    { label: "Size Guide", href: "/pages/size-guide" },
    { label: "FAQs", href: "/pages/faqs" },
    { label: "Contact Us", href: "/pages/contact" },
  ],
  Company: [
    { label: "About Us", href: "/pages/about" },
    { label: "Careers", href: "/pages/careers" },
    { label: "Privacy Policy", href: "/pages/privacy" },
    { label: "Terms of Service", href: "/pages/terms" },
  ],
};

const socials = [
  { icon: FiInstagram, href: "#", label: "Instagram" },
  { icon: FiFacebook, href: "#", label: "Facebook" },
  { icon: FiTwitter, href: "#", label: "Twitter" },
  { icon: FiYoutube, href: "#", label: "YouTube" },
  { icon: FaWhatsapp, href: "https://wa.me/919876543210", label: "WhatsApp" },
];

const paymentBadges = [
  "Visa",
  "Mastercard",
  "RuPay",
  "UPI",
  "G Pay",
  "PhonePe",
  "Paytm",
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("You are subscribed! Welcome to the ONE PIECE family 🎉");
    setEmail("");
    setSubmitting(false);
  };

  return (
    <footer className="bg-brand-900 text-white relative overflow-hidden border-t border-white/10 font-sans">
      {/* Background Lighting Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-800/40 via-transparent to-transparent pointer-events-none" />

      {/* Newsletter Header Section */}
      <div className="relative border-b border-white/10 bg-brand-950/40 backdrop-blur-xl">
        <div className="container-op py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase bg-brand-500/20 text-brand-300 border border-brand-400/30 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Stay in the Loop
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
                Get exclusive drops & offers
              </h3>
              <p className="text-white/60 text-xs sm:text-sm mt-2 font-light leading-relaxed">
                Join 50,000+ style enthusiasts receiving private access to new
                releases.
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <form
                onSubmit={handleNewsletter}
                className="flex flex-col sm:flex-row w-full lg:w-[460px] gap-2 p-1.5 bg-white/5 border border-white/15 rounded-2xl backdrop-blur-md focus-within:border-brand-400 transition-all duration-300 shadow-2xl"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-7 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 shrink-0 shadow-lg shadow-brand-500/20"
                >
                  {submitting ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
              <div className="flex items-center justify-center lg:justify-start gap-4 mt-3 text-[11px] text-white/50">
                <span className="flex items-center gap-1">
                  <FiLock className="text-brand-300" size={12} /> Unsubscribe
                  anytime
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FiCheckCircle className="text-brand-300" size={12} /> No spam
                  ever
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="container-op py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="sm:col-span-2 md:col-span-4 lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block group">
              <div className="font-display font-black text-2xl sm:text-3xl text-white leading-none tracking-tight">
                ONE
                <span className="text-brand-400 group-hover:text-brand-300 transition-colors">
                  PIECE
                </span>
              </div>
              <p className="text-[9px] tracking-[0.35em] uppercase text-brand-300/80 font-semibold mt-1.5">
                Your Statement. Your Style.
              </p>
            </Link>

            <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-sm font-light">
              India's premium fashion destination. Curated styles, custom
              prints, and exclusive collections — crafted for those who dare to
              stand out.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  icon: FiMapPin,
                  text: "42 Fashion Street, Banjara Hills, Hyderabad – 500034",
                },
                {
                  icon: FiPhone,
                  text: "+91 98765 43210",
                  href: "tel:+919876543210",
                },
                {
                  icon: FiMail,
                  text: "support@onepiece.in",
                  href: "mailto:support@onepiece.in",
                },
              ].map(({ icon: Icon, text, href }) => (
                <div key={text} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-brand-400/50 transition-colors">
                    <Icon size={14} className="text-brand-400" />
                  </div>
                  {href ? (
                    <a
                      href={href}
                      className="text-white/60 text-xs sm:text-sm hover:text-white transition-colors"
                    >
                      {text}
                    </a>
                  ) : (
                    <span className="text-white/60 text-xs sm:text-sm">
                      {text}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-300/80 block mb-3">
                Connect With Us
              </span>
              <div className="flex items-center gap-2.5">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-brand-400 hover:bg-brand-500 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="col-span-1">
              <h4 className="font-bold text-xs tracking-[0.2em] uppercase text-brand-300/90 mb-6 border-b border-white/10 pb-2">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href, badge }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-xs sm:text-sm text-white/60 hover:text-white transition-all duration-200 flex items-center justify-between group py-0.5"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-brand-400 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200">
                          <FiArrowUpRight size={14} />
                        </span>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          {label}
                        </span>
                      </span>

                      {badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-brand-950/60 backdrop-blur-md">
        <div className="container-op py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <p className="text-white/40 text-xs font-sans">
              © {new Date().getFullYear()}{" "}
              <span className="text-white font-medium">ONE PIECE Fashion</span>.
              All rights reserved.
            </p>
            <span className="hidden sm:inline text-white/20">•</span>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {paymentBadges.map((badge) => (
              <span
                key={badge}
                className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 text-[10px] font-sans font-medium rounded-md tracking-wider uppercase hover:border-white/20 transition-colors"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
