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
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // Electric Blue
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#0A5ACB", // Royal Blue
          900: "#0A2A80", // Deep Navy
          950: "#071B52",
        },
        sky: {
          accent: "#7AB2E4",
        },
        ice: "#F7FAFC",
        silver: "#94A3B8",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #0A2A80 0%, #0A5ACB 50%, #3B82F6 100%)",
        "brand-gradient-r": "linear-gradient(135deg, #3B82F6 0%, #0A5ACB 100%)",
        "hero-overlay":
          "linear-gradient(180deg, rgba(10,42,128,0.6) 0%, rgba(10,42,128,0.3) 60%, rgba(10,42,128,0.7) 100%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        "brand-sm": "0 2px 8px rgba(10,90,203,0.15)",
        brand: "0 4px 20px rgba(10,90,203,0.2)",
        "brand-lg": "0 8px 40px rgba(10,90,203,0.25)",
        "brand-xl": "0 16px 60px rgba(10,90,203,0.3)",
        card: "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        glass:
          "0 8px 32px rgba(10,42,128,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
        "inset-brand": "inset 0 0 0 2px #0A5ACB",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(10,90,203,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(10,90,203,0)" },
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
