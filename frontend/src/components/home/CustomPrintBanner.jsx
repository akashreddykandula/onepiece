import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiUpload,
  FiEdit3,
  FiPackage,
  FiStar,
} from "react-icons/fi";
import { useAnimateOnScroll, useCountUp } from "@hooks/index";

// ─── Custom Print Banner ──────────────────────────────────────────────────────
export default function CustomPrintBanner() {
  const { ref, inView } = useAnimateOnScroll();
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-20 md:py-28">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-white/5"
            style={{ left: `${i * 18}%`, top: `${(i % 3) * 30}%` }}
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
      <div className="container-op relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-brand-300 mb-4">
              <span className="w-8 h-0.5 bg-brand-300" /> Custom Studio
            </span>
            <h2 className="font-display font-black text-5xl md:text-6xl text-white leading-tight mb-5">
              Design Your Own
              <br />
              <span className="text-brand-300">Statement</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Upload your artwork, add your text, pick your style. We print it,
              pack it, and deliver it to your door in 5 days.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: FiUpload, label: "Upload Art", step: "01" },
                { icon: FiEdit3, label: "Customise", step: "02" },
                { icon: FiPackage, label: "We Deliver", step: "03" },
              ].map(({ icon: Icon, label, step }) => (
                <div key={step} className="glass-card-dark p-4 text-center">
                  <span className="text-[10px] text-brand-400 font-bold tracking-widest">
                    {step}
                  </span>
                  <Icon size={22} className="text-white mx-auto my-2" />
                  <p className="text-xs text-white/70 font-medium">{label}</p>
                </div>
              ))}
            </div>
            <Link
              to="/custom-print"
              className="btn-primary bg-gradient-to-r from-brand-800 to-brand-600 text-white hover:from-brand-900 hover:to-brand-700 shadow-brand-xl"
            >
              Start Designing <FiArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-w-md mx-auto">
              <img
                src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&q=80"
                alt="Custom Print"
                className="w-full h-full object-cover rounded-3xl shadow-brand-xl"
              />
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-5 -right-5 glass-card p-4 rounded-2xl shadow-brand-lg"
              >
                <p className="text-xs text-white/80 font-semibold">
                  500+ designs created
                </p>
                <p className="text-xs text-white/50 mt-0.5">today alone 🎨</p>
              </motion.div>
              <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-4 -left-5 glass-card p-4 rounded-2xl shadow-brand-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-xs text-white font-semibold">
                      Delivered in 5 days
                    </p>
                    <p className="text-[10px] text-white/50">
                      Anywhere in India
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
const stats = [
  { value: 50000, suffix: "+", label: "Happy Customers", icon: "😊" },
  { value: 500, suffix: "+", label: "Unique Styles", icon: "👗" },
  { value: 98, suffix: "%", label: "Satisfaction Rate", icon: "⭐" },
  { value: 5, suffix: "K+", label: "Custom Prints", icon: "🎨" },
];

function StatItem({ value, suffix, label, icon }) {
  const { count, ref } = useCountUp(value, 1800);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-display font-black text-4xl md:text-5xl text-brand-900">
        {count.toLocaleString("en-IN")}
        {suffix}
      </div>
      <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="section-sm bg-white border-y border-gray-100">
      <div className="container-op">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Brand Story ──────────────────────────────────────────────────────────────
export function BrandStory() {
  const { ref, inView } = useAnimateOnScroll();
  return (
    <section className="section bg-ice">
      <div className="container-op">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative z-10">
              <img
                src="https://plus.unsplash.com/premium_photo-1756051507291-3ccf57b945c5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="ONE PIECE Brand Story"
                className="w-full aspect-[4/5] object-cover rounded-3xl shadow-card-hover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-brand-100 rounded-3xl -z-10" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand-500/10 rounded-2xl -z-10" />
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute bottom-8 -right-5 card p-4 shadow-card-hover max-w-[180px]"
            >
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-800">
                "Best fashion brand in India"
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                — Verified Customer
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <p className="eyebrow">Our Story</p>
            <h2 className="heading-lg mb-5">
              Fashion That
              <br />
              <span className="text-gradient">Makes a Statement</span>
            </h2>
            <div className="w-16 h-1 bg-brand-gradient rounded-full mb-6" />
            <p className="text-gray-600 leading-relaxed mb-4">
              ONE PIECE was born from a simple belief: fashion should be
              personal, powerful, and accessible to everyone. Since 2020, we've
              been crafting pieces that don't just fit your body — they fit your
              identity.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              From our flagship store in Hyderabad to delivering across India,
              we blend quality craftsmanship with bold design to create clothes
              that mean something. Because when you wear ONE PIECE, you are not
              just wearing clothes — you are making a statement.
            </p>
            <div className="grid grid-cols-2 gap-5 mb-8">
              {[
                { value: "2020", label: "Founded" },
                { value: "50K+", label: "Customers" },
                { value: "100%", label: "Quality Checked" },
                { value: "5★", label: "Avg. Rating" },
              ].map((s) => (
                <div key={s.label} className="border-l-2 border-brand-500 pl-4">
                  <p className="font-display font-bold text-2xl text-brand-900">
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 tracking-wide uppercase">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/pages/about" className="btn-primary">
              Our Full Story <FiArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Delhi",
    avatar: "AM",
    rating: 5,
    text: "ONE PIECE has completely changed how I dress. The quality is unreal for the price. I have ordered 8 times and every single piece is perfect.",
  },
  {
    name: "Priya Sharma",
    role: "Bangalore",
    avatar: "PS",
    rating: 5,
    text: "The custom print service is mind-blowing. Uploaded my design, got the t-shirt in 4 days. Print quality is professional-grade. Highly recommend!",
  },
  {
    name: "Rahul Verma",
    role: "Mumbai",
    avatar: "RV",
    rating: 5,
    text: "Fast shipping, amazing packaging, and the clothes fit perfectly. Their size guide is spot on. Will always shop here for my casuals.",
  },
  {
    name: "Sneha Patel",
    role: "Hyderabad",
    avatar: "SP",
    rating: 5,
    text: "Returns were super easy and hassle-free. Customer support is top class. The exchange process took less than 24 hours. Brilliant!",
  },
];

export function TestimonialsSection() {
  const { ref, inView } = useAnimateOnScroll();
  return (
    <section className="section bg-white">
      <div className="container-op">
        <div className="text-center mb-12" ref={ref}>
          <p className="eyebrow justify-center">What Customers Say</p>
          <h2 className="heading-lg">
            Loved by <span className="text-gradient">50,000+</span> Shoppers
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="card p-6 hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 bg-brand-gradient rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">
                    {t.avatar}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
                <div className="ml-auto">
                  <span className="badge-green text-[10px]">Verified ✓</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Instagram Grid ───────────────────────────────────────────────────────────
const igPhotos = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80",
  "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&q=80",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80",
  "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=400&q=80",
];

export function InstagramGrid() {
  return (
    <section className="section-sm bg-ice">
      <div className="container-op">
        <div className="text-center mb-8">
          <p className="eyebrow justify-center">Follow Our Journey</p>
          <h2 className="heading-md">@onepiece.in</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {igPhotos.map((photo, i) => (
            <motion.a
              key={i}
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100"
            >
              <img
                src={photo}
                alt={`ONE PIECE style ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/40 transition-colors duration-300 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl">
                  📸
                </span>
              </div>
            </motion.a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
