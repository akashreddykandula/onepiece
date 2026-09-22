/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      colors: {
        brand: {
          50: "#fdf2f2",
          100: "#fde6e6",
          200: "#fbd0d0",
          300: "#f7aab0",
          400: "#f0757d",
          500: "#e3383e", // Primary Accent Red
          600: "#d02027",
          700: "#be181e",
          800: "#8e1c20", // Deep Red
          900: "#b02429", // Base Crimson Red
          950: "#48090b", // Deep Maroon
        },
        sky: {
          accent: "#e47a7d",
        },
        ice: "#FAFAFA",
        silver: "#94A3B8",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #b02429 0%, #8e1c20 50%, #e3383e 100%)",
        "brand-gradient-r": "linear-gradient(135deg, #e3383e 0%, #8e1c20 100%)",
        "hero-overlay":
          "linear-gradient(180deg, rgba(176,36,41,0.6) 0%, rgba(176,36,41,0.3) 60%, rgba(176,36,41,0.7) 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        "brand-sm": "0 2px 8px rgba(176,36,41,0.15)",
        brand: "0 4px 20px rgba(176,36,41,0.2)",
        "brand-lg": "0 8px 40px rgba(176,36,41,0.25)",
        "brand-xl": "0 16px 60px rgba(176,36,41,0.3)",
        card: "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        glass:
          "0 8px 32px rgba(176,36,41,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
        "inset-brand": "inset 0 0 0 2px #b02429",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        float: "float 6s ease-in-out infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-brand": "pulseBrand 2s ease-in-out infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        pulseBrand: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(176,36,41,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(176,36,41,0)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
